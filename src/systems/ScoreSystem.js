/**
 * src/systems/ScoreSystem.js
 *
 * Controla el marcador del partido.
 * Al detectar un gol: actualiza HUD, reproduce audio y lanza GoalScene.
 */

export default class ScoreSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('../ui/HUB.js').default} hud
   */
  constructor(scene, hud) {
    this.scene = scene;
    this.hud   = hud;

    this.homeScore = 0;
    this.awayScore = 0;
  }

  /** @param {'home'|'away'} team */
  goal(team) {
    if (team === 'home') {
      this.homeScore++;
    } else if (team === 'away') {
      this.awayScore++;
    }

    this.scene.events.emit('updateScore', this.homeScore, this.awayScore);
    this.scene.audioManager?.play('goal');

    // Avisar a MatchScene para que ejecute la animación de celebración in-game
    if (this.scene.onGoalScored) {
      this.scene.onGoalScored(team);
    }
  }

  getScore() {
    return { home: this.homeScore, away: this.awayScore };
  }
}