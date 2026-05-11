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
  }

  create() {
    this.audioManager.create();
    this.audioManager.play('menu');
    this.registry.set('audioManager', this.audioManager);

    this._generateTextures();
    this.scene.start('MenuScene');
  }

  // ─── Generador de texturas ──────────────────────────────────────────────────

  /**
   * Dibuja un sprite de jugador usando RenderTexture para fondo transparente.
   * @param {string} key
   * @param {number} shirtColor  color camiseta
   * @param {number} shortsColor color shorts
   * @param {number} legColor    color medias/piel de piernas
   */
  _makePlayerSprite(key, shirtColor, shortsColor, legColor) {
    const W = 6, H = 10;
    const rt = this.add.renderTexture(0, 0, W, H);
    rt.setVisible(false);

    const g = this.make.graphics({ add: false });

    // Cabeza — piel
    g.fillStyle(SKIN, 1);
    g.fillRect(2, 0, 2, 2);

    // Camiseta
    g.fillStyle(shirtColor, 1);
    g.fillRect(1, 2, 4, 1);
    g.fillRect(0, 3, 6, 2);

    // Shorts
    g.fillStyle(shortsColor, 1);
    g.fillRect(1, 5, 4, 2);

    // Medias/piernas
    g.fillStyle(legColor, 1);
    g.fillRect(1, 7, 1, 2);
    g.fillRect(4, 7, 1, 2);

    // Botas
    g.fillStyle(BOOT, 1);
    g.fillRect(1, 9, 1, 1);
    g.fillRect(4, 9, 1, 1);

    rt.draw(g, 0, 0);
    rt.saveTexture(key);

    g.destroy();
    rt.destroy();
  }

  /**
   * Portero: igual al jugador pero con guantes blancos visibles.
   */
  _makeGKSprite(key, shirtColor, shortsColor) {
    const W = 6, H = 10;
    const rt = this.add.renderTexture(0, 0, W, H);
    rt.setVisible(false);

    const g = this.make.graphics({ add: false });

    // Cabeza
    g.fillStyle(SKIN, 1);
    g.fillRect(2, 0, 2, 2);

    // Camiseta
    g.fillStyle(shirtColor, 1);
    g.fillRect(1, 2, 4, 1);
    g.fillRect(0, 3, 6, 2);

    // Guantes blancos en extremos de los brazos
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 4, 1, 1);
    g.fillRect(5, 4, 1, 1);

    // Shorts
    g.fillStyle(shortsColor, 1);
    g.fillRect(1, 5, 4, 2);

    // Piernas
    g.fillStyle(SKIN, 1);
    g.fillRect(1, 7, 1, 2);
    g.fillRect(4, 7, 1, 2);

    // Botas
    g.fillStyle(BOOT, 1);
    g.fillRect(1, 9, 1, 1);
    g.fillRect(4, 9, 1, 1);

    rt.draw(g, 0, 0);
    rt.saveTexture(key);

    g.destroy();
    rt.destroy();
  }

  _generateTextures() {
    // ─── HOME: camiseta ROJA, shorts AZUL OSCURO, medias rojas ───────────────
    this._makePlayerSprite('team_home', 0xcc1111, 0x1111aa, 0xcc1111);

    // ─── AWAY: camiseta AZUL, shorts BLANCO, medias azules ───────────────────
    this._makePlayerSprite('team_away', 0x1144cc, 0xeeeeee, 0x1144cc);

    // ─── GK HOME: camiseta VERDE LIMA, shorts azules ──────────────────────────
    this._makeGKSprite('gk_home', 0x33cc33, 0x1111aa);

    // ─── GK AWAY: camiseta NARANJA, shorts negros ─────────────────────────────
    this._makeGKSprite('gk_away', 0xff8800, 0x222222);

    // ─── PELOTA: cuadrado blanco 2×2 con sombra ──────────────────────────────
    const rt = this.add.renderTexture(0, 0, 3, 3);
    rt.setVisible(false);
    const bg = this.make.graphics({ add: false });
    bg.fillStyle(0xffffff, 1);
    bg.fillRect(0, 0, 3, 3);
    bg.fillStyle(0xaaaaaa, 1);
    bg.fillRect(2, 2, 1, 1); // sombra esquina
    bg.fillStyle(0x555555, 1);
    bg.fillRect(1, 1, 1, 1); // centro oscuro (efecto cuero)
    rt.draw(bg, 0, 0);
    rt.saveTexture('ball_tex');
    bg.destroy();
    rt.destroy();
  }
}
