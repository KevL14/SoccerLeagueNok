/**
 * src/main.js
 * 
 * Archivo principal de la aplicación.
 * Configura Phaser, importa todas las escenas y sistemas,
 * y lanza el juego con la configuración retro Nokia.
 */

import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

// Importar todas las escenas
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import MatchScene from './scenes/MatchScene.js';
import PauseScene from './scenes/PauseScene.js';
import GoalScene from './scenes/GoalScene.js';

/**
 * Crear configuración completa del juego con todas las escenas.
 */
const config = {
  ...gameConfig,
  scene: [
    BootScene,      // Carga de assets
    MenuScene,      // Menú principal
    MatchScene,     // Partido en curso
    PauseScene,     // Pausa
    GoalScene       // Celebración de gol
  ]
};

/**
 * Crear instancia de Phaser con la configuración.
 */
const game = new Phaser.Game(config);

console.log('🎮 Nokia Soccer League iniciado!');
console.log('📋 Escenas cargadas:', config.scene.map(s => s.name || s.key));
