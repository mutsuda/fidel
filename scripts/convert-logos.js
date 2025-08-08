const fs = require('fs');
const path = require('path');

// Función para convertir SVG a PNG usando sharp
async function convertSvgToPng(inputPath, outputPath, width, height) {
  const sharp = require('sharp');
  
  try {
    await sharp(inputPath)
      .resize(width, height)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Convertido: ${inputPath} -> ${outputPath} (${width}x${height})`);
  } catch (error) {
    console.error(`❌ Error convirtiendo ${inputPath}:`, error);
  }
}

// Función principal
async function convertAllLogos() {
  const conversions = [
    {
      input: 'public/logo-icon.svg',
      output: 'public/icon.png',
      width: 29,
      height: 29
    },
    {
      input: 'public/logo-horizontal.svg',
      output: 'public/logo.png',
      width: 160,
      height: 50
    },
    {
      input: 'public/logo-strip.svg',
      output: 'public/strip.png',
      width: 320,
      height: 123
    }
  ];

  console.log('🔄 Convirtiendo logos para Apple Wallet...');
  
  for (const conversion of conversions) {
    if (fs.existsSync(conversion.input)) {
      await convertSvgToPng(conversion.input, conversion.output, conversion.width, conversion.height);
    } else {
      console.log(`⚠️  Archivo no encontrado: ${conversion.input}`);
    }
  }
  
  console.log('✅ Conversión completada!');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  convertAllLogos().catch(console.error);
}

module.exports = { convertAllLogos }; 