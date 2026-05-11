/**
 * src/config/gameConfig.js
 *
 * Configuración base de Phaser para Nokia Soccer League.
 * Resolución: 120×160 (vertical/portrait) · Escala: ×4 = 480×640 en pantalla
 */

import Phaser from 'phaser';

export const gameConfig = {
  type:     Phaser.AUTO,
  width:    120,
  height:   160,
  zoom:     4,
  pixelArt: true,
  parent:   'app',

  physics: {
    default: 'arcade',
    arcade:  {
      gravity: { y: 0 },
      debug:   false,
    },
  },

  scene: [], // Las escenas se inyectan en main.js
};
