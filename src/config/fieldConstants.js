/**
 * src/config/fieldConstants.js
 *
 * Constantes de layout del campo compartidas entre escenas y sistemas.
 * Canvas: 120 × 160 px
 */

export const FIELD = {
  X:        60,   // centro X del campo
  TOP:      10,   // Y inicio del campo (debajo del margen superior)
  BOTTOM:   280,  // Y fin del campo (270 px de altura total)
  LEFT:     1,
  RIGHT:    119,
  WIDTH:    118,
  HEIGHT:   270,
  CY:       145,  // Y línea de medio campo

  // Porterías
  GOAL_W:   38,
  GOAL_H:   10,
  GOAL_TOP: 10,
  GOAL_BOT: 280,

  // Áreas de penal (Grande y Chica)
  PEN_W:    72,
  PEN_H:    42,
  PEN_S_W:  40,
  PEN_S_H:  16,
};
