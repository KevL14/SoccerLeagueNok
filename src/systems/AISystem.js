/**
 * src/systems/AISystem.js
 * 
 * Sistema que gestiona la IA del equipo visitante (away).
 * Maneja:
 * - Movimiento automático de jugadores
 * - Lógica simple de ataque y defensa
 * - Pateo automático cuando tiene la pelota
 * - IA del arquero
 * - Toma de decisiones arcade retro
 */

export default class AISystem {
  /**
   * Constructor del sistema de IA.
   * @param {Phaser.Scene} scene - La escena actual (MatchScene)
   */
  constructor(scene) {
    this.scene = scene;
    
    // Referencias a equipos y pelota
    this.awayTeam = null;
    this.homeTeam = null;
    this.ball = null;
    
    // Estado de IA
    this.playerAIStates = {}; // { playerIndex: 'idle' | 'attacking' | 'defending' }
    this.updateInterval = 0; // Contador para actualizar IA cada X frames
    this.updateFrequency = 10; // Actualizar cada 10 frames (menos cálculo)
    
    console.log('🤖 AISystem inicializado');
  }
  
  /**
   * Configura referencias de equipos y pelota.
   * Debe llamarse después de que MatchScene los crea.
   * @param {Team} awayTeam - Equipo visitante
   * @param {Team} homeTeam - Equipo local
   * @param {Ball} ball - Instancia de la pelota
   */
  setup(awayTeam, homeTeam, ball) {
    this.awayTeam = awayTeam;
    this.homeTeam = homeTeam;
    this.ball = ball;
    
    // Inicializar estados de IA para cada jugador
    awayTeam.getAllPlayers().forEach((player, index) => {
      this.playerAIStates[index] = 'idle';
    });
    
    console.log('✅ AISystem configurado');
  }
  
  /**
   * Actualización cada frame.
   * Ejecuta lógica de IA para el equipo visitante.
   */
  update() {
    if (!this.awayTeam || !this.ball) {
      return; // No hacer nada si no está configurado
    }
    
    // Actualizar solo cada X frames para optimizar
    this.updateInterval++;
    if (this.updateInterval < this.updateFrequency) {
      return;
    }
    this.updateInterval = 0;
    
    // Actualizar IA del arquero (siempre)
    if (this.awayTeam.goalkeeper) {
      this.awayTeam.goalkeeper.updateAI(this.ball, this.scene.game.loop.deltaTime);
    }
    
    // Actualizar IA de jugadores
    this.updateTeamAI();
  }
  
  /**
   * Actualiza la IA de todo el equipo visitante.
   */
  updateTeamAI() {
    const ballPos = this.ball.getPosition();
    const ballVel = this.ball.getVelocity();
    
    // Detectar quién está más cerca de la pelota
    const nearestPlayer = this.awayTeam.getNearestPlayer(ballPos.x, ballPos.y);
    
    // Iterar sobre todos los jugadores
    this.awayTeam.getAllPlayers().forEach((player, index) => {
      const isNearestPlayer = player === nearestPlayer;
      
      if (isNearestPlayer) {
        // Este jugador es el más cercano a la pelota
        this.updatePlayerAttackingAI(player, ballPos, index);
      } else {
        // Este jugador está en defensa/apoyo
        this.updatePlayerDefenseAI(player, ballPos, index);
      }
    });
  }
  
  /**
   * IA para jugador atacando (cerca de la pelota).
   * @param {Player} player - Instancia del jugador
   * @param {Object} ballPos - Posición actual de la pelota
   * @param {number} index - Índice del jugador
   */
  updatePlayerAttackingAI(player, ballPos, index) {
    const playerPos = player.getPosition();
    const dx = ballPos.x - playerPos.x;
    const dy = ballPos.y - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Si está muy cerca de la pelota
    if (distance < 12) {
      // Dirigirse hacia el arco (equipo away ataca hacia la izquierda)
      const dirX = -1; // Ataca hacia equipo home (izquierda)
      const dirY = Math.random() > 0.5 ? 1 : -1; // Variabilidad retro
      
      // Patea si tiene posibilidad
      if (Math.random() > 0.6) { // 40% de probabilidad
        player.kick(this.ball, dirX, dirY);
      } else {
        // Si no patea, se mueve hacia la pelota
        player.move(Math.sign(dx), Math.sign(dy));
      }
    } else {
      // Moverse hacia la pelota
      const moveX = Math.sign(dx) * 0.8;
      const moveY = Math.sign(dy) * 0.8;
      player.move(moveX, moveY);
    }
    
    this.playerAIStates[index] = 'attacking';
  }
  
  /**
   * IA para jugador en defensa/apoyo (lejos de la pelota).
   * @param {Player} player - Instancia del jugador
   * @param {Object} ballPos - Posición actual de la pelota
   * @param {number} index - Índice del jugador
   */
  updatePlayerDefenseAI(player, ballPos, index) {
    const playerPos = player.getPosition();
    
    // Posición defensiva (permanecer en posición inicial aproximadamente)
    // con movimiento leve hacia la pelota si está muy cerca
    const dx = ballPos.x - playerPos.x;
    const distance = Math.abs(dx);
    
    if (distance < 30) {
      // Si la pelota está relativamente cerca, moverse un poco hacia ella
      player.move(Math.sign(dx) * 0.3, 0);
    } else {
      // Mantener posición (sin movimiento)
      player.stop();
    }
    
    this.playerAIStates[index] = 'defending';
  }
  
  /**
   * Obtiene el estado de IA de un jugador.
   * @param {number} index - Índice del jugador
   * @returns {string} Estado: 'idle', 'attacking', 'defending'
   */
  getPlayerState(index) {
    return this.playerAIStates[index] || 'idle';
  }
  
  /**
   * Incrementa la dificultad de la IA.
   * Nota: Para futuras mejoras
   */
  increaseDifficulty() {
    this.updateFrequency = Math.max(5, this.updateFrequency - 2);
    console.log(`📈 Dificultad de IA aumentada (update freq: ${this.updateFrequency})`);
  }
  
  /**
   * Reduce la dificultad de la IA.
   * Nota: Para futuras mejoras
   */
  decreaseDifficulty() {
    this.updateFrequency = Math.min(20, this.updateFrequency + 2);
    console.log(`📉 Dificultad de IA reducida (update freq: ${this.updateFrequency})`);
  }
  
  /**
   * Reinicia la IA.
   */
  reset() {
    this.updateInterval = 0;
    Object.keys(this.playerAIStates).forEach(key => {
      this.playerAIStates[key] = 'idle';
    });
  }
}
