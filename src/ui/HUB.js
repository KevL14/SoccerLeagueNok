/**
 * src/ui/HUB.js
 *
 * HUD Nokia Soccer League — fijo a la cámara (scrollFactor = 0).
 * Ocupa la franja superior (y=0–8) del VIEWPORT (no del mundo).
 */

import Phaser from 'phaser';

export default class HUD {
  constructor(scene) {
    this.scene = scene;

    this.scoreText           = null;
    this.timerText           = null;
    this.possessionIndicator = null;
    this.announcement        = null;

    this.homeScore    = 0;
    this.awayScore    = 0;
    this._elapsedSecs = 0;
  }

  create() {
    // Fondo del HUD — fijo a cámara
    const bg = this.scene.add.rectangle(30, 4, 60, 8, 0x000000)
      .setScrollFactor(0).setDepth(30);

    // Separador
    this.scene.add.graphics()
      .setScrollFactor(0).setDepth(31)
      .lineStyle(1, 0x44ff44, 0.7)
      .lineBetween(0, 8, 60, 8);

    // Posesión (izquierda) — fijo
    this.possessionIndicator = this.scene.add.text(3, 4, '▶', {
      fontFamily: 'monospace', fontSize: '6px', color: '#44ff44',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(32);

    // Marcador (centro) — fijo
    this.scoreText = this.scene.add.text(30, 4, '0 - 0', {
      fontFamily: 'monospace', fontSize: '7px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(32);

    // Timer (derecha) — fijo
    this.timerText = this.scene.add.text(57, 4, '00:00', {
      fontFamily: 'monospace', fontSize: '6px', color: '#44ff44',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(32);
  }

  updateScore(home, away) {
    this.homeScore = home;
    this.awayScore = away;
    this.scoreText.setText(`${home} - ${away}`);
    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.5, scaleY: 1.5,
      duration: 90, yoyo: true,
    });
  }

  updateTimer(ms) {
    const total   = Math.floor(ms / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    this.timerText.setText(
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    );
    this._elapsedSecs = total;
  }

  updatePossession(team) {
    if (!this.possessionIndicator) return;
    if (team === 'home') this.possessionIndicator.setText('▶').setColor('#44ff44');
    else if (team === 'away') this.possessionIndicator.setText('◀').setColor('#ffff44');
    else this.possessionIndicator.setText('·').setColor('#448844');
  }

  showAnnouncement(text) {
    if (this.announcement) this.announcement.destroy();
    this.announcement = this.scene.add.text(30, 44, text, {
      fontFamily: 'monospace', fontSize: '6px', color: '#ffff44',
      backgroundColor: '#000000cc',
      padding: { x: 3, y: 2 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  hideAnnouncement() {
    if (this.announcement) { this.announcement.destroy(); this.announcement = null; }
  }

  showMessage(text, duration = 1000) {
    const msg = this.scene.add.text(30, 44, text, {
      fontFamily: 'monospace', fontSize: '6px', color: '#ffff00',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
    this.scene.time.delayedCall(duration, () => msg.destroy());
  }

  getScore()          { return { home: this.homeScore, away: this.awayScore }; }
  getElapsedSeconds() { return this._elapsedSecs; }

  destroy() {
    this.scoreText?.destroy();
    this.timerText?.destroy();
    this.possessionIndicator?.destroy();
    this.announcement?.destroy();
  }
}
