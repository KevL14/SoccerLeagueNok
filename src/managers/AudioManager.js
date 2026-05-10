// src/managers/AudioManager.js
// Este archivo gestiona todos los sonidos y música del juego.
// Centraliza la reproducción, pausa y control de volumen.
// Mantiene estética arcade retro con efectos simples y cortos.

import Phaser from 'phaser';

export default class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
  }

  preload() {
    // Cargar sonidos retro
    this.scene.load.audio('goal', 'assets/sounds/goal.wav');
    this.scene.load.audio('kick', 'assets/sounds/kick.wav');
    this.scene.load.audio('whistle', 'assets/sounds/whistle.wav');
    this.scene.load.audio('menu', 'assets/sounds/menu.wav');
  }

  create() {
    // Inicializar sonidos cargados
    this.sounds.goal = this.scene.sound.add('goal');
    this.sounds.kick = this.scene.sound.add('kick');
    this.sounds.whistle = this.scene.sound.add('whistle');
    this.sounds.menu = this.scene.sound.add('menu');
  }

  play(key) {
    // Reproduce un sonido específico
    if (this.sounds[key]) {
      this.sounds[key].play();
    }
  }

  stop(key) {
    // Detiene un sonido específico
    if (this.sounds[key]) {
      this.sounds[key].stop();
    }
  }

  setVolume(key, value) {
    // Ajusta volumen de un sonido
    if (this.sounds[key]) {
      this.sounds[key].setVolume(value);
    }
  }
}
