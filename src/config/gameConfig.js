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
  width:    80,
  height:   110,
  zoom:     5,
  pixelArt:    true,
  roundPixels: true,
  antialias:   false,
  parent:      'app',

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
