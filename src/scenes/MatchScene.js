/**
 * src/scenes/MatchScene.js
 * 
 * Escena principal del partido.
 * Orquesta:
 * - Creación de entidades (equipos, pelota, arqueros)
 * - Sistemas de juego (Input, AI, Físicas, Puntuación)
 * - HUD e interfaz
 * - Colisiones y eventos
 * - Detección de goles
 * - Pausa/reanudación
 * 
 * Arquitectura modular: cada sistema tiene responsabilidad clara.
 */

import Phaser from 'phaser';
import InputSystem from '../systems/InputSystem.js';
import AISystem from '../systems/AISystem.js';
import ScoreSystem from '../systems/ScoreSystem.js';
import HUB from '../ui/HUB.js';
import Ball from '../entities/Ball.js';
import Player from '../entities/Player.js';
import GoalKeeper from '../entities/GoalKeeper.js';
import Team from '../entities/Team.js';

export default class MatchScene extends Phaser.Scene {
  /**
   * Constructor de MatchScene.
   */
  constructor() {
    super({ key: 'MatchScene' });
  }

  /**
   * Inicialización de variables internas.
   */
  init() {
    // Equipos y jugadores
    this.homeTeam = null;
    this.awayTeam = null;
    
    // Pelota
    this.ball = null;
    
    // Sistemas
    this.inputSystem = null;
    this.aiSystem = null;
    this.scoreSystem = null;
    
    // UI
    this.hud = null;
    
    // Control de colisiones
    this.homeTeamGroup = null;
    this.awayTeamGroup = null;
    
    // Control de partido
    this.matchStarted = false;
    this.matchPaused = false;
  }

  /**
   * Creación de todos los elementos del partido.
   */
  create() {
    console.log('🎮 MatchScene: Inicializando partido...');
    
    // Fondo negro retro Nokia
    this.add.rectangle(80, 60, 160, 120, 0x000000);

    // Línea de medio campo (opcional visual)
    this.add.line(80, 20, 80, 120, 0x00ff00, 0.3);

    // === CREAR PELOTA ===
    this.ball = new Ball(this, 80, 60);
    console.log('✅ Pelota creada');

    // === CREAR EQUIPOS ===
    this.createTeams();

    // === CREAR SISTEMAS ===
    this.inputSystem = new InputSystem(this);
    this.aiSystem = new AISystem(this);
    this.scoreSystem = new ScoreSystem(this, this.hud);

    // Configurar sistemas con referencias
    this.inputSystem.setup(this.homeTeam, this.awayTeam, this.ball);
    this.aiSystem.setup(this.awayTeam, this.homeTeam, this.ball);

    // === CREAR HUD ===
    this.hud = new HUB(this);
    this.hud.create();
    this.hud.updateScore(0, 0);
    this.hud.updateTimer(0);

    // === CONFIGURAR COLISIONES ===
    this.setupCollisions();

    // === AUDIO (si existe) ===
    if (this.audioManager) {
      this.audioManager.play('whistle'); // Silbato de inicio
    }

    // === EVENTOS ===
    this.scene.events.on('pause', () => {
      this.handlePause();
    });

    this.scene.events.on('resume', () => {
      this.handleResume();
    });

    this.matchStarted = true;
    console.log('🏀 ¡Partido iniciado!');
  }

  /**
   * Crea ambos equipos con sus jugadores y arqueros.
   */
  createTeams() {
    // === EQUIPO LOCAL (HOME) - JUGADOR ===
    const homeGoalkeeper = new GoalKeeper(this, 10, 60, 'home');
    this.homeTeam = new Team(this, 'EQUIPO LOCAL', 'home', homeGoalkeeper);

    // Agregar 9 jugadores al equipo local (más arquero = 10 total en real, 9 aquí)
    for (let i = 0; i < 9; i++) {
      const player = new Player(this, 50 + i * 5, 30 + i * 10, 'home', i + 1);
      this.homeTeam.addPlayer(player);
    }

    // Resetear posiciones de formación
    this.homeTeam.resetPositions();

    console.log(`✅ Equipo LOCAL creado (${this.homeTeam.getPlayerCount()} jugadores)`);

    // === EQUIPO VISITANTE (AWAY) - IA ===
    const awayGoalkeeper = new GoalKeeper(this, 150, 60, 'away');
    this.awayTeam = new Team(this, 'EQUIPO VISITANTE', 'away', awayGoalkeeper);

    // Agregar 9 jugadores al equipo visitante
    for (let i = 0; i < 9; i++) {
      const player = new Player(this, 110 - i * 5, 30 + i * 10, 'away', i + 1);
      this.awayTeam.addPlayer(player);
    }

    // Resetear posiciones de formación
    this.awayTeam.resetPositions();

    console.log(`✅ Equipo VISITANTE creado (${this.awayTeam.getPlayerCount()} jugadores)`);
  }

  /**
   * Configura las colisiones entre objetos.
   */
  setupCollisions() {
    // Pelota vs Jugadores LOCAL
    this.homeTeam.getAllPlayers().forEach(player => {
      this.physics.add.overlap(this.ball.getSprite(), player.getSprite(), () => {
        this.handleBallPlayerCollision(player, 'home');
      });
    });

    // Pelota vs Jugadores VISITANTE
    this.awayTeam.getAllPlayers().forEach(player => {
      this.physics.add.overlap(this.ball.getSprite(), player.getSprite(), () => {
        this.handleBallPlayerCollision(player, 'away');
      });
    });

    // Pelota vs Arquero LOCAL
    this.physics.add.overlap(this.ball.getSprite(), this.homeTeam.goalkeeper.getSprite(), () => {
      this.handleBallGoalkeeperCollision(this.homeTeam.goalkeeper, 'home');
    });

    // Pelota vs Arquero VISITANTE
    this.physics.add.overlap(this.ball.getSprite(), this.awayTeam.goalkeeper.getSprite(), () => {
      this.handleBallGoalkeeperCollision(this.awayTeam.goalkeeper, 'away');
    });

    // Detección de goles (pelota sale por los lados)
    this.setupGoalDetection();

    console.log('✅ Colisiones configuradas');
  }

  /**
   * Configura la detección de goles.
   */
  setupGoalDetection() {
    // Zona de gol izquierda (equipo visitante marca)
    const leftGoal = this.physics.add.zone(0, 60, 5, 30);
    this.physics.add.overlap(this.ball.getSprite(), leftGoal, () => {
      console.log('⚽ ¡GOL DEL EQUIPO VISITANTE!');
      this.scoreSystem.goal('away');
      this.resetMatch();
    });

    // Zona de gol derecha (equipo local marca)
    const rightGoal = this.physics.add.zone(160, 60, 5, 30);
    this.physics.add.overlap(this.ball.getSprite(), rightGoal, () => {
      console.log('⚽ ¡GOL DEL EQUIPO LOCAL!');
      this.scoreSystem.goal('home');
      this.resetMatch();
    });
  }

  /**
   * Maneja colisión pelota-jugador.
   * @param {Player} player - Jugador que colisiona
   * @param {string} team - Equipo del jugador
   */
  handleBallPlayerCollision(player, team) {
    // Establecer posesión
    player.setBallPossession(true);
    this.hud.updatePossession(team);

    // Hacer que jugador IA detecte mejor la pelota
    if (team === 'away') {
      this.aiSystem.getPlayerState(this.awayTeam.getAllPlayers().indexOf(player));
    }

    console.log(`⚽ Colisión: ${team} Player toca la pelota`);
  }

  /**
   * Maneja colisión pelota-arquero.
   * @param {GoalKeeper} goalkeeper - Arquero que colisiona
   * @param {string} team - Equipo del arquero
   */
  handleBallGoalkeeperCollision(goalkeeper, team) {
    goalkeeper.performSave();
    
    // Pelota rebota al arquero desviar
    const ballVel = this.ball.getVelocity();
    this.ball.kick(-ballVel.x * 0.5, ballVel.y * 0.3);

    console.log(`🧤 Parada del arquero ${team}`);
  }

  /**
   * Reinicia la posición de la pelota al centro del campo.
   * Se llama después de un gol.
   */
  resetMatch() {
    this.time.delayedCall(3000, () => {
      this.ball.setPosition(80, 60);
      this.homeTeam.resetPositions();
      this.awayTeam.resetPositions();
    });
  }

  /**
   * Maneja pausa del partido.
   */
  handlePause() {
    this.matchPaused = true;
    this.homeTeam.stopAll();
    this.awayTeam.stopAll();
    this.ball.stop();
    console.log('⏸️ Partido pausado');
  }

  /**
   * Maneja reanudación del partido.
   */
  handleResume() {
    this.matchPaused = false;
    console.log('▶️ Partido reanudado');
  }

  /**
   * Actualización cada frame.
   * @param {number} time - Tiempo total en ms
   * @param {number} delta - Tiempo desde último frame en ms
   */
  update(time, delta) {
    if (!this.matchStarted || this.matchPaused) {
      return;
    }

    // Actualizar HUD (timer)
    this.hud.updateTimer(time);

    // Actualizar sistemas
    this.inputSystem.update();
    this.aiSystem.update();

    // Actualizar entidades
    this.ball.update();
    this.homeTeam.getAllPlayers().forEach(player => {
      player.update(delta);
    });
    this.awayTeam.getAllPlayers().forEach(player => {
      player.update(delta);
    });

    // Debug: mostrar info en consola (opcional)
    if (time % 5000 < 16) { // Cada 5 segundos
      const ballPos = this.ball.getPosition();
      console.log(`🔵 Posición pelota: (${Math.floor(ballPos.x)}, ${Math.floor(ballPos.y)})`);
    }
  }

  /**
   * Limpieza al salir de la escena.
   */
  shutdown() {
    // Destruir equipos
    if (this.homeTeam) this.homeTeam.destroy();
    if (this.awayTeam) this.awayTeam.destroy();

    // Destruir pelota
    if (this.ball) this.ball.destroy();

    // Limpiar HUD
    if (this.hud) this.hud.destroy();

    console.log('🛑 MatchScene limpiada');
  }
}

