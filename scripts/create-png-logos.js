const fs = require('fs');
const { createCanvas } = require('canvas');

// Función para crear PNG usando canvas
function createPngLogo(width, height, drawFunction, outputPath) {
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

// Función para dibujar el icono (29x29)
function drawIcon(ctx, width, height) {
  // Fondo del pan
  ctx.fillStyle = '#D4AF37';
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(2, 4, 25, 21, 3);
  ctx.fill();
  ctx.stroke();
  
  // Líneas del pan
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.6;
  
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(23, 8);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(6, 12);
  ctx.lineTo(23, 12);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(6, 16);
  ctx.lineTo(23, 16);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(6, 20);
  ctx.lineTo(23, 20);
  ctx.stroke();
  
  // S estilizada
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(10, 8);
  ctx.quadraticCurveTo(12, 8, 14, 8);
  ctx.quadraticCurveTo(16, 8, 18, 8);
  ctx.quadraticCurveTo(18, 10, 18, 10);
  ctx.quadraticCurveTo(18, 12, 18, 12);
  ctx.quadraticCurveTo(16, 12, 14, 12);
  ctx.quadraticCurveTo(12, 12, 10, 12);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(10, 16);
  ctx.quadraticCurveTo(12, 16, 14, 16);
  ctx.quadraticCurveTo(16, 16, 18, 16);
  ctx.quadraticCurveTo(18, 18, 18, 18);
  ctx.quadraticCurveTo(18, 20, 18, 20);
  ctx.quadraticCurveTo(16, 20, 14, 20);
  ctx.quadraticCurveTo(12, 20, 10, 20);
  ctx.stroke();
}

// Función para dibujar el logo horizontal (160x50)
function drawHorizontalLogo(ctx, width, height) {
  // Fondo del pan
  ctx.fillStyle = '#D4AF37';
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(5, 8, 35, 34, 4);
  ctx.fill();
  ctx.stroke();
  
  // Líneas del pan
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.6;
  
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(10, 15 + i * 7);
    ctx.lineTo(35, 15 + i * 7);
    ctx.stroke();
  }
  
  // S estilizada
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(15, 15);
  ctx.quadraticCurveTo(18, 15, 22, 15);
  ctx.quadraticCurveTo(26, 15, 30, 15);
  ctx.quadraticCurveTo(30, 18, 30, 18);
  ctx.quadraticCurveTo(30, 21, 30, 21);
  ctx.quadraticCurveTo(26, 21, 22, 21);
  ctx.quadraticCurveTo(18, 21, 15, 21);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(15, 29);
  ctx.quadraticCurveTo(18, 29, 22, 29);
  ctx.quadraticCurveTo(26, 29, 30, 29);
  ctx.quadraticCurveTo(30, 32, 30, 32);
  ctx.quadraticCurveTo(30, 35, 30, 35);
  ctx.quadraticCurveTo(26, 35, 22, 35);
  ctx.quadraticCurveTo(18, 35, 15, 35);
  ctx.stroke();
  
  // Texto "Shokupan"
  ctx.fillStyle = '#8B4513';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('Shokupan', 50, 30);
}

// Función para dibujar el strip (320x123)
function drawStripLogo(ctx, width, height) {
  // Fondo degradado
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#D4AF37');
  gradient.addColorStop(1, '#F4E4BC');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Elementos decorativos de pan
  ctx.fillStyle = '#D4AF37';
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.roundRect(20, 15, 280, 93, 8);
  ctx.fill();
  ctx.stroke();
  
  // Líneas del pan
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(35, 30 + i * 15);
    ctx.lineTo(285, 30 + i * 15);
    ctx.stroke();
  }
  
  // S estilizada grande
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(50, 30);
  ctx.quadraticCurveTo(60, 30, 75, 30);
  ctx.quadraticCurveTo(90, 30, 105, 30);
  ctx.quadraticCurveTo(105, 40, 105, 40);
  ctx.quadraticCurveTo(105, 50, 105, 50);
  ctx.quadraticCurveTo(90, 50, 75, 50);
  ctx.quadraticCurveTo(60, 50, 50, 50);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(50, 70);
  ctx.quadraticCurveTo(60, 70, 75, 70);
  ctx.quadraticCurveTo(90, 70, 105, 70);
  ctx.quadraticCurveTo(105, 80, 105, 80);
  ctx.quadraticCurveTo(105, 90, 105, 90);
  ctx.quadraticCurveTo(90, 90, 75, 90);
  ctx.quadraticCurveTo(60, 90, 50, 90);
  ctx.stroke();
  
  // Texto "Shokupan"
  ctx.fillStyle = '#8B4513';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('Shokupan', 130, 70);
  
  // Elementos decorativos adicionales
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.arc(280, 35, 8, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(290, 85, 6, 0, 2 * Math.PI);
  ctx.fill();
}

// Función principal
function createAllLogos() {
  console.log('🔄 Creando logos para Apple Wallet...');
  
  // Crear icono
  createPngLogo(29, 29, drawIcon, 'public/icon.png');
  
  // Crear logo horizontal
  createPngLogo(160, 50, drawHorizontalLogo, 'public/logo.png');
  
  // Crear strip
  createPngLogo(320, 123, drawStripLogo, 'public/strip.png');
  
  console.log('✅ Todos los logos creados!');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAllLogos();
}

module.exports = { createAllLogos }; 