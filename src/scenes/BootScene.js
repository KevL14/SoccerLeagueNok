/**
 * src/scenes/BootScene.js
 *
 * Escena de carga inicial.
 * Precarga assets de audio y transfiere el control a MenuScene.
 */

import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.audioManager = new AudioManager(this);
    this.audioManager.preload();
  }

  create() {
    this.audioManager.create();
    this.audioManager.play('menu');

    this._generateTextures();

    this.scene.start('MenuScene');
  }

  _generateTextures() {
    /**
     * @param {string} key Nombre de la textura
     * @param {number} shirtColor Color principal (camiseta)
     * @param {number} shortColor Color secundario (pantalón)
     * @param {number} skinColor Color de piel
     * @param {boolean} isGK Si es arquero (más ancho)
     */
    const makeSprite = (key, shirtColor, shortColor, skinColor = 0xffe0bd, isGK = false) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      
      // Outline/Shadow (Darker version of shirt color)
      // g.fillStyle(0x000000, 0.2);
      // g.fillRect(1, 1, 6, 9);

      // Hair (Classic Nokia black)
      g.fillStyle(0x111111, 1);
      g.fillRect(2, 0, 4, 2);

      // Face
      g.fillStyle(skinColor, 1);
      g.fillRect(2, 2, 4, 2);

      // Shirt (Primary color)
      g.fillStyle(shirtColor, 1);
      g.fillRect(1, 4, 6, 5);
      
      // White Stripe/Chest Detail (As seen in reference image)
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(1, 5, 6, 1);

      // Shorts (Secondary color)
      g.fillStyle(shortColor || 0xeeeeee, 1);
      g.fillRect(1, 9, 6, 2);

      // Shoes/Feet
      g.fillStyle(0x000000, 1);
      g.fillRect(1, 11, 2, 1);
      g.fillRect(5, 11, 2, 1);

      g.generateTexture(key, 8, 12);
    };

    const SKIN_LIGHT = 0xffe0bd;
    const SKIN_DARK  = 0x8d5524;

    // Equipos con colores mejorados
    makeSprite('team_red',    0xdd1111, 0x1111bb, SKIN_LIGHT); // España
    makeSprite('team_yellow', 0xffdd00, 0x0055aa, SKIN_DARK);  // Brasil
    makeSprite('team_blue',   0x0033cc, 0xffffff, SKIN_LIGHT); // Italia
    makeSprite('team_white',  0xffffff, 0x333333, SKIN_LIGHT); // Alemania
    makeSprite('team_lightblue', 0x77bbff, 0x333333, SKIN_LIGHT); // Argentina
    
    // Arqueros con colores contrastantes
    makeSprite('gk_home', 0x00ff00, 0x111111, SKIN_LIGHT, true);
    makeSprite('gk_away', 0xff00ff, 0x111111, SKIN_DARK, true);
  }
}
