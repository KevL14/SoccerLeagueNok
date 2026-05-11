/**
 * src/config/fieldConstants.js
 *
 * Constantes físicas del campo para el Nokia Soccer League.
 * Ampliado para dar más aire y visibilidad a los porteros.
 */

export const FIELD = {
  // Dimensiones del mundo total (incluye márgenes fuera de banda)
  WORLD_W: 120,
  WORLD_H: 280,
  X:       60, // Centro horizontal
  CY:      140, // Centro vertical (medio campo)

  // Campo activo (donde juegan los jugadores)
  TOP:    30,  
  BOTTOM: 250, 
  LEFT:   10, 
  RIGHT:  110,
  WIDTH:  100, // RIGHT - LEFT
  HEIGHT: 220, // BOTTOM - TOP

  // Porterías
  GOAL_TOP: 15,
  GOAL_BOT: 265,
  GOAL_W:   30,
  GOAL_H:   15,

  // Áreas y Marcas
  PEN_W: 56,
  PEN_H: 32,
  PEN_S_W: 24,
  PEN_S_H: 12,
  PEN_ARC: 14,
};
