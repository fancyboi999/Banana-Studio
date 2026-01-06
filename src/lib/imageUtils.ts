
// Helper: Load Image
export const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

// Helper: Create Masked Preview
export const createMaskedPreview = (baseImage: HTMLImageElement, maskImage: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = baseImage.width;
    canvas.height = baseImage.height;

    // 1. Draw original
    ctx.drawImage(baseImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 2. Draw mask
    const mCanvas = document.createElement('canvas');
    const mCtx = mCanvas.getContext('2d');
    if (!mCtx) return '';
    mCanvas.width = canvas.width;
    mCanvas.height = canvas.height;
    mCtx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
    const maskData = mCtx.getImageData(0, 0, canvas.width, canvas.height);

    // 3. Apply mask (brightness to alpha)
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = maskData.data[i];
        const g = maskData.data[i + 1];
        const b = maskData.data[i + 2];
        const brightness = (r + g + b) / 3;
        imageData.data[i + 3] = brightness;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
};

// Helper: Extract BBox
export const extractBoundingBox = (maskBase64: string): Promise<{ x: number, y: number, width: number, height: number } | null> => {
    return new Promise(async (resolve) => {
        try {
            const img = await loadImageElement(maskBase64);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
            let hasPixel = false;
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const alpha = data[(y * canvas.width + x) * 4 + 3];
                    if (alpha > 25) { // Threshold
                        hasPixel = true;
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (!hasPixel) return resolve(null);
            resolve({
                x: (minX / canvas.width) * 100,
                y: (minY / canvas.height) * 100,
                width: ((maxX - minX + 1) / canvas.width) * 100,
                height: ((maxY - minY + 1) / canvas.height) * 100,
            });
        } catch { resolve(null); }
    });
};

// Helper: Get Cropped Image
export const getCroppedImage = (imageSrc: string, croppedAreaPixels: { x: number, y: number, width: number, height: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Canvas not supported'));
                return;
            }

            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );

            resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = (error) => reject(error);
    });
};
