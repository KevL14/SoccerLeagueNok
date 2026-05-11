/**
 * src/ui/HUB.js
 *
 * HUD del partido en la franja superior (y=0-10) del canvas 120×160.
 * Muestra marcador, cronómetro e indicador de posesión.
 */

import Phaser from 'phaser';

export default class HUD {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;

    this.scoreText           = null;
    this.timerText           = null;
    this.possessionIndicator = null;

    this.homeScore    = 0;
    this.awayScore    = 0;
    this._elapsedSecs = 0;
  }

  create() {
    // La franja superior (y=0-10) ya tiene fondo dibujado en _drawField()
    const HY = 5; // Y centro de la franja

    // Posesión (izquierda)
    this.possessionIndicator = this.scene.add.text(3, HY, '▶', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#00ff00',
    }).setOrigin(0, 0.5).setScrollFactor(0);

    // Marcador (centro)
    this.scoreText = this.scene.add.text(60, HY, '0 - 0', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5).setScrollFactor(0);

    // Timer (derecha)
    this.timerText = this.scene.add.text(117, HY, '00:00', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#00ff00',
    }).setOrigin(1, 0.5).setScrollFactor(0);
  }

  // ─── Actualización ─────────────────────────────────────────────────────────

  /** @param {number} home @param {number} away */
  updateScore(home, away) {
    this.homeScore = home;
    this.awayScore = away;
    this.scoreText.setText(`${home} - ${away}`);
    // Animación de marcador al gol
    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 80,
      yoyo: true,
    });
  }

  /** @param {number} ms */
  updateTimer(ms) {
    const total   = Math.floor(ms / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    this.timerText.setText(
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    );
    this._elapsedSecs = total;
  }

  /** @param {'home'|'away'|null} team */
  updatePossession(team) {
    if (!this.possessionIndicator) return;
    if (team === 'home') {
      this.possessionIndicator.setText('▶').setColor('#00ff00');
    } else if (team === 'away') {
      this.possessionIndicator.setText('◀').setColor('#ffff00');
    } else {
      this.possessionIndicator.setText('·').setColor('#448844');
    }
  }

  getScore() {
    return { home: this.homeScore, away: this.awayScore };
  }

  getElapsedSeconds() {
    return this._elapsedSecs;
  }

  /**
   * Muestra un mensaje persistente hasta que se llame a hideAnnouncement.
   * @param {string} text
   */
  showAnnouncement(text) {
    if (this.announcement) this.announcement.destroy();
    this.announcement = this.scene.add.text(60, 45, text, {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#00ff00',
      backgroundColor: '#000000cc',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  hideAnnouncement() {
    if (this.announcement) {
      this.announcement.destroy();
      this.announcement = null;
    }
  }

  /**
   * Muestra un mensaje temporal centrado en el campo.
   * @param {string} text
   * @param {number} [duration=1200]
   */
  showMessage(text, duration = 1200) {
    const msg = this.scene.add.text(60, 85, text, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffff00',
    }).setOrigin(0.5).setScrollFactor(0);

    this.scene.time.delayedCall(duration, () => msg.destroy());
  }

  destroy() {
    this.scoreText?.destroy();
    this.timerText?.destroy();
    this.possessionIndicator?.destroy();
  }
}
