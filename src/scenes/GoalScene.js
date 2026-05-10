/**
 * src/scenes/GoalScene.js
 * 
 * Escena que se muestra cuando se marca un gol.
 * Maneja:
 * - Animación retro del gol (parpadeo, texto)
 * - Sonido de gol (si existe AudioManager)
 * - Estadísticas del gol
 * - Temporización: espera 3 segundos y vuelve a MatchScene
 * - Estética Nokia pixel art verde
 */

import Phaser from 'phaser';

export default class GoalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GoalScene' });
  }

  /**
   * Recibe datos de la escena anterior (quién anotó, equipo, etc).
   * Se llama automáticamente cuando se lanza esta escena.
   */
  init(data) {
    // Datos del gol (pasados desde ScoreSystem)
    this.goalData = data || {
      team: 'home', // Equipo que anotó
      scorer: null, // Jugador que anotó (opcional)
      time: 0       // Tiempo en que se anotó
    };
  }

  create() {
    // Fondo negro retro Nokia
    this.add.rectangle(80, 60, 160, 120, 0x000000);

    // Texto grande "GOAL" parpadeante
    this.goalText = this.add.text(50, 40, 'GOAL!!!', {
      fontFamily: 'RetroFont',
      fontSize: '20px',
      color: '#00ff00' // Verde Nokia
    });
    
    // Animar parpadeo
    this.tweens.add({
      targets: [this.goalText],
      alpha: [1, 0.3],
      duration: 200,
      repeat: 10, // Parpadea 10 veces
      yoyo: true
    });

    // Información adicional del gol
    const teamName = this.goalData.team === 'home' ? 'EQUIPO LOCAL' : 'EQUIPO VISITANTE';
    this.add.text(30, 75, teamName, {
      fontFamily: 'RetroFont',
      fontSize: '8px',
      color: '#00ff00'
    });

    // Si existe información del anotador
    if (this.goalData.scorer) {
      this.add.text(30, 85, `Anotador: ${this.goalData.scorer}`, {
        fontFamily: 'RetroFont',
        fontSize: '6px',
        color: '#00ff00'
      });
    }

    // Presionar ENTER para continuar (opcional)
    this.input.keyboard.on('keydown-ENTER', () => {
      this.continueToMatch();
    });

    // Auto-continuar después de 3 segundos
    this.time.delayedCall(3000, () => {
      this.continueToMatch();
    });

    // Reproducir sonido de gol si existe
    if (this.scene.get('BootScene')?.audioManager) {
      this.scene.get('BootScene').audioManager.play('goal');
    }

    console.log(`⚽ GOAL por ${this.goalData.team}!`);
  }

  /**
   * Continúa hacia MatchScene.
   */
  continueToMatch() {
    // Detener cualquier tween activo
    this.tweens.killAll();

    // Volver a MatchScene
    this.scene.stop('GoalScene');
    this.scene.resume('MatchScene');
  }

  /**
   * Si el usuario presiona ESC, vuelve sin continuar.
   */
  shutdown() {
    // Limpiar listeners
    this.tweens.killAll();
  }
}
