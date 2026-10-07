import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public', { recursive: true });

// SVG source — an ocean-themed icon
function makeSVG(size) {
  const r = size * 0.2;          // corner radius
  const emojiSize = size * 0.55; // emoji scale
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0A0E1A"/>
          <stop offset="1" stop-color="#0F2D3D"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
      <text
        x="50%" y="50%"
        font-size="${emojiSize}"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"
      >🌊</text>
    </svg>
  `;
}

async function generate(size, filename) {
  const svg = Buffer.from(makeSVG(size));
  await sharp(svg).png().toFile(`public/${filename}`);
  console.log(`✅ Created public/${filename}`);
}

await generate(192, 'pwa-192x192.png');
await generate(512, 'pwa-512x512.png');
await generate(180, 'apple-touch-icon.png');

console.log('\n🎉 All icons generated in dashboard/public/\n');