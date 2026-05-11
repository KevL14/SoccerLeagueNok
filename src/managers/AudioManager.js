/**
 * src/managers/AudioManager.js
 *
 * Gestiona todos los sonidos del juego.
 * Si un archivo de audio no existe, lo ignora silenciosamente.
 */

export default class AudioManager {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    /** @type {Record<string, Phaser.Sound.BaseSound>} */
    this.sounds = {};

    /** Claves de audio que se intentarán cargar. */
    this.keys = ['goal', 'kick', 'whistle', 'menu'];
  }

  preload() {
    this.keys.forEach(key => {
      this.scene.load.audio(key, `assets/sounds/${key}.wav`);
    });
  }

  create() {
    this.keys.forEach(key => {
      // Registrar solo si el asset se cargó correctamente
      if (this.scene.cache.audio.exists(key)) {
        this.sounds[key] = this.scene.sound.add(key);
      }
    });
  }

  /** @param {string} key */
  play(key) {
    this.sounds[key]?.play();
  }

  /** @param {string} key */
  stop(key) {
    this.sounds[key]?.stop();
  }

  /**
   * @param {string} key
   * @param {number} value  0.0 – 1.0
   */
  setVolume(key, value) {
    this.sounds[key]?.setVolume(value);
  }
}
