import { LIMITS } from "./types";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image. Try JPG or PNG."));
    };
    img.src = url;
  });
}

/**
 * Resizes and compresses an image in the browser to a Base64 JPEG (data URL),
 * lowering quality progressively until it fits under Groq's limit.
 */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("The selected file is not an image.");
  }

  const img = await loadImage(file);
  const max = LIMITS.maxImageDimension;
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  let width = Math.max(1, Math.round(img.naturalWidth * scale));
  let height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser does not support image compression.");

  let quality = 0.85;
  for (let i = 0; i < 8; i++) {
    canvas.width = width;
    canvas.height = height;
    // White background for transparent images (sticky notes read better).
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    // Comfortable target (~1.5 MB) for fast responses.
    if (dataUrl.length <= Math.min(LIMITS.maxImageDataUrlBytes, 1_500_000)) return dataUrl;

    if (quality > 0.55) {
      quality -= 0.1;
    } else {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
    }
  }
  throw new Error("The image is too heavy even after compression.");
}

export function dataUrlSizeKb(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4 / 1024);
}
