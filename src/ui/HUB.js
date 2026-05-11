/**
 * src/ui/HUB.js
 *
 * Interfaz de usuario para el Nokia Soccer League.
 * Rediseñado para mayor legibilidad (LCD retro pero nítido).
 */

import Phaser from 'phaser';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.scoreText = null;
    this.timerText = null;
    this.possessionIndicator = null;
    this.announcementText = null;
    this.announcementBg = null;
  }

  create() {
    // Fondo de la barra superior (LCD retro oscuro)
    const bar = this.scene.add.rectangle(40, 6, 80, 12, 0x1a2a08, 0.85);
    bar.setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(30);

    const textStyle = {
      fontFamily: 'Verdana, Arial, sans-serif',
      fontSize:   '7px',
      color:      '#4dff4d',
      fontStyle:  'bold',
      stroke:     '#000000',
      strokeThickness: 1
    };

    // Posesión (izquierda)
    this.possessionIndicator = this.scene.add.text(4, 6, '▶', textStyle)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(32);

    // Marcador (centro)
    this.scoreText = this.scene.add.text(40, 6, '0 - 0', {
      ...textStyle,
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(32);

    // Timer (derecha)
    this.timerText = this.scene.add.text(76, 6, '00:00', textStyle)
      .setOrigin(1, 0.5).setScrollFactor(0).setDepth(32);

    // ─── Anuncios (Press X, GOAL, etc) ─────────────────────────────────────────
    this.announcementBg = this.scene.add.rectangle(40, 65, 70, 12, 0x000000, 0.85);
    this.announcementBg.setOrigin(0.5).setScrollFactor(0).setDepth(40).setVisible(false);
    this.announcementBg.setStrokeStyle(1, 0x4dff4d, 0.5);

    this.announcementText = this.scene.add.text(40, 65, '', {
      fontFamily: 'Verdana, Arial, sans-serif',
      fontSize:   '6px',
      color:      '#ffffff',
      fontStyle:  'bold',
      align:      'center',
      letterSpacing: 1,
      stroke:     '#1a2a08',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41).setVisible(false);
  }

  updateScore(home, away) {
    if (this.scoreText) this.scoreText.setText(`${home} - ${away}`);
  }

  updateTimer(timeMs) {
    if (!this.timerText) return;
    const totalSeconds = Math.floor(timeMs / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    this.timerText.setText(`${m}:${s}`);
  }

  updatePossession(team) {
    if (!this.possessionIndicator) return;
    this.possessionIndicator.setX(team === 'home' ? 4 : 70);
    this.possessionIndicator.setText(team === 'home' ? '▶' : '◀');
  }

  showAnnouncement(text, duration = 0) {
    if (!this.announcementText) return;
    this.announcementText.setText(text).setVisible(true);
    this.announcementBg.setVisible(true);

    if (duration > 0) {
      this.scene.time.delayedCall(duration, () => this.hideAnnouncement());
    }
  }

  hideAnnouncement() {
    if (this.announcementText) {
      this.announcementText.setVisible(false);
      this.announcementBg.setVisible(false);
    }
  }

  destroy() {
    this.scoreText?.destroy();
    this.timerText?.destroy();
    this.possessionIndicator?.destroy();
    this.announcementText?.destroy();
    this.announcementBg?.destroy();
  }
}
