/**
 * src/scenes/UIScene.js
 *
 * Escena separada para la interfaz de usuario (HUD).
 * Al ser una escena independiente, no le afecta el scroll ni el jitter
 * de la cámara principal de MatchScene.
 */

import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
    this.scoreContainer = null;
    this.timerContainer = null;
    this.possessionIndicator = null;
    this.announcementContainer = null;
    this.announcementBg = null;
    this.lastScoreText = '';
    this.lastTimeText  = '';
  }

  create() {
    // Fondo de la barra superior (LCD retro oscuro)
    const bar = this.add.rectangle(40, 6, 80, 12, 0x1a2a08, 0.85);
    bar.setOrigin(0.5, 0.5).setDepth(30);

    // ─── Posesión (izquierda)
    this.possessionIndicator = this.drawPixelText(4, 6, '>', 0x4dff4d);

    // ─── Marcador (centro)
    this.scoreContainer = this.drawPixelText(40, 6, '0-0', 0xffffff, true);

    // ─── Timer (derecha)
    this.timerContainer = this.drawPixelText(76, 6, '00:00', 0x4dff4d, false, true);

    // ─── Anuncios ─────────────────────────────────────────────────────────────
    this.announcementBg = this.add.rectangle(40, 65, 76, 10, 0x000000, 0.85);
    this.announcementBg.setOrigin(0.5).setDepth(40).setVisible(false);
    this.announcementBg.setStrokeStyle(1, 0x4dff4d, 0.4);

    this.announcementContainer = this.add.container(40, 65).setDepth(41).setVisible(false);

    // Escuchar eventos desde MatchScene
    const match = this.scene.get('MatchScene');
    match.events.on('updateScore', this.updateScore, this);
    match.events.on('updateTimer', this.updateTimer, this);
    match.events.on('updatePossession', this.updatePossession, this);
    match.events.on('showAnnouncement', this.showAnnouncement, this);
    match.events.on('hideAnnouncement', this.hideAnnouncement, this);

    this.events.on('shutdown', () => {
      match.events.off('updateScore');
      match.events.off('updateTimer');
      match.events.off('updatePossession');
      match.events.off('showAnnouncement');
      match.events.off('hideAnnouncement');
    });
  }

  drawPixelText(x, y, text, color, centered = false, rightAligned = false) {
    const container = this.add.container(x, y).setDepth(32);
    const chars = text.toUpperCase().split('');
    const charW = 4;
    
    let totalW = chars.length * charW;
    let startX = centered ? -Math.floor(totalW / 2) : (rightAligned ? -totalW : 0);

    chars.forEach((char, i) => {
      const key = `font_${char}`;
      if (this.textures.exists(key)) {
        const s = this.add.sprite(startX + i * charW, 0, key).setOrigin(0, 0.5);
        s.setTint(color);
        container.add(s);
      }
    });
    return container;
  }

  updateScore(home, away) {
    const newText = `${home}-${away}`;
    if (newText === this.lastScoreText) return;
    this.lastScoreText = newText;
    if (this.scoreContainer) this.scoreContainer.destroy();
    this.scoreContainer = this.drawPixelText(40, 6, newText, 0xffffff, true);
  }

  updateTimer(timeMs) {
    const totalSeconds = Math.floor(timeMs / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    const newText = `${m}:${s}`;
    if (newText === this.lastTimeText) return;
    this.lastTimeText = newText;
    if (this.timerContainer) this.timerContainer.destroy();
    this.timerContainer = this.drawPixelText(76, 6, newText, 0x4dff4d, false, true);
  }

  updatePossession(team) {
    if (!this.possessionIndicator) return;
    this.possessionIndicator.destroy();
    this.possessionIndicator = this.drawPixelText(team === 'home' ? 4 : 72, 6, team === 'home' ? '>' : '<', 0x4dff4d);
  }

  showAnnouncement(data) {
    const text = typeof data === 'string' ? data : data.text;
    if (!this.announcementContainer) return;
    this.announcementContainer.removeAll(true);
    
    const chars = text.toUpperCase().split('');
    const charW = 4;
    let totalW = chars.length * charW;
    let startX = -Math.floor(totalW / 2);

    chars.forEach((char, i) => {
      const key = `font_${char}`;
      if (this.textures.exists(key)) {
        const s = this.add.sprite(startX + i * charW, 0, key).setOrigin(0, 0.5);
        this.announcementContainer.add(s);
      }
    });

    this.announcementContainer.setVisible(true);
    this.announcementBg.setVisible(true);
  }

  hideAnnouncement() {
    this.announcementContainer?.setVisible(false);
    this.announcementBg?.setVisible(false);
  }
}
