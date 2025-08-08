const fs = require('fs');
const { createCanvas } = require('canvas');

// Función para crear PNG de alta resolución
function createHighResLogo(width, height, drawFunction, outputPath) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fondo transparente
  ctx.clearRect(0, 0, width, height);
  
  // Llamar a la función de dibujo
  drawFunction(ctx, width, height);
  
  // Guardar como PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`✅ Creado: ${outputPath} (${width}x${height})`);
}

// Función para dibujar logo de navbar (64x64px)
function drawNavbarLogo(ctx, width, height) {
  // Fondo del pan
  ctx.fillStyle = '#D4AF37';
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(4, 8, 56, 48, 6);
  ctx.fill();
  ctx.stroke();
  
  // Líneas del pan
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.6;
  
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(12, 16 + i * 12);
    ctx.lineTo(52, 16 + i * 12);
    ctx.stroke();
  }
  
  // S estilizada
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(20, 16);
  ctx.quadraticCurveTo(24, 16, 32, 16);
  ctx.quadraticCurveTo(40, 16, 48, 16);
  ctx.quadraticCurveTo(48, 24, 48, 24);
  ctx.quadraticCurveTo(48, 32, 48, 32);
  ctx.quadraticCurveTo(40, 32, 32, 32);
  ctx.quadraticCurveTo(24, 32, 20, 32);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(20, 40);
  ctx.quadraticCurveTo(24, 40, 32, 40);
  ctx.quadraticCurveTo(40, 40, 48, 40);
  ctx.quadraticCurveTo(48, 48, 48, 48);
  ctx.quadraticCurveTo(48, 56, 48, 56);
  ctx.quadraticCurveTo(40, 56, 32, 56);
  ctx.quadraticCurveTo(24, 56, 20, 56);
  ctx.stroke();
}

// Función para dibujar logo de landing (96x96px)
function drawLandingLogo(ctx, width, height) {
  // Fondo del pan
  ctx.fillStyle = '#D4AF37';
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(6, 12, 84, 72, 9);
  ctx.fill();
  ctx.stroke();
  
  // Líneas del pan
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2.4;
  ctx.globalAlpha = 0.6;
  
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(18, 24 + i * 18);
    ctx.lineTo(78, 24 + i * 18);
    ctx.stroke();
  }
  
  // S estilizada
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(30, 24);
  ctx.quadraticCurveTo(36, 24, 48, 24);
  ctx.quadraticCurveTo(60, 24, 72, 24);
  ctx.quadraticCurveTo(72, 36, 72, 36);
  ctx.quadraticCurveTo(72, 48, 72, 48);
  ctx.quadraticCurveTo(60, 48, 48, 48);
  ctx.quadraticCurveTo(36, 48, 30, 48);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(30, 60);
  ctx.quadraticCurveTo(36, 60, 48, 60);
  ctx.quadraticCurveTo(60, 60, 72, 60);
  ctx.quadraticCurveTo(72, 72, 72, 72);
  ctx.quadraticCurveTo(72, 84, 72, 84);
  ctx.quadraticCurveTo(60, 84, 48, 84);
  ctx.quadraticCurveTo(36, 84, 30, 84);
  ctx.stroke();
}

// Función principal
function createHighResLogos() {
  console.log('🔄 Creando logos de alta resolución...');
  
  // Crear logo para navbar (64x64px)
  createHighResLogo(64, 64, drawNavbarLogo, 'public/logo-navbar.png');
  
  // Crear logo para landing (96x96px)
  createHighResLogo(96, 96, drawLandingLogo, 'public/logo-landing.png');
  
  console.log('✅ Logos de alta resolución creados!');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createHighResLogos();
}

module.exports = { createHighResLogos }; 