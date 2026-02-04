/**
 * Capture screenshot from Three.js canvas
 */
export async function captureCanvasScreenshot(
    canvas: HTMLCanvasElement,
    format: "png" | "jpeg" = "png",
    quality: number = 0.95,
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Failed to create blob from canvas"));
                }
            },
            `image/${format}`,
            quality,
        );
    });
}

/**
 * Convert blob to base64 data URL
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 */
export async function resizeImage(
    blob: Blob,
    maxWidth: number = 800,
    maxHeight: number = 600,
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Calculate scaling factor
            const scale = Math.min(
                maxWidth / width,
                maxHeight / height,
                1, // Don't upscale
            );

            width = Math.floor(width * scale);
            height = Math.floor(height * scale);

            // Create canvas for resizing
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (resizedBlob) => {
                    if (resizedBlob) {
                        resolve(resizedBlob);
                    } else {
                        reject(new Error("Failed to resize image"));
                    }
                },
                "image/jpeg",
                0.9,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };

        img.src = url;
    });
}
