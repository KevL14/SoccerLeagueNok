/**
 * src/scenes/BootScene.js
 *
 * Nokia Soccer League — texturas procedurales con colores reales.
 *
 * SOLUCIÓN al "color canela": usamos RenderTexture en vez de make.graphics,
 * que garantiza fondo transparente y píxeles exactos sin mezcla de colores.
 *
 * Paleta del Nokia Soccer League original (pantalla pasiva a color):
 *   HOME (local): cuerpo ROJO con shorts azules
 *   AWAY (visit): cuerpo AZUL oscuro con shorts blancos
 *   GK HOME:      camiseta VERDE lima
 *   GK AWAY:      camiseta NARANJA
 *   Pelota:       punto BLANCO con pixel gris
 *
 * Sprite: 6×10 px — más alto para ser reconocible a zoom ×7
 *
 *  Col:  0 1 2 3 4 5
 *  Row:
 *   0:   . . H H . .   ← cabeza (H = piel 0xffcc99)
 *   1:   . . H H . .
 *   2:   . C C C C .   ← camiseta (C = color equipo)
 *   3:   C C C C C C   ← camiseta ancha
 *   4:   C C C C C C   ← camiseta
 *   5:   . S S S S .   ← shorts (S = color shorts)
 *   6:   . S S S S .
 *   7:   . L . . L .   ← medias (L = leg color)
 *   8:   . L . . L .
 *   9:   . F . . F .   ← pies (F = foot/boot)
 */

import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager.js';

// Colores de la paleta Nokia
const SKIN     = 0xffcc99;  // piel
const BOOT     = 0x222222;  // botas oscuras

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    this.audioManager = new AudioManager(this);
    this.audioManager.preload();
    
    // Carga del logo del menú (debe estar en la carpeta public/)
    this.load.image('menu_logo', '/menu_logo.png');
  }

  create() {
    this.audioManager.create();
    this.audioManager.play('menu');
    this.registry.set('audioManager', this.audioManager);

    this._generateTextures();
    this._generatePixelFont();
    this.scene.start('MenuScene');
  }

  /**
   * Genera texturas individuales para cada letra/número (Pixel Font 3x5).
   * Esto garantiza CERO blur porque cada caracter es un objeto de píxeles reales.
   */
  _generatePixelFont() {
    const chars = {
      '0': [7,5,5,5,7], '1': [2,6,2,2,7], '2': [7,1,7,4,7], '3': [7,1,7,1,7], '4': [5,5,7,1,1],
      '5': [7,4,7,1,7], '6': [7,4,7,5,7], '7': [7,1,1,1,1], '8': [7,5,7,5,7], '9': [7,5,7,1,7],
      ':': [0,2,0,2,0], '-': [0,0,7,0,0], ' ': [0,0,0,0,0],
      'S': [7,4,7,1,7], 'O': [7,5,5,5,7], 'C': [7,4,4,4,7], 'E': [7,4,7,4,7], 'R': [7,5,7,6,5],
      'L': [4,4,4,4,7], 'A': [7,5,7,5,5], 'G': [7,4,5,5,7], 'U': [5,5,5,5,7],
      'P': [7,5,7,4,4], 'X': [5,5,2,5,5], 'T': [7,2,2,2,2], 'N': [5,7,7,7,5],
      'I': [7,2,2,2,7], 'M': [5,7,7,5,5], 'H': [5,5,7,5,5], 'F': [7,4,7,4,4],
      'D': [6,5,5,5,6], 'V': [5,5,5,5,2], 'J': [1,1,1,5,7], 'K': [5,5,6,5,5],
      'Q': [7,5,5,7,1], 'W': [5,5,7,7,5], 'Y': [5,5,2,2,2], 'Z': [7,1,2,4,7],
    };

    Object.entries(chars).forEach(([char, data]) => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xffffff, 1);
      data.forEach((row, y) => {
        for (let x = 0; x < 3; x++) {
          if ((row >> (2 - x)) & 1) {
            g.fillRect(x, y, 1, 1);
          }
        }
      });
      g.generateTexture(`font_${char}`, 3, 5);
      g.destroy();
    });
  }

  // ─── Generador de texturas ──────────────────────────────────────────────────

  /**
   * Genera texturas direccionales con 2 frames de animación para un equipo.
   */
  _generateTeamTextures(teamKey, shirtColor, shortsColor, legColor) {
    const W = 6, H = 9;
    const HAIR = 0x221100;
    
    const drawBase = (g, view, frame) => {
      const isAlt = frame === 1;

      // 1. Cabeza
      g.fillStyle(SKIN, 1);
      g.fillRect(2, 1, 2, 2); 
      g.fillRect(2, 0, 2, 1); 
      
      g.fillStyle(HAIR, 1);
      if (view === 'front') {
        g.fillRect(2, 0, 2, 1);
      } else if (view === 'back') {
        g.fillRect(2, 0, 2, 2);
      } else { // side
        g.fillRect(2, 0, 1, 3);
      }

      // 2. Cuerpo
      g.fillStyle(shirtColor, 1);
      g.fillRect(2, 3, 2, 3);

      // 3. Brazos (Alternando en frames)
      if (view === 'front' || view === 'back') {
        const offL = isAlt ? -1 : 0;
        const offR = isAlt ? 0 : -1;
        
        g.fillStyle(shirtColor, 1);
        g.fillRect(1, 3 + offL, 1, 2); // L
        g.fillRect(4, 3 + offR, 1, 2); // R
        g.fillStyle(SKIN, 1);
        g.fillRect(1, 5 + offL, 1, 1);
        g.fillRect(4, 5 + offR, 1, 1);
      } else { // side
        const swing = isAlt ? 1 : -1;
        g.fillStyle(shirtColor, 1);
        g.fillRect(3 + swing, 3, 1, 2);
        g.fillStyle(SKIN, 1);
        g.fillRect(3 + swing, 5, 1, 1);
      }

      // 4. Pantalones
      g.fillStyle(shortsColor, 1);
      g.fillRect(2, 6, 2, 1);

      // 5. Piernas (Alternando)
      g.fillStyle(legColor, 1);
      if (view === 'side') {
        const legSwing = isAlt ? 1 : 0;
        g.fillRect(2 + legSwing, 7, 1, 1);
        g.fillStyle(BOOT, 1);
        g.fillRect(2 + legSwing, 8, 2, 1);
      } else {
        const liftL = isAlt ? -1 : 0;
        const liftR = isAlt ? 0 : -1;
        g.fillRect(2, 7 + liftL, 1, 1);
        g.fillRect(3, 7 + liftR, 1, 1);
        g.fillStyle(BOOT, 1);
        g.fillRect(1, 8 + liftL, 2, 1);
        g.fillRect(3, 8 + liftR, 2, 1);
      }
    };

    ['front', 'back', 'side'].forEach(view => {
      [0, 1].forEach(frame => {
        const g = this.make.graphics({ add: false });
        drawBase(g, view, frame);
        g.generateTexture(`${teamKey}_${view}_${frame}`, W, H);
        g.destroy();
      });
    });
  }

  _generateTextures() {
    // HOME: Rojo/Azul
    this._generateTeamTextures('team_home', 0xcc1111, 0x1111aa, 0xcc1111);
    // AWAY: Azul/Blanco
    this._generateTeamTextures('team_away', 0x1144cc, 0xeeeeee, 0x1144cc);
    // GKs
    this._generateTeamTextures('gk_home', 0x33cc33, 0x1111aa, SKIN);
    this._generateTeamTextures('gk_away', 0xff8800, 0x222222, SKIN);

    // ─── PELOTA: cuadrado blanco 2×2 con sombra ──────────────────────────────
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Diseño de pelota más pulido (círculo 4x4 aproximado)
    g.fillStyle(0xffffff, 1);
    g.fillRect(1, 0, 2, 4); // central vert
    g.fillRect(0, 1, 4, 2); // central horiz
    
    // Detalle gajos (puntos oscuros)
    g.fillStyle(0x000000, 1);
    g.fillRect(1, 1, 1, 1);
    g.fillRect(2, 2, 1, 1);
    
    // Brillo superior
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(1, 0, 1, 1);

    g.generateTexture('ball_tex', 4, 4);
    g.destroy();
  }
}
