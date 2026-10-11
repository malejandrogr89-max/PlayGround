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

**Pruebas:** `node tests/run-tests.mjs` (27 comprobaciones estáticas, sintaxis ESM incluida).
Verificado además en Chrome real: menú → selección (9) → 4 circuitos → salto →
pausa → meta → reinicio, con 0 errores de consola. Audio verificado con
AnalyserNode: los 9 rugidos dan pico RMS 0.84–0.93 sin clipping, música 0.049,
silencio total 0. BPM medidos 93.7.

### ✨ Ronda 2
- **Audio que se oye**: causa raíz del silencio = AudioContext en `suspended`
  hasta el primer gesto (diseño del navegador) + rugidos antiguos poco
  presentes. Ahora: cadena master con compresor y AnalyserNode, reanudación
  en cada gesto, rugidos más largos y presentes con colita alegre, burbujas
  del tiburón y sonda `music.level()` para verificación real.
- **Estrellas-premio**: exactamente 20 por circuito en la trazada, con brillo,
  giro, flotación, destello de partículas, campanilla, +10 puntos y contador
  grande reiniciado por carrera.
- **Tiburón (9º)**: cuerpo hidrodinámico, hocico, branquias, dientes
  redondeados, aletas dorsal/pectorales/caudal animadas, kart marino con
  salvavidas, voz propia + burbujas. Corre en los 4 circuitos.
- **Braquiosaurio**: cuello de 11 segmentos continuos con retardo de fase
  (ratio cuello/torso 2.62 medido), cabeza pequeña, cámaras dedicadas en menú
  y carrera para no taparlo.
- **Música**: marimba + xilófono suave + campanillas (solo senos), 93.7 BPM
  medidos, RMS muy por debajo de los rugidos; sliders independientes y
  silencio total conservados.

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

### 🧸 Ronda 3, parte 1
- **Juguete blando**: sombreado suave global (0 mallas con flatShading),
  pastelizado mate, contorno toon (2 cáscaras/personaje en los 9),
  ojos ×1.45 y cuerpo ensanchado. Sin texturas ni modelos externos.
- **Rugidos gruñido-grave**: sierra 60–120 Hz + AM 20–40 Hz + ruido
  filtrado + paso bajo que se abre/cierra + caída final + ±5 % aleatorio;
  tiburón burbujeante aparte. Sin solape, enfriamiento ≥8 s, botón
  "¡TOCA PARA JUGAR!", auto-resume al volver a la pestaña, vols 0.5/0.8.
- **Braquiosaurio**: cuello S de 11 segmentos (ratio 2.55 medido en torso),
  cabeza +50 % con sonrisa, cola de 4 conos, cámaras dedicadas. Corregido
  bug real: la cabeza flotaba (una línea de animación obsoleta la separaba
  2,3 m del cuello; ahora 0,45 m exactos).
- **Estrellas**: 5 puntas extruidas (geometría/material compartidos), 4
  hileras de 5 por circuito, balanceo ±35°, magnetismo suave, +10, hilera
  +20 con do-re-mi-sol, contador y reinicio verificados.

### 🌈 Ronda 3, parte 2
- **Laterales**: bebés que saltan/saludan (3/circuito), flores grandes,
  mariposas (6), helechos, rocas redondeadas, huevos gigantes, guirnaldas,
  2 pteranodones lejanos, estrella grande en el arco de meta y fondo propio
  (montañas/lago/oasis/segundo volcán). Todo fuera de pista, sin colisión.
- **Ejes corregidos**: 63/48/154/4 troncos tumbados → 0; copas 312/312
  hacia arriba; pianos y líneas a InstancedMesh (~700 draws menos).
- **Recompensas**: medalla 1-3 por estrellas (0→1, 5→2, 12→3 verificado),
  total animado e hitos 50 %/90 % con rugido y cartel de iconos.
- **Música**: RMS 0,0163 (9–15× bajo los rugidos 0,144–0,246), >4 kHz al
  0,37 %, sliders persistentes (0.3/0.6 restaurados tras recarga).
- **Pruebas**: 47/47 en verde; tour Chrome con 0 errores; 60 s de carrera
  estables; builds deterministas (sin fugas).
