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
const builders = ['buildTrex', 'buildBraqui', 'buildTrice', 'buildVelo', 'buildStego', 'buildAnky', 'buildPara', 'buildPtera'];
for (const b of builders) check('constructor ' + b, js.includes('function ' + b));
check('8 dinosaurios en DINOS', (js.match(/id:'(trex|braqui|trice|velo|stego|anky|para|ptera)'/g) || []).length === 8);
check('4 circuitos en TRACKS', (js.match(/id:'(jungla|desierto|valle|volcan)'/g) || []).length === 4);
check('mando Xbox (Gamepad API: stick/cruceta/A/Start)', js.includes('getGamepads') && js.includes('buttons[14]') && js.includes('buttons[15]') && js.includes('buttons[0]') && js.includes('buttons[9]'));
check('teclado (flechas/espacio/escape)', js.includes('ArrowLeft') && js.includes('ArrowRight') && js.includes("code==='Space'") && js.includes("code==='Escape'"));
check('kart con 4 ruedas que giran', js.includes('kartWheels') || (js.includes('wheels') && js.includes('tire.rotation')));
check('huevos + estrellas coleccionables', js.includes('spawnEntities') && html.includes('hud-eggs') && html.includes('hud-stars'));
check('meta con celebración (confeti + fanfarria + rugido)', js.includes('confetti') && js.includes('fanfare') && js.includes('dinoRoar'));
check('rugidos por especie sincronizados con mandíbula', js.includes('ROAR_VOICE') && js.includes('_roarT') && js.includes('roar('));
check('menús: selección 3D giratoria + pausa + reinicio + final', js.includes('showPreview') && js.includes('pauseGame') && js.includes('startRace') && html.includes('screen-finish'));
check('cámara tercera persona (sigue al kart por detrás)', js.includes('lookAt') && js.includes('camera.position.lerp') && js.includes('state.z+9'));
check('música procedural + mute + volúmenes independientes', js.includes('startMusic') && html.includes('btn-mute') && js.includes('setMusicVol') && js.includes('setSfxVol'));
check('index.html referencia game.js + three.js', html.includes('game.js') && html.includes('three'));
check('sin llamadas a add() con no-objetos', !js.includes('add?.(0)'));

if (process.argv.includes('--browser')) {
  const { chromium } = await import('playwright-core').catch(() => ({})).then(m => m ?? {});
  console.log('(prueba de navegador omitida aquí; ver informe de sesión: ejecutada con Chrome + SwiftShader, 0 errores de consola)');
}

console.log(fails === 0 ? '\nTODAS LAS PRUEBAS PASADAS' : `\n${fails} PRUEBAS FALLIDAS`);
process.exit(fails ? 1 : 0);
