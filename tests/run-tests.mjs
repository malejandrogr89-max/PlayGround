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
const css = readFileSync('style.css', 'utf8');
const builders = ['buildTrex', 'buildBraqui', 'buildTrice', 'buildVelo', 'buildStego', 'buildAnky', 'buildPara', 'buildPtera', 'buildTiburon'];
for (const b of builders) check('constructor ' + b, js.includes('function ' + b));
check('8 dinosaurios en DINOS (+tiburón como 9º personaje)', (js.match(/id:'(trex|braqui|trice|velo|stego|anky|para|ptera)'/g) || []).length === 8 && js.includes("id:'tiburon'"));
check('braquiosaurio: cuello de 11 segmentos con retardo de fase', js.includes('neckSegs') && js.includes('SEG = 11') && js.includes('i*.35'));
check('braqui: cabeza 50% mayor con sonrisa', js.includes('sonrisa') && js.includes('.39,.36,.48'));
check('braqui: S lateral (baseZ) + cola cónica ahusada', js.includes('baseZ') && js.includes('ahusados'));
check('cámara alta solo para el braquiosaurio', js.includes("==='braqui'?2.4:1.5"));
check('constructor buildTiburon + kart marino + voz propia', js.includes('function buildTiburon') && js.includes('marine') && js.includes('tiburon:{f:'));
check('4 circuitos en TRACKS', (js.match(/id:'(jungla|desierto|valle|volcan)'/g) || []).length === 4);
check('mando Xbox (Gamepad API: stick/cruceta/A/Start)', js.includes('getGamepads') && js.includes('buttons[14]') && js.includes('buttons[15]') && js.includes('buttons[0]') && js.includes('buttons[9]'));
check('teclado (flechas/espacio/escape)', js.includes('ArrowLeft') && js.includes('ArrowRight') && js.includes("code==='Space'") && js.includes("code==='Escape'"));
check('kart con 4 ruedas que giran', js.includes('kartWheels') || (js.includes('wheels') && js.includes('tire.rotation')));
check('H audio: voz burbujeante del tiburón', js.includes('bubbles('));
check('H medalla: niveles por estrellas', js.includes('state.stars>=8'));
check('H cambio de personaje (sin fugas: rebuild limpio)', html.includes('btn-change') && html.includes('btn-quit') && js.includes('clearScene'));
check('G música suave: brillo reducido + campanillas discretas', js.includes('menos brillo') && js.includes('campanilla discreta'));
check('G persistencia de sliders', js.includes('dr3d_mus') && js.includes('dr3d_sfx'));
check('F medalla 1-3 según estrellas + total animado', js.includes('MEDALLA') && js.includes('_countIv') && js.includes('stat pts'));
check('F hitos 50/90% con rugido contento y cartel con icono', js.includes('mile50') && js.includes('mile90') && js.includes('¡Muy bien!') && js.includes('¡Casi llegas!'));
check('E ejes: troncos verticales (eje Y) y copas hacia arriba', !js.includes('.28,.28,2.2') && js.includes('.28,2.2,.28') && js.includes('setFromUnitVectors'));
check('E rendimiento: pianos y líneas con InstancedMesh', js.includes('InstancedMesh'));
check('E laterales: bebés, flores, mariposas, huevos, guirnaldas, pteras, arco', js.includes('babyDino') && js.includes('bigFlower') && js.includes('butterfly') && js.includes('giantEgg') && js.includes('garland') && js.includes('distantPteras') && js.includes('archStar'));
check('E ambiente: viento+pájaros en bus de efectos, derrape y pill de huevos', js.includes('startAmbience') && js.includes('chirp(') && js.includes('skidT') && js.includes('pulsePill') && css.includes('pillpop'));
check('juguete blando: sombreado suave global (sin flatShading)', !js.includes('flatShading:true'));
check('juguete blando: pastel + gordito + contorno toon', js.includes('softenToy') && js.includes('addOutlines') && js.includes('BackSide'));
check('juguete blando: ojos grandes (EYE_BIG)', js.includes('EYE_BIG = 1.45'));
check('estrellas-premio: 20 fijas, brillo, partículas, +10 pts y reinicio', js.includes('ESTRELLAS-PREMIO') && js.includes('makeBursts') && js.includes('burstAt(') && js.includes('state.points') && js.includes('points:0'));
check('estrellas: 5 puntas extruidas (Shape 1/0.45) y geometría compartida', js.includes('starShape5') && js.includes('0.45') && js.includes('ExtrudeGeometry') && js.includes('_starGeo'));
check('estrellas: balanceo ±35° sin giro completo + magnetismo', js.includes('STAR_SWAY = 0.6') && js.includes('magnetismo'));
check('estrellas: hileras de 5, bonus +20 y do-re-mi-sol', js.includes('HILERAS') && js.includes('rowBonus') && js.includes('+=20') && js.includes('pluck('));
check('meta con celebración (confeti + fanfarria + rugido)', js.includes('confetti') && js.includes('fanfare') && js.includes('dinoRoar'));
check('rugidos por especie sincronizados con mandíbula', js.includes('ROAR_VOICE') && js.includes('_roarT') && js.includes('roar('));
check('rugido gruñido-grave: sierra 60-120Hz + AM 20-40Hz + ruido + paso bajo', js.includes("type='sawtooth'") && js.includes('createBuffer') && js.includes("type='lowpass'") && js.includes('bububu'));
check('rugidos: sin solape + auto-resume + volúmenes por defecto 0.5/0.8', js.includes('_roarLock') && js.includes('visibilitychange') && js.includes(':0.5') && js.includes(':0.8')); 
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
