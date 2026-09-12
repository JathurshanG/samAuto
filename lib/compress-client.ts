"use client";
export async function compressPhotos(form: FormData) {
  const files = form
    .getAll("photos")
    .filter((x): x is File => x instanceof File && x.size > 0);
  if (files.length > 12) throw Error("Maximum 12 photos par envoi.");
  const output: File[] = [];
  for (const file of files) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    )
      throw Error("Photo invalide : JPEG, PNG ou WebP, 8 Mo maximum.");
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(Error("Compression impossible"))),
        "image/webp",
        0.78,
      ),
    );
    output.push(new File([blob], "photo.webp", { type: "image/webp" }));
  }
  if (output.reduce((sum, f) => sum + f.size, 0) > 3 * 1024 * 1024)
    throw Error("Envoyez moins de photos à la fois (3 Mo par envoi).");
  form.delete("photos");
  output.forEach((f) => form.append("photos", f));
}
