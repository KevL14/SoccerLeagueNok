# 🎮 Nokia Soccer League - Phaser 3

Proyecto de recreación del clásico **Nokia Soccer League** usando **Phaser 3**, con arquitectura modular, código comentado en español y estética retro Nokia 100% fiel.

---

## 📋 Estado del Proyecto

### ✅ COMPLETADO - FASE 1: Entidades

- **Ball.js** - Pelota con física arcade, rebote y movimiento
- **Player.js** - Jugador controlable con movimiento, pateo y detección de posesión
- **GoalKeeper.js** - Arquero con IA retro para seguimiento de pelota
- **Team.js** - Gestión de equipos, formaciones y estadísticas

### ✅ COMPLETADO - FASE 2: Sistemas

- **InputSystem.js** - Gestión de entrada (movimiento flechas/WASD, pateo espacio, pausa P)
- **AISystem.js** - IA para equipo visitante con estados (ataque/defensa)
- **ScoreSystem.js** - Sistema de puntuación y detección de goles (mejorado)

### ✅ COMPLETADO - FASE 3: Escenas

- **BootScene.js** - Carga de assets (mejorada)
- **MenuScene.js** - Menú principal
- **MatchScene.js** - Escena principal del partido (completamente integrada)
- **PauseScene.js** - Menú de pausa con animaciones retro
- **GoalScene.js** - Celebración de gol con parpadeo retro

### ✅ COMPLETADO - FASE 4: UI

- **HUB.js** - HUD mejorado con marcador, timer, indicador de posesión y mensajes

### ✅ COMPLETADO - FASE 5: Configuración

- **gameConfig.js** - Configuración base de Phaser (retro: 160x120, zoom x4)
- **main.js** - Punto de entrada con todas las escenas registradas

---

## 🎯 Características Implementadas

### Mecánicas de Juego
- ✅ Movimiento de jugador con flechas o WASD
- ✅ Pateo de pelota con ESPACIO
- ✅ Cambio de jugador con TAB
- ✅ Pausa con P (lanza PauseScene)
- ✅ IA del equipo visitante (ataque/defensa automático)
- ✅ Detección de colisiones pelota-jugadores
- ✅ Detección de goles (zonas de arco)
- ✅ Arqueros con IA de seguimiento de pelota

### Estética Retro Nokia
- ✅ Resolución 160x120 (escalada x4)
- ✅ Fondo negro (#000000)
- ✅ Texto verde pixel (#00ff00)
- ✅ Colores equipo: Verde (local) / Amarillo (visitante)
- ✅ Animaciones simples (parpadeos, transiciones básicas)
- ✅ HUD retro con marcador en tiempo real

### Arquitectura Modular
- ✅ Separación clara: Entities, Systems, Scenes, UI, Managers
- ✅ Comentarios en español en cada archivo
- ✅ Documentación JSDoc completa
- ✅ Bajo acoplamiento, alta cohesión
- ✅ Fácil de extender

---

## 📁 Estructura de Carpetas

```
src/
├── config/
│   └── gameConfig.js          # Configuración de Phaser
├── entities/
│   ├── Ball.js                # Pelota
│   ├── Player.js              # Jugador
│   ├── GoalKeeper.js          # Arquero
│   └── Team.js                # Equipo
├── managers/
│   └── AudioManager.js        # Gestor de audio
├── scenes/
│   ├── BootScene.js           # Carga
│   ├── MenuScene.js           # Menú
│   ├── MatchScene.js          # Partido (INTEGRADO)
│   ├── PauseScene.js          # Pausa (MEJORADO)
│   └── GoalScene.js           # Gol (MEJORADO)
├── systems/
│   ├── InputSystem.js         # Entrada
│   ├── AISystem.js            # IA
│   └── ScoreSystem.js         # Puntuación
├── ui/
│   └── HUB.js                 # HUD (MEJORADO)
└── main.js                    # Punto de entrada
```

---

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| **Flechas** | Mover jugador |
| **WASD** | Mover jugador (alternativa) |
| **ESPACIO** | Patear pelota |
| **TAB** | Cambiar jugador |
| **P** | Pausar / Reanudar |
| **R** (pausa) | Reanudar |
| **M** (pausa) | Volver al menú |

---

## 🏗️ Arquitectura de MatchScene

```
MatchScene
├── Ball (pelota con física)
├── HomeTeam (jugador + arquero)
│   ├── Players[] (9 jugadores)
│   └── GoalKeeper
├── AwayTeam (IA + arquero)
│   ├── Players[] (9 jugadores)
│   └── GoalKeeper
├── Systems
│   ├── InputSystem (entrada del usuario)
│   ├── AISystem (IA del equipo visitante)
│   └── ScoreSystem (puntuación y goles)
├── HUD (marcador, timer, posesión)
└── Collisions (pelota-jugador, pelota-arquero, goles)
```

---

## 🚀 Próximas Mejoras

### CORTO PLAZO
- [ ] Mejorar IA: Formaciones dinámicas, pases
- [ ] Animaciones de jugador (rotación, cambios de dirección)
- [ ] Mejora visual de sprites (pixel art detallado)
- [ ] Sonidos retro (Nokia original si es posible)

### MEDIO PLAZO
- [ ] Sistema de dificultad (fácil/normal/difícil)
- [ ] Estadísticas de partido (posesión, tiros, etc)
- [ ] Sistema de eventos (tarjetas, lesiones retro)
- [ ] Mejora de física (golpes de cabeza, efectos especiales)

### LARGO PLAZO
- [ ] Multijugador local (dos controles)
- [ ] Modelos de equipo (seleccionar equipo inicial)
- [ ] Campeonato/Liga
- [ ] Compilación APK para Android (Capacitor)

---

## 📝 Estándares de Código

### Comentarios
- Cada archivo incluye comentario inicial con descripción
- Métodos documentados con JSDoc
- Código importante comentado inline

### Nomenclatura
- Clases: PascalCase (Ball, Player, GoalKeeper)
- Métodos: camelCase (getPosition, updateAI)
- Constantes: UPPER_SNAKE_CASE (MAX_SPEED)

### Modularidad
- Cada clase tiene una responsabilidad clara
- Bajo acoplamiento entre módulos
- Inyección de dependencias en constructores

---

## 🔧 Instalación y Ejecución

### Requisitos
- Node.js 14+
- npm

### Instalar dependencias
```bash
npm install
```

### Ejecutar en desarrollo (Vite)
```bash
npm run dev
```

### Construir para producción
```bash
npm run build
```

---

## 📱 Futuro: Android con Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap open android
```

---

## 🎨 Paleta de Colores (Retro Nokia)

| Color | Código | Uso |
|-------|--------|-----|
| Negro | #000000 | Fondo |
| Verde | #00ff00 | Texto, Equipo Local, Borde |
| Amarillo | #ffff00 | Equipo Visitante, Mensajes |
| Blanco | #ffffff | Énfasis, Bordes activos |

---

## 📚 Referencias

- [Phaser 3 Documentation](https://photonengine.com/phaser)
- [Vite Documentation](https://vitejs.dev/)
- [Capacitor Documentation](https://capacitorjs.com/)
- Nokia Nokia Game Boy Specifications (retro arcade)

---

## 👨‍💻 Autor

**Desarrollo**: Nokia Soccer League Remake - Phaser 3  
**Stack**: Phaser 3, Vite, Node.js, JavaScript (ES6+)  
**Estilo**: Retro Nokia 100% fiel

---

**¡Disfruta del juego retro! 🎮⚽**
