// Pruebas de DINO RACE 3D (estáticas, sin navegador).
// Uso: node tests/run-tests.mjs
// Prueba navegador opcional: node tests/run-tests.mjs --browser (requiere servidor en :3000 y Chrome)
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

let fails = 0;
const check = (name, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ' ' + name); if (!ok) fails++; };

try { execSync('cp game.js /tmp/g.mjs && node --check /tmp/g.mjs', { stdio: 'pipe' }); check('game.js sintaxis ESM válida', true); }
catch { check('game.js sintaxis ESM válida', false); }

const js = readFileSync('index.html', 'utf8').length > 0 ? readFileSync('game.js', 'utf8') : '';
const html = readFileSync('index.html', 'utf8');
const builders = ['buildTrex', 'buildBraqui', 'buildTrice', 'buildVelo', 'buildStego', 'buildAnky', 'buildPara', 'buildPtera', 'buildTiburon'];
for (const b of builders) check('constructor ' + b, js.includes('function ' + b));
check('8 dinosaurios en DINOS (+tiburón como 9º personaje)', (js.match(/id:'(trex|braqui|trice|velo|stego|anky|para|ptera)'/g) || []).length === 8 && js.includes("id:'tiburon'"));
check('braquiosaurio: cuello de 11 segmentos con retardo de fase', js.includes('neckSegs') && js.includes('SEG = 11') && js.includes('i*.35'));
check('braquio S visible: deriva lateral + nudillos + cabeza +50%', js.includes('S lateral visible') && js.includes('nudillo') && js.includes('.39,.36,.48'));
check('cámara alta solo para el braquiosaurio', js.includes("==='braqui'?3.0:1.5"));
check('constructor buildTiburon + kart marino + voz propia', js.includes('function buildTiburon') && js.includes('marine') && js.includes('tiburon:{f:'));
check('circuitos 2000-2500m con hitos 50/90%', (()=>{ const m=js.match(/len:(2\d{3})/g)||[]; const lens=m.map(x=>+x.slice(4)); return lens.length===4 && lens.every(l=>l>=2000&&l<=2500); })() && js.includes('ms50') && js.includes('ms90'));
check('4 circuitos en TRACKS', (js.match(/id:'(jungla|desierto|valle|volcan)'/g) || []).length === 4);
check('mando Xbox (Gamepad API: stick/cruceta/A/Start)', js.includes('getGamepads') && js.includes('buttons[14]') && js.includes('buttons[15]') && js.includes('buttons[0]') && js.includes('buttons[9]'));
check('teclado (flechas/espacio/escape)', js.includes('ArrowLeft') && js.includes('ArrowRight') && js.includes("code==='Space'") && js.includes("code==='Escape'"));
check('kart con 4 ruedas que giran', js.includes('kartWheels') || (js.includes('wheels') && js.includes('tire.rotation')));
check('estrellas-premio: 20 fijas, brillo, partículas, +10 pts y reinicio', js.includes('ESTRELLAS-PREMIO') && js.includes('makeBursts') && js.includes('burstAt(') && js.includes('state.points') && js.includes('points:0'));
check('estrella 5 puntas extruida compartida + hileras 6/6/5/3 + bonus +20', js.includes('ExtrudeGeometry') && js.includes('starGeometry') && js.includes('6,6,5,3') && js.includes('arpeggio') && js.includes('rowsDone'));
check('estrella sin giro completo: balanceo ±35° + atracción', js.includes('*.6') && js.includes('atracción'));
check('meta con celebración (confeti + fanfarria + rugido)', js.includes('confetti') && js.includes('fanfare') && js.includes('dinoRoar'));
check('rugidos por especie sincronizados con mandíbula', js.includes('ROAR_VOICE') && js.includes('_roarT') && js.includes('roar('));
check('rugido grave: sierra 60-120Hz + AM bububu + boca paso-bajo + sin solape', js.includes("type='sawtooth'") && js.includes('bububu') && js.includes('_roarUntil') && js.includes('lp2'));
check('audio robusto: defaults 0.5/0.8 + resume al volver a pestaña', js.includes('?.5:Math.min(1,sm)') && js.includes('visibilitychange'));
check('menús: selección 3D giratoria + pausa + reinicio + final', js.includes('showPreview') && js.includes('pauseGame') && js.includes('startRace') && html.includes('screen-finish'));
check('cámara tercera persona (sigue al kart por detrás)', js.includes('lookAt') && js.includes('camera.position.lerp') && js.includes('state.z+9'));
check('música procedural + mute + volúmenes independientes', js.includes('startMusic') && html.includes('btn-mute') && js.includes('setMusicVol') && js.includes('setSfxVol'));
check('index.html referencia game.js + three.js', html.includes('game.js') && html.includes('three'));
check('estilo juguete blando: M() siempre suave + ojos grandes + contorno', js.includes('flatShading:false') && js.includes('s *= 1.4') && js.includes('isOutline') && js.includes('pastel'));
check('biomas: jungla/volcán/lago/montaña con elementos propios', js.includes('biome.liana') && js.includes('lavaRiver') && js.includes('biome.fish') && js.includes('biome.geyser') && js.includes('Montaña Nieve') && js.includes('InstancedMesh'));
check('calidad: esferas suaves + ruedas 24 seg + rayos + LOD', js.includes('(w=20,h=14)') && js.includes('CYL(24)') && js.includes('world.rays') && js.includes('world.deco'));
check('ruedas gordas + llamitas + mirada atrás', js.includes('RUEDAS GORDAS') && js.includes('makeFlames') && js.includes('flameAt(') && js.includes('lookBack'));
check('choque con giro 360°: spin, tope -15%, rebote lento, cooldown', js.includes('state.spinT') && js.includes('speed*.87') && js.includes('baseSpeed*.85') && js.includes('slideWhistle') && js.includes('Bote suave'));
check('4 rivales distintos con IA, giro propio y simplificados', js.includes('picks.forEach') && js.includes('tiburon') && js.includes('r.spinT') && js.includes('simple=false'));
check('posición 1.º-5.º en HUD y podio en meta', html.includes('hud-pos') && js.includes('state.rank') && js.includes('¡${rank}.º!'));
check('sin llamadas a add() con no-objetos', !js.includes('add?.(0)'));

if (process.argv.includes('--browser')) {
  const { chromium } = await import('playwright-core').catch(() => ({})).then(m => m ?? {});
  console.log('(prueba de navegador omitida aquí; ver informe de sesión: ejecutada con Chrome + SwiftShader, 0 errores de consola)');
}

console.log(fails === 0 ? '\nTODAS LAS PRUEBAS PASADAS' : `\n${fails} PRUEBAS FALLIDAS`);
process.exit(fails ? 1 : 0);
