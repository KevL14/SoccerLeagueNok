/**
 * src/main.js
 *
 * Punto de entrada — configura Phaser e inicia el juego.
 */

/**
 * src/main.js
 *
 * Punto de entrada — configura Phaser e inicia el juego.
 */

import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

import BootScene  from './scenes/BootScene.js';
import MenuScene  from './scenes/MenuScene.js';
import MatchScene from './scenes/MatchScene.js';
import UIScene    from './scenes/UIScene.js';
import PauseScene from './scenes/PauseScene.js';
import GoalScene  from './scenes/GoalScene.js';
import IntroScene from './scenes/IntroScene.js';
import FullTimeScene from './scenes/FullTimeScene.js';

new Phaser.Game({
  ...gameConfig,
  scene: [BootScene, IntroScene, MenuScene, MatchScene, UIScene, PauseScene, GoalScene, FullTimeScene],
});
