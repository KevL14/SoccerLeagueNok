// src/systems/ScoreSystem.js
// Este sistema controla el marcador del partido.
// Detecta goles, actualiza el puntaje, comunica cambios al HUD
// y lanza la GoalScene retro para celebrar.

export default class ScoreSystem {
  constructor(scene, hud) {
    this.scene = scene;
    this.hud = hud;

    // Inicializamos marcador
    this.homeScore = 0;
    this.awayScore = 0;
  }

  goal(team) {
    // Incrementa marcador según equipo
    if (team === 'home') {
      this.homeScore++;
    } else if (team === 'away') {
      this.awayScore++;
    }

    // Actualiza HUD
    this.hud.updateScore(this.homeScore, this.awayScore);

    // Reproduce sonido de gol si existe AudioManager
    if (this.scene.audioManager) {
      this.scene.audioManager.play('goal');
    }

    // Pausar partido y mostrar GoalScene retro
    this.scene.scene.pause('MatchScene');
    this.scene.scene.launch('GoalScene');
  }
}