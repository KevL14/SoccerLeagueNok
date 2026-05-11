/**
 * src/config/fieldConstants.js
 *
 * Constantes físicas del campo para el Nokia Soccer League.
 * Ampliado para dar más aire y visibilidad a los porteros.
 */

export const FIELD = {
  // Dimensiones del mundo total (incluye márgenes fuera de banda)
  WORLD_W: 100,
  WORLD_H: 220,
  X:       50, // Centro horizontal
  CY:      110, // Centro vertical (medio campo)

  // Campo activo (donde juegan los jugadores)
  TOP:    20,  // Más margen arriba
  BOTTOM: 200, // Más margen abajo
  LEFT:   10, 
  RIGHT:  90,
  WIDTH:  80,  // RIGHT - LEFT
  HEIGHT: 180, // BOTTOM - TOP

  // Porterías
  GOAL_TOP: 10,
  GOAL_BOT: 210,
  GOAL_W:   24,
  GOAL_H:   10,
};
