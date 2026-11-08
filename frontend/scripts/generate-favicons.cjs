const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../public/favicon-512.png');
const outputDir = path.join(__dirname, '../public');

// 생성할 파비콘 크기들
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 }, // ICO는 32x32로 생성
  { name: 'pwa-192x192.png', size: 192 }, // PWA 아이콘
  { name: 'pwa-512x512.png', size: 512 }, // PWA 아이콘 (고해상도)
];

async function generateFavicons() {
  console.log('🎨 파비콘 생성 시작...\n');

  if (!fs.existsSync(inputFile)) {
    console.error('❌ favicon-512.png 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  for (const { name, size } of sizes) {
    const outputPath = path.join(outputDir, name);

    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ ${name} (${size}x${size}) 생성 완료`);
    } catch (error) {
      console.error(`❌ ${name} 생성 실패:`, error.message);
    }
  }

  console.log('\n🎉 모든 파비콘 생성 완료!');
}

generateFavicons().catch(console.error);
