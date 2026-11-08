const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../public/pwa-source.png');
const outputDir = path.join(__dirname, '../public');

// PWA 아이콘 크기들
const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
];

async function generatePWAIcons() {
  console.log('📱 PWA 아이콘 생성 시작...\n');

  if (!fs.existsSync(inputFile)) {
    console.error('❌ pwa-source.png 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  for (const { name, size } of sizes) {
    const outputPath = path.join(outputDir, name);

    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ ${name} (${size}x${size}) 생성 완료`);
    } catch (error) {
      console.error(`❌ ${name} 생성 실패:`, error.message);
    }
  }

  console.log('\n🎉 모든 PWA 아이콘 생성 완료!');
}

generatePWAIcons().catch(console.error);
