// Regenerates the resized variants of the approved brand logo from the
// original asset. The original stays the byte-identical source of truth;
// variants are lossless-exact WebP rasters of it so rendering pixels are
// never recompressed or redrawn artwork, with alpha preserved untouched.
// `exact` keeps RGB values under fully transparent pixels so decoded
// rasters match a plain resize bit for bit.
// Width 500 divides the 2000x564 source exactly (500x141 keeps the original
// 500:141 aspect), which matters because logo CSS uses height:auto: a rounded
// alternative height would change the rendered box height. The aspect check
// below fails the run if a future original breaks that exact ratio.
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const original = "public/images/logo.webp";
const variantWidths = [500];

const originalMeta = await sharp(original).metadata();

for (const width of variantWidths) {
  const buffer = await sharp(original)
    .resize({ width })
    .webp({ lossless: true, exact: true })
    .toBuffer();
  const outputMeta = await sharp(buffer).metadata();
  if (originalMeta.width * outputMeta.height !== outputMeta.width * originalMeta.height) {
    throw new Error(`logo-500.webp: output ${outputMeta.width}x${outputMeta.height} deviates from original aspect ${originalMeta.width}x${originalMeta.height}`);
  }
  await writeFile(`public/images/logo-${width}.webp`, buffer);
}
