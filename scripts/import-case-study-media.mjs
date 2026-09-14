import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const items = [
  ['tuklas-overview.png', 'Tuklas overview'],
  ['tuklas-draw-color.png', 'Tuklas Draw and Color'],
  ['tindahan.png', 'Tindahan overview'],
  ['pdf-forge.png', 'PDF Forge overview'],
  ['jordflix.png', 'Jordflix overview'],
  ['kavanagh-resort.png', 'Kavanagh Resort overview'],
  ['fern-private-villas.png', 'The Fern Private Villas overview'],
  ['portfolio-home.png', 'Portfolio homepage'],
  ['portfolio-work.png', 'Portfolio projects page'],
];

try {
  for (const [filename, displayName] of items) {
    const libraryName = `Case Study — ${displayName}`;
    const already = await prisma.media.findFirst({ where: { filename: libraryName } });
    if (already) {
      console.log('[case-study-import] exists', filename, already.id);
      continue;
    }

    const source = `https://raw.githubusercontent.com/jonaslacandola0617/portfolio/main/public/case-studies/${filename}`;
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to fetch ${filename}: ${response.status}`);
    const bytes = await response.arrayBuffer();
    const blob = await put(`case-studies/${filename}`, bytes, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'image/png',
    });
    const media = await prisma.media.create({
      data: {
        url: blob.url,
        filename: libraryName,
        type: 'IMAGE',
        size: bytes.byteLength,
      },
    });
    console.log('[case-study-import] uploaded', filename, media.id, media.url);
  }
} finally {
  await prisma.$disconnect();
}
