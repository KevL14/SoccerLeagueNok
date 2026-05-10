// gameConfig.js
// Este archivo define la configuración global del juego en Phaser.
// Aquí se establecen resolución retro, escalado, físicas y escenas iniciales.

export const gameConfig = {
  type: Phaser.AUTO, // Detecta automáticamente WebGL o Canvas
  width: 160,        // Resolución retro pequeña
  height: 120,
  zoom: 4,           // Escala para pantallas modernas
  pixelArt: true,    // Activa renderizado pixel-perfect
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Sin gravedad, estilo arcade
      debug: false       // Desactiva debug visual
    }
  },
  scene: [] // Se llenará con las escenas (BootScene, MenuScene, etc.)
};
