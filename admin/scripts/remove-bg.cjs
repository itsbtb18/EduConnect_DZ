const sharp = require('sharp');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'ilmi-favicon.png');

(async () => {
  const image = sharp(filePath);
  const { width, height, channels } = await image.metadata();

  // Ensure we have raw RGBA data
  const raw = await image.ensureAlpha().raw().toBuffer();

  // Replace near-black pixels (R<30, G<30, B<30) with fully transparent
  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];
    if (r < 30 && g < 30 && b < 30) {
      raw[i + 3] = 0; // set alpha to 0
    }
  }

  await sharp(raw, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(filePath + '.tmp');

  // Replace original
  const fs = require('fs');
  fs.renameSync(filePath + '.tmp', filePath);

  console.log(`Done: ${width}x${height}, black pixels made transparent.`);
})();
