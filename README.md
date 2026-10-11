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

**Pruebas:** `node tests/run-tests.mjs` (41 comprobaciones estáticas, sintaxis ESM incluida).
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

### ✨ Ronda 3, Parte 1 (estilo + audio + braquio + estrellas)
- **Juguete blando**: sombreado suave global (0 de 459 mallas con facetas),
  paleta pastel, ojos ×1.4, cabezas ×1.12 y contorno toon en cada cabeza
  (9 cascarones). Vegetación en verde pastel.
- **Rugidos gruñido grave**: sierra 60–120 Hz + AM 20–40 Hz + ruido filtrado
  + paso bajo "boca" + descenso final + jitter ±5 %; picos medidos 0.72–0.78
  (sin clipping, <0.95), RMS 0.20–0.25, energía >1 kHz ≤12 % (tiburón
  burbujeante aparte, pico 0.28); sin solape; silencio total = RMS 0;
  defaults música 0.5 / efectos 0.8; auto-resume al volver a la pestaña.
- **Braquiosaurio**: cuello de 11 segmentos con S lateral visible desde
  atrás, nudillos en las uniones, cabeza +50 % con sonrisa y ojos grandes,
  cola fina y larga, ratio cuello/torso 2.6 (torso medido sin cuello ni
  cola); cámaras dedicadas de menú (proyección medida) y carrera.
- **Estrellas**: 5 puntas extruidas (geometría compartida), 20 por circuito
  en hileras 6/6/5 + arco de 3, balanceo ±35°, atracción, radio generoso,
  +10, bonus de hilera +20 con do-re-mi-sol; reinicio verificado.
### ✨ Ronda 4 (carreras largas, biomas, rivales, público)
- **Circuitos 2000–2500 m** (2–2,5 min a 17 m/s) con hitos al 50 % y 90 %;
  estrellas y decorado escalan con la longitud.
- **Biomas**: jungla (lianas y helechos instanciados, cascada, luciérnagas),
  volcán (ríos de lava, humo, ceniza), valle con lago (nenúfares, peces que
  saltan, patos) y montaña nevada (pinos con nieve, nevada, géiseres); sol
  con tinte propio por circuito. Desierto → Montaña Nieve.
- **Calidad**: esferas 20×14, ruedas de 24 segmentos, rayos de sol baratos,
  LOD que oculta decorado a >130 m; auditoría: 500 mallas sin NaN.
- **Ruedas gordas** (R .55, kart más ancho que el dino) con chasis alto;
  **llamitas** de dibujos en pool (40/12); **mirada atrás** en los saltos
  (solo la cabeza; el cuello del braquio no se mueve).
- **Choque con giro 360°** a velocidad media/alta (conserva ≥85 %,
  estrellitas y silbato) o rebote suave a baja velocidad; cooldown 1,5 s.
- **4 rivales** con IA de trazada (incluido el tiburón), más lentos,
  simplificados (sin contornos ni sombras), con su propio giro de choque;
  badge de posición 1.º–5.º y podio en meta.
- **3 karts** seleccionables (clásico, marino, cohete) con el mismo manejo.
- **Público**: ~90 bebés dino instanciados (4 mallas InstancedMesh) fuera
  del asfalto (mín. medido 9.6), con saltitos, mirada al kart y «yuju»
  suave con enfriamiento de 8 s. Sin colisión.
- **Tests**: 41 comprobaciones en verde + verificación en Chrome real.
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
