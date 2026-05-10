/**
 * src/ui/HUB.js
 * 
 * Clase que gestiona el HUD (Heads-Up Display) del partido.
 * Muestra:
 * - Marcador en tiempo real
 * - Cronómetro del partido
 * - Indicadores de posesión (opcional)
 * - Estado del juego
 * - Estética Nokia pixel art (texto verde sobre fondo negro)
 */

import Phaser from 'phaser';

export default class HUB {
  /**
   * Constructor del HUD.
   * @param {Phaser.Scene} scene - La escena actual (MatchScene)
   */
  constructor(scene) {
    this.scene = scene;

    // Elementos de texto retro
    this.scoreText = null;
    this.timerText = null;
    this.homeTeamName = null;
    this.awayTeamName = null;
    this.possessionIndicator = null;

    // Variables internas
    this.homeScore = 0;
    this.awayScore = 0;
    this.elapsedSeconds = 0;
  }

  /**
   * Crea los elementos visuales del HUD.
   * Debe llamarse una sola vez en MatchScene.create()
   */
  create() {
    // Fondo superior con información (banda retro)
    this.scene.add.rectangle(80, 8, 160, 14, 0x000000);
    
    // Borde superior
    const topBorder = this.scene.add.rectangle(80, 8, 160, 14, undefined, 0);
    topBorder.setStrokeStyle(1, 0x00ff00);

    // MARCADOR: Equipo Local - Equipo Visitante (centro arriba)
    this.scoreText = this.scene.add.text(80, 3, '0 - 0', {
      fontFamily: 'RetroFont',
      fontSize: '8px',
      color: '#00ff00',
      align: 'center'
    }).setOrigin(0.5, 0);

    // TIMER: Tiempo del partido (derecha arriba)
    this.timerText = this.scene.add.text(155, 3, '00:00', {
      fontFamily: 'RetroFont',
      fontSize: '8px',
      color: '#00ff00'
    }).setOrigin(1, 0);

    // POSESIÓN: Indicador visual simple (izquierda arriba)
    this.possessionIndicator = this.scene.add.text(5, 3, '●○', {
      fontFamily: 'RetroFont',
      fontSize: '6px',
      color: '#00ff00'
    }).setOrigin(0, 0);

    console.log('✅ HUB creado correctamente');
  }

  /**
   * Actualiza el marcador mostrado en pantalla.
   * @param {number} homeScore - Goles del equipo local
   * @param {number} awayScore - Goles del equipo visitante
   */
  updateScore(homeScore, awayScore) {
    this.homeScore = homeScore;
    this.awayScore = awayScore;
    this.scoreText.setText(`${homeScore} - ${awayScore}`);
  }

  /**
   * Actualiza el cronómetro del partido.
   * @param {number} milliseconds - Tiempo en milisegundos desde inicio
   */
  updateTimer(milliseconds) {
    // Convertir ms a segundos y luego a formato mm:ss
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.timerText.setText(formatted);
    
    this.elapsedSeconds = totalSeconds;
  }

  /**
   * Actualiza el indicador de posesión (cuál equipo tiene la pelota).
   * @param {string} team - 'home', 'away', o null (ninguno)
   */
  updatePossession(team) {
    // ● = equipo local, ○ = equipo visitante
    if (team === 'home') {
      this.possessionIndicator.setText('●○');
    } else if (team === 'away') {
      this.possessionIndicator.setText('○●');
    } else {
      this.possessionIndicator.setText('●○');
    }
  }

  /**
   * Obtiene el marcador actual.
   * @returns {Object} Objeto {home, away} con los goles
   */
  getScore() {
    return {
      home: this.homeScore,
      away: this.awayScore
    };
  }

  /**
   * Obtiene el tiempo transcurrido.
   * @returns {number} Tiempo en segundos
   */
  getElapsedSeconds() {
    return this.elapsedSeconds;
  }

  /**
   * Muestra un mensaje temporal en pantalla.
   * Útil para notificaciones retro.
   * @param {string} text - Texto del mensaje
   * @param {number} duration - Duración en ms (por defecto 1000)
   */
  showMessage(text, duration = 1000) {
    const message = this.scene.add.text(80, 60, text, {
      fontFamily: 'RetroFont',
      fontSize: '8px',
      color: '#ffff00' // Amarillo para mensajes
    }).setOrigin(0.5);

    // Desaparecer después del tiempo especificado
    this.scene.time.delayedCall(duration, () => {
      message.destroy();
    });
  }

  /**
   * Destaca un evento en el HUD (parpadeo).
   * Útil para goles, tarjetas, etc.
   */
  highlightEvent() {
    this.scene.tweens.add({
      targets: [this.scoreText],
      scaleX: [1, 1.2],
      scaleY: [1, 1.2],
      duration: 100,
      yoyo: true,
      repeat: 2
    });
  }

  /**
   * Limpia los elementos del HUD.
   */
  destroy() {
    if (this.scoreText) this.scoreText.destroy();
    if (this.timerText) this.timerText.destroy();
    if (this.possessionIndicator) this.possessionIndicator.destroy();
    if (this.homeTeamName) this.homeTeamName.destroy();
    if (this.awayTeamName) this.awayTeamName.destroy();
  }
}

