import "server-only";
import sharp from "sharp";
export async function imageBytes(file: File) {
  if (
    file.size > 8 * 1024 * 1024 ||
    !file.size ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw Error("Invalid photo");
  const input = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(input, { limitInputPixels: 40000000 }).metadata();
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format))
    throw Error("Invalid image content");
  return sharp(input, { limitInputPixels: 40000000 })
    .rotate()
    .resize(1920, 1440, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}
