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
      fontFamily: '"Courier New", monospace',
      fontSize:   '7px',
      color:      '#4dff4d',
      fontStyle:  'bold',
    };

    // ─── Posesión (izquierda)
    this.possessionIndicator = this.drawPixelText(4, 6, '>', 0x4dff4d);

    // ─── Marcador (centro)
    this.scoreContainer = this.drawPixelText(40, 6, '0-0', 0xffffff, true);

    // ─── Timer (derecha)
    this.timerContainer = this.drawPixelText(76, 6, '00:00', 0x4dff4d, false, true);

    // ─── Anuncios (Press X, GOAL, etc) ─────────────────────────────────────────
    this.announcementBg = this.scene.add.rectangle(40, 65, 76, 10, 0x000000, 0.85);
    this.announcementBg.setOrigin(0.5).setScrollFactor(0).setDepth(40).setVisible(false);
    this.announcementBg.setStrokeStyle(1, 0x4dff4d, 0.4);

    this.announcementContainer = this.scene.add.container(40, 65).setScrollFactor(0).setDepth(41).setVisible(false);

    this.lastScoreText = '';
    this.lastTimeText  = '';
  }

  /**
   * Dibuja texto usando las texturas de píxeles individuales (3x5).
   */
  drawPixelText(x, y, text, color, centered = false, rightAligned = false) {
    const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(32);
    const lines = text.toUpperCase().split('\n');
    const charW = 4;
    const lineH = 7;

    lines.forEach((line, lineIdx) => {
      const chars = line.split('');
      let totalW = chars.length * charW;
      let startX = centered ? -Math.floor(totalW / 2) : (rightAligned ? -totalW : 0);
      let startY = lineIdx * lineH;

      chars.forEach((char, i) => {
        const key = `font_${char}`;
        if (this.scene.textures.exists(key)) {
          const s = this.scene.add.sprite(startX + i * charW, startY, key).setOrigin(0, 0.5);
          s.setTint(color);
          container.add(s);
        }
      });
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

  showHalfTimeStats(text) {
    this.hideAnnouncement();
    if (this.statsContainer) this.statsContainer.destroy();
    
    // Centrar en pantalla (40, 60 aprox)
    this.statsContainer = this.drawPixelText(40, 45, text, 0x4dff4d, true);
    
    // Fondo más grande para las estadísticas
    if (!this.statsBg) {
      this.statsBg = this.scene.add.rectangle(40, 60, 78, 50, 0x000000, 0.9);
      this.statsBg.setOrigin(0.5).setScrollFactor(0).setDepth(31).setStrokeStyle(1, 0x4dff4d, 0.6);
    }
    this.statsBg.setVisible(true);
  }

  hideHalfTimeStats() {
    if (this.statsContainer) this.statsContainer.setVisible(false);
    if (this.statsBg) this.statsBg.setVisible(false);
  }

  showAnnouncement(text, duration = 0) {
    if (!this.announcementContainer) return;
    this.announcementContainer.removeAll(true);
    
    // Generar el nuevo texto pixelado dentro del contenedor
    const chars = text.toUpperCase().split('');
    const charW = 4;
    let totalW = chars.length * charW - 1;
    let startX = Math.floor(-totalW / 2);

    chars.forEach((char, i) => {
      const key = `font_${char}`;
      if (this.scene.textures.exists(key)) {
        const s = this.scene.add.sprite(startX + i * charW, 0, key).setOrigin(0, 0.5);
        this.announcementContainer.add(s);
      }
    });

    this.announcementContainer.setVisible(true);
    this.announcementBg.setVisible(true);

    if (duration > 0) {
      this.scene.time.delayedCall(duration, () => this.hideAnnouncement());
    }
  }

  hideAnnouncement() {
    this.announcementContainer?.setVisible(false);
    this.announcementBg?.setVisible(false);
  }

  destroy() {
    this.scoreContainer?.destroy();
    this.timerContainer?.destroy();
    this.possessionIndicator?.destroy();
    this.announcementContainer?.destroy();
    this.announcementBg?.destroy();
  }
}
