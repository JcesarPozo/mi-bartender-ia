// scripts/generate-icons.mjs
// Versión sin dependencias externas — usa fetch + Jimp (incluido en Next.js)
// Si falla, instala: pnpm add jimp --save-dev
// Ejecutar: node scripts/generate-icons.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const INPUT     = join(ROOT, 'public', 'logo-borrachos.jpg');
const OUT_DIR   = join(ROOT, 'public', 'icons');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Intentar con sharp primero, luego con Jimp
let resizer;

try {
  const { default: sharp } = await import('sharp');
  resizer = async (size, outPath, padded = false) => {
    if (padded) {
      const pad   = Math.round(size * 0.1);
      const inner = size - pad * 2;
      await sharp(INPUT)
        .resize(inner, inner, { fit: 'cover', position: 'center' })
        .extend({ top: pad, bottom: pad, left: pad, right: pad,
          background: { r: 0, g: 3, b: 16, alpha: 1 } })
        .png({ quality: 90 })
        .toFile(outPath);
    } else {
      await sharp(INPUT)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .png({ quality: 90 })
        .toFile(outPath);
    }
  };
  console.log('🔧 Usando: sharp\n');
} catch {
  try {
    const { Jimp } = await import('jimp');
    resizer = async (size, outPath, padded = false) => {
      const img = await Jimp.read(INPUT);
      // Recortar al cuadrado central
      const dim = Math.min(img.width, img.height);
      img.crop({ x: (img.width - dim) / 2, y: (img.height - dim) / 2, w: dim, h: dim });

      if (padded) {
        const pad   = Math.round(size * 0.1);
        const inner = size - pad * 2;
        img.resize({ w: inner, h: inner });
        // Crear imagen con fondo oscuro
        const bg = new Jimp({ width: size, height: size, color: 0x000310FF });
        bg.composite(img, pad, pad);
        await bg.write(outPath);
      } else {
        img.resize({ w: size, h: size });
        await img.write(outPath);
      }
    };
    console.log('🔧 Usando: jimp\n');
  } catch {
    console.error('❌ No se encontró sharp ni jimp.');
    console.error('   Instala uno de los dos:');
    console.error('   pnpm add sharp --save-dev');
    console.error('   pnpm add jimp --save-dev');
    process.exit(1);
  }
}

const ICONS = [
  { size: 72,  name: 'icon-72x72.png' },
  { size: 96,  name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 32,  name: 'favicon-32x32.png' },
  { size: 16,  name: 'favicon-16x16.png' },
];

console.log('🎨 Generando íconos PWA desde logo-borrachos.jpg...\n');

for (const { size, name } of ICONS) {
  const outPath = join(OUT_DIR, name);
  await resizer(size, outPath, false);
  console.log(`  ✅ ${name} (${size}×${size})`);
}

// Íconos maskable con safe zone
for (const size of [512, 192]) {
  const outPath = join(OUT_DIR, `icon-maskable-${size}x${size}.png`);
  await resizer(size, outPath, true);
  console.log(`  ✅ icon-maskable-${size}x${size}.png (safe zone)`);
}

console.log('\n🚀 Todos los íconos en public/icons/ — ¡listo para el deploy!\n');
console.log('Siguiente paso:');
console.log('  git add .');
console.log('  git commit -m "feat: PWA icons generados"');
console.log('  git push origin main');
