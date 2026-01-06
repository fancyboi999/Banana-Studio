"use server";

import { GoogleGenAI } from "@google/genai";
import Replicate from "replicate";
import fs from 'fs';
import path from 'path';
import { saveToHistory, ensureImageDir, getHistory } from '@/lib/db';

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
});

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Helper to convert ReadableStream to Base64
 */
async function streamToBase64(stream: ReadableStream): Promise<string> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    const fullBuffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
    return fullBuffer.toString('base64');
}

/**
 * Generate image using Google Gemini Image Models
 * @param prompt - Text description of the image to generate
 * @param negativePrompt - Optional negative prompt (not supported by Gemini natively, logged for reference)
 * @param model - 'nanobanana' (Flash) or 'nanobanana-pro' (Gemini 3 Pro)
 */
export async function generateImageAction(
    prompt: string,
    negativePrompt?: string,
    model: 'nanobanana' | 'nanobanana-pro' = 'nanobanana',
    layers?: string
): Promise<any> {
    console.log('[Gemini] Generating image with prompt:', prompt);
    if (negativePrompt) console.log('[Gemini] Negative prompt (for reference):', negativePrompt);

    try {
        const modelName = model === 'nanobanana-pro'
            ? 'gemini-3-pro-image-preview'
            : 'gemini-2.5-flash-image';

        console.log(`[Gemini] Using model: ${modelName}`);

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseModalities: ["TEXT", "IMAGE"],
            }
        });

        // Extract image from response
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('No candidates in response');
        }

        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts) {
            throw new Error('No content in response');
        }

        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data;
                const base64Image = `data:image/png;base64,${imageData}`;

                // --- 持久化逻辑 ---
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const imageName = `nanobanana-generate-${timestamp}.png`;
                const imageDir = ensureImageDir();
                const filePath = path.join(imageDir, imageName);

                // 保存原始 Buffer 到文件
                fs.writeFileSync(filePath, Buffer.from(imageData || '', 'base64'));

                // 保存记录到 SQLite
                saveToHistory({
                    prompt,
                    negative_prompt: negativePrompt,
                    model,
                    mode: 'generate',
                    image_name: imageName,
                    layers: layers
                });
                // ----------------

                console.log('[Gemini] Image generated successfully');
                return {
                    success: true,
                    image: base64Image
                };
            }
        }

        throw new Error('No image data in response');
    } catch (error: any) {
        console.error('[Gemini] Generation error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Edit image using Google Gemini (Text + Image to Image)
 * @param baseImage - Base64 encoded image
 * @param prompt - Editing instructions
 * @param negativePrompt - Optional negative prompt (logged for reference)
 * @param maskImage - Optional mask for inpainting (currently unused)
 * @param model - 'nanobanana' (Flash) or 'nanobanana-pro' (Gemini 3 Pro)
 */
export async function editImageAction(
    baseImage: string,
    prompt: string,
    negativePrompt?: string,
    maskImage?: string,
    model: 'nanobanana' | 'nanobanana-pro' = 'nanobanana',
    layers?: string
): Promise<any> {
    console.log('[Gemini] Editing image with prompt:', prompt);
    if (negativePrompt) console.log('[Gemini] Negative prompt (for reference):', negativePrompt);
    if (maskImage) console.log('[Gemini] Mask detected (will be used for context)');

    try {
        const modelName = model === 'nanobanana-pro'
            ? 'gemini-3-pro-image-preview'
            : 'gemini-2.5-flash-image';

        console.log(`[Gemini] Using model: ${modelName}`);

        // Extract base64 data from data URL
        let imageBase64 = baseImage;
        if (baseImage.startsWith('data:')) {
            imageBase64 = baseImage.split(',')[1];
        }

        // Build contents array with text and image
        const contents: any[] = [
            {
                text: maskImage
                    ? `[INSTRUCTION] Use the second image (mask) to editing the specific area in the first image (base). ${prompt}`
                    : prompt
            },
            {
                inlineData: {
                    mimeType: "image/png",
                    data: imageBase64,
                },
            },
        ];

        // If mask is provided, add it as the second image
        if (maskImage) {
            let maskBase64 = maskImage;
            if (maskImage.startsWith('data:')) {
                maskBase64 = maskImage.split(',')[1];
            }
            // If it's a URL (from Replicate), we might need to fetch it first, but for now let's assume it's dataURL or we fetch it.
            // Wait, the frontend might pass a URL. We should handle URL -> Base64 if needed, 
            // but for simplicity let's assume the frontend passes DataURL or handle it here if it's a remote URL.
            // Replicate returns URLs. We need to fetch it.

            if (maskImage.startsWith('http')) {
                const maskBuf = await fetch(maskImage).then(res => res.arrayBuffer());
                maskBase64 = Buffer.from(maskBuf).toString('base64');
            }

            contents.push({
                inlineData: {
                    mimeType: "image/png",
                    data: maskBase64,
                },
            });
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
                responseModalities: ["TEXT", "IMAGE"],
            }
        });

        // Extract edited image from response
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('No candidates in response');
        }

        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts) {
            throw new Error('No content in response');
        }

        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data;
                const base64Image = `data:image/png;base64,${imageData}`;

                // --- 持久化逻辑 ---
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const imageName = `nanobanana-edit-${timestamp}.png`;
                const imageDir = ensureImageDir();
                const filePath = path.join(imageDir, imageName);

                // 保存原始 Buffer 到文件
                fs.writeFileSync(filePath, Buffer.from(imageData || '', 'base64'));

                // 保存记录到 SQLite
                saveToHistory({
                    prompt,
                    negative_prompt: negativePrompt,
                    model,
                    mode: 'edit',
                    image_name: imageName,
                    layers: layers
                });
                // ----------------

                console.log('[Gemini] Image edited successfully');
                return {
                    success: true,
                    image: base64Image
                };
            }
        }

        throw new Error('No image data in response');
    } catch (error: any) {
        console.error('[Gemini] Edit error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Image segmentation using Meta's SAM-2 via Replicate.
 */
export async function segmentImageAction(base64Image: string): Promise<any> {
    console.log('[Replicate] Starting segmentation...');

    try {
        let buffer: Buffer;
        if (base64Image.startsWith('data:')) {
            const base64Data = base64Image.split(',')[1];
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            buffer = Buffer.from(base64Image, 'base64');
        }

        const input = {
            image: buffer,
        };

        const output: any = await replicate.run(
            "meta/sam-2:fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
            { input }
        );

        console.log('[Replicate] Running complete, processing streams...');
        if (!output) throw new Error('Model returned empty output');

        let combinedMaskBase64 = '';
        if (output.combined_mask) {
            if (output.combined_mask instanceof ReadableStream) {
                combinedMaskBase64 = `data:image/png;base64,${await streamToBase64(output.combined_mask)}`;
            } else if (typeof output.combined_mask === 'string') {
                combinedMaskBase64 = output.combined_mask;
            }
        }

        const individualMasksBase64 = [];
        if (Array.isArray(output.individual_masks)) {
            for (const maskItem of output.individual_masks) {
                if (maskItem instanceof ReadableStream) {
                    const b64 = await streamToBase64(maskItem);
                    individualMasksBase64.push(`data:image/png;base64,${b64}`);
                } else if (typeof maskItem === 'string') {
                    individualMasksBase64.push(maskItem);
                }
            }
        }

        return {
            success: true,
            data: {
                combined_mask: combinedMaskBase64,
                individual_masks: individualMasksBase64
            }
        };
    } catch (error: any) {
        console.error('[Replicate] Segmentation error:', error);
        return {
            success: false,
            error: error.message || 'Segmentation failed'
        };
    }
}

/**
 * 获取图片生成历史
 */
export async function fetchHistoryAction() {
    try {
        const history = getHistory();
        return { success: true, data: history };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

