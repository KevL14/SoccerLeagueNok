// MatchScene.js
// Esta escena maneja el partido en curso.
// No contiene toda la lógica directamente, sino que delega en Systems.

import InputSystem from '../systems/InputSystem.js';
import AISystem from '../systems/AISystem.js';

export default class MatchScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MatchScene' });
  }

  create() {
    // Inicializamos sistemas separados para modularidad
    this.inputSystem = new InputSystem(this);
    this.aiSystem = new AISystem(this);
  }

  update(time, delta) {
    // Cada frame se actualizan los sistemas
    this.inputSystem.update();
    this.aiSystem.update();
  }
}
