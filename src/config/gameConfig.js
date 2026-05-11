/**
 * src/config/gameConfig.js
 *
 * Nokia Soccer League
 * Viewport: 60×85 px  ·  Zoom: ×7  →  420×595 px en pantalla
 * El campo total mide 60×200 px → la cámara hace scroll siguiendo la bola.
 * Esto replica el Nokia 1600 donde solo ves una porción del campo
 * y la cámara sigue la acción (efecto "muy cerca" / zoomed-in).
 */

import Phaser from 'phaser';

export const gameConfig = {
  type:     Phaser.AUTO,
  width:    60,   // viewport ancho
  height:   85,   // viewport alto (campo total: 200px, la cámara scrollea)
  zoom:     7,    // 60×7=420 · 85×7=595 px en pantalla
  pixelArt: true,
  parent:   'app',

  backgroundColor: '#3d5c1a',

  physics: {
    default: 'arcade',
    arcade:  {
      gravity: { y: 0 },
      debug:   false,
    },
  },

  scene: [],
};
