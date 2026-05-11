/**
 * src/scenes/IntroScene.js
 *
 * Escena de introducción: entrada de equipos con nombres.
 */

import Phaser from 'phaser';
import { FIELD } from '../config/fieldConstants.js';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  init(data) {
    this.homeTeam = data?.homeTeam || { name: 'HOME', players: [] };
    this.awayTeam = data?.awayTeam || { name: 'AWAY', players: [] };
  }

  create() {
    // Fondo verde del campo
    this.add.rectangle(FIELD.X, FIELD.CY, FIELD.WIDTH, FIELD.HEIGHT, 0x1c6e1c);

    // Dibuja línea de medio campo
    this.add.line(0, 0, FIELD.LEFT, FIELD.CY, FIELD.RIGHT, FIELD.CY, 0xffffff, 0.8).setOrigin(0);
    this.add.circle(FIELD.X, FIELD.CY, 13, 0x000000, 0).setStrokeStyle(1, 0xffffff, 0.8);

    // Animación de equipos entrando
    this._playTeamIntro();
  }

  _playTeamIntro() {
    const timeline = this.tweens.timeline({
      tweens: []
    });

    // HOME TEAM - entra desde arriba
    const homeNameX = 30;
    const homeNameY = 40;
    const homeTeamText = this.add.text(homeNameX, homeNameY, this.homeTeam.name.toUpperCase(), {
      fontSize: '8px',
      fill: '#ff0000',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    homeTeamText.alpha = 0;

    timeline.add({
      targets: homeTeamText,
      alpha: 1,
      y: 50,
      duration: 600,
      ease: 'Power2.out'
    });

    // AWAY TEAM - entra desde abajo
    const awayNameX = 90;
    const awayNameY = 120;
    const awayTeamText = this.add.text(awayNameX, awayNameY, this.awayTeam.name.toUpperCase(), {
      fontSize: '8px',
      fill: '#ffcc00',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    awayTeamText.alpha = 0;

    timeline.add({
      targets: awayTeamText,
      alpha: 1,
      y: 110,
      duration: 600,
      ease: 'Power2.out'
    }, '-=400'); // Overlap

    // Mostrar "vs" en el medio
    const vsText = this.add.text(FIELD.X, FIELD.CY, 'VS', {
      fontSize: '10px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    vsText.alpha = 0;

    timeline.add({
      targets: vsText,
      alpha: { from: 1, to: 0 },
      duration: 800,
      delay: 200
    });

    timeline.on('complete', () => {
      this.scene.start('MatchScene', {
        homeTeamName: this.homeTeam.name,
        awayTeamName: this.awayTeam.name
      });
    });
  }
}
