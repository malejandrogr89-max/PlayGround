# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/malejandrogr89-max/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/malejandrogr89-max/PlayGround)

- 🎮 [Open the project](https://omgithub.com/malejandrogr89-max/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=malejandrogr89-max%2FPlayGround).
- 💻 [Explore the source](https://github.com/malejandrogr89-max/PlayGround).
- 🛠️ [Check build runs](https://github.com/malejandrogr89-max/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/malejandrogr89-max/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/malejandrogr89-max).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->

## 🦖 DINO RACE 3D — Carreras arcade infantil (4 años)

Juego 3D jugable: 8 dinosaurios (T. rex, braquiosaurio, tricerátops,
velociraptor, estegosaurio, anquilosaurio, parasaurolophus y pteranodon),
cada uno con modelo 3D volumétrico propio y animaciones, en su kart con
ruedas giratorias. Avance automático, movimiento lateral, saltos, rocas,
troncos y barro (sin castigos), huevos 🥚 y estrellas ⭐, 4 circuitos
(jungla, desierto, valle, volcán) y meta con confeti y trofeo.

**Cómo iniciarlo:** el proyecto es estático (`index.html` + `style.css` +
`game.js`, motor Three.js por CDN). Se sirve con `./start.sh` (puerto 3000)
o abriendo `index.html` en un navegador de escritorio con internet.

**Controles:**
- 🎮 Mando Xbox: stick izquierdo o cruceta = moverse · A = saltar · Start = pausa
- ⌨️ Teclado: ◀️ ▶️ (o A/D) = moverse · Espacio = saltar · Esc/P = pausa
- 📱 Táctil: botones ◀️ ▶️ ¡SALTA!

**Pruebas:** `node tests/run-tests.mjs` (23 comprobaciones estáticas, sintaxis ESM incluida).
Verificado además en Chrome real: menú → selección 3D → carrera → salto →
pausa → meta → reinicio, con 0 errores de consola.

### ✨ Edición Premium (v2)
- Dinosaurios detallados: ojos expresivos con iris, brillo y **parpadeo**,
  dientes, lengua, garras, fosas nasales, textura de escamas, manchas, rayas,
  plumas y membranas mejoradas según la especie.
- Animación viva: **respiración**, personalidad por especie, reacciones a
  giros, estirón en saltos y aplastado suave al aterrizar.
- **Rugidos amistosos** procedurales con voz propia por especie, en salida,
  saltos, estrellas, meta y de vez en cuando en carrera; mandíbula y cabeza
  sincronizadas. Sin sonidos aterradores.
- Gráficos: cielo con degradado y sol que sigue al jugador, tono ACES,
  sombras suaves mejoradas, pianos rojo/blanco, línea de salida, río animado,
  lava pulsante con chispas, luciérnagas, polvo del kart, vegetación con brisa
  y resolución adaptable según rendimiento.
- Karts con pontones, alerones, escapes cromados, llantas con radios y
  suspensión; cámara más suave con FOV sutil de velocidad.
- Menú con diorama prehistórico (volcán, lago, palmeras, bandada de
  pteranodones), pedestal con foco, logo animado y lluvia de confeti en la
  victoria. Selección con iluminación de estudio.
- Audio: **volumen independiente de música y efectos** (con rugidos) +
  silencio total; el audio solo arranca tras pulsar un botón.
