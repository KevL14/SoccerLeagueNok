/**
 * src/config/fieldConstants.js
 *
 * Nokia Soccer League — campo para viewport 60×85, campo total 60×200
 * La cámara hace scroll vertical siguiendo la bola.
 *
 * Coordenadas absolutas del mundo (60×200):
 *   y   0–7   → margen trasero portería HOME (césped oscuro)
 *   y   7–13  → profundidad portería HOME (red)
 *   y  13–187 → campo activo (174 px)
 *   y 187–193 → profundidad portería AWAY (red)
 *   y 193–200 → margen trasero portería AWAY (césped oscuro)
 */

export const FIELD = {
  // Dimensiones del mundo total
  WORLD_W: 60,
  WORLD_H: 200,

  // Centro X
  X: 30,

  // Campo activo (donde juegan los jugadores)
  TOP:    13,
  BOTTOM: 187,
  LEFT:   2,
  RIGHT:  58,
  WIDTH:  56,
  HEIGHT: 174,
  CY:     100,  // línea de medio campo

  // Porterías
  GOAL_W:   22,  // ancho del arco
  GOAL_H:   6,   // profundidad de la red
  GOAL_TOP: 7,   // Y boca portería HOME (arriba) — donde la bola puede entrar
  GOAL_BOT: 193, // Y boca portería AWAY (abajo)

  // Áreas
  PEN_W:   44,
  PEN_H:   28,
  PEN_S_W: 22,   // === GOAL_W
  PEN_S_H: 12,

  // Viewport (lo que ve la cámara)
  VP_W: 60,
  VP_H: 85,
};
