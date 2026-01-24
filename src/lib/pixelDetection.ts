/**
 * 图片缓存 - 避免重复加载
 */
const imageCache = new Map<string, HTMLImageElement>();

/**
 * 加载图片并缓存
 */
async function loadImage(imageUrl: string): Promise<HTMLImageElement> {
    // 检查缓存
    if (imageCache.has(imageUrl)) {
        return imageCache.get(imageUrl)!;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            imageCache.set(imageUrl, img);
            resolve(img);
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = imageUrl;
    });
}

/**
 * 检测图片在指定坐标位置是否有非透明像素
 * @param imageUrl - 图片的 data URL 或 URL
 * @param x - 点击的 x 坐标(相对于图片)
 * @param y - 点击的 y 坐标(相对于图片)
 * @returns Promise<boolean> - true 表示该位置有非透明像素
 */
export async function hasPixelAtPosition(
    imageUrl: string,
    x: number,
    y: number
): Promise<boolean> {
    try {
        const img = await loadImage(imageUrl);

        // 创建离屏 canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            return false;
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0);

        // 获取点击位置的像素数据
        const pixelData = ctx.getImageData(x, y, 1, 1).data;

        // 检查 alpha 通道(索引 3)
        const alpha = pixelData[3];
        return alpha > 0;
    } catch (error) {
        console.error('Error checking pixel:', error);
        return false;
    }
}

/**
 * 从所有图层中找到点击位置的最上层图层
 * @param layers - 图层数组
 * @param clickX - 点击的 x 坐标(相对于容器,百分比 0-100)
 * @param clickY - 点击的 y 坐标(相对于容器,百分比 0-100)
 * @param imageWidth - 图片实际宽度(像素)
 * @param imageHeight - 图片实际高度(像素)
 * @returns Promise<string | null> - 匹配的图层 ID,如果没有匹配则返回 null
 */
export async function findLayerAtPosition(
    layers: Array<{ id: string; preview: string | null; visible: boolean }>,
    clickX: number,
    clickY: number,
    imageWidth: number,
    imageHeight: number
): Promise<string | null> {
    // 将百分比坐标转换为像素坐标
    const pixelX = Math.floor((clickX / 100) * imageWidth);
    const pixelY = Math.floor((clickY / 100) * imageHeight);

    console.log('[Pixel Detection] Click position:', { clickX, clickY, pixelX, pixelY });

    // 过滤可见且有预览的图层
    const visibleLayers = layers.filter(l => l.visible && l.preview);

    // 从后往前遍历(后面的图层 z-index 更高)
    for (let i = visibleLayers.length - 1; i >= 0; i--) {
        const layer = visibleLayers[i];

        try {
            const hasPixel = await hasPixelAtPosition(layer.preview!, pixelX, pixelY);

            if (hasPixel) {
                console.log('[Pixel Detection] Found layer:', layer.id);
                return layer.id;
            }
        } catch (error) {
            console.error('[Pixel Detection] Error checking layer:', layer.id, error);
        }
    }

    console.log('[Pixel Detection] No layer found at position');
    return null;
}

/**
 * 清除图片缓存(可选,用于释放内存)
 */
export function clearImageCache() {
    imageCache.clear();
}
