/**
 * src/systems/InputSystem.js
 * 
 * Sistema que gestiona toda la entrada del usuario.
 * Maneja:
 * - Movimiento del jugador (flechas/WASD)
 * - Pateo de pelota (espacio)
 * - Cambio de jugador (TAB/números)
 * - Pausa del juego (P)
 * - Acciones especiales (retro arcade simple)
 */

export default class InputSystem {
  /**
   * Constructor del sistema de entrada.
   * @param {Phaser.Scene} scene - La escena actual (MatchScene)
   */
  constructor(scene) {
    this.scene = scene;
    
    // Referencias a equipos y ball
    this.homeTeam = null;
    this.awayTeam = null;
    this.ball = null;
    
    // Estado de entrada actual
    this.moveDirection = { x: 0, y: 0 };
    this.isKickPressed = false;
    this.lastKickTime = 0;
    
    // Crear listeners de teclado
    this.createKeyboardListeners();
    
    console.log('📥 InputSystem inicializado');
  }
  
  /**
   * Crea los listeners de teclado.
   * Métodos privado, llamado en el constructor.
   */
  createKeyboardListeners() {
    const input = this.scene.input.keyboard;
    
    // MOVIMIENTO: Flechas
    const cursors = input.createCursorKeys();
    this.cursors = cursors;
    
    // MOVIMIENTO: WASD (alternativo)
    const wasd = input.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D'
    });
    this.wasd = wasd;
    
    // PATEO: Espacio
    input.on('keydown-SPACE', () => {
      this.handleKick();
    });
    
    // PAUSA: P
    input.on('keydown-P', () => {
      this.handlePause();
    });
    
    // CAMBIO DE JUGADOR: TAB
    input.on('keydown-TAB', () => {
      this.handlePlayerSwitch();
    });
    
    // DEBUG: F para debug (opcional)
    input.on('keydown-F', () => {
      console.log('📊 [DEBUG] Entrada del sistema activa');
    });
  }
  
  /**
   * Configura referencias de equipos y pelota.
   * Debe llamarse después de que MatchScene los crea.
   * @param {Team} homeTeam - Equipo local
   * @param {Team} awayTeam - Equipo visitante
   * @param {Ball} ball - Instancia de la pelota
   */
  setup(homeTeam, awayTeam, ball) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.ball = ball;
    
    console.log('✅ InputSystem configurado con equipos y pelota');
  }
  
  /**
   * Actualización cada frame.
   * Lee entrada y aplica movimiento al jugador activo.
   */
  update() {
    if (!this.homeTeam || !this.homeTeam.getActivePlayer()) {
      return; // No hacer nada si no está configurado
    }
    
    // Leer entrada de movimiento
    this.moveDirection = this.readMovementInput();
    
    // Aplicar movimiento al jugador activo
    const activePlayer = this.homeTeam.getActivePlayer();
    if (activePlayer) {
      activePlayer.move(this.moveDirection.x, this.moveDirection.y);
    }
    
    // Actualizar cooldown de pateo
    if (this.lastKickTime > 0) {
      this.lastKickTime -= this.scene.game.loop.deltaTime;
    }
  }
  
  /**
   * Lee la entrada de movimiento (flechas o WASD).
   * @returns {Object} Objeto con propiedades x, y (-1, 0, 1)
   */
  readMovementInput() {
    let x = 0;
    let y = 0;
    
    // Leer flechas
    if (this.cursors.left.isDown || this.wasd.left.isDown) x -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) x += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) y -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) y += 1;
    
    return { x, y };
  }
  
  /**
   * Maneja el evento de pateo (Espacio).
   */
  handleKick() {
    // Verificar cooldown
    if (this.lastKickTime > 0) {
      return;
    }
    
    // Obtener jugador activo
    const activePlayer = this.homeTeam.getActivePlayer();
    if (!activePlayer) return;
    
    // Determinar dirección de pateo basada en dirección de movimiento
    let kickX = this.moveDirection.x || 1; // Patea hacia donde se movía
    let kickY = this.moveDirection.y || 0;
    
    // Si no se movía, patea hacia adelante
    if (this.moveDirection.x === 0 && this.moveDirection.y === 0) {
      kickX = this.homeTeam.teamType === 'home' ? 1 : -1; // Hacia el arco contrario
      kickY = 0;
    }
    
    // Realizar pateo
    activePlayer.kick(this.ball, kickX, kickY);
    
    // Establecer cooldown
    this.lastKickTime = 300; // 300ms entre pateos
    
    console.log(`⚽ Pateo en dirección (${kickX}, ${kickY})`);
  }
  
  /**
   * Maneja el evento de pausa (P).
   */
  handlePause() {
    // Pausar MatchScene
    this.scene.scene.pause();
    
    // Lanzar PauseScene
    this.scene.scene.launch('PauseScene');
    
    console.log('⏸️ Juego pausado');
  }
  
  /**
   * Maneja el cambio de jugador (TAB).
   */
  handlePlayerSwitch() {
    const team = this.homeTeam;
    const nextIndex = (team.activePlayerIndex + 1) % team.players.length;
    
    team.setActivePlayer(nextIndex);
    
    console.log(`🔄 Jugador cambiado a: ${nextIndex}`);
  }
  
  /**
   * Obtiene la dirección de movimiento actual.
   * @returns {Object} Objeto {x, y}
   */
  getMovementDirection() {
    return this.moveDirection;
  }
  
  /**
   * Verifica si se está presionando acción (pateo).
   * @returns {boolean}
   */
  isActionPressed() {
    return this.isKickPressed;
  }
  
  /**
   * Reinicia el estado de entrada.
   */
  reset() {
    this.moveDirection = { x: 0, y: 0 };
    this.isKickPressed = false;
    this.lastKickTime = 0;
  }
}
