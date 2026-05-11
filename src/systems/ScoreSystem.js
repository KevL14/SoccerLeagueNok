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

    this.hud?.updateScore(this.homeScore, this.awayScore);
    this.scene.audioManager?.play('goal');

    // Pausar MatchScene y mostrar GoalScene
    this.scene.scene.pause('MatchScene');
    this.scene.scene.launch('GoalScene', { team });
  }

  getScore() {
    return { home: this.homeScore, away: this.awayScore };
  }
}