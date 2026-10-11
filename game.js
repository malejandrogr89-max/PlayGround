import * as THREE from 'three';

/* ============================================================
   DINO RACE 3D — juego arcade infantil (4 años)
   - 8 dinosaurios procedurales anatómicamente distintos
   - karts con ruedas giratorias (no ocultan cabeza/cuernos/colas)
   - avance automático, lateral suave, salto, obstáculos,
     huevos, estrellas, 4 circuitos, meta con celebración
   - mando Xbox (Gamepad API) + teclado + táctil
   ============================================================ */

export const DINOS = [
  { id:'trex',   name:'T. Rex',          emoji:'🦖', color:0x66cf7e, belly:0xdcf2c4, desc:'¡El rey fuerte con dientes grandes y bracitos!' },
  { id:'braqui', name:'Braquiosaurio',   emoji:'🦕', color:0x8fd07a, belly:0xeef5d2, desc:'¡Cuello larguísimo para verlo todo desde arriba!' },
  { id:'trice',  name:'Tricerátops',     emoji:'🦏', color:0x8abdff, belly:0xe0efff, desc:'¡Tres cuernos y un escudo genial en la cabeza!' },
  { id:'velo',   name:'Velociraptor',    emoji:'🦅', color:0xff9a66, belly:0xffe6c4, desc:'¡Rapidísimo, con plumas y una garra curva!' },
  { id:'stego',  name:'Estegosaurio',    emoji:'🦎', color:0xb49bf0, belly:0xece4ff, desc:'¡Placas en la espalda y cola con pinchos!' },
  { id:'anky',   name:'Anquilosaurio',   emoji:'🐢', color:0xc9a06e, belly:0xf4e6c4, desc:'¡Armadura de tortuga y cola con maza!' },
  { id:'para',   name:'Parasaurolophus', emoji:'🦆', color:0x5fd8cb, belly:0xdcfaf4, desc:'¡Cresta trompeta para cantar mientras corre!' },
  { id:'ptera',  name:'Pteranodon',      emoji:'🦅', color:0xffbcd4, belly:0xffe9f3, desc:'¡Alas grandes y pico volador, el rey del cielo!' },
  { id:'tiburon',name:'Tiburón',           emoji:'🦈', color:0x5cbdf0, belly:0xecf8ff, desc:'¡Aletas, sonrisas y burbujas en su kart marino!' },
];

export const TRACKS = [
  { id:'jungla',  name:'Jungla Verde',   emoji:'🌴', len:2000, sky:0x87d7f5, fog:0xaee6c8, ground:0x55b04e, road:0xd9b382, edge:0x3e8f3e, desc:'Árboles, lianas y monitos. ¡Fácil y alegre!' },
  { id:'desierto',name:'Montaña Nieve',  emoji:'🏔️', len:2150, sky:0xaed6f0, fog:0xdceefb, ground:0xe9f1f5, road:0xc98d4e, edge:0x7fa8c9, desc:'Pinos nevados, nieve suave y géiseres. ¡Abrígate!' },
  { id:'valle',   name:'Valle Florido',  emoji:'🌸', len:2300, sky:0xa8e6ff, fog:0xc4ecff, ground:0x7ed957, road:0x9c7b54, edge:0x5da33f, desc:'Flores, río y arcoíris. ¡El más bonito!' },
  { id:'volcan',  name:'Volcán Chispa',  emoji:'🌋', len:2500, sky:0x4a3560, fog:0x6b4a7a, ground:0x6e5a6e, road:0x4a4a55, edge:0xff6b35, desc:'Lava que no quema, rocas y chispas. ¡Emoción!' },
];

// ---------- helpers ----------
// Estilo "juguete blando": sombreado SUAVE (sin facetas), colores pastel vivos.
function M(color, opts={}) {
  const { flatShading: _fs, ...rest } = opts; // se ignora: siempre suave
  return new THREE.MeshStandardMaterial({ color, roughness:.55, metalness:.0, flatShading:false, ...rest });
}
// aclara un color hacia pastel (0..1)
function pastel(hex, amt=.22){
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(0xffffff), amt);
  return c.getHex();
}
function mesh(geo, material, x=0,y=0,z=0, rx=0,ry=0,rz=0, sx=1,sy=1,sz=1){
  const m = new THREE.Mesh(geo, material);
  m.position.set(x,y,z); m.rotation.set(rx,ry,rz); m.scale.set(sx,sy,sz);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const SPH = (w=20,h=14)=>new THREE.SphereGeometry(1,w,h);
const BOX = ()=>new THREE.BoxGeometry(1,1,1);
const CYL = (s=12)=>new THREE.CylinderGeometry(1,1,1,s);
const CONE = (s=12)=>new THREE.ConeGeometry(1,1,s);

/* ============================================================
   FÁBRICA DE DINOSAURIOS — cada uno anatomía + silueta propia.
   Todos miran hacia -Z. Devuelven {group, parts}.
   parts puede tener: jaw, tail[], legL, legR, armL, armR,
   head, crest, wings[], plates[] para animar.
   ============================================================ */
function baseEyes(head, x, y, z, s=0.11){
  s *= 1.4; // ojos GRANDES y tiernos para todos
  const w = M(0xffffff,{roughness:.25}), b = M(0x2b2b3a,{roughness:.2});
  const irisCols = [0x7a4a21,0x2e7d32,0x1565c0,0x6a1b9a,0xb26a00,0x00838f,0xc2185b,0x4a6572];
  const iris = M(irisCols[(Math.random()*irisCols.length)|0],{roughness:.25});
  const hl = new THREE.MeshBasicMaterial({color:0xffffff});
  head.userData.lids = head.userData.lids||[];
  for (const side of [-1,1]) {
    const e = mesh(SPH(), w, x*side, y, z, 0,0,0, s*1.15,s*1.25,s*0.9); head.add(e);
    const ir = mesh(SPH(), iris, x*side, y+s*0.05, z-s*0.62, 0,0,0, s*0.62,s*0.68,s*0.4); head.add(ir);
    const p = mesh(SPH(), b, x*side, y+s*0.08, z-s*0.85, 0,0,0, s*0.34,s*0.38,s*0.25); head.add(p);
    const h = new THREE.Mesh(new THREE.SphereGeometry(1,8,6), hl);
    h.position.set(x*side-s*0.12, y+s*0.32, z-s*1.05); h.scale.setScalar(s*0.16); head.add(h);
    // párpado para parpadear (escala Y animada)
    const lid = mesh(SPH(10,8), M(0x000000), 0,0,0, 0,0,0, 1,1,1);
    lid.material = lid.material.clone();
    lid.material.color.set(0x3a3a4a);
    lid.position.set(x*side, y+s*0.1, z-s*0.15);
    lid.scale.set(s*1.3, s*0.12, s*1.0);
    lid.userData.isLid = true; lid.userData.baseY = s*0.12;
    lid.castShadow = false;
    head.add(lid); head.userData.lids.push(lid);
  }
}

/* ---------- textura de escamas (bump sutil reutilizable) ---------- */
let _scaleTex = null;
function scaleTexture(){
  if(_scaleTex) return _scaleTex;
  const c = document.createElement('canvas'); c.width=c.height=256;
  const x = c.getContext('2d');
  x.fillStyle='#808080'; x.fillRect(0,0,256,256);
  for(let r=0;r<8;r++) for(let q=0;q<8;q++){
    const cxp=q*32+(r%2?16:0), cyp=r*32;
    const g=x.createRadialGradient(cxp,cyp,2,cxp,cyp,15);
    g.addColorStop(0,'#a8a8a8'); g.addColorStop(.75,'#7a7a7a'); g.addColorStop(1,'#5a5a5a');
    x.fillStyle=g; x.beginPath(); x.arc(cxp,cyp,15,0,7); x.fill();
  }
  _scaleTex = new THREE.CanvasTexture(c);
  _scaleTex.wrapS=_scaleTex.wrapT=THREE.RepeatWrapping; _scaleTex.repeat.set(3,3);
  return _scaleTex;
}
function applyScales(dinoGroup, skinHex){
  const tex = scaleTexture();
  dinoGroup.traverse(o=>{
    if(o.isMesh && o.material && o.material.isMeshStandardMaterial && o.material.color &&
       Math.abs(o.material.color.getHex()-skinHex)<2 && !o.userData.isLid){
      o.material.bumpMap = tex; o.material.bumpScale = 0.6;
      o.material.roughness = Math.min(1, o.material.roughness+0.05);
    }
  });
}

/* ---------- cielo con degradado + sol ---------- */
function makeSky(topHex, botHex, sunHex=0xfff6c9){
  const geo = new THREE.SphereGeometry(420, 20, 14);
  const top = new THREE.Color(topHex), bot = new THREE.Color(botHex);
  const pos = geo.attributes.position, cols = [];
  for(let i=0;i<pos.count;i++){
    const t = Math.max(0, Math.min(1, pos.getY(i)/420*1.4+0.35));
    const c = bot.clone().lerp(top, t);
    cols.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols,3));
  const mat = new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.BackSide, fog:false, depthWrite:false});
  const sky = new THREE.Mesh(geo, mat); sky.renderOrder=-10;
  const sun = new THREE.Mesh(new THREE.SphereGeometry(18,16,12),
    new THREE.MeshBasicMaterial({color:sunHex, fog:false}));
  sun.position.set(-140,150,-420); sky.add(sun);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(30,16,12),
    new THREE.MeshBasicMaterial({color:sunHex, transparent:true, opacity:.28, fog:false}));
  halo.position.copy(sun.position); sky.add(halo);
  return sky;
}

/* ---------- detalles premium por especie (conserva la anatomía base) ---------- */
function detailDino(id, g, P, d){
  const skin = M(d.color), hornM = M(0xfff5d6,{roughness:.4});
  const clawM = M(0xfff2cc,{roughness:.35});
  const stripeM = M(new THREE.Color(d.color).multiplyScalar(.72).getHex());
  const spotM = M(new THREE.Color(d.color).multiplyScalar(1.25).getHex(),{roughness:.6});
  const featherM = M(0xffd43b,{roughness:.8, side:THREE.DoubleSide});
  const add = m=>{ g.add(m); return m; };
  const claws = (x,y,z,n=3,s=.05)=>{ for(let t=0;t<n;t++) add(mesh(CONE(8), clawM, x+(t-(n-1)/2)*.11,y,z, -Math.PI/2.3,0,0, s,s*2.4,s)); };
  const backSpikes = (zs,y,s=.07)=>{ zs.forEach((z,i)=> add(mesh(CONE(7), stripeM, 0,y+((i%2)*.04),z, -.25,0,0, s,s*2.6,s))); };
  if(id==='trex'){
    // cejas marcadas, fosas nasales, lengua, garras en pies y manos, lomo con púas
    for(const s of [-1,1]){
      add(mesh(SPH(8,6), stripeM, s*.24,2.02,-.62, 0,0,0, .1,.09,.16));
      add(mesh(SPH(8,6), M(0x3a2a1a), s*.12,1.78,-.98, 0,0,0, .045,.06,.03));
    }
    add(mesh(SPH(10,8), M(0xe2596b), 0,1.42,-.62, 0,0,0, .14,.07,.2)); // lengua
    claws(-.36,.1,-.42); claws(.36,.1,-.42);
    backSpikes([-.1,.25,.6,.95],1.62,.075);
    for(let i=0;i<3;i++) add(mesh(SPH(8,6), spotM, (i-1)*.3,1.35,.9+i*.25, 0,0,0, .09,.09,.09));
  } else if(id==='braqui'){
    // manchas del lomo voluminoso, uñas en pies anchos, cresta suave del lomo
    for(let i=0;i<5;i++) add(mesh(SPH(8,6), spotM, (i%2? .42:-.42),1.15+i*.1,.9-i*.35, 0,0,0, .17,.14,.17));
    for(const s of [-1,1]){ claws(s*.52,.14,.95-.28,3); claws(s*.52,.14,-.15-.28,3); }
    backSpikes([.2,.5,.8],1.68,.06);
  } else if(id==='trice'){
    // gola con ocelos + pinchos en el borde, pico córneo, uñas
    const fr = P.head?.children||[];
    for(let i=-2;i<=2;i++) P.head.add(mesh(SPH(8,6), M(0xff8c42), i*.19,.42,.32, 0,0,0, .075,.075,.05));
    for(let i=-3;i<=3;i++) P.head.add(mesh(CONE(7), hornM, i*.17,.82,.28, 0,0,-i*.12, .05,.16,.05));
    P.head.add(mesh(CONE(8), M(0x8a8f9e), 0,-.22,-.62, -Math.PI/2.4,0,0, .12,.22,.12)); // pico
    for(const s of [-1,1]) for(let k=0;k<2;k++) claws(s*.48,.1,.6-k*.7,2);
  } else if(id==='velo'){
    // alas-pluma en brazos, rayas, más plumas en cola y mejillas
    for(const s of [-1,1]){
      for(let i=0;i<3;i++) add(mesh(CONE(6), featherM, s*(.34+i*.07),1.05-i*.12,-.1+i*.1, .9,0,s*(.5+i*.2), .09,.34,.04));
      add(mesh(CONE(6), featherM, s*.3,1.62,-.3, -.4,0,s*.4, .07,.2,.04)); // mejilla
      claws(s*.22,.08,-.5,2,.04);
    }
    for(let i=0;i<3;i++) add(mesh(BOX(), stripeM, 0,1.12-i*.12,.28+i*.22, -.3,0,0, .3,.06,.1));
  } else if(id==='stego'){
    // placas alternas más grandes con borde claro, cabeza con pico, uñas
    P.plates?.forEach((pl,i)=>{
      pl.scale.set(1.25,1.25,1.25);
      const rim = mesh(new THREE.TorusGeometry(.3,.045,8,14), M(0xffe3ef), 0,0,0, 0,0,0, 1,1,1);
      rim.rotation.y=Math.PI/2; pl.add(rim);
    });
    P.head.add(mesh(CONE(8), M(0x8a8f9e), 0,-.2,-.52, -Math.PI/2.3,0,0, .09,.18,.09));
    for(const s of [-1,1]) for(let k=0;k<2;k++) claws(s*.44,.1,.5-k*.65,2);
    backSpikes([-.5],1.3,.06);
  } else if(id==='anky'){
    // doble fila de osteodermos + párpados acorazados + púas laterales extra
    for(let r=0;r<2;r++) for(let c=-2;c<=2;c++)
      add(mesh(CONE(7), hornM, c*.24,1.42+r*.14,.0+r*.3, 0,0,0, .06,.14,.06));
    for(const s of [-1,1]){
      P.head.add(mesh(SPH(8,6), M(0x7a5c33), s*.2,.14,-.28, 0,0,0, .11,.07,.08));
      claws(s*.46,.08,.35,2); claws(s*.46,.08,-.3,2);
    }
  } else if(id==='para'){
    // cresta tubular con anillos, fosas nasales, rayas corporales, membrana caudal
    if(P.crest){ for(let i=0;i<3;i++){ const r=mesh(new THREE.TorusGeometry(.14,.028,8,14), stripeM, 0,0,-.2+i*.22, 0,0,0, 1,1,1); P.crest.add(r); } }
    for(let i=0;i<4;i++) add(mesh(BOX(), stripeM, 0,1.14-i*.14,.3+i*.2, -.25,0,0, .42,.05,.12));
    for(const s of [-1,1]) claws(s*.28,.06,-.42,2);
  } else if(id==='ptera'){
    // membrana con dedos, picos de apoyo, cresta con vetas, patas con garras
    P.wings?.forEach((w,wi)=>{
      const s = wi===0?-1:1;
      for(let f=0;f<2;f++) w.add(mesh(CYL(6), skin, s*(.7+f*.45),.18-f*.12,-.05*f, 0,0,s*1.35, .03,.03,.8-f*.15));
    });
    for(const s of [-1,1]) claws(s*.2,.26,-.3,2,.035);
  } else if(id==='tiburon'){
    // línea lateral clara + motas del lomo (el resto ya viene del constructor)
    for(const s of [-1,1]) add(mesh(BOX(), M(0x90d8f5), s*.47,1.05,.1, 0,0,0, .04,.07,1.1));
    for(let i=0;i<4;i++) add(mesh(SPH(8,6), M(0x2a7aab), (i%2?.18:-.18),1.42-i*.05,.25+i*.16, 0,0,0, .07,.05,.07));
  }
  applyScales(g, d.color);
  return P;
}
function bellySkin(d){ return M(d.belly); }

function buildTrex(d){
  const g = new THREE.Group(), P = {};
  const skin = M(d.color), bellyM = M(d.belly);
  const body = mesh(SPH(), skin, 0,1.05,0.35, 0,0,0, .62,.58,.8); g.add(body);
  g.add(mesh(SPH(), bellyM, 0,.92,0.05, 0,0,0, .5,.46,.62));
  const tail = new THREE.Group(); tail.position.set(0,1.1,1.0); g.add(tail); P.tail = tail;
  tail.add(mesh(CONE(10), skin, 0,0.05,0.55, Math.PI/2.3,0,0, .34,.95,.34));
  tail.add(mesh(CONE(10), skin, 0,0.08,1.15, Math.PI/2.15,0,0, .2,.7,.2));
  const head = new THREE.Group(); head.position.set(0,1.72,-0.35); g.add(head); P.head = head;
  head.add(mesh(BOX(), skin, 0,0,-0.05, 0,0,0, .62,.55,.85));
  head.add(mesh(BOX(), skin, 0,-0.12,-0.55, 0,0,0, .5,.34,.5)); // hocico
  const jaw = new THREE.Group(); jaw.position.set(0,-0.28,-0.1); head.add(jaw); P.jaw = jaw;
  jaw.add(mesh(BOX(), bellyM, 0,-0.05,-0.35, 0,0,0, .44,.12,.7));
  for(let i=0;i<4;i++) for(const s of [-1,1])
    jaw.add(mesh(CONE(6), M(0xffffff), s*0.16,-0.02,-0.6+i*0.17, Math.PI,0,0, .03,.09,.03));
  for(let i=0;i<4;i++) for(const s of [-1,1])
    head.add(mesh(CONE(6), M(0xffffff), s*0.15,0.02-0.28,-0.62+i*0.16, 0,0,0, .03,.09,.03));
  head.add(mesh(BOX(), skin, 0,0.3,-0.15, 0,0,0, .66,.14,.6)); // ceja
  baseEyes(head, .3,.12,-0.42,.12);
  head.add(mesh(CONE(8), skin, -.18,.42,.25, 0,0,-.15, .09,.22,.09)); // piquitos
  head.add(mesh(CONE(8), skin, .18,.42,.25, 0,0,.15, .09,.22,.09));
  for(const s of [-1,1]){ // bracitos diminutos
    const a = mesh(CYL(8), skin, s*.55,.95,-.25, .9,0,s*.25, .09,.09,.42); g.add(a);
    if(s<0) P.armL=a; else P.armR=a;
  }
  for(const s of [-1,1]){ // patas potentes
    const up = mesh(CYL(10), skin, s*.32,.62,.25, 0,0,s*-.12, .17,.17,.5); g.add(up);
    const lo = mesh(CYL(10), skin, s*.36,.24,.12, .25,0,0, .14,.14,.4); g.add(lo);
    const ft = mesh(BOX(), skin, s*.36,.08,-.12, 0,0,0, .26,.12,.42); g.add(ft);
    for(let t=-1;t<=1;t++) g.add(mesh(CONE(8), M(0xfff2cc), s*.36+t*.09,.08,-.34, -Math.PI/2.4,0,0, .045,.12,.045));
    if(s<0) P.legL=up; else P.legR=up;
  }
  return {group:g, parts:P};
}

function buildBraqui(d){
  const g = new THREE.Group(), P = {};
  const skin = M(d.color), bellyM = M(d.belly);
  // cuerpo voluminoso en forma de barril
  g.add(mesh(SPH(), skin, 0,1.0,.5, 0,0,0, .85,.78,1.1));
  g.add(mesh(SPH(), bellyM, 0,.82,.42, 0,0,0, .7,.62,.92));
  g.add(mesh(SPH(10,8), skin, 0,1.6,.55, 0,0,0, .6,.44,.65)); // joroba de hombros
  // cola más fina y larga, hacia atrás y algo hacia abajo (no tapa el kart)
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,1.0,1.4), new THREE.Vector3(0,.9,2.2),
    new THREE.Vector3(0,.68,3.1), new THREE.Vector3(0,.42,4.0),
  ]);
  const tail = new THREE.Group(); tail.position.set(0,0,0); g.add(tail); P.tail = tail;
  tail.add(new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 12, .17, 10),
    skin.clone()));
  tail.children[0].castShadow=true;
  // CUELLO en S visible desde atrás: deriva lateral + base al frente, arco alto
  // y cabeza que mira al frente-abajo. 11 segmentos con retardo de fase.
  const neckPivot = new THREE.Group(); neckPivot.position.set(0,1.35,-.35); g.add(neckPivot);
  const SEG = 11, SGL = .52; // longitud total 5.72 (≥2.5× el torso de ~2.2)
  const tilts = [-.3,-.24,-.16,-.08,0,.06,.08,.04,-.04,-.12,-.18];
  const steps = [.21,.18,.12,.045,-.06,-.135,-.18,-.165,-.12,-.06,0]; // S lateral visible desde atrás
  P.neckSegs = [];
  let parent = neckPivot;
  for(let i=0;i<SEG;i++){
    const piv = new THREE.Group();
    if(i>0) piv.position.set(steps[i],SGL,0); else piv.position.set(steps[0],0,0);
    piv.rotation.x = tilts[i];
    parent.add(piv);
    const r = .36 - (i/SEG)*.2; // .36 → .16
    const seg = mesh(SPH(12,10), skin, 0,SGL/2,0, 0,0,0, r,SGL*.62,r);
    piv.add(seg);
    piv.add(mesh(SPH(10,8), skin, 0,0,0, 0,0,0, r*1.02,r*.72,r*1.02)); // nudillo: unión suave
    if(i%3===1) piv.add(mesh(SPH(8,6), M(d.belly), r*.7,SGL*.5,r*.35, 0,0,0, .1,.14,.1)); // garganta clara
    P.neckSegs.push({pivot:piv, base:tilts[i], step:steps[i]});
    parent = piv;
  }
  P.neck = neckPivot;
  // cabeza 50 % MAYOR, hija del último segmento, mirando al frente-abajo
  const head = new THREE.Group(); head.position.set(0,SGL+.05,0); head.rotation.x=-.35; head.userData.basePitch=-.35; parent.add(head); P.headG = head;
  head.add(mesh(SPH(), skin, 0,0,0, 0,0,0, .39,.36,.48));
  head.add(mesh(SPH(), bellyM, 0,-.15,-.34, 0,0,0, .26,.2,.3)); // hocico claro
  head.add(mesh(SPH(8,6), M(0xe2596b), 0,-.22,-.42, 0,0,0, .12,.06,.1)); // sonrisa: lengua
  for(const s of [-1,1]){
    head.add(mesh(SPH(8,6), M(0x3a2a1a), s*.1,.2,-.42, 0,0,0, .05,.06,.04)); // narinas altas
    head.add(mesh(CONE(8), skin, s*.18,.3,-.02, 0,0,s*-.3, .08,.18,.08));
    head.add(mesh(SPH(8,6), M(0xff9db0), s*.3,-.08,-.3, 0,0,0, .08,.06,.06)); // mejillas
  }
  baseEyes(head, .28,.1,-.28,.12); // ojos grandes
  const jaw = new THREE.Group(); jaw.position.set(0,-.26,-.2); head.add(jaw); P.jaw = jaw;
  jaw.add(mesh(SPH(), bellyM, 0,0,-.1, 0,0,0, .2,.1,.26));
  // patas robustas de elefante con uñas
  for(const s of [-1,1]) for(let i=0;i<2;i++){
    const z = .95-i*1.1;
    g.add(mesh(CYL(14), skin, s*.52,.55,z, 0,0,0, .24,.24,.6));
    g.add(mesh(CYL(14), skin, s*.52,.16,z-.02, 0,0,0, .28,.28,.2)); // pie ancho
    for(let tI=-1;tI<=1;tI++)
      g.add(mesh(CONE(8), M(0xfff2cc), s*.52+tI*.13,.14,z-.24, -Math.PI/2.3,0,0, .05,.13,.05));
    if(i===0){ if(s<0)P.legL=g.children[g.children.length-6]; else P.legR=g.children[g.children.length-6]; }
  }
  return {group:g, parts:P};
}

function buildTrice(d){
  const g = new THREE.Group(), P = {};
  const skin = M(d.color), bellyM = M(d.belly), hornM = M(0xfff5d6,{roughness:.4});
  g.add(mesh(SPH(), skin, 0,.85,.3, 0,0,0, .66,.6,.95));
  g.add(mesh(SPH(), bellyM, 0,.68,.25, 0,0,0, .54,.46,.8));
  const tail = new THREE.Group(); tail.position.set(0,.9,1.15); g.add(tail); P.tail = tail;
  tail.add(mesh(CONE(10), skin, 0,0,.4, Math.PI/2.2,0,0, .26,.8,.26));
  const head = new THREE.Group(); head.position.set(0,1.25,-0.75); g.add(head); P.head = head;
  head.add(mesh(BOX(), skin, 0,-.05,-.15, 0,0,0, .6,.55,.7));
  head.add(mesh(CONE(8), hornM, 0,-.28,-.5, -Math.PI/2.2,0,0, .07,.3,.07)); // cuerno nariz
  head.add(mesh(CONE(10), hornM, -.2,.18,-.42, -.7,0,-.25, .08,.55,.08)); // cuernos frente
  head.add(mesh(CONE(10), hornM, .2,.18,-.42, -.7,0,.25, .08,.55,.08));
  const frill = mesh(CYL(20), M(0x4a7fb5), 0,.3,.35, Math.PI/2.25,0,0, .55,.55,.16); head.add(frill); // gola
  for(let i=-2;i<=2;i++) head.add(mesh(SPH(8,6), hornM, i*.2,.72,.3, 0,0,0, .06,.1,.06));
  baseEyes(head, .28,0,-.3,.1);
  const jaw = new THREE.Group(); jaw.position.set(0,-.33,-.2); head.add(jaw); P.jaw = jaw;
  jaw.add(mesh(BOX(), bellyM, 0,0,-.1, 0,0,0, .4,.1,.55));
  for(const s of [-1,1]) for(let i=0;i<2;i++){
    const l = mesh(CYL(10), skin, s*.48,.42,.6-i*.7, 0,0,0, .17,.17,.42); g.add(l);
    if(i===0){ if(s<0)P.legL=l; else P.legR=l; }
    g.add(mesh(CYL(10), hornM, s*.48,.12,.6-i*.7, 0,0,0, .2,.12,.24));
  }
  return {group:g, parts:P};
}

function buildVelo(d){
  const g = new THREE.Group(), P = {};
  const skin = M(d.color), bellyM = M(d.belly), fea = M(0xffd43b);
  const body = mesh(SPH(), skin, 0,1.0,.2, -.25,0,0, .42,.44,.7); g.add(body);
  g.add(mesh(SPH(), bellyM, 0,.9,-.05, -.25,0,0, .34,.34,.55));
  const tail = new THREE.Group(); tail.position.set(0,1.05,.8); g.add(tail); P.tail = tail;
  tail.add(mesh(CONE(8), skin, 0,.05,.55, Math.PI/2.25,0,0, .16,1.0,.16));
  for(let i=0;i<3;i++) tail.add(mesh(CONE(6), fea, 0,.2+i*.02,.5+i*.28, Math.PI/2.4,0,0, .1,.3,.05));
  const head = new THREE.Group(); head.position.set(0,1.55,-.45); g.add(head); P.head = head;
  head.add(mesh(BOX(), skin, 0,0,-.1, 0,0,0, .34,.32,.55));
  head.add(mesh(BOX(), bellyM, 0,-.1,-.42, 0,0,0, .26,.14,.3));
  const jaw = new THREE.Group(); jaw.position.set(0,-.2,-.2); head.add(jaw); P.jaw = jaw;
  jaw.add(mesh(BOX(), bellyM, 0,0,-.2, 0,0,0, .22,.07,.4));
  for(let i=0;i<3;i++) for(const s of [-1,1])
    head.add(mesh(CONE(5), M(0xffffff), s*.1,.02-.22,-.4+i*.13, 0,0,0, .025,.06,.025));
  baseEyes(head, .2,.1,-.2,.09);
  for(let i=0;i<3;i++) head.add(mesh(CONE(6), fea, 0,.24+i*.09,.12-i*.06, -.3,0,0, .09,.22,.05)); // cresta plumas
  for(const s of [-1,1]){
    const a = mesh(CYL(8), skin, s*.3,1.0,-.25, 1.0,0,s*.3, .07,.07,.34); g.add(a);
    if(s<0)P.armL=a; else P.armR=a;
  }
  for(const s of [-1,1]){
    const up = mesh(CYL(8), skin, s*.22,.6,.25, 0,0,0, .12,.12,.4); g.add(up);
    g.add(mesh(CYL(8), skin, s*.22,.28,.05, .7,0,0, .09,.09,.36));
    g.add(mesh(BOX(), skin, s*.22,.1,-.25, 0,0,0, .16,.1,.34));
    g.add(mesh(CONE(8), M(0xffffff), s*.22,.14,-.44, -Math.PI/2,0,0, .05,.16,.05)); // garra hoz
    if(s<0)P.legL=up; else P.legR=up;
  }
  return {group:g, parts:P};
}

function buildStego(d){
  const g = new THREE.Group(), P = {};
  const skin = M(d.color), bellyM = M(d.belly), plateM = M(0xff5fa2,{roughness:.5});
  g.add(mesh(SPH(), skin, 0,.85,.25, 0,0,0, .6,.58,.95));
  g.add(mesh(SPH(), bellyM, 0,.68,.2, 0,0,0, .48,.44,.8));
  P.plates = [];
  const plateGeo = new THREE.CylinderGeometry(0.34,0.34,0.08,5);
  let i=0;
  for(const z of [-0.45,-0.1,0.25,0.6,0.9]){
    const p = mesh(plateGeo, plateM, 0,1.42-(i%2)*0.06,z, 0,0,Math.PI/2.4, 1,1,1); g.add(p);
    p.rotation.x = -.15; P.plates.push(p); i++;
  }
  const tail = new THREE.Group(); tail.position.set(0,.9,1.1); g.add(tail); P.tail = tail;
  tail.add(mesh(CONE(10), skin, 0,0,.45, Math.PI/2.2,0,0, .24,.9,.24));
  for(const s of [-1,1]) for(let k=0;k<2;k++)
    tail.add(mesh(CONE(8), M(0xfff5d6), s*.14,.1+k*.1,.6+k*.3, k*.4,0,s*.5, .05,.4,.05)); // thagomizer
  const head = new THREE.Group(); head.position.set(0,.95,-0.85); g.add(head); P.head = head;
  head.add(mesh(BOX(), skin, 0,0,-.1, 0,0,0, .4,.36,.5));
  head.add(mesh(SPH(), bellyM, 0,-.12,-.32, 0,0,0, .18,.14,.2));
  baseEyes(head, .2,.08,-.22,.085);
  const jaw = new THREE.Group(); jaw.position.set(0,-.22,-.15); head.add(jaw); P.jaw = jaw;
  jaw.add(mesh(BOX(), bellyM, 0,0,-.1, 0,0,0, .3,.08,.4));
  for(const s of [-1,1]) for(let k=0;k<2;k++){
    const l = mesh(CYL(10), skin, s*.44,.42,.5-k*.65, 0,0,0, .16,.16,.4); g.add(l);
    if(k===0){ if(s<0)P.legL=l; else P.legR=l; }
  }
  return {group:g, parts:P};
}

function buildAnky(d){
  const g = new THREE.Group(), P = {};
  const skin = M(d.color), shell = M(0x7a5c33), spike = M(0xfff5d6);
  g.add(mesh(SPH(), M(d.belly), 0,.7,.2, 0,0,0, .62,.5,.95));
  g.add(mesh(SPH(20,14), shell, 0,.98,.2, 0,0,0, .68,.5,1.0)); // caparazón
  P.plates = [];
  for(let r=0;r<3;r++) for(let c=-2;c<=2;c++){
    const o = mesh(SPH(8,6), spike, c*.22,1.38-Math.abs(c)*.05,.2+r*.32-.3, 0,0,0, .07,.07,.07);
    g.add(o); P.plates.push(o);
  }
  for(const s of [-1,1]) for(let k=0;k<3;k++)
    g.add(mesh(CONE(8), spike, s*.68,.95,.1+k*.35, 0,0,s*1.2, .07,.25,.07));
  const tail = new THREE.Group(); tail.position.set(0,.8,1.15); g.add(tail); P.tail = tail;
  tail.add(mesh(CYL(10), skin, 0,0,.4, Math.PI/2.2,0,0, .13,.13,.7));
  tail.add(mesh(SPH(10,8), shell, 0,.02,1.0, 0,0,0, .26,.24,.26)); // maza
  for(let k=0;k<4;k++) tail.add(mesh(CONE(6), spike, Math.cos(k*1.57)*.2,.05+Math.sin(k*1.57)*.18,1.0, 0,0,0, .05,.14,.05));
  const head = new THREE.Group(); head.position.set(0,.85,-0.9); g.add(head); P.head = head;
  head.add(mesh(BOX(), skin, 0,0,-.05, 0,0,0, .44,.36,.5));
  head.add(mesh(BOX(), shell, 0,.2,.05, 0,0,0, .4,.14,.4)); // casco
  for(const s of [-1,1]) head.add(mesh(CONE(8), spike, s*.26,.05,-.1, 0,0,s*1.4, .06,.18,.06));
  baseEyes(head, .2,.02,-.28,.09);
  const jaw = new THREE.Group(); jaw.position.set(0,-.2,-.1); head.add(jaw); P.jaw = jaw;
  jaw.add(mesh(BOX(), M(d.belly), 0,0,-.1, 0,0,0, .32,.08,.4));
  for(const s of [-1,1]) for(let k=0;k<2;k++){
    const l = mesh(CYL(10), skin, s*.46,.35,.4-k*.6, 0,0,0, .16,.16,.36); g.add(l);
    if(k===0){ if(s<0)P.legL=l; else P.legR=l; }
  }
  return {group:g, parts:P};
}

function buildPara(d){
  const g = new THREE.Group(), P = {};
  const skin = M(d.color), bellyM = M(d.belly);
  const body = mesh(SPH(), skin, 0,1.0,.25, -.2,0,0, .55,.55,.8); g.add(body);
  g.add(mesh(SPH(), bellyM, 0,.86,.05, -.2,0,0, .44,.42,.62));
  const tail = new THREE.Group(); tail.position.set(0,1.0,.95); g.add(tail); P.tail = tail;
  tail.add(mesh(CONE(10), skin, 0,.05,.5, Math.PI/2.25,0,0, .26,.9,.26));
  tail.add(mesh(CONE(8), M(0xffd43b), 0,.2,.7, Math.PI/2.3,0,0, .12,.5,.06)); // aleta cola
  const head = new THREE.Group(); head.position.set(0,1.7,-0.5); g.add(head); P.head = head;
  head.add(mesh(SPH(), skin, 0,0,-.05, 0,0,0, .34,.32,.42));
  const crest = mesh(CYL(10), M(0xff8c42), 0,.28,.42, 1.9,0,0, .13,.13,.75); head.add(crest); P.crest = crest;
  head.add(mesh(SPH(), bellyM, 0,-.12,-.42, 0,0,0, .2,.14,.22)); // pico de pato
  head.add(mesh(BOX(), bellyM, 0,-.08,-.55, 0,0,0, .24,.1,.18));
  baseEyes(head, .28,.08,-.2,.1);
  const jaw = new THREE.Group(); jaw.position.set(0,-.24,-.3); head.add(jaw); P.jaw = jaw;
  jaw.add(mesh(BOX(), bellyM, 0,0,-.1, 0,0,0, .26,.07,.36));
  for(const s of [-1,1]){
    const a = mesh(CYL(8), skin, s*.42,.95,-.15, .8,0,s*.3, .08,.08,.36); g.add(a);
    if(s<0)P.armL=a; else P.armR=a;
  }
  for(const s of [-1,1]){
    const up = mesh(CYL(10), skin, s*.28,.6,.3, 0,0,0, .15,.15,.42); g.add(up);
    g.add(mesh(CYL(10), skin, s*.28,.24,.1, .3,0,0, .12,.12,.36));
    g.add(mesh(BOX(), skin, s*.28,.08,-.18, 0,0,0, .22,.1,.36));
    if(s<0)P.legL=up; else P.legR=up;
  }
  return {group:g, parts:P};
}

function buildPtera(d){
  const g = new THREE.Group(), P = {};
  const skin = M(d.color), bellyM = M(d.belly), wingM = M(d.color);
  g.add(mesh(SPH(), bellyM, 0,.95,.15, 0,0,0, .4,.38,.55));
  g.add(mesh(SPH(), skin, 0,1.05,.15, 0,0,0, .36,.3,.5));
  const head = new THREE.Group(); head.position.set(0,1.45,-0.35); g.add(head); P.head = head;
  head.add(mesh(SPH(), skin, 0,0,0, 0,0,0, .26,.26,.3));
  head.add(mesh(CONE(10), M(0xffd43b), 0,-.05,-.55, -Math.PI/2,0,0, .1,.5,.1)); // pico
  const jaw = new THREE.Group(); jaw.position.set(0,-.14,-.3); head.add(jaw); P.jaw = jaw;
  jaw.add(mesh(CONE(8), M(0xffc53b), 0,0,-.2, -Math.PI/2,0,0, .07,.34,.07));
  head.add(mesh(BOX(), M(0xff5fa2), 0,.28,.25, -.5,0,0, .12,.3,.3)); // cresta trasera
  baseEyes(head, .22,.06,-.18,.095);
  P.wings = [];
  for(const s of [-1,1]){
    const w = new THREE.Group(); w.position.set(s*.3,1.15,.1); g.add(w); P.wings.push(w);
    const arm = mesh(CYL(8), skin, s*.35,.1,0, 0,0,s*1.25, .06,.06,.7); w.add(arm);
    const sailShape = new THREE.Shape();
    sailShape.moveTo(0,0); sailShape.lineTo(s*1.7,0.35); sailShape.lineTo(s*1.55,-0.5); sailShape.lineTo(s*.3,-0.35); sailShape.lineTo(0,0);
    const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape),
      new THREE.MeshStandardMaterial({color:d.color, roughness:.7, side:THREE.DoubleSide}));
    sail.castShadow = true; sail.position.set(s*.3,0,0); w.add(sail);
    if(s<0)P.armL=w; else P.armR=w;
  }
  const tail = new THREE.Group(); tail.position.set(0,1.0,.65); g.add(tail); P.tail = tail;
  tail.add(mesh(CONE(8), skin, 0,0,.25, Math.PI/2.2,0,0, .1,.4,.1));
  for(const s of [-1,1]){
    g.add(mesh(CYL(8), skin, s*.2,.5,.1, 0,0,0, .09,.09,.34));
    g.add(mesh(BOX(), skin, s*.2,.3,-.1, 0,0,0, .12,.08,.28));
  }
  P.legL = g.children[8]; P.legR = g.children[9];
  return {group:g, parts:P};
}

function buildTiburon(d){
  const g = new THREE.Group(), P = {};
  const skin = M(d.color), bellyM = M(d.belly), finM = M(0x1f7fc0,{roughness:.6});
  // cuerpo hidrodinámico: torpedo redondo y simpático
  const body = mesh(SPH(), skin, 0,1.05,.15, 0,0,0, .52,.5,1.0); g.add(body); P.body = body;
  g.add(mesh(SPH(), bellyM, 0,.88,.1, 0,0,0, .44,.4,.86)); // panza clara
  // hocico redondeado con fosas
  const snout = mesh(SPH(), skin, 0,1.0,-.78, 0,0,0, .34,.3,.34); g.add(snout);
  for(const s of [-1,1]) g.add(mesh(SPH(8,6), M(0x2a4a5a), s*.1,1.08,-1.02, 0,0,0, .035,.05,.03));
  // ojos grandes y simpáticos a los lados (con párpados para parpadear)
  const w = M(0xffffff,{roughness:.25}), b = M(0x223344,{roughness:.2});
  g.userData.lids = g.userData.lids||[];
  for(const s of [-1,1]){
    const e = mesh(SPH(10,8), w, s*.34,1.18,-.5, 0,0,0, .16,.18,.12); g.add(e);
    const p = mesh(SPH(8,6), b, s*.4,1.18,-.56, 0,0,0, .075,.09,.06); g.add(p);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(1,8,6), new THREE.MeshBasicMaterial({color:0xffffff}));
    hl.position.set(s*.42,1.25,-.62); hl.scale.setScalar(.025); g.add(hl);
    const lid = mesh(SPH(10,8), M(0x2a6a9a), s*.34,1.2,-.52, 0,0,0, .15,.02,.12);
    lid.userData.isLid=true; lid.userData.baseY=.02; lid.castShadow=false;
    g.add(lid); g.userData.lids.push(lid);
  }
  // sonrisa con dientecitos pequeños y redondeados (nada amenazador)
  const jaw = new THREE.Group(); jaw.position.set(0,.86,-.55); g.add(jaw); P.jaw = jaw;
  jaw.add(mesh(SPH(10,8), bellyM, 0,-.04,-.15, 0,0,0, .24,.1,.3));
  const toothM = M(0xffffff,{roughness:.3});
  for(let i=0;i<5;i++){
    g.add(mesh(SPH(8,6), toothM, (i-2)*.085,1.0,-.93, 0,0,0, .04,.05,.04));
    jaw.add(mesh(SPH(8,6), toothM, (i-2)*.085,-.0,-.32, 0,0,0, .035,.045,.035));
  }
  // branquias: 3 ranuras por lado
  for(const s of [-1,1]) for(let i=0;i<3;i++)
    g.add(mesh(BOX(), M(0x2a7aab), s*.5,1.02-i*.02,.1-i*.16, 0,0,s*.35, .03,.16,.05));
  // aleta dorsal triangular
  const dorsal = mesh(CONE(4), finM, 0,1.62,.25, 0,0,0, .3,.55,.12); g.add(dorsal); P.dorsal = dorsal;
  // aletas pectorales (se animan)
  P.fins = [];
  for(const s of [-1,1]){
    const f = new THREE.Group(); f.position.set(s*.45,.85,-.1); g.add(f); P.fins.push(f);
    f.add(mesh(CONE(6), finM, s*.35,-.1,.05, 0,0,s*1.9, .22,.55,.08));
  }
  // cola: pedúnculo + aleta caudal heterocerca (lóbulo superior grande)
  const tail = new THREE.Group(); tail.position.set(0,1.05,1.05); g.add(tail); P.tail = tail;
  tail.add(mesh(CYL(10), skin, 0,0,.25, Math.PI/2.2,0,0, .16,.16,.5));
  tail.add(mesh(CONE(4), finM, 0,.35,.7, -.25,0,0, .3,.7,.1));   // lóbulo superior
  tail.add(mesh(CONE(4), finM, 0,-.2,.65, Math.PI+.25,0,0, .24,.45,.1)); // lóbulo inferior
  // mejillas sonrosadas de personaje infantil
  for(const s of [-1,1]) g.add(mesh(SPH(8,6), M(0xff9db0), s*.3,.98,-.62, 0,0,0, .07,.05,.05));
  return {group:g, parts:P};
}

export const DINO_BUILDERS = {
  trex: buildTrex, braqui: buildBraqui, trice: buildTrice, velo: buildVelo,
  stego: buildStego, anky: buildAnky, para: buildPara, ptera: buildPtera,
  tiburon: buildTiburon,
};
export function buildDinosaur(id){
  const d = DINOS.find(x=>x.id===id) || DINOS[0];
  const built = DINO_BUILDERS[d.id](d);
  try { detailDino(d.id, built.group, built.parts, d); } catch(e){}
  try { softToyFinish(built.group, built.parts, d.id); } catch(e){}
  return { ...built, def: d };
}
/* acabado "juguete blando": cabezas un poco más grandes (proporción tierna;
   el braquiosaurio ya trae su cabeza al +50 %, no se reescala)
   + contorno suave tipo dibujo animado en la cabeza (1 malla extra por pj) */
const _outlineMat = ()=>new THREE.MeshBasicMaterial({color:0x4a3f55, side:THREE.BackSide});
function softToyFinish(group, P, id){
  const headG = P.headG || (P.head && P.head.isGroup ? P.head : null) || P.body || null;
  if(!headG) return;
  if(headG.isGroup && !P.body && id!=='braqui') headG.scale.multiplyScalar(1.12);
  // la malla más grande de la cabeza recibe un cascarón invertido = contorno
  let big=null, bigR=0;
  const kids = headG.isGroup ? headG.children : [headG];
  for(const o of kids){
    if(!o.isMesh || o.userData.isLid) continue;
    o.geometry.computeBoundingSphere?.();
    const r = (o.geometry.boundingSphere?.radius||0) * Math.max(o.scale.x,o.scale.y,o.scale.z);
    if(r>bigR){ bigR=r; big=o; }
  }
  if(big && big.parent){
    const shell = new THREE.Mesh(big.geometry, _outlineMat());
    shell.position.copy(big.position); shell.rotation.copy(big.rotation);
    shell.scale.copy(big.scale).multiplyScalar(1.07);
    shell.castShadow = false; shell.receiveShadow = false;
    shell.userData.isOutline = true;
    big.parent.add(shell);
  }
}

/* ============ KART (no tapa cabeza/cuernos/placas/cola) ============ */
const KART_COLORS = [0xff4757,0x1cb0f6,0xffd43b,0x58cc02,0xa55eea,0xff5fa2,0xff7f50,0x3ec6b8,0x00b4d8];
export function buildKart(colorIdx=0, marine=false, variant=null){
  const g = new THREE.Group();
  const v = variant || (marine?'marine':'classic'); // classic | marine | rocket
  const col = v==='marine' ? 0xf4f8ff : KART_COLORS[colorIdx % KART_COLORS.length];
  const bodyM = M(col,{roughness:.28, metalness:.25}), darkM = M(0x333344,{roughness:.6});
  const chromeM = M(0xdfe6ee,{roughness:.2, metalness:.75});
  const trimM = M(v==='marine'?0x0096c7:(v==='rocket'?0xe63946:col),{roughness:.35});
  // chasis alto de juguete: el personaje queda visible por completo
  const chassis = mesh(BOX(), bodyM, 0,.65,.15, 0,0,0, 1.15,.22,1.9); g.add(chassis);
  g.add(mesh(BOX(), trimM, 0,.73,-.55, 0,0,0, .9,.14,.5)); // morro
  if(v==='marine'){ // franja de olas + salvavidas a los lados (bajos, no tapan)
    g.add(mesh(BOX(), trimM, 0,.65,.15, 0,0,0, 1.17,.08,1.92));
    for(const s of [-1,1]){
      const ring = mesh(new THREE.TorusGeometry(.22,.08,10,20), M(0xff6b35,{roughness:.5}), s*.98,.65,.3, 0,Math.PI/2,0, 1,1,1);
      g.add(ring);
      g.add(mesh(BOX(), M(0xffffff), s*.98,.87,.3, 0,0,0, .1,.08,.1));
      g.add(mesh(BOX(), M(0xffffff), s*.98,.43,.3, 0,0,0, .1,.08,.1));
    }
    g.add(mesh(BOX(), trimM, 0,1.55,1.15, 0,0,0, .5,.3,.06)); // banderita con ola
    g.add(mesh(SPH(8,6), M(0xffffff), 0,1.55,1.19, 0,0,0, .1,.1,.05));
  }
  g.add(mesh(BOX(), bodyM, 0,.57,-1.05, .12,0,0, 1.0,.1,.5)); // alerón delantero
  for(const s of [-1,1]){ // pontones laterales con franja blanca
    g.add(mesh(BOX(), bodyM, s*.72,.63,.3, 0,0,0, .3,.26,1.1));
    g.add(mesh(BOX(), M(0xffffff,{roughness:.35}), s*.72,.71,.3, 0,0,0, .32,.07,1.0));
    g.add(mesh(BOX(), darkM, s*.72,.51,-.75, 0,0,0, .34,.1,.3)); // guardabarros
    g.add(mesh(BOX(), darkM, s*.72,.51,.95, 0,0,0, .34,.1,.3));
  }
  g.add(mesh(SPH(), M(0xfff200,{emissive:0xffee00,emissiveIntensity:.5}), 0,.78,-1.12, 0,0,0, .16,.1,.08)); // faro
  for(const s of [-1,1]) g.add(mesh(SPH(8,6), M(0xff5252,{emissive:0xcc0000,emissiveIntensity:.5}), s*.3,.78,1.28, 0,0,0, .09,.07,.05)); // pilotos
  g.add(mesh(BOX(), darkM, 0,.85,.75, -.25,0,0, .95,.3,.18)); // respaldo bajo (no tapa)
  g.add(mesh(CYL(10), darkM, 0,.73,.35, Math.PI/2,0,0, .42,.42,.12)); // asiento
  g.add(mesh(BOX(), M(0xffd43b,{roughness:.4}), 0,.79,.35, 0,0,0, .3,.06,.3)); // cojín
  const wheel = mesh(new THREE.TorusGeometry(.2,.05,10,20), darkM, 0,.91,-.35, -.5,0,0, 1,1,1); g.add(wheel); // volante
  g.add(mesh(CYL(8), chromeM, 0,.83,-.28, .9,0,0, .035,.035,.3)); // columna
  g.add(mesh(SPH(8,6), bodyM, 0,.91,-.35, 0,0,0, .07,.07,.07));
  // alerón trasero alto pero estrecho (no tapa la cola lateral)
  g.add(mesh(BOX(), bodyM, -.4,1.08,1.15, 0,0,0, .08,.5,.08));
  g.add(mesh(BOX(), bodyM, .4,1.08,1.15, 0,0,0, .08,.5,.08));
  g.add(mesh(BOX(), M(0xffffff), 0,1.33,1.15, 0,0,0, 1.1,.16,.3));
  // escapes cromados con brillo
  for(const s of [-1,1]){
    g.add(mesh(CYL(8), chromeM, s*.35,.73,1.1, Math.PI/2,0,0, .07,.07,.35));
    g.add(mesh(CYL(8), M(0x222222,{emissive:0xff8800,emissiveIntensity:.25}), s*.35,.73,1.28, Math.PI/2,0,0, .055,.055,.04));
  }
  if(v==='rocket'){ // COHETE: morro cónico, aletas y banda a cuadros (mismo manejo)
    g.add(mesh(CONE(12), trimM, 0,.73,-1.35, -Math.PI/2,0,0, .3,.5,.3));
    for(const s of [-1,1])
      g.add(mesh(BOX(), trimM, s*.55,1.0,1.05, 0,0,s*.35, .08,.5,.4)); // aletas traseras
    for(let i=0;i<6;i++)
      g.add(mesh(BOX(), M(i%2?0xe63946:0xffffff,{roughness:.4}), -.45+i*.18,.66,.15, 0,0,0, .16,.06,.1)); // banda
    g.add(mesh(SPH(10,8), M(0x9adcff,{roughness:.15,metalness:.3}), 0,.95,1.15, 0,0,0, .16,.16,.08)); // ojo de buey
  }
  // RUEDAS GORDAS de juguete: más anchas que el cuerpo, con llanta de color
  const wheels = [];
  const tireM = M(0x22222c,{roughness:.9, bumpMap:scaleTexture(), bumpScale:.25}), hubM = M(0xffffff,{roughness:.25, metalness:.4});
  for(const [x,z,front] of [[-.85,-.6,1],[.85,-.6,1],[-.85,.85,0],[.85,.85,0]]){
    const pivot = new THREE.Group(); pivot.position.set(x,.55,z); pivot.userData.baseY=.55; g.add(pivot);
    const tire = mesh(CYL(24), tireM, 0,0,0, 0,0,Math.PI/2, .55,.55,.42); pivot.add(tire);
    const hub = mesh(CYL(12), hubM, 0,0,0, 0,0,Math.PI/2, .26,.26,.44); pivot.add(hub);
    for(let k=0;k<5;k++){ // radios de la llanta con el color del kart
      const sp = mesh(BOX(), M(col,{roughness:.4}), 0,0,0, k*Math.PI/5,0,0, .06,.46,.46);
      pivot.add(sp);
    }
    wheels.push({pivot, tire, front:!!front});
  }
  g.userData.chassis = chassis;
  return { group:g, wheels, steering: wheel };
}
export function mountDinoOnKart(dinoGroup, kartGroup, dinoId){
  // El dino va sentado sobre el asiento alto, entero y visible
  dinoGroup.position.set(0,.85,.35);
  const s = dinoId==='braqui' ? .85 : dinoId==='ptera' ? .9 : .95;
  dinoGroup.scale.setScalar(s);
  kartGroup.add(dinoGroup);
}

/* ============ AUDIO: música alegre procedural + SFX ============ */
/* Voces "gruñido grave amistoso": sierra 60-120 Hz + AM 20-40 Hz ("bububu").
   Grande = más grave, lento y largo. Pequeño = más agudo y rápido. */
const ROAR_VOICE = {
  braqui: {f:62,  d:1.6, am:22}, trex:   {f:75,  d:1.3, am:26},
  anky:   {f:70,  d:1.2, am:24}, trice:  {f:85,  d:1.1, am:28},
  stego:  {f:90,  d:1.0, am:30}, para:   {f:95,  d:1.1, am:30},
  velo:   {f:110, d:0.7, am:36}, ptera:  {f:120, d:0.7, am:38},
  tiburon:{f:140, d:0.8, am:30},
};
class MusicBox {
  constructor(){
    this.ctx=null; this.playing=false; this.muted=false; this.timer=null; this.step=0;
    this.musicGain=null; this.sfxGain=null; this._roarUntil=0; this._noise=null;
    // valores razonables aunque lo guardado sea 0 (el silencio total va por el botón 🔇)
    let sm=NaN, ss=NaN;
    try{ sm=parseFloat(localStorage.getItem('dr3d_mus')); ss=parseFloat(localStorage.getItem('dr3d_sfx')); }catch{}
    this.musicVol=(!isFinite(sm)||sm<=0)?.5:Math.min(1,sm);
    this.sfxVol=(!isFinite(ss)||ss<=0)?.8:Math.min(1,ss);
  }
  ensure(){
    if(!this.ctx){
      const AC = window.AudioContext||window.webkitAudioContext; if(!AC) return;
      this.ctx = new AC();
      this.musicGain=this.ctx.createGain(); this.musicGain.gain.value=this.muted?0:this.musicVol;
      this.sfxGain=this.ctx.createGain(); this.sfxGain.gain.value=this.muted?0:this.sfxVol;
      // master con compresor suave + analizador para sonda de audio real
      this.master=this.ctx.createGain(); this.master.gain.value=.9;
      this.comp=this.ctx.createDynamicsCompressor();
      this.comp.threshold.value=-18; this.comp.ratio.value=4;
      this.probe=this.ctx.createAnalyser(); this.probe.fftSize=1024;
      this._pbuf=new Float32Array(this.probe.fftSize);
      this.musicGain.connect(this.master); this.sfxGain.connect(this.master);
      this.master.connect(this.comp); this.comp.connect(this.probe); this.probe.connect(this.ctx.destination);
      // ruido blanco reutilizable para la capa de gruñido
      const nb=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);
      const nd=nb.getChannelData(0);
      for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
      this._noise=nb;
      // el audio solo vive tras gesto del usuario: reanudar en cada gesto y al volver a la pestaña
      const wake=()=>{ if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); };
      addEventListener('pointerdown',wake); addEventListener('keydown',wake);
      document.addEventListener('visibilitychange',()=>{ if(!document.hidden) wake(); });
    }
    if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume();
  }
  /* nivel RMS real de la salida (0 = silencio). Sirve para verificar sonido de verdad. */
  level(){
    if(!this.ctx||!this.probe) return -1;
    this.probe.getFloatTimeDomainData(this._pbuf);
    let s=0; for(let i=0;i<this._pbuf.length;i++) s+=this._pbuf[i]*this._pbuf[i];
    return Math.sqrt(s/this._pbuf.length);
  }
  setMusicVol(v){ this.musicVol=v; try{localStorage.setItem('dr3d_mus',v);}catch{} if(this.musicGain&&!this.muted) this.musicGain.gain.value=v; }
  setSfxVol(v){ this.sfxVol=v; try{localStorage.setItem('dr3d_sfx',v);}catch{} if(this.sfxGain&&!this.muted) this.sfxGain.gain.value=v; }
  setMuted(m){ this.muted=m; if(this.musicGain) this.musicGain.gain.value=m?0:this.musicVol; if(this.sfxGain) this.sfxGain.gain.value=m?0:this.sfxVol; }
  beep(freq, dur=.15, type='square', vol=.12, when=0, bus='sfx'){
    if(!this.ctx||this.muted) return;
    const t = this.ctx.currentTime+when, o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(vol,t);
    g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.connect(g); g.connect(bus==='music'?this.musicGain:this.sfxGain);
    o.start(t); o.stop(t+dur+.02);
  }
  jump(){ this.beep(400,.18,'square',.14); this.beep(700,.2,'square',.12,.08); }
  egg(){ this.beep(880,.12,'sine',.16); this.beep(1320,.15,'sine',.14,.07); }
  star(){ [660,830,990,1320].forEach((f,i)=>this.beep(f,.14,'triangle',.15,i*.07)); }
  /* "¡yuju!" muy suave del público (bus de efectos, con enfriamiento) */
  cheer(){ this.beep(659,.16,'sine',.12); this.beep(784,.22,'sine',.12,.12); }
  /* hilera completa: do-re-mi-sol ascendente y alegre (bus de efectos) */
  arpeggio(){ [523,587,659,784].forEach((f,i)=>this.beep(f,.22,'triangle',.18,i*.11)); }
  /* silbato deslizante gracioso para el giro de choque (suave, nada estridente) */
  slideWhistle(){
    if(!this.ctx||this.muted) return;
    const t=this.ctx.currentTime, o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(950,t);
    o.frequency.exponentialRampToValueAtTime(340,t+.38);
    g.gain.setValueAtTime(.001,t); g.gain.exponentialRampToValueAtTime(.22,t+.05);
    g.gain.exponentialRampToValueAtTime(.001,t+.42);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t+.45);
  }
  hit(){ this.beep(160,.25,'sawtooth',.14); }
  fanfare(){ [523,659,784,1047,784,1047,1319].forEach((f,i)=>this.beep(f,.22,'square',.13,i*.14)); }
  click(){ this.beep(600,.07,'square',.1); }
  count(n){ this.beep(n===0?880:440,.25,'square',.16); }
  /* GRUÑIDO GRAVE AMISTOSO: sierra 60-120 Hz + AM 20-40 Hz + ruido filtrado +
     paso bajo "boca" que se abre y cierra + descenso final. Nada fuerte >1 kHz. */
  roar(species='trex', vol=.8){
    if(!this.ctx||this.muted) return 0;
    if(this.ctx.state!=='running'){ this.ctx.resume(); return 0; }
    if(species==='tiburon'){ this.bubbles(6,.35); this._roarUntil=this.ctx.currentTime+.9; return .9; }
    const now=this.ctx.currentTime;
    if(now<(this._roarUntil||0)) return 0; // sin solaparse
    const v = ROAR_VOICE[species]||ROAR_VOICE.trex;
    const jit = 1+(Math.random()*.1-.05); // variación ±5 %
    const f0 = v.f*jit, dur = v.d*(1+(Math.random()*.1-.05));
    this._roarUntil = now+dur;
    const t0=now+.02;
    const o=this.ctx.createOscillator(); o.type='sawtooth';
    o.frequency.setValueAtTime(f0*1.08,t0);
    o.frequency.exponentialRampToValueAtTime(f0,t0+dur*.3);
    o.frequency.exponentialRampToValueAtTime(f0*.82,t0+dur); // descenso suave
    const am=this.ctx.createOscillator(); am.type='sine';
    am.frequency.value=v.am*(1+(Math.random()*.1-.05)); // "bububu"
    const amG=this.ctx.createGain(); amG.gain.value=.45;
    const g=this.ctx.createGain(); g.gain.value=.5;
    am.connect(amG); amG.connect(g.gain);
    const lp=this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=2;
    lp.frequency.setValueAtTime(260,t0);
    lp.frequency.exponentialRampToValueAtTime(Math.min(650,v.f*6),t0+dur*.35); // la boca se abre
    lp.frequency.exponentialRampToValueAtTime(220,t0+dur); // ...y se cierra
    const lp2=this.ctx.createBiquadFilter(); lp2.type='lowpass'; lp2.frequency.value=700; // techo extra: nada fuerte >1 kHz
    const out=this.ctx.createGain();
    out.gain.setValueAtTime(.001,t0);
    out.gain.exponentialRampToValueAtTime(vol,t0+.08);
    out.gain.setValueAtTime(vol,t0+dur*.75);
    out.gain.exponentialRampToValueAtTime(.001,t0+dur);
    o.connect(g); g.connect(lp); lp.connect(lp2); lp2.connect(out); out.connect(this.sfxGain);
    const n=this.ctx.createBufferSource(); n.buffer=this._noise; n.loop=true;
    const nf=this.ctx.createBiquadFilter(); nf.type='lowpass'; nf.frequency.value=380; nf.Q.value=1;
    const ng=this.ctx.createGain(); ng.gain.value=.12;
    n.connect(nf); nf.connect(ng); ng.connect(out);
    o.start(t0); o.stop(t0+dur+.05); am.start(t0); am.stop(t0+dur+.05);
    n.start(t0); n.stop(t0+dur+.05);
    return dur;
  }
  /* burbujitas de tiburón: glissandos cortos ascendentes */
  bubbles(n=4, vol=.3){
    if(!this.ctx||this.muted) return;
    for(let i=0;i<n;i++){
      const t0=this.ctx.currentTime+i*.09;
      const o=this.ctx.createOscillator(), g=this.ctx.createGain();
      o.type='sine';
      const f0=500+Math.random()*700;
      o.frequency.setValueAtTime(f0,t0); o.frequency.exponentialRampToValueAtTime(f0*1.8,t0+.08);
      g.gain.setValueAtTime(.001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+.02);
      g.gain.exponentialRampToValueAtTime(.001,t0+.09);
      o.connect(g); g.connect(this.sfxGain); o.start(t0); o.stop(t0+.12);
    }
  }
  /* mazo suave tipo marimba/xilófono: seno + armónico con caída exponencial */
  mallet(freq, dur=.5, vol=.1, bright=.25, when=0){
    if(!this.ctx||this.muted) return;
    const t=this.ctx.currentTime+when;
    const o=this.ctx.createOscillator(), o2=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='sine'; o.frequency.value=freq;
    o2.type='sine'; o2.frequency.value=freq*4; // brillo de lámina
    const g2=this.ctx.createGain(); g2.gain.value=bright;
    g.gain.setValueAtTime(.001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+.015);
    g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.musicGain);
    o.start(t); o.stop(t+dur+.05); o2.start(t); o2.stop(t+dur+.05);
  }
  /* campanilla discreta con destello */
  bell(freq, vol=.05, when=0){
    if(!this.ctx||this.muted) return;
    const t=this.ctx.currentTime+when;
    for(const [m,a] of [[1,1],[2.4,.4],[5.1,.15]]){
      const o=this.ctx.createOscillator(), g=this.ctx.createGain();
      o.type='sine'; o.frequency.value=freq*m;
      g.gain.setValueAtTime(.001,t);
      g.gain.exponentialRampToValueAtTime(vol*a,t+.01);
      g.gain.exponentialRampToValueAtTime(.001,t+1.1);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t+1.2);
    }
  }
  startMusic(){
    this.ensure(); if(!this.ctx||this.playing) return; this.playing=true;
    // melodía infantil relajante en pentatónica de Do, frases que respiran
    const mel=[
      523,587,659,587, 523,0,659,0, 587,523,440,523, 587,0,0,0,
      523,587,659,784, 659,587,523,0, 440,523,587,523, 440,0,0,0,
      659,784,880,784, 659,0,587,0, 659,587,523,587, 523,0,0,0,
      523,440,523,587, 659,587,523,440, 523,0,392,0, 523,0,0,0];
    const bass=[131,0,165,0,196,0,165,0,131,0,196,0,165,0,147,0];
    const tick=()=>{
      if(!this.playing||!this.ctx) return;
      if(!this.muted){
        const i=this.step%mel.length, n=mel[i];
        if(n) this.mallet(n,.55,.085,.22);                       // marimba
        if(i%2===0&&n) this.mallet(n*2,.4,.028,.3);              // xilófono suave arriba
        const b=bass[(this.step>>1)%bass.length];
        if(b) this.mallet(b,1.1,.06,.08);                        // bajo redondo
        if(i%16===12) this.bell(1568,.035);                      // campanilla discreta
        if(i%32===28) this.bell(1319,.03);
      }
      this.step++;
    };
    tick(); this.timer=setInterval(tick,320); // negra = 2 pasos → 93.75 BPM (rango 80-100)
  }
  stopMusic(){ this.playing=false; if(this.timer) clearInterval(this.timer); this.timer=null; }
}
export const music = new MusicBox();

/* ============ ENTRADA: teclado + Xbox + táctil ============ */
export const Input = {
  left:false,right:false, jumpQ:false, pauseQ:false,
  axis:0, padName:'', padSeen:false,
  keys:{},
  init(musicRef){
    addEventListener('keydown',e=>{
      if(['ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      this.keys[e.code]=true; this.readKeys();
      if(e.code==='Space'){ this.jumpQ=true; }
      if(e.code==='Escape'||e.code==='KeyP'){ this.pauseQ=true; }
    });
    addEventListener('keyup',e=>{ this.keys[e.code]=false; this.readKeys(); });
    addEventListener('gamepadconnected',e=>{ this.padSeen=true; this.padName=e.gamepad.id||'Mando'; this.padUpdate(); });
    addEventListener('gamepaddisconnected',()=>{ this.padUpdate(); });
    const b=(id,down,up)=>{ const el=document.getElementById(id);
      el.addEventListener('pointerdown',ev=>{ev.preventDefault();down();});
      el.addEventListener('pointerup',()=>up&&up()); el.addEventListener('pointerleave',()=>up&&up()); };
    b('tc-left',()=>this.left=true,()=>this.left=false);
    b('tc-right',()=>this.right=true,()=>this.right=false);
    b('tc-jump',()=>{this.jumpQ=true;});
  },
  readKeys(){
    this.left = !!(this.keys.ArrowLeft||this.keys.KeyA);
    this.right = !!(this.keys.ArrowRight||this.keys.KeyD);
    this.gas = !!(this.keys.ArrowUp||this.keys.KeyW);
    this.brake = !!(this.keys.ArrowDown||this.keys.KeyS);
  },
  poll(){
    // gamepad Xbox: stick izquierdo/cruceta -> moverse, A -> salto, Start -> pausa
    // (mapeo completo Elite en tarea 3: aquí lectura básica + gatillos)
    let gx=0, gjump=false, gpause=false, name='', gas=false, brake=false, nonStd=false;
    try{
      const gps = navigator.getGamepads?navigator.getGamepads():[];
      for(const gp of gps){ if(!gp||!gp.connected) continue;
        name=gp.id||'Mando'; if(gp.mapping&&gp.mapping!=='standard') nonStd=true;
        const ax = gp.axes[0]||0; if(Math.abs(ax)>0.15) gx=ax;
        if(gp.buttons[14]?.pressed) gx=-1; if(gp.buttons[15]?.pressed) gx=1;
        if(gp.buttons[0]?.pressed) gjump=true;
        if(gp.buttons[9]?.pressed) gpause=true;
        if((gp.buttons[7]?.value||0)>0.1) gas=true;   // RT = acelerar
        if((gp.buttons[6]?.value||0)>0.1) brake=true; // LT = frenar
        break;
      }
    }catch{}
    this.axis=gx; this.padGas=gas||this.gas; this.padBrake=brake||this.brake; this.nonStd=nonStd;
    if(name!==this.padName||(!this.padSeen&&name)){ this.padSeen=!!name; this.padName=name; this.padUpdate(); }
    // combinar sin pisar teclado: recalcula (zona muerta ~0.15)
    const kL=!!(this.keys.ArrowLeft||this.keys.KeyA), kR=!!(this.keys.ArrowRight||this.keys.KeyD);
    this.left = kL||gx<-0.15; this.right = kR||gx>0.15;
    // flancos de botones del mando
    if(gjump&&!this._gj){ this.jumpQ=true; } this._gj=gjump;
    if(gpause&&!this._gp){ this.pauseQ=true; } this._gp=gpause;
    return {move:(this.right?1:0)-(this.left?1:0)+(Math.abs(gx)>0.25?gx*0.0:0)};
  },
  padUpdate(){
    const el=document.getElementById('pad-status'); if(!el) return;
    const gps = navigator.getGamepads?Array.from(navigator.getGamepads()).filter(g=>g&&g.connected):[];
    if(gps.length){ el.classList.add('ok'); el.innerHTML=`🎮 ¡Mando conectado! <b>${String(gps[0].id).slice(0,40)}</b><br>Stick/cruceta = moverte · A = saltar · Start = pausa`; }
  },
  takeJump(){ const j=this.jumpQ; this.jumpQ=false; return j; },
  takePause(){ const p=this.pauseQ; this.pauseQ=false; return p; },
};

/* ============ MUNDO / PISTA ============ */
function rand(a,b){ return a+Math.random()*(b-a); }

export function themeProps(scene, track, LEN){
  const grp = new THREE.Group(); scene.add(grp);
  const fx = { swayers:[], lavaMats:[], sparks:null, river:null, smoke:[], fish:[], ducks:[], geysers:[], falls:null };
  const biome = {liana:0,fern:0,falls:0,lavaRiver:0,smoke:0,lake:0,lily:0,fish:0,duck:0,snowpine:0,geyser:0,cactus:0};
  // InstancedMesh barato: una geometría + N transformaciones
  const _dummy = new THREE.Object3D();
  function inst(geo, mat, list, shadow=true){
    const m=new THREE.InstancedMesh(geo,mat,list.length);
    list.forEach((tr,i)=>{ _dummy.position.set(tr.p[0],tr.p[1],tr.p[2]);
      _dummy.rotation.set(tr.r?.[0]||0,tr.r?.[1]||0,tr.r?.[2]||0);
      _dummy.scale.set(tr.s?.[0]??tr.s??1,tr.s?.[1]??tr.s??1,tr.s?.[2]??tr.s??1);
      _dummy.updateMatrix(); m.setMatrixAt(i,_dummy.matrix); });
    m.instanceMatrix.needsUpdate=true; m.castShadow=shadow; m.receiveShadow=true;
    grp.add(m); return m;
  }
  function tree(x,z,s=1){
    const t=new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s);
    t.add(mesh(CYL(8), M(0x7a5230,{roughness:.85}), 0,1.1,0, 0,0,0, .28,.28,2.2));
    const leafM=M(0x46c46a,{roughness:.8});
    t.add(mesh(SPH(), leafM, 0,2.8,0, 0,0,0, 1.3,1.1,1.3));
    t.add(mesh(SPH(), M(0x62db7e,{roughness:.8}), .7,2.3,.4, 0,0,0, .85,.75,.85));
    t.add(mesh(SPH(), M(0x62db7e,{roughness:.8}), -.7,2.4,-.3, 0,0,0, .8,.7,.8));
    t.add(mesh(SPH(8,6), M(0xff5fa2), .5,2.5,.9, 0,0,0, .14,.14,.14));
    t.add(mesh(SPH(8,6), M(0xffd43b), -.4,2.9,.7, 0,0,0, .12,.12,.12));
    fx.swayers.push({o:t, ph:Math.random()*9, amt:.02});
    grp.add(t); return t;
  }
  function palm(x,z,s=1){
    const t=new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s);
    t.add(mesh(CYL(8), M(0x8a6238,{roughness:.85}), 0,1.5,0, 0,0,.08, .24,.24,3));
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3;
      t.add(mesh(CONE(6), M(0x55cf74,{roughness:.8}), Math.cos(a)*1.1,3.1,Math.sin(a)*1.1, Math.PI/2.6*Math.cos(a),0,Math.PI/2.6*Math.sin(a)+1.2, .4,1.9,.12));
    }
    t.add(mesh(SPH(8,6), M(0x6b4a2a), 0,2.9,0, 0,0,0, .3,.25,.3)); // cocos
    t.add(mesh(SPH(8,6), M(0x6b4a2a), .25,2.8,.1, 0,0,0, .22,.2,.22));
    fx.swayers.push({o:t, ph:Math.random()*9, amt:.03});
    grp.add(t);
  }
  function pine(x,z,s=1,snow=false){
    const t=new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s);
    t.add(mesh(CYL(8), M(0x6b4a2a), 0,.5,0, 0,0,0, .22,.22,1));
    const g1=M(snow?0x3f8f5f:0x4cae6b,{roughness:.85});
    t.add(mesh(CONE(10), g1, 0,1.6,0, 0,0,0, 1.1,1.6,1.1));
    t.add(mesh(CONE(10), g1, 0,2.6,0, 0,0,0, .8,1.3,.8));
    if(snow) t.add(mesh(CONE(10), M(0xffffff,{roughness:.9}), 0,3.15,0, 0,0,0, .5,.7,.5)); // gorro de nieve
    grp.add(t);
  }
  function cactus(x,z,s=1){
    const t=new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s);
    const cm=M(0x4fc878);
    t.add(mesh(CYL(10), cm, 0,.9,0, 0,0,0, .3,.3,1.8));
    t.add(mesh(SPH(10,8), cm, 0,1.85,0, 0,0,0, .3,.3,.3));
    t.add(mesh(CYL(8), cm, -.45,.9,0, 0,0,.5, .18,.18,.8));
    t.add(mesh(CYL(8), cm, .45,1.1,0, 0,0,-.5, .18,.18,.8));
    grp.add(t);
  }
  function flower(x,z){
    const f=new THREE.Group(); f.position.set(x,0,z);
    f.add(mesh(CYL(6), M(0x46c46a), 0,.25,0, 0,0,0, .05,.05,.5));
    const cols=[0xff5fa2,0xffd43b,0xff6b6b,0xc084fc,0xffffff];
    f.add(mesh(SPH(8,6), M(cols[(Math.random()*cols.length)|0]), 0,.55,0, 0,0,0, .16,.16,.16));
    grp.add(f);
  }
  function rock(x,z,s=1,c=0x8a8a96){
    const r=mesh(new THREE.DodecahedronGeometry(1,0), M(c,{flatShading:true, roughness:.9}), x,.4*s,z, Math.random(),Math.random(),0, s,s*.8,s);
    grp.add(r);
    if(Math.random()<.5) grp.add(mesh(SPH(8,6), M(0x5da33f,{roughness:.9}), x+s*.4,.15,z+s*.3, 0,0,0, s*.4,s*.25,s*.4)); // musgo
  }
  function lava(x,z,s=1){
    const lm=M(0xff5a00,{emissive:0xff4400,emissiveIntensity:1});
    const l=mesh(CYL(18), lm, x,.06,z, 0,0,0, s,s*.1,s);
    grp.add(l); fx.lavaMats.push(lm);
    grp.add(mesh(new THREE.TorusGeometry(s,.22,8,20), M(0x3a2a33,{roughness:.95}), x,.1,z, Math.PI/2,0,0, 1,1,1)); // borde rocoso
  }
  function tuft(x,z,c=0x55c96e){
    const f=new THREE.Group(); f.position.set(x,0,z); f.rotation.y=Math.random()*6;
    for(let k=-1;k<=1;k++) f.add(mesh(CONE(5), M(c,{roughness:.9}), k*.12,.3,0, 0,0,k*.18, .09,.6,.09));
    fx.swayers.push({o:f, ph:Math.random()*9, amt:.06});
    grp.add(f);
  }
  const n = Math.floor(LEN/28);
  for(let i=0;i<n;i++){
    const z=-i*28-rand(4,20), side=i%2?1:-1;
    const xOut=rand(9,26)*side, xOut2=rand(9,26)*-side;
    if(track.id==='jungla'){ (i%3===0?palm:tree)(xOut,z,rand(.8,1.5)); if(i%2===0)tree(xOut2,z-8,rand(.7,1.2)); if(i%3===0)flower(rand(-7,7),z); tuft(rand(-24,-8),z); tuft(rand(8,24),z-10); }
    else if(track.id==='desierto'){ pine(xOut,z,rand(.9,1.5),true); biome.snowpine++; rock(xOut2,z,rand(.5,1.2),0x9aa5b1); if(i%4===0)rock(rand(-7,7),z+40,rand(.3,.5),0xdde6ec); tuft(rand(-20,20),z,0xe6eef3); }
    else if(track.id==='valle'){ (i%2?pine:tree)(xOut,z,rand(.7,1.1)); flower(xOut2,z); flower(rand(-8,8),z-6); tuft(rand(-22,22),z-4); if(i%5===0)rock(rand(-20,20),z,rand(.4,.8)); }
    else { rock(xOut,z,rand(.8,1.8),0x4a3a52); lava(xOut2,z,rand(1,2.4)); if(i%3===0)lava(rand(-14,-8),z,rand(.8,1.6)); if(i%3===1)lava(rand(8,14),z,rand(.8,1.6)); }
  }
  // arcoíris en valle, sol en desierto, volcán al fondo
  if(track.id==='valle'){
    const rb=new THREE.Group(); rb.position.set(0,26,-LEN-60);
    [0xff0000,0xff9900,0xffff00,0x33cc66,0x3399ff].forEach((c,i)=>{
      const t=mesh(new THREE.TorusGeometry(30-i*2.2,1.6,8,40,Math.PI), M(c,{emissive:c,emissiveIntensity:.25}), 0,0,i*0.5, 0,0,0, 1,1,1);
      rb.add(t);
    });
    scene.add(rb);
  }
  if(track.id==='volcan'){
    const v=new THREE.Group(); v.position.set(28,0,-LEN-80);
    v.add(mesh(CONE(24), M(0x5a465a,{roughness:.9}), 0,18,0, 0,0,0, 26,36,26));
    const craterM=M(0xff5a00,{emissive:0xff3300,emissiveIntensity:1.2});
    v.add(mesh(CONE(24), craterM, 0,34,0, 0,0,0, 9,8,9));
    fx.lavaMats.push(craterM);
    scene.add(v);
    // chispas del volcán (partículas ascendentes)
    fx.sparks = makeSparks(scene, 26, 40, -LEN-80, 0xff7733, 90, 14);
  }
  if(track.id==='valle'){
    // río animado junto a la pista
    const rm = new THREE.MeshStandardMaterial({color:0x3fb6f2, roughness:.15, metalness:.35, transparent:true, opacity:.85});
    const river = new THREE.Mesh(new THREE.PlaneGeometry(5,LEN+120), rm);
    river.rotation.x=-Math.PI/2; river.position.set(-13,.05,10-LEN/2); river.receiveShadow=true;
    scene.add(river); fx.river=rm;
    for(let i=0;i<6;i++) scene.add(mesh(SPH(8,6), M(0xffffff,{roughness:.6}), -13+rand(-1.5,1.5),.15,-i*(LEN/6)-10, 0,0,0, rand(.3,.6),.2,rand(.3,.6)));
  }
  if(track.id==='jungla'){
    // luciérnagas / polen flotante
    fx.sparks = makeSparks(scene, 0, 4, -LEN/2, 0xfff59b, 70, 26);
    // LIANAS colgantes (instanciadas) + HELECHOS gigantes (instanciados)
    const vines=[], ferns=[];
    for(let i=0;i<34;i++){ const vx=rand(10,26)*(i%2?1:-1), vz=-rand(60,LEN-60);
      vines.push({p:[vx,3.4,vz],s:[rand(.8,1.3),rand(.9,1.4),rand(.8,1.3)],r:[0,rand(0,6),0]}); }
    for(let i=0;i<44;i++){ const fx0=rand(9,24)*(i%2?1:-1), fz=-rand(60,LEN-60);
      ferns.push({p:[fx0,0,fz],s:[rand(1,2.2),rand(.8,1.4),rand(1,2.2)],r:[0,rand(0,6),0]}); }
    inst(new THREE.CylinderGeometry(.13,.09,5,7), M(0x2f7d3e,{roughness:.9}), vines);
    inst(new THREE.ConeGeometry(1,1,7), M(0x55cf74,{roughness:.85}), ferns);
    biome.liana=vines.length; biome.fern=ferns.length;
    // CASCADA: acantilado + lámina de agua animada + espuma
    const fz=-LEN*0.5, fall=new THREE.Group(); fall.position.set(-19,0,fz); scene.add(fall);
    fall.add(mesh(BOX(), M(0x8a8f9e,{roughness:.95}), 0,4,0, 0,0,0, 6,8,3));
    const wm=new THREE.MeshStandardMaterial({color:0x7fd4ff,roughness:.1,metalness:.3,transparent:true,opacity:.8});
    const sheet=new THREE.Mesh(new THREE.PlaneGeometry(3.6,7.4),wm);
    sheet.position.set(0,3.4,1.6); fall.add(sheet); fx.falls=wm;
    fall.add(mesh(SPH(10,8), M(0xffffff,{roughness:.6}), 0,.3,2.2, 0,0,0, 2.2,.5,1.2)); // espuma
    biome.falls=1;
  }
  if(track.id==='volcan'){
    // RÍOS DE LAVA con brillo a ambos lados (pulsan con lavaMats)
    for(const s of [-1,1]){
      const lm=M(0xff5a00,{emissive:0xff4400,emissiveIntensity:1.1});
      const r=mesh(new THREE.PlaneGeometry(2.2,LEN*.7), lm, s*11.5,.07,-LEN*.45, -Math.PI/2,0,0, 1,1,1);
      scene.add(r); fx.lavaMats.push(lm); biome.lavaRiver++;
    }
    // HUMO del cráter: 8 motas grises ascendentes en bucle
    _dotTex=_dotTex||dotTexture();
    for(let i=0;i<8;i++){
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:_dotTex,color:0x9a8a96,transparent:true,opacity:.5,depthWrite:false}));
      sp.position.set(26+rand(-3,3),38,-LEN-80+rand(-4,4)); sp.scale.set(4,4,1);
      scene.add(sp); fx.smoke.push({sp,t:Math.random()}); biome.smoke++;
    }
    // CENIZA cayendo en toda la pista
    fx.ash=makeSparks(scene, 0, 14, -LEN/2, 0xcfc4bb, 110, 30);
  }
  if(track.id==='desierto'){
    // NIEVE cayendo suave + GÉISERES (cono + surtidor translúcido pulsante)
    fx.sparks = makeSparks(scene, 0, 12, -LEN/2, 0xffffff, 130, 30);
    for(let i=0;i<3;i++){
      const gz=-300-i*550, gx=(i%2?13:-13);
      const gy=new THREE.Group(); gy.position.set(gx,0,gz); scene.add(gy);
      gy.add(mesh(CONE(10), M(0x8a8f9e,{roughness:.9}), 0,.5,0, 0,0,0, 1.4,1,1.4));
      const jetM=new THREE.MeshStandardMaterial({color:0xbfe9ff,roughness:.2,transparent:true,opacity:.75});
      const jet=new THREE.Mesh(new THREE.CylinderGeometry(.5,.9,5,10),jetM);
      jet.position.y=3; gy.add(jet);
      fx.geysers.push({jet,t:Math.random()*9}); biome.geyser++;
    }
  }
  if(track.id==='valle'){
    // LAGO con nenúfares, PECES que saltan y PATOS
    const lakeM=new THREE.MeshStandardMaterial({color:0x3fb6f2,roughness:.12,metalness:.4,transparent:true,opacity:.88});
    const lake=new THREE.Mesh(new THREE.CircleGeometry(16,28),lakeM);
    lake.rotation.x=-Math.PI/2; lake.position.set(-24,.06,-LEN*.55); lake.receiveShadow=true;
    scene.add(lake); fx.lake=lakeM; biome.lake=1;
    const lilies=[];
    for(let i=0;i<22;i++){ const a=rand(0,6.28), rr=rand(3,13);
      lilies.push({p:[-24+Math.cos(a)*rr,.12,-LEN*.55+Math.sin(a)*rr],s:[rand(.5,1)],r:[-Math.PI/2,0,rand(0,6)]}); }
    inst(new THREE.CircleGeometry(.9,12), M(0x3fa34d,{roughness:.8,side:THREE.DoubleSide}), lilies,false);
    biome.lily=lilies.length;
    for(let i=0;i<4;i++){ // peces naranjas que saltan en arco
      const f=new THREE.Group(); f.position.set(-24+rand(-8,8),.3,-LEN*.55+rand(-9,9)); scene.add(f);
      f.add(mesh(SPH(8,6), M(0xff9a3d,{roughness:.6}), 0,0,0, 0,0,0, .35,.25,.6));
      f.add(mesh(CONE(6), M(0xff7b2e,{roughness:.6}), 0,.1,.6, Math.PI/2.4,0,0, .2,.4,.08));
      fx.fish.push({g:f,t:rand(0,9)}); biome.fish++;
    }
    for(let i=0;i<3;i++){ // patitos amarillos en círculo
      const dk=new THREE.Group(); scene.add(dk);
      dk.add(mesh(SPH(10,8), M(0xffd93b,{roughness:.6}), 0,.25,0, 0,0,0, .4,.32,.5));
      dk.add(mesh(SPH(10,8), M(0xffd93b,{roughness:.6}), 0,.55,-.35, 0,0,0, .22,.22,.24));
      dk.add(mesh(CONE(8), M(0xff9a3d,{roughness:.6}), 0,.52,-.58, -Math.PI/2,0,0, .08,.18,.08));
      fx.ducks.push({g:dk,t:rand(0,9),cz:-LEN*.55}); biome.duck++;
    }
  }
  // PÚBLICO ANIMANDO: bebés dino a los lados, SIEMPRE fuera del asfalto
  // (|x|>=9.5, detrás de los pianos) y SIN colisión (nunca entran en obstacles).
  // 3-6 por grupo, densos en salida, meta y rectas. Todo instanciado.
  const crowd=[];
  const addGroup=(z,s)=>{
    const n=3+((Math.random()*4)|0), gx=s*rand(10.5,14);
    for(let k=0;k<n;k++) crowd.push({x:gx+rand(-1,1), z:z-rand(0,7), ph:rand(0,9), sp:(Math.random()*DINOS.length)|0});
  };
  for(let z=-15;z>-95;z-=rand(18,28)) for(const s of [-1,1]) addGroup(z,s); // salida
  for(let z=-LEN+95;z>-LEN+15;z-=rand(18,28)) for(const s of [-1,1]){ if(Math.random()<.3) continue; addGroup(z,s); } // meta
  let flip=1;
  for(let z=-260;z>-LEN+140;z-=rand(220,300)){ addGroup(z,flip); flip*=-1; } // rectas
  {
    const NB=crowd.length, white=M(0xffffff,{roughness:.5}), dark=M(0x2b2b3a,{roughness:.4});
    const bodyIM=new THREE.InstancedMesh(new THREE.SphereGeometry(.45,12,10), M(0xffffff,{roughness:.7}), NB);
    const headIM=new THREE.InstancedMesh(new THREE.SphereGeometry(.3,12,10), M(0xffffff,{roughness:.7}), NB);
    const eyeIM=new THREE.InstancedMesh(new THREE.SphereGeometry(.09,8,6), white, NB*2);
    const pupIM=new THREE.InstancedMesh(new THREE.SphereGeometry(.045,8,6), dark, NB*2);
    const C=new THREE.Color();
    crowd.forEach((c,i)=>{
      C.set(DINOS[c.sp%DINOS.length].color).lerp(new THREE.Color(0xffffff),.15);
      bodyIM.setColorAt(i,C); headIM.setColorAt(i,C);
      setCrowdPose(c, 0, 0, 0, bodyIM, headIM, eyeIM, pupIM, i);
    });
    for(const m of [bodyIM,headIM,eyeIM,pupIM]){ m.instanceMatrix.needsUpdate=true; if(m.instanceColor) m.instanceColor.needsUpdate=true; m.castShadow=false; grp.add(m); }
    fx.crowd={list:crowd,bodyIM,headIM,eyeIM,pupIM,cd:0};
    biome.crowd=NB;
  }
  return {grp, fx, biome};
}
/* coloca un bebé (cuerpo+cabeza+ojos) mirando a la pista, con saltito y guiño */
const _cd=new THREE.Object3D();
function setCrowdPose(c, jump, yaw, t, bodyIM, headIM, eyeIM, pupIM, i){
  _cd.position.set(c.x,.45+jump,c.z); _cd.rotation.set(0,0,0);
  _cd.scale.set(1,1+Math.sin(t*6+c.ph)*.06,1); _cd.updateMatrix();
  bodyIM.setMatrixAt(i,_cd.matrix);
  const side=c.x>0?1:-1;
  const fx0=-side*Math.cos(yaw), fz=side*Math.sin(yaw); // mirada (base: hacia la pista)
  const hx=c.x+fx0*.38, hy=.95+jump*1.2, hz=c.z+fz*.38;
  _cd.position.set(hx,hy,hz); _cd.rotation.set(0,Math.atan2(fx0,fz),0);
  _cd.scale.set(1,1,1); _cd.updateMatrix();
  headIM.setMatrixAt(i,_cd.matrix);
  for(let e=0;e<2;e++){
    const s=e?1:-1, px=-fz*s*.13, pz=fx0*s*.13; // perpendicular
    _cd.position.set(hx+fx0*.24+px,hy+.04,hz+fz*.24+pz);
    _cd.rotation.set(0,0,0); _cd.scale.set(1,1,1); _cd.updateMatrix();
    eyeIM.setMatrixAt(i*2+e,_cd.matrix);
    _cd.position.set(hx+fx0*.3+px,hy+.05,hz+fz*.3+pz); _cd.updateMatrix();
    pupIM.setMatrixAt(i*2+e,_cd.matrix);
  }
}

/* chispas / motas flotantes (Points reciclados, baratos) */
function dotTexture(){
  const c=document.createElement('canvas'); c.width=c.height=64;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,2,32,32,30);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.5,'rgba(255,255,255,.6)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}
let _dotTex=null;
function makeSparks(scene, cx, cy, cz, color, count, spread){
  _dotTex=_dotTex||dotTexture();
  const pos=new Float32Array(count*3), seed=new Float32Array(count);
  for(let i=0;i<count;i++){ pos[i*3]=cx+rand(-spread,spread); pos[i*3+1]=rand(0,cy); pos[i*3+2]=cz+rand(-spread*4,spread*4); seed[i]=Math.random()*9; }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({color, size:1.1, map:_dotTex, transparent:true, opacity:.9, depthWrite:false, blending:THREE.AdditiveBlending});
  const pts=new THREE.Points(geo,mat); scene.add(pts);
  return {pts, seed, count, cy};
}
/* polvo trasero del kart (se crea en startRace, se actualiza en carrera) */
let dust=null;
function makeDust(scene){
  _dotTex=_dotTex||dotTexture();
  const count=60, pos=new Float32Array(count*3), life=new Float32Array(count);
  for(let i=0;i<count;i++){ pos[i*3+1]=-50; life[i]=0; }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({color:0xfff2d8, size:.9, map:_dotTex, transparent:true, opacity:.55, depthWrite:false});
  const pts=new THREE.Points(geo,mat); pts.frustumCulled=false; scene.add(pts);
  return {pts, life, count, head:0};
}
function updateDust(dt){
  if(!dust||!player||state.mode!=='racing') return;
  const pos=dust.pts.geometry.attributes.position;
  if(state.y<0.05&&state.speed>8){
    for(let k=0;k<2;k++){
      const i=dust.head=(dust.head+1)%dust.count;
      pos.setXYZ(i, state.x+rand(-.5,.5), .25, state.z+1.2+rand(0,.4));
      dust.life[i]=1;
    }
  }
  for(let i=0;i<dust.count;i++){
    if(dust.life[i]>0){
      dust.life[i]-=dt*1.6;
      pos.setY(i, pos.getY(i)+dt*1.4);
      if(dust.life[i]<=0) pos.setY(i,-50);
    }
  }
  pos.needsUpdate=true;
}
/* anima vegetación (brisa), lava, río y chispas */
function updateFx(fx, dt, t, px=0, pz=0, cheerOK=false){
  if(!fx) return;
  for(const s of fx.swayers) s.o.rotation.z = Math.sin(t*1.4+s.ph)*s.amt;
  fx.lavaMats?.forEach((m,i)=>{ m.emissiveIntensity = .9+Math.sin(t*3+i*1.3)*.35; });
  if(fx.river){ fx.river.opacity = .75+Math.sin(t*2)*.1; }
  if(fx.sparks){
    const pos=fx.sparks.pts.geometry.attributes.position;
    for(let i=0;i<fx.sparks.count;i++){
      let y=pos.getY(i)+dt*(2+ (i%3));
      if(y>fx.sparks.cy) y=0;
      pos.setY(i,y);
      pos.setX(i, pos.getX(i)+Math.sin(t+i)*dt*.5);
    }
    pos.needsUpdate=true;
  }
  if(fx.ash){ // ceniza que CAE despacio
    const pos=fx.ash.pts.geometry.attributes.position;
    for(let i=0;i<fx.ash.count;i++){
      let y=pos.getY(i)-dt*(1+(i%3)*.5);
      if(y<0) y=fx.ash.cy;
      pos.setY(i,y);
      pos.setX(i, pos.getX(i)+Math.sin(t*.7+i)*dt*.4);
    }
    pos.needsUpdate=true;
  }
  for(const s of fx.smoke||[]){ // humo del cráter en bucle
    s.t+=dt*.25; if(s.t>1) s.t=0;
    s.sp.position.y=38+s.t*14; s.sp.position.x+=Math.sin(t+s.t*9)*dt*.6;
    const sc=4+s.t*5; s.sp.scale.set(sc,sc,1); s.sp.material.opacity=.5*(1-s.t);
  }
  if(fx.falls) fx.falls.opacity=.7+Math.sin(t*4)*.12; // cascada
  if(fx.lake) fx.lake.opacity=.82+Math.sin(t*2)*.06;
  for(const f of fx.fish||[]){ // peces que saltan en arco
    f.t+=dt; const ph=(f.t%3)/3, y=Math.sin(ph*Math.PI)*2.2+.2;
    f.g.position.y=y; f.g.rotation.x=ph<.5?-.6:.6; f.g.rotation.y+=dt*.5;
  }
  for(const d of fx.ducks||[]){ // patos en círculo con balanceo
    d.t+=dt*.35;
    d.g.position.set(-24+Math.cos(d.t)*7,.15+Math.sin(t*2+d.t)*.08,d.cz+Math.sin(d.t)*6);
    d.g.rotation.y=-d.t;
  }
  for(const gy of fx.geysers||[]){ // géiseres periódicos
    gy.t+=dt; const c=(gy.t%6)/6, jet=gy.jet;
    const h=c<.25?Math.sin(c/ .25*Math.PI):0;
    jet.scale.set(1,.15+h,1); jet.position.y=.5+2.5*(.15+h);
  }
  const cr=fx.crowd;
  if(cr){ // público: solo los cercanos saltan y miran al kart (barato)
    cr.cd=Math.max(0,cr.cd-dt);
    let dirty=false, nearCheer=false;
    for(let i=0;i<cr.list.length;i++){
      const c=cr.list[i], dz=c.z-pz;
      if(Math.abs(dz)>60||Math.abs(c.x-px)>30) continue;
      const jump=Math.abs(Math.sin(t*3+c.ph))*.22;
      const want=Math.max(-.6,Math.min(.6,(pz-c.z)*.04)); // cabeza sigue al kart
      c.yaw=((c.yaw||0)+ (want-(c.yaw||0))*Math.min(1,dt*4));
      setCrowdPose(c,jump,c.yaw,t,cr.bodyIM,cr.headIM,cr.eyeIM,cr.pupIM,i);
      dirty=true;
      if(cheerOK&&Math.abs(dz)<18) nearCheer=true;
    }
    if(dirty){ cr.bodyIM.instanceMatrix.needsUpdate=true; cr.headIM.instanceMatrix.needsUpdate=true;
      cr.eyeIM.instanceMatrix.needsUpdate=true; cr.pupIM.instanceMatrix.needsUpdate=true; }
    if(nearCheer&&cheerOK&&cr.cd<=0){ cr.cd=8; try{music.cheer();}catch{} }
  }
}

export function buildWorld(scene, track){
  const LEN = track.len;
  const topSky = track.id==='volcan'?0x2c1e44 : track.id==='desierto'?0x6fb7ee : 0x4fa8e8;
  scene.background = new THREE.Color(track.sky);
  const sky = makeSky(topSky, track.sky); sky.position.set(0,0,-LEN/2); scene.add(sky);
  scene.fog = new THREE.Fog(track.fog, 45, 170);
  // iluminación premium: clave con sombras suaves + relleno frío + contraluz cálida
  scene.add(new THREE.HemisphereLight(0xffffff, track.ground, .85));
  const sunTint = {jungla:0xfff3d0, desierto:0xf4f8ff, valle:0xfff6e0, volcan:0xffd9c0};
  const sun = new THREE.DirectionalLight(sunTint[track.id]||0xffffff, 1.7);
  sun.position.set(18,32,12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-30; sun.shadow.camera.right=30; sun.shadow.camera.top=30; sun.shadow.camera.bottom=-60;
  sun.shadow.camera.far=140; sun.shadow.bias=-0.0004; sun.shadow.normalBias=.03;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0xbfe9ff, .5); fill.position.set(-14,10,20); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe0b3, .55); rim.position.set(-8,14,-30); scene.add(rim);
  if(track.id==='volcan'){ const glow=new THREE.PointLight(0xff5522, 60, 90); glow.position.set(26,30,-LEN-60); scene.add(glow); }
  // suelo + carretera de circuito terminada
  const ground = mesh(new THREE.PlaneGeometry(220,LEN+400), M(track.ground,{roughness:.95}), 0,0,-LEN/2+60, -Math.PI/2,0,0, 1,1,1);
  ground.receiveShadow=true; scene.add(ground);
  const road = mesh(new THREE.PlaneGeometry(14,LEN+120), M(track.road,{roughness:.8}), 0,.02,10-LEN/2, -Math.PI/2,0,0, 1,1,1);
  road.receiveShadow=true; scene.add(road);
  // pianos rojo/blanco de circuito + bordes
  const curbR=M(0xe63946,{roughness:.6}), curbW=M(0xf8f9fa,{roughness:.6});
  for(let z=12; z>-LEN-8; z-=4){
    const k=((z/4)|0)%2===0;
    for(const s of [-1,1]) scene.add(mesh(new THREE.BoxGeometry(1,.22,4), k?curbR:curbW, s*7.4,.11,z, 0,0,0, 1,1,1));
  }
  for(const s of [-1,1]) scene.add(mesh(new THREE.BoxGeometry(.5,.3,LEN+120), M(track.edge,{roughness:.7}), s*8.1,.14,10-LEN/2, 0,0,0, 1,1,1));
  for(let z=10; z>-LEN; z-=8) scene.add(mesh(new THREE.PlaneGeometry(.5,3), M(0xffffff,{roughness:.6}), 0,.035,z, -Math.PI/2,0,0, 1,1,1));
  // línea de salida a cuadros
  for(let i=0;i<7;i++) for(let j=0;j<2;j++)
    scene.add(mesh(new THREE.PlaneGeometry(1,1), M((i+j)%2?0x222222:0xffffff,{roughness:.6}), -3+i,.04,8-j, -Math.PI/2,0,0, 1,1,1));
  // nubes cartoon con volumen (base sombreada)
  const clouds=[];
  for(let i=0;i<10;i++){
    const c=new THREE.Group(); c.position.set(rand(-40,40),rand(16,30),rand(-LEN,20));
    const cm=M(0xffffff,{roughness:1});
    c.add(mesh(SPH(10,8),cm,0,0,0,0,0,0,2.2,1.4,1.6)); c.add(mesh(SPH(10,8),cm,1.8,.2,0,0,0,0,1.5,1,1.2)); c.add(mesh(SPH(10,8),cm,-1.8,.1,0,0,0,0,1.4,1,1.1));
    c.add(mesh(SPH(10,8),M(0xd8ecf7,{roughness:1}),0,-.5,0,0,0,0,2.0,1.0,1.4));
    scene.add(c); clouds.push(c);
  }
  const {fx, biome, grp:decoGrp} = themeProps(scene, track, LEN);
  // meta: arco con banderas ondeantes + focos
  const meta=new THREE.Group(); meta.position.set(0,0,-LEN); scene.add(meta);
  meta.userData.flags=[];
  for(const s of [-1,1]){
    meta.add(mesh(CYL(10), M(0xff4757,{roughness:.5}), s*7,3,0, 0,0,0, .5,.5,6));
    meta.add(mesh(SPH(10,8), M(0xffd43b,{emissive:0xffaa00,emissiveIntensity:.3}), s*7,6.4,0, 0,0,0, .7,.7,.7));
    const flagPole = mesh(CYL(6), M(0xeeeeee), s*7,7.6,0, 0,0,0, .06,.06,2.2); meta.add(flagPole);
    const flag = mesh(new THREE.PlaneGeometry(1.6,1), M(s<0?0x58cc02:0x1cb0f6,{side:THREE.DoubleSide}), s*7+(s<0?-.85:.85),8.2,0, 0,0,0, 1,1,1);
    meta.add(flag); meta.userData.flags.push(flag);
  }
  const banner = mesh(BOX(), M(0xffffff), 0,6,0, 0,0,0, 15,1.6,.4); meta.add(banner);
  for(let i=0;i<10;i++) for(let j=0;j<1;j++){
    const sq = mesh(BOX(), M((i%2===0)?0x222222:0xffffff), -6.5+i*1.4,6,0, 0,0,0, 1.3,1.4,.1);
    meta.add(sq);
  }
  const txt = document.createElement('canvas'); txt.width=512; txt.height=96;
  const cx=txt.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,512,96);
  cx.font='900 56px sans-serif'; cx.textAlign='center'; cx.fillStyle='#e63946'; cx.fillText('🏁 ¡META! 🏁',256,66);
  const tex=new THREE.CanvasTexture(txt);
  meta.add(mesh(new THREE.PlaneGeometry(10,1.6), new THREE.MeshBasicMaterial({map:tex}), 0,4.6,0, 0,0,0, 1,1,1));
  dust = makeDust(scene);
  starBursts = makeBursts(scene);
  // RAYOS DE SOL: 2 planos aditivos finos que siguen al jugador (baratos, sin postproceso)
  _dotTex=_dotTex||dotTexture();
  const rays=[];
  for(let i=0;i<2;i++){
    const rm=new THREE.Mesh(new THREE.PlaneGeometry(5,22),
      new THREE.MeshBasicMaterial({map:_dotTex,color:0xfff3c4,transparent:true,opacity:.08,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false}));
    rm.rotation.set(.3,0,.35+i*.3); rm.renderOrder=5;
    scene.add(rm); rays.push(rm);
  }
  return { LEN, clouds, meta, fx, sky, biome, rays, deco:decoGrp };
}

export function spawnEntities(scene, LEN){
  const obstacles=[], eggs=[], stars=[];
  const rockM=[0x777788,0x8a8a96,0x6b5b4b], logM=M(0x7a5230), mudM=M(0x8b5a2b);
  for(let z=-60; z>-LEN+40; z-=rand(22,34)){
    if(Math.random()<0.72){
      const x=rand(-5,5), kind=Math.random();
      let o;
      if(kind<0.4){ o=mesh(new THREE.DodecahedronGeometry(rand(.7,1),0), M(rockM[(Math.random()*3)|0]), x,.6,z); o.userData={type:'rock',r:1.1}; }
      else if(kind<0.75){ o=new THREE.Group(); o.position.set(x,0,z);
        o.add(mesh(CYL(10), logM, 0,.5,0, Math.PI/2,0,Math.PI/2, .5,.5,2.4));
        o.add(mesh(CYL(10), M(0x5da33f), 0,.5,-1.1, 0,0,0, .55,.55,.2));
        o.userData={type:'log',r:1.2};
      }
      else { o=mesh(CYL(14), M(0x9c6b3c), x,.04,z, 0,0,0, 1.4,1,.3, 1.6,1,1.6); o.userData={type:'mud',r:1.2,flat:true}; }
      scene.add(o.group||o); obstacles.push(o.group||o);
    }
    if(Math.random()<0.85){
      const e=new THREE.Group(); e.position.set(rand(-5,5),1.0,z-rand(6,12));
      const shell=mesh(SPH(12,10), M(0xfff8e7,{roughness:.35}), 0,0,0, 0,0,0, .45,.55,.45); e.add(shell);
      shell.add(mesh(SPH(8,6), M(0xffb703), .2,.1,.25, 0,0,0, .12,.12,.12));
      shell.add(mesh(SPH(8,6), M(0xff5fa2), -.18,-.05,.28, 0,0,0, .1,.1,.1));
      shell.add(mesh(SPH(8,6), M(0x8ecae6), .05,.25,-.2, 0,0,0, .1,.1,.1));
      e.userData={taken:false}; scene.add(e); eggs.push(e);
    }
  }
  // ESTRELLAS-PREMIO: 20 por circuito en HILERAS (6+6+5) + arco elevado (3),
  // siguiendo la trazada. Geometría y material COMPARTIDOS (rendimiento).
  _dotTex=_dotTex||dotTexture();
  const sg=starGeometry(), sm=starMaterial();
  const rows=[6,6,5,3];
  let idx=0;
  rows.forEach((count,ri)=>{
    const zBase = ri===0 ? -70 : ri===1 ? -LEN*0.45 : -LEN+220;
    const xBase = Math.sin(ri*2.1)*3.5;
    for(let k=0;k<count;k++,idx++){
      const s=new THREE.Group();
      let x, z, y=1.4;
      if(ri<3){ x=xBase+Math.sin(k*.6)*1.2; z=zBase-k*6; } // hilera separada 6 m
      else { x=(k-1)*2.2; z=-LEN+150; y=[1.4,2.8,1.4][k]; } // arco final elevado
      s.position.set(x,y,z);
      const star=new THREE.Mesh(sg,sm); star.castShadow=true; s.add(star);
      const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:_dotTex,color:0xffe27a,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));
      glow.scale.set(3.2,3.2,1); s.add(glow);
      s.userData={taken:false,core:star,glow,ph:idx*.7,row:ri,baseY:y}; scene.add(s); stars.push(s);
    }
  });
  return { obstacles, eggs, stars };
}
/* estrella clásica de 5 puntas (punta arriba), extruida fina con bisel */
let _starGeo=null, _starMat=null;
function starGeometry(){
  if(_starGeo) return _starGeo;
  const sh=new THREE.Shape(), R=1, r=.45;
  for(let i=0;i<10;i++){
    const a=Math.PI/2+i*Math.PI/5, rad=i%2===0?R:r;
    const px=Math.cos(a)*rad, py=Math.sin(a)*rad;
    if(i===0) sh.moveTo(px,py); else sh.lineTo(px,py);
  }
  sh.closePath();
  _starGeo=new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:2});
  _starGeo.translate(0,0,-.15);
  return _starGeo;
}
function starMaterial(){
  if(_starMat) return _starMat;
  _starMat=new THREE.MeshStandardMaterial({color:0xffd43b,emissive:0xcc7a00,emissiveIntensity:.55,roughness:.3,metalness:.35});
  return _starMat;
}
/* destellos al recoger estrellas (pool reciclado de motas doradas) */
let starBursts=null;
function makeBursts(scene){
  _dotTex=_dotTex||dotTexture();
  const count=90, pos=new Float32Array(count*3), vel=new Float32Array(count*3), life=new Float32Array(count);
  for(let i=0;i<count;i++){ pos[i*3+1]=-60; }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({color:0xffd94d,size:1.0,map:_dotTex,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending});
  const pts=new THREE.Points(geo,mat); pts.frustumCulled=false; scene.add(pts);
  return {pts,vel,life,count,head:0};
}
function burstAt(x,y,z,n=14){
  if(!starBursts) return;
  const pos=starBursts.pts.geometry.attributes.position;
  for(let k=0;k<n;k++){
    const i=starBursts.head=(starBursts.head+1)%starBursts.count;
    pos.setXYZ(i,x,y,z);
    const a=Math.random()*Math.PI*2, r=2+Math.random()*4;
    starBursts.vel[i*3]=Math.cos(a)*r; starBursts.vel[i*3+1]=2+Math.random()*4; starBursts.vel[i*3+2]=Math.sin(a)*r;
    starBursts.life[i]=1;
  }
}
function updateBursts(dt){
  if(!starBursts) return;
  const pos=starBursts.pts.geometry.attributes.position;
  for(let i=0;i<starBursts.count;i++){
    if(starBursts.life[i]>0){
      starBursts.life[i]-=dt*1.8;
      starBursts.vel[i*3+1]-=9*dt;
      pos.setXYZ(i,pos.getX(i)+starBursts.vel[i*3]*dt,pos.getY(i)+starBursts.vel[i*3+1]*dt,pos.getZ(i)+starBursts.vel[i*3+2]*dt);
      if(starBursts.life[i]<=0) pos.setY(i,-60);
    }
  }
  pos.needsUpdate=true;
}

/* LLAMITAS de dibujo animado tras las ruedas (pool reutilizable).
   Naranja/amarillo/rosa-azul, nada realista. Máx. 40 jugador / 12 rival. */
const FLAME_COLS=[new THREE.Color(0xff9a3d),new THREE.Color(0xffd93b),new THREE.Color(0xff6fa2),new THREE.Color(0x6fc4ff)];
function makeFlames(scene, max){
  _dotTex=_dotTex||dotTexture();
  const pos=new Float32Array(max*3), col=new Float32Array(max*3), life=new Float32Array(max), vel=new Float32Array(max*3);
  for(let i=0;i<max;i++) pos[i*3+1]=-60;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  const mat=new THREE.PointsMaterial({size:.8,map:_dotTex,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true});
  const pts=new THREE.Points(geo,mat); pts.frustumCulled=false; scene.add(pts);
  return {pts,life,vel,max,head:0};
}
function flameAt(pool,x,y,z,n=2,spread=1.6){
  if(!pool) return;
  const pos=pool.pts.geometry.attributes.position, col=pool.pts.geometry.attributes.color;
  for(let k=0;k<n;k++){
    const i=pool.head=(pool.head+1)%pool.max;
    pos.setXYZ(i,x+rand(-.4,.4),y+rand(0,.2),z+rand(-.2,.3));
    pool.vel[i*3]=rand(-spread,spread); pool.vel[i*3+1]=rand(1,3); pool.vel[i*3+2]=rand(1.5,4);
    const c=FLAME_COLS[(Math.random()*FLAME_COLS.length)|0];
    col.setXYZ(i,c.r,c.g,c.b);
    pool.life[i]=1;
  }
  col.needsUpdate=true;
}
function updateFlames(pool,dt){
  if(!pool) return;
  const pos=pool.pts.geometry.attributes.position;
  for(let i=0;i<pool.max;i++){
    if(pool.life[i]>0){
      pool.life[i]-=dt*3.2; // estela corta que se apaga rápido
      pos.setXYZ(i,pos.getX(i)+pool.vel[i*3]*dt,pos.getY(i)+pool.vel[i*3+1]*dt,pos.getZ(i)+pool.vel[i*3+2]*dt);
      if(pool.life[i]<=0) pos.setY(i,-60);
    }
  }
  pos.needsUpdate=true;
}

/* ============================================================
   JUEGO PRINCIPAL
   ============================================================ */
const $ = id=>document.getElementById(id);
const canvas = $('game-canvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
let pixelCap = Math.min(devicePixelRatio||1, 2);
renderer.setPixelRatio(pixelCap);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
// resolución adaptable: baja el tope si el rendimiento cae, lo sube si sobra
let perfAcc=0, perfN=0, perfT=0;
function perfGovern(dt){
  perfAcc+=dt; perfN++; perfT+=dt;
  if(perfT>2.5){
    const fps = perfN/perfAcc;
    if(fps<38 && pixelCap>1){ pixelCap=Math.max(1,pixelCap-.25); renderer.setPixelRatio(pixelCap); }
    else if(fps>55 && pixelCap<Math.min(devicePixelRatio||1,2)){ pixelCap=Math.min(Math.min(devicePixelRatio||1,2),pixelCap+.25); renderer.setPixelRatio(pixelCap); }
    perfAcc=0; perfN=0; perfT=0;
  }
}
function resize(){ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, .1, 600);
addEventListener('resize', resize);

const state = {
  mode:'menu', dinoId:'trex', trackId:'jungla', kart:'classic', help:'peque',
  speed:0, baseSpeed:17, x:0, y:0, vy:0, z:10, targetX:0,
  eggs:0, stars:0, hits:0, time:0, slowT:0, invT:0, finished:false,
};
/* almacenamiento seguro: try/catch + valores por defecto si falla localStorage */
function store(k, v){
  try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch{ return null; }
  return v;
}
/* niveles de ayuda: Peque (por defecto) / Normal / Mayor */
const HELP_LEVELS = {
  peque:  {icon:'🐣', auto:true,  assist:.85, label:'Peque'},
  normal: {icon:'🙂', auto:false, assist:.35, label:'Normal'},
  mayor:  {icon:'🦖', auto:false, assist:0,   label:'Mayor'},
};
function loadHelp(){
  const h = store('dr3d_help');
  state.help = HELP_LEVELS[h] ? h : 'peque';
}
function setHelp(h){
  if(!HELP_LEVELS[h]) h='peque';
  state.help=h; store('dr3d_help',h);
  document.querySelectorAll('#help-row .kart-btn').forEach(x=>x.classList.toggle('sel',x.dataset.help===h));
}
function assistK(){ return (HELP_LEVELS[state.help]||HELP_LEVELS.peque).assist; }
function autoThrottle(){ return (HELP_LEVELS[state.help]||HELP_LEVELS.peque).auto; }
let world=null, ents=null, player=null, rivals=[], confetti=null, clock=new THREE.Clock();

function toast(msg, ms=1600){
  const t=$('toast'); t.textContent=msg; t.classList.remove('hidden');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.add('hidden'),ms);
}
function show(id){ ['screen-menu','screen-dino','screen-track','screen-pause','screen-finish','screen-countdown'].forEach(s=>$(s).classList.add('hidden')); if(id) $(id).classList.remove('hidden'); }
function setHUD(v){ $('hud').classList.toggle('hidden',!v); }

function clearScene(){
  while(scene.children.length){ const o=scene.children.pop(); scene.remove(o); }
  player=null; rivals=[]; world=null; ents=null; confetti=null;
}

function makePlayer(dinoId, colorIdx, simple=false, variant=null){
  const kart = buildKart(colorIdx, dinoId==='tiburon', variant||state.kart);
  const {group, parts, def} = buildDinosaur(dinoId);
  mountDinoOnKart(group, kart.group, dinoId);
  kart.group.traverse(o=>{ if(o.isMesh){o.castShadow=true;} });
  if(simple) kart.group.traverse(o=>{ // rivales simplificados: sin contornos ni sombras
    if(o.isMesh){ o.castShadow=false; }
    if(o.userData&&o.userData.isOutline) o.visible=false;
  });
  return { rig:kart.group, kart, dino:group, parts, def };
}

function startRace(){
  clearScene();
  music.ensure(); music.startMusic();
  const track = TRACKS.find(t=>t.id===state.trackId);
  world = buildWorld(scene, track);
  ents = spawnEntities(scene, world.LEN);
  const di = DINOS.findIndex(d=>d.id===state.dinoId);
  player = makePlayer(state.dinoId, di, false, state.kart);
  scene.add(player.rig);
  rivals = [];
  // 3 rivales con dinos distintos (incluido el tiburón), algo más lentos que el jugador
  const pool = DINOS.filter(d=>d.id!==state.dinoId);
  const picks = [];
  const tib = pool.find(d=>d.id==='tiburon');
  if(tib) picks.push(tib);
  for(const d of pool){ if(picks.length>=3) break; if(!picks.includes(d)) picks.push(d); }
  picks.forEach((other,i)=>{
    const r = makePlayer(other.id, (di+2+i*2)%9, true);
    r.rig.position.set(-4.5+i*3, 0, 6-i*3);
    scene.add(r.rig);
    try{ r.flames=makeFlames(scene,12); }catch{} // menos partículas en rivales
    rivals.push({ ...r, z:6-i*3, x:-4.5+i*3, spd:14.2+i*0.5, wob:Math.random()*9, spinT:0, spinCd:0 });
  });
  try{ player.flames=makeFlames(scene,40); }catch{}
  Object.assign(state,{speed:0,x:0,y:0,vy:0,z:10,targetX:0,eggs:0,stars:0,points:0,rowsDone:{},ms50:false,ms90:false,hits:0,time:0,slowT:0,invT:0,spinT:0,stuckT:0,steerSm:0,finished:false});
  setHUD(true); updateHUD(track);
  // cuenta atrás 3-2-1-¡YA!
  state.mode='countdown'; show('screen-countdown');
  let n=3; $('countdown-num').textContent=n; music.count(1);
  const iv=setInterval(()=>{
    n--;
    if(n>0){ $('countdown-num').textContent=n; music.count(1); }
    else if(n===0){ $('countdown-num').textContent='¡YA! 🏁'; music.count(0); }
    else { clearInterval(iv); show(null); state.mode='racing'; clock.getDelta(); dinoRoar(player,.85); toast('¡Corre, '+player.def.name+'! 🦖💨'); }
  },800);
}

function updateHUD(track){
  const t = track||TRACKS.find(t=>t.id===state.trackId);
  $('hud-dino').textContent = player?`${player.def.emoji} ${player.def.name}`:'🦖';
  $('hud-track').textContent = `${t.emoji} ${t.name}`;
  $('hud-eggs').textContent = state.eggs;
  $('hud-stars').textContent = state.stars;
  // posición en carrera con icono grande (más z = más atrás; el jugador compite con 4 rivales)
  let rank=1;
  for(const r of rivals){ if(r.z<state.z) rank++; }
  state.rank=rank;
  const pe=$('hud-pos'); if(pe) pe.textContent=`${rank}.º`;
  const prog = Math.min(1, Math.max(0,(10-state.z)/world.LEN));
  $('progress-bar').style.width = (prog*100).toFixed(1)+'%';
  $('hud-dist').textContent = `${Math.max(0,(10-state.z)|0)} m / ${world.LEN} m · ⏱️ ${state.time.toFixed(0)}s`;
}

function celebrate(){
  // confeti de cubitos de colores
  const g=new THREE.Group(); const cols=[0xff4757,0xffd43b,0x58cc02,0x1cb0f6,0xff5fa2,0xffffff];
  const geo=new THREE.BoxGeometry(.22,.22,.05);
  confetti={group:g,parts:[]};
  for(let i=0;i<220;i++){
    const m=new THREE.Mesh(geo,M(cols[i%cols.length]));
    m.position.set(player.rig.position.x+rand(-6,6),rand(2,9),state.z+rand(-10,4));
    m.userData={vy:rand(-4,-1),vx:rand(-2,2),rz:rand(-6,6)};
    g.add(m); confetti.parts.push(m);
  }
  scene.add(g);
  dinoRoar(player,.9);
  music.fanfare(); setTimeout(()=>music.fanfare(),900);
  setTimeout(()=>{ if(state.mode==='finished') dinoRoar(player,.8); },1400);
}

function finishRace(){
  state.mode='finished'; state.finished=true;
  celebrate();
  const bonus = state.eggs + state.stars*5;
  const score = Math.max(0, 1000 - state.time*2 - state.hits*15 + bonus*10)|0;
  const nstars = state.hits===0&&state.time<90 ? 3 : state.hits<=3 ? 3 : state.hits<=6 ? 2 : 2;
  $('finish-text').textContent = `¡${player.def.name} cruzó la meta! ${player.def.emoji}🎉`;
  const rank=state.rank||1, medal=['🏆','🥈','🥉','🎖️','🎖️'][Math.min(4,rank-1)];
  $('finish-stats').innerHTML =
    `<div class="stat" style="font-size:30px">${medal} ¡${rank}.º!</div><div class="stat">⏱️ ${state.time.toFixed(1)}s</div><div class="stat">🥚 ${state.eggs}</div><div class="stat">⭐ ${state.stars}</div><div class="stat">✨ ${state.points||0} pts</div><div class="stat">🏆 ${score} pts</div>`;
  $('finish-stars').textContent = '⭐'.repeat(nstars);
  domConfetti($('screen-finish'));
  setTimeout(()=>{ show('screen-finish'); }, 1800);
  toast('🏁 ¡META! ¡Lo hiciste genial! 🎊');
}
/* lluvia de confeti DOM sobre la pantalla de victoria */
function domConfetti(screen){
  screen.querySelectorAll('.cfetti').forEach(n=>n.remove());
  const cols=['#ff4757','#ffd43b','#58cc02','#1cb0f6','#ff5fa2','#a55eea','#ff7f50'];
  for(let i=0;i<46;i++){
    const s=document.createElement('div'); s.className='cfetti';
    const sz=8+Math.random()*10;
    s.style.cssText=`position:absolute;top:-20px;left:${Math.random()*100}%;width:${sz}px;height:${sz*.6}px;`+
      `background:${cols[i%cols.length]};border-radius:3px;z-index:5;pointer-events:none;`+
      `animation:cfall ${2.2+Math.random()*2}s ${Math.random()*1.2}s ease-in forwards;transform:rotate(${Math.random()*360}deg);`;
    screen.appendChild(s);
  }
}

function pauseGame(){
  if(state.mode!=='racing') return;
  state.mode='paused'; show('screen-pause'); music.click();
}
function resumeGame(){
  if(state.mode!=='paused') return;
  show(null); state.mode='racing'; clock.getDelta(); music.click();
}

// animación del dino: respiración, parpadeo, personalidad por especie y
// reacciones a giros (inclinación), saltos (estirón) y aterrizajes (aplastado)
function animDino(p, t, dt, extra={}){
  const P=p.parts||{}, id=(p.def&&p.def.id)||'trex';
  if(P._ph===undefined){ P._ph=Math.random()*9; P._roarT=0; P._squash=0; }
  if(!P._lids){ P._lids=[]; p.dino.traverse(o=>{ if(o.userData&&o.userData.isLid) P._lids.push(o); }); }
  P._blinkT=(P._blinkT??2)-dt; P._blinkP=Math.max(0,(P._blinkP??0)-dt);
  if(P._blinkT<=0){ P._blinkP=.13; P._blinkT=2+Math.random()*3.5; }
  const lidS = P._blinkP>0 ? 3.2 : 1; // párpado cerrado = escala Y grande
  for(const l of P._lids) l.scale.y = l.userData.baseY*lidS;
  const steer=extra.steer||0, spd=extra.speed??6;
  const air = THREE.MathUtils.clamp((extra.airY||0)/2.2,0,1);
  P._squash=Math.max(0,(P._squash??0)-dt*3);
  const sq = P._squash; // 1 = aplastado al aterrizar
  // respiración visible + bote de carrera
  const breathe = Math.sin(t*2.3+P._ph)*0.5+0.5;
  p.dino.scale.setScalar(p.dino.userData.s0||(p.dino.userData.s0=p.dino.scale.x));
  const s0=p.dino.userData.s0;
  p.dino.scale.set(s0*(1+.012*breathe-sq*.06+air*.05), s0*(1+.018*breathe-sq*.1+air*.09), s0*(1+.012*breathe-sq*.06+air*.02));
  p.dino.position.y = .85 + Math.abs(Math.sin(t*9))*.05*(spd/14) + sq*-.06;
  p.dino.rotation.z = Math.sin(t*5)*.03 - steer*.14;
  p.dino.rotation.y = -steer*.3;
  p.dino.rotation.x = air*.22 - sq*.12; // morro arriba al saltar, agachado al caer
  // rugido: mandíbula abierta + cabeza alta (sincronizado con el audio)
  const roar = P._roarT>0 ? 1 : 0;
  if(P._roarT>0) P._roarT-=dt;
  const jawBase = .12+Math.max(0,Math.sin(t*3+P._ph))*.22;
  if(P.jaw) P.jaw.rotation.x = jawBase + roar*.85;
  const headUp = roar*.4;
  if(P.head&&P.head.rotation!==undefined&&id!=='ptera'){
    P.head.rotation.y = Math.sin(t*1.6+P._ph)*.2 - steer*.15;
    P.head.rotation.x = -headUp + Math.sin(t*2.1)*.05 + air*-.15;
  }
  if(P.headG){ P.headG.position.y = 2.85+Math.sin(t*2)*.06+headUp*.3; P.headG.rotation.x = -headUp*.7; }
  if(P.tail){
    P.tail.rotation.y = Math.sin(t*4+P._ph)*.3 + steer*-.25;
    P.tail.rotation.x = air*-.3 + roar*.2;
  }
  // --- personalidad por especie ---
  if(id==='trex'){ // mordisquitos + balanceo de cabezota
    if(P.jaw&&!roar) P.jaw.rotation.x = jawBase + Math.max(0,Math.sin(t*5.2))*.18;
    if(P.head) P.head.rotation.z = Math.sin(t*1.2)*.08;
  } else if(id==='braqui'){ // cuello alto por segmentos con retardo + cabeza curiosa
    if(P.neckSegs) P.neckSegs.forEach((sg,i)=>{
      sg.pivot.rotation.x = sg.base + Math.sin(t*.9-i*.35)*.035 + air*-.025;
      sg.pivot.rotation.z = Math.sin(t*.7-i*.3)*.022 + steer*-.022;
    });
    if(P.headG){ P.headG.rotation.y = Math.sin(t*.8+P._ph)*.35; P.headG.rotation.z = Math.sin(t*1.1)*.1;
      P.headG.rotation.x = (P.headG.userData.basePitch||0) - headUp*.7 + Math.sin(t*2)*.06; }
    if(P.tail) P.tail.rotation.y = Math.sin(t*2.2)*.2;
  } else if(id==='trice'){ // cabezazos juguetones de lado a lado
    if(P.head){ P.head.rotation.z = Math.sin(t*2.4)*.12; P.head.position.y = 1.25+Math.abs(Math.sin(t*3.1))*.05; }
  } else if(id==='velo'){ // cresta erizada + saltitos de emoción
    if(P.tail) P.tail.rotation.y = Math.sin(t*6)*.4;
    p.dino.position.y += Math.abs(Math.sin(t*4.4))*.03;
  } else if(id==='stego'){ // placas que respiran + cola que serpentea
    if(P.plates) P.plates.forEach((pl,i)=>{ pl.rotation.z = Math.PI/2.4+Math.sin(t*2.3+i*.7)*.08; });
    if(P.tail) P.tail.rotation.y = Math.sin(t*3)*.45;
  } else if(id==='anky'){ // balanceo de maza + cabeceo acorazado
    if(P.tail){ P.tail.rotation.y = Math.sin(t*2.2)*.5; P.tail.rotation.z = Math.sin(t*3.4)*.1; }
    if(P.head) P.head.rotation.x = Math.sin(t*1.8)*.1 - headUp;
  } else if(id==='para'){ // trompeta alta + ladeos curiosos
    if(P.crest) P.crest.rotation.x = 1.9+Math.sin(t*6)*.08+headUp*.3;
    if(P.head) P.head.rotation.z = Math.sin(t*1.5)*.14;
  } else if(id==='ptera'){ // aleteo + planeo
    if(P.wings) P.wings.forEach((w,i)=>{ w.rotation.z = (i===0?1:-1)*(.25+Math.sin(t*7+P._ph)*(.35+air*.35)); w.rotation.x = air*-.25; });
    if(P.head){ P.head.rotation.x = -headUp*.8+Math.sin(t*2.5)*.06; P.head.rotation.y = Math.sin(t*1.9)*.25; }
  } else if(id==='tiburon'){ // nado alegre: ondulación + cola + aletas
    p.dino.rotation.y += Math.sin(t*6+P._ph)*.09;
    if(P.tail){ P.tail.rotation.y = Math.sin(t*6+P._ph)*.55; P.tail.rotation.x = air*-.25+roar*.15; }
    if(P.fins) P.fins.forEach((f,i)=>{ f.rotation.x = Math.sin(t*5+i*2.1)*.4; f.rotation.z = (i===0?-1:1)*(.3+Math.sin(t*5)*.1); });
    if(P.dorsal) P.dorsal.rotation.z = Math.sin(t*6+P._ph)*.07;
    if(P.jaw&&!roar) P.jaw.rotation.x = jawBase*.7 + Math.max(0,Math.sin(t*4.2))*.15; // mordisquitos
    p.dino.position.y += Math.sin(t*3+P._ph)*.03;
  }
  if(P.legL) P.legL.rotation.x = Math.sin(t*11)*.5*(spd/16);
  if(P.legR) P.legR.rotation.x = -Math.sin(t*11)*.5*(spd/16);
  if(P.armL&&id!=='ptera') P.armL.rotation.x = .8+Math.sin(t*11)*.2;
  if(P.armR&&id!=='ptera') P.armR.rotation.x = .8-Math.sin(t*11)*.2;
  // MIRADA ATRÁS en el salto: la cabeza gira hacia la cámara (corta y graciosa).
  // Solo gira la cabeza: en el braquiosaurio el cuello no se mueve ni atraviesa el kart.
  const lb = extra.lookBack||0;
  if(lb>0){
    const hg = (P.headG&&P.headG.isGroup) ? P.headG : (P.head&&P.head.isGroup ? P.head : null);
    if(hg){ hg.rotation.y += lb*2.4; hg.rotation.z += lb*.3; hg.rotation.x += lb*-.25; }
  }
  // ruedas + suspensión del kart (sigue girando siempre)
  const spin = spd*dt*2.2;
  p.kart.wheels.forEach((w,i)=>{
    w.tire.rotation.x += spin;
    w.pivot.rotation.y = w.front ? steer*.45 : 0;
    w.pivot.position.y = w.pivot.userData.baseY + Math.sin(t*22+i*1.7)*.014*Math.min(1,spd/14);
  });
  if(p.kart.steering) p.kart.steering.rotation.z = steer*.7;
  if(p.rig&&p.rig.userData.chassis) p.rig.userData.chassis.position.y = .42 + Math.sin(t*22)*.008*Math.min(1,spd/14) - sq*.05;
}
// dispara un rugido con sincronización de mandíbula (devuelve duración real)
function dinoRoar(p, vol=.8){
  if(!p||!p.parts) return 0;
  const sp=(p.def&&p.def.id)||'trex';
  const dur = music.roar(sp, vol);
  if(dur>0) p.parts._roarT = dur;
  return dur;
}

// bucle principal
let elapsed=0;
function loop(){
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05);
  perfGovern(dt);
  Input.poll();
  if(Input.takePause()){
    if(state.mode==='racing') pauseGame();
    else if(state.mode==='paused') resumeGame();
  }
  // nubes siempre
  if(world){ world.clouds.forEach((c,i)=>{ c.position.x += dt*(.4+i*.05); if(c.position.x>45)c.position.x=-45; });
    world.meta?.userData.flags?.forEach((f,i)=>{ f.rotation.y = Math.sin(elapsed*6+i*2)*.5; }); }
  if(state.mode==='racing'&&player){
    const steerRaw = Math.max(-1,Math.min(1,(Input.right?1:0)-(Input.left?1:0) + (Math.abs(Input.axis)>0.15?Input.axis:0)));
    // giro suavizado (sin tirones) + dirección asistida hacia la trazada
    state.steerSm = (state.steerSm||0) + (steerRaw-(state.steerSm||0))*Math.min(1,dt*8);
    const steer = state.steerSm, ak = assistK();
    state.targetX = Math.max(-5.2,Math.min(5.2, state.targetX + steer*13*dt));
    if(ak>0) state.targetX += (0-state.targetX)*ak*dt*1.4; // la ayuda tira al centro
    if(Math.abs(state.x)>4) state.targetX += (0-state.targetX)*ak*dt*2; // corrección en bordes
    if(Math.abs(state.targetX)>=5.19) state.targetX *= 0.96; // bordes blandos: rebote suave
    state.x += (state.targetX-state.x)*Math.min(1,dt*7);
    // salto (con rugidito alegre ocasional en saltos grandes)
    const grounded = state.y<=0.001;
    if(Input.takeJump()&&grounded){
      state.vy=9.5; state.jumpPeak=0; music.jump();
      if(Math.random()<.5) dinoRoar(player,.6);
    }
    else Input.takeJump();
    state.vy -= 24*dt; state.y += state.vy*dt;
    state.jumpPeak=Math.max(state.jumpPeak||0,state.y);
    if(state.y<0){
      state.y=0;
      if(state.vy<-7){ player.parts._squash=1; music.beep(220,.12,'sine',.1);
        flameAt(player.flames,state.x,.4,state.z+1.2,8,2.5); } // chispazo al aterrizar
      state.vy=0;
    }
    // mirada atrás en el salto: aparece y desaparece suavemente (corta y graciosa)
    state.lookBack = state.y>0.3 ? Math.min(1,(state.lookBack||0)+dt*4) : Math.max(0,(state.lookBack||0)-dt*3);
    // velocidad: Peque = acelerador automático; Normal/Mayor = manual (RT o ↑),
    // freno opcional (LT o ↓). Sin gas se detiene suave (el rescate ayuda).
    // Sin game over: siempre se puede llegar a la meta.
    state.slowT=Math.max(0,state.slowT-dt); state.invT=Math.max(0,state.invT-dt);
    let spd;
    if(state.slowT>0) spd=9;
    else if(autoThrottle()) spd=state.baseSpeed;
    else if(Input.padBrake) spd=state.baseSpeed*.35;
    else if(Input.padGas) spd=state.baseSpeed;
    else spd=0;
    state.speed += (spd-state.speed)*Math.min(1,dt*2);
    state.z -= state.speed*dt;
    // rescate automático: parado o atascado más de 3 s -> a la trazada con nube, sin castigo
    if(state.speed<1.5) state.stuckT=(state.stuckT||0)+dt; else state.stuckT=0;
    if(state.stuckT>3){
      state.stuckT=0; state.x=0; state.targetX=0; state.speed=state.baseSpeed*.5; state.invT=2;
      burstAt(state.x,1.5,state.z,16); music.cheer(); toast('🫧 ¡Al rescate! ¡Sigue así!');
      try{ Rumble.buzz({d:.1,w:.15}); }catch{}
    }
    state.time += dt; elapsed+=dt;
    player.rig.position.set(state.x, state.y, state.z);
    player.rig.rotation.y = -steer*.18;
    player.rig.rotation.z = -steer*.08;
    if(state.spinT>0){ // giro ágil de 360°: acaba mirando al frente
      state.spinT-=dt;
      const k=1-Math.max(0,state.spinT)/.7;
      player.rig.rotation.y=(state.spinFrom||0)+k*Math.PI*2;
      if(state.spinT<=0){ state.spinT=0; player.rig.rotation.y=-steer*.18; }
      burstAt(state.x,1.8,state.z,2);
    }
    animDino(player, elapsed, dt, {speed:state.speed, steer, airY:state.y, lookBack:state.lookBack||0});
    // llamitas tras las ruedas al acelerar o derrapar (casi nada a baja velocidad)
    if(state.speed>12) flameAt(player.flames,state.x,.4,state.z+1.4,Math.abs(steer)>.6?3:1);
    updateFlames(player.flames,dt);
    // rugidos aleatorios mientras conduce (espaciados, nunca molestos)
    state.roarCd=(state.roarCd??12)-dt;
    if(state.roarCd<=0){ dinoRoar(player,.65); state.roarCd=14+Math.random()*12; }
    // rivales con IA sencilla: siguen la trazada, algo más lentos, sin bloquear.
    // También hacen su giro de choque con obstáculos y entre ellos (solo visual).
    // ayuda invisible: si el jugador va muy atrás, los rivales aflojan un poco
    let minRZ=1e9; for(const q of rivals) minRZ=Math.min(minRZ,q.z);
    const catchup=(state.z-minRZ>60)?.9:1;
    for(const r of rivals){
      r.z -= r.spd*catchup*dt; r.wob+=dt*2; r.spinCd=Math.max(0,(r.spinCd||0)-dt);
      r.x += Math.sin(r.wob)*dt*1.2; r.x=Math.max(-5,Math.min(5,r.x));
      r.rig.position.set(r.x, Math.abs(Math.sin(r.wob*2))*.1, r.z);
      if(r.spinT>0){
        r.spinT-=dt;
        r.rig.rotation.y=(r.spinFrom||0)+(1-Math.max(0,r.spinT)/.7)*Math.PI*2;
        if(r.spinT<=0){ r.spinT=0; r.rig.rotation.y=0; }
      } else {
        r.rig.rotation.y=Math.sin(r.wob)*.1;
        if(r.spinCd<=0){
          let bump=false;
          for(const o of ents.obstacles){
            if(Math.abs(o.position.z-r.z)<2&&Math.abs(o.position.x-r.x)<1.6){ bump=true; break; }
          }
          if(!bump) for(const q of rivals){ if(q!==r&&Math.abs(q.z-r.z)<2.5&&Math.abs(q.x-r.x)<1.6){ bump=true; break; } }
          if(bump){ r.spinT=.7; r.spinFrom=r.rig.rotation.y; r.spinCd=4; burstAt(r.x,1.6,r.z,8); }
        }
      }
      animDino(r, elapsed+r.wob, dt, {speed:r.spd, steer:Math.sin(r.wob)*.3});
      if(r.spd>11&&Math.random()<.3) flameAt(r.flames,r.x,.4,r.z+1.4,1);
      updateFlames(r.flames,dt);
    }
    // obstáculos: a velocidad media/alta GIRO 360° con estrellitas (máx. -15 %);
    // a velocidad baja, rebote suave. Enfriamiento 1,5 s (invT) anti-cadenas.
    for(const o of ents.obstacles){
      if(o.userData.done) continue;
      const dz=o.position.z-state.z, dx=o.position.x-state.x;
      if(Math.abs(dz)<1.6 && Math.abs(dx)<(o.userData.r||1.1)){
        const airbone = state.y>0.9;
        if(airbone){ continue; } // ¡saltado! sin choque
        if(state.invT<=0 && !state.spinT){
          state.hits++; state.invT=1.5;
          if(state.speed>=11){
            state.spinT=.7; state.spinFrom=player.rig.rotation.y;
            state.speed=Math.max(state.speed*.87, state.baseSpeed*.85); // pierde como mucho el 15 %
            music.slideWhistle(); music.bell(1568,.06);
            burstAt(state.x,1.6,state.z,20);
            toast(['¡Giro loco! 🌀','¡Pirueta! ⭐','¡Wiii! 🎉'][state.hits%3]);
          } else {
            state.speed*=.95; music.hit();
            state.vy=4; state.y=Math.max(state.y,.15);
            toast('¡Bote suave! 💪');
          }
        }
      }
      if(o.position.z>state.z+15) o.userData.done=true;
    }
    // huevos y estrellas (radio generoso para peques)
    for(const e of ents.eggs){
      if(e.userData.taken) continue;
      e.rotation.y+=dt*2;
      const dz=e.position.z-state.z, dx=e.position.x-state.x, dy=(1.0)-(state.y+1.2);
      if(Math.abs(dz)<1.9&&Math.abs(dx)<1.9&&Math.abs(dy)<2.2){ e.userData.taken=true; e.visible=false; state.eggs++; music.egg(); toast('🥚 ¡Huevo! +1'); }
    }
    for(const s of ents.stars){
      if(s.userData.taken) continue;
      // balanceo ±35° (nunca de canto) + cabeceo + flotación
      s.rotation.y=Math.sin(elapsed*2+s.userData.ph)*.6;
      s.rotation.x=Math.sin(elapsed*1.6+s.userData.ph)*.15;
      s.position.y=s.userData.baseY+Math.sin(elapsed*3+s.userData.ph)*.25;
      s.userData.glow.material.opacity=.65+Math.sin(elapsed*5+s.userData.ph)*.25;
      const dz=s.position.z-state.z, dx=s.position.x-state.x, dy=(s.position.y)-(state.y+1.2);
      // ligera atracción al kart cuando pasa cerca
      if(Math.abs(dz)<5&&Math.abs(dx)<3.5) s.position.x += (state.x-s.position.x)*Math.min(1,dt*3);
      if(Math.abs(dz)<2.8&&Math.abs(dx)<2.8&&Math.abs(dy)<3.2){
        s.userData.taken=true; s.visible=false; state.stars++; state.points=(state.points||0)+10;
        music.star(); music.bell(1568,.06); dinoRoar(player,.7);
        burstAt(s.position.x,s.position.y,s.position.z);
        toast('⭐ ¡Estrella! +10');
        // bonus de hilera completa: +20, do-re-mi-sol y destello grande
        const row=s.userData.row;
        if(row!==undefined && !state.rowsDone[row]){
          const allRow=ents.stars.filter(o=>o.userData.row===row);
          if(allRow.every(o=>o.userData.taken)){
            state.rowsDone[row]=true; state.points+=20;
            music.arpeggio(); burstAt(s.position.x,s.position.y,s.position.z,30);
            toast('✨ ¡Hilera completa! +20 🎶');
          }
        }
      }
    }
    updateHUD();
    updateDust(dt); updateBursts(dt);
    // hitos de carrera al 50 % y 90 % (proporcionales a cada circuito)
    const prog=(10-state.z)/world.LEN;
    if(prog>=.5&&!state.ms50){ state.ms50=true; toast('🎉 ¡Mitad del camino! ¡Genial!'); music.bell(1319,.05); }
    if(prog>=.9&&!state.ms90){ state.ms90=true; toast('🏁 ¡Casi en la meta! ¡Tú puedes!'); music.bell(1568,.05); }
    if(world.fx) updateFx(world.fx, dt, elapsed, state.x, state.z, true);
    if(world.sky) world.sky.position.set(state.x, 0, state.z-60);
    if(world.rays) for(let i=0;i<world.rays.length;i++){ const r=world.rays[i]; r.position.set(state.x-4+i*4, 12, state.z-22); }
    // LOD barato: oculta el decorado a más de 130 m (se reevalúa 2 veces/s)
    state.lodT=(state.lodT||0)-dt;
    if(state.lodT<=0 && world.deco){
      state.lodT=.5;
      const kids=world.deco.children;
      for(let i=0;i<kids.length;i++){ const k=kids[i]; if(k.position!==undefined) k.visible=Math.abs((k.position.z||0)-state.z)<130; }
    }
    // cámara en tercera persona: suave, con leve FOV de velocidad (sin mareos)
    const targetFov = 62 + Math.min(1,state.speed/state.baseSpeed)*6;
    if(Math.abs(camera.fov-targetFov)>.05){ camera.fov += (targetFov-camera.fov)*Math.min(1,dt*2); camera.updateProjectionMatrix(); }
    const cxp = state.x*.55, cyp = 4.7+state.y*.35, czp = state.z+9.8;
    camera.position.lerp(new THREE.Vector3(cxp,cyp,czp), Math.min(1,dt*5));
    // al braquiosaurio se le encuadra más alto para no tapar cuello ni cabeza
    const lookY = (player.def.id==='braqui'?3.0:1.5)+state.y*.3;
    camera.lookAt(state.x*.8, lookY, state.z-7);
    // sol sigue al jugador para sombras estables
    scene.children.forEach(o=>{ if(o.isDirectionalLight&&o.castShadow){ o.position.set(state.x+18,32,state.z+12); o.target.position.set(state.x,0,state.z-10); o.target.updateMatrixWorld(); }});
    // meta
    if(state.z<=-world.LEN+6 && !state.finished){ finishRace(); }
  } else if(state.mode==='finished'&&player){
    elapsed+=dt;
    animDino(player, elapsed, dt, {speed:2, steer:Math.sin(elapsed)*.2});
    player.rig.position.y = Math.abs(Math.sin(elapsed*4))*.4; // ¡saltos de alegría!
    player.rig.rotation.y += dt*1.2;
    if(confetti) for(const m of confetti.parts){
      m.position.y+=m.userData.vy*dt; m.position.x+=m.userData.vx*dt; m.rotation.z+=m.userData.rz*dt;
      if(m.position.y<0){ m.position.y=rand(5,9); }
    }
    camera.position.lerp(new THREE.Vector3(state.x+5,4,state.z+8),Math.min(1,dt*3));
    camera.lookAt(state.x,1.5,state.z);
  } else if(state.mode==='menu'||state.mode==='dino'||state.mode==='track'){
    elapsed+=dt;
    // escaparate: gira el último jugador o un trex por defecto
  }
  renderer.render(scene,camera);
}

/* ============ VISTA PREVIA GIRATORIA (selección) ============ */
let pvRenderer=null, pvScene=null, pvCam=null, pvRig=null, pvT=0, pvRAF=0;
function initPreview(){
  const c=$('preview-canvas');
  pvRenderer=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true});
  pvRenderer.setSize(420,300,false); pvRenderer.shadowMap.enabled=true;
  pvRenderer.shadowMap.type=THREE.PCFSoftShadowMap;
  pvRenderer.toneMapping=THREE.ACESFilmicToneMapping; pvRenderer.toneMappingExposure=1.15;
  pvScene=new THREE.Scene();
  pvCam=new THREE.PerspectiveCamera(45,420/300,.1,100); pvCam.position.set(3.6,2.6,5.2); pvCam.lookAt(0,1.2,0);
  // iluminación de estudio: clave + relleno + contraluz
  pvScene.add(new THREE.HemisphereLight(0xffffff,0x88aa66,.7));
  const key=new THREE.DirectionalLight(0xffffff,1.8); key.position.set(4,7,4); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024); pvScene.add(key);
  const fill=new THREE.DirectionalLight(0xbfe9ff,.6); fill.position.set(-5,3,2); pvScene.add(fill);
  const rim=new THREE.DirectionalLight(0xffe0b3,.9); rim.position.set(-2,4,-5); pvScene.add(rim);
  const spot=new THREE.SpotLight(0xfff2cc, 60, 30, .5, .5); spot.position.set(0,9,2);
  spot.target.position.set(0,1,0); pvScene.add(spot); pvScene.add(spot.target);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.8,.25,28), M(0xf4f6fb,{roughness:.5}));
  disc.receiveShadow=true; disc.position.y=-.15; pvScene.add(disc);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6,.12,10,40), M(0xffd43b,{emissive:0xffaa00,emissiveIntensity:.35}));
  ring.rotation.x=Math.PI/2; ring.position.y=0; pvScene.add(ring);
  const tick=()=>{ pvRAF=requestAnimationFrame(tick); pvT+=.016;
    if(pvRig){ pvRig.rotation.y+=.009;
      const p=pvRig.userData.anim; if(p) animDino(p,pvT,.016,{speed:5,steer:Math.sin(pvT*.7)*.15});
    }
    pvCam.position.x = 3.6+Math.sin(pvT*.25)*.5;
    pvCam.lookAt(0,1.2,0);
    pvRenderer.render(pvScene,pvCam); };
  tick();
}
function showPreview(id){
  if(pvRig){ pvScene.remove(pvRig); pvRig=null; }
  const di=DINOS.findIndex(d=>d.id===id);
  const kart=buildKart(di, id==='tiburon', state.kart); const {group,parts,def}=buildDinosaur(id);
  mountDinoOnKart(group,kart.group,id);
  pvRig=kart.group; pvRig.userData.anim={rig:kart.group,kart,dino:group,parts,def};
  pvScene.add(pvRig);
  $('preview-name').textContent=`${def.emoji} ${def.name}`;
  $('preview-desc').textContent=def.desc;
}

/* ============ UI ============ */
function buildSelectUI(){
  const grid=$('dino-grid'); grid.innerHTML='';
  DINOS.forEach(d=>{
    const el=document.createElement('div'); el.className='dino-card'+(d.id===state.dinoId?' sel':'');
    el.innerHTML=`<div class="emoji">${d.emoji}</div><div class="nm">${d.name}</div><div class="cl" style="background:${'#'+d.color.toString(16).padStart(6,'0')}">${d.id==='ptera'?'vuela 🪽':d.id==='braqui'?'cuello largo':d.id==='trice'?'3 cuernos':d.id==='stego'?'placas':d.id==='anky'?'armadura':d.id==='para'?'trompeta':d.id==='velo'?'veloz':d.id==='tiburon'?'aletas 🌊':'fuerte 💪'}</div>`;
    el.onclick=()=>{ state.dinoId=d.id; music.ensure(); music.click(); showPreview(d.id);
      grid.querySelectorAll('.dino-card').forEach(x=>x.classList.remove('sel')); el.classList.add('sel'); };
    grid.appendChild(el);
  });
  const tg=$('track-grid'); tg.innerHTML='';
  TRACKS.forEach(t=>{
    const el=document.createElement('div'); el.className='track-card'+(t.id===state.trackId?' sel':'');
    el.innerHTML=`<div class="em">${t.emoji}</div><div class="nm">${t.name}</div><div class="ds">${t.desc}</div><div class="ds">📏 ${t.len} m</div>`;
    el.onclick=()=>{ state.trackId=t.id; music.ensure(); music.click();
      tg.querySelectorAll('.track-card').forEach(x=>x.classList.remove('sel')); el.classList.add('sel'); };
    tg.appendChild(el);
  });
}

function wireUI(){
  Input.init();
  loadHelp(); setHelp(state.help);
  buildSelectUI(); initPreview(); showPreview(state.dinoId);
  $('btn-start').onclick=()=>{ music.ensure(); music.click(); music.startMusic(); state.mode='dino'; show('screen-dino'); };
  document.querySelectorAll('#help-row .kart-btn').forEach(b=>{
    b.onclick=()=>{ music.ensure(); music.click(); setHelp(b.dataset.help); };
  });
  $('btn-help').onclick=()=>{ music.click(); $('help-panel').classList.toggle('hidden'); };
  $('btn-back-menu').onclick=()=>{ music.click(); state.mode='menu'; show('screen-menu'); };
  $('btn-to-track').onclick=()=>{ music.click(); state.mode='track'; show('screen-track'); };
  document.querySelectorAll('#kart-row .kart-btn').forEach(b=>{
    if(b.dataset.kart===state.kart) b.classList.add('sel'); else b.classList.remove('sel');
    b.onclick=()=>{ state.kart=b.dataset.kart; music.ensure(); music.click();
      document.querySelectorAll('#kart-row .kart-btn').forEach(x=>x.classList.toggle('sel',x===b));
      showPreview(state.dinoId); };
  });
  $('btn-back-dino').onclick=()=>{ music.click(); state.mode='dino'; show('screen-dino'); };
  $('btn-race').onclick=()=>{ music.click(); startRace(); };
  $('btn-pause').onclick=()=>pauseGame();
  $('btn-resume').onclick=()=>resumeGame();
  $('btn-restart').onclick=()=>{ music.click(); startRace(); };
  $('btn-quit').onclick=()=>{ music.click(); state.mode='dino'; setHUD(false); show('screen-dino'); };
  $('btn-again').onclick=()=>{ music.click(); startRace(); };
  $('btn-change').onclick=()=>{ music.click(); state.mode='dino'; setHUD(false); show('screen-dino'); };
  $('btn-mute').onclick=()=>{ music.ensure(); music.setMuted(!music.muted); $('btn-mute').textContent=music.muted?'🔇':'🔊'; };
  // controles independientes de música y efectos (conservan silencio total con 🔊/🔇)
  const vm=$('vol-music'), vs=$('vol-sfx');
  if(vm){ vm.value=Math.round(music.musicVol*100); vm.oninput=()=>{ music.ensure(); music.setMusicVol(vm.value/100); }; }
  if(vs){ vs.value=Math.round(music.sfxVol*100); vs.oninput=()=>{ music.ensure(); music.setSfxVol(vs.value/100); }; }
  // fondo del menú: diorama prehistórico vivo con el dino elegido en pedestal
  clearScene();
  scene.background = new THREE.Color(0x87d7f5);
  const menuSky = makeSky(0x4fa8e8, 0xbfe9ff); menuSky.position.set(0,0,-4); scene.add(menuSky);
  scene.fog=new THREE.Fog(0xaee6c8,45,170);
  scene.add(new THREE.HemisphereLight(0xffffff,0x55b04e,.9));
  const sun=new THREE.DirectionalLight(0xffffff,1.6); sun.position.set(10,20,10); sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024); scene.add(sun);
  const rimM=new THREE.DirectionalLight(0xffe0b3,.6); rimM.position.set(-8,10,-14); scene.add(rimM);
  const gnd=mesh(new THREE.PlaneGeometry(220,220),M(0x55b04e,{roughness:.95}),0,0,-10,-Math.PI/2,0,0); gnd.receiveShadow=true; scene.add(gnd);
  // pedestal con foco para la estrella
  const ped=mesh(new THREE.CylinderGeometry(2.4,2.7,.3,28), M(0xf4f6fb,{roughness:.5}), -8,0.15,-2.3, 0,0,0, 1,1,1);
  ped.receiveShadow=true; scene.add(ped);
  scene.add(mesh(new THREE.TorusGeometry(2.4,.1,10,40), M(0xffd43b,{emissive:0xffaa00,emissiveIntensity:.35}), -8,0.32,-2.3, Math.PI/2,0,0, 1,1,1));
  const spotM=new THREE.SpotLight(0xfff2cc, 120, 40, .45, .55); spotM.position.set(-8,12,-2);
  spotM.target.position.set(-8,1,-2.3); scene.add(spotM); scene.add(spotM.target);
  // palmeras laterales y traseras (lejos de la cámara) + volcán + laguito
  for(const [px,pz,ps] of [[-12,-10,1.2],[-16,-18,1.5],[10,-12,1.1],[15,-20,1.4],[-9,-24,1.0],[7,-26,1.3],[0,-30,1.6]]){
    const t=new THREE.Group(); t.position.set(px,0,pz); t.scale.setScalar(ps);
    t.add(mesh(CYL(8), M(0x8a6238), 0,1.5,0, 0,0,.08, .24,.24,3));
    for(let k=0;k<6;k++){ const fa=k*Math.PI/3;
      t.add(mesh(CONE(6), M(0x55cf74), Math.cos(fa)*1.1,3.1,Math.sin(fa)*1.1, Math.PI/2.6*Math.cos(fa),0,Math.PI/2.6*Math.sin(fa)+1.2, .4,1.9,.12)); }
    scene.add(t);
  }
  const volc=new THREE.Group(); volc.position.set(-24,0,-70); scene.add(volc);
  volc.add(mesh(CONE(20), M(0x5a6e5a), 0,10,0, 0,0,0, 16,20,16));
  volc.add(mesh(CONE(20), M(0xff5a00,{emissive:0xff3300,emissiveIntensity:1}), 0,19,0, 0,0,0, 5,4,5));
  const pondM=new THREE.MeshStandardMaterial({color:0x3fb6f2, roughness:.15, metalness:.3, transparent:true, opacity:.85});
  const pond=new THREE.Mesh(new THREE.CircleGeometry(5,24), pondM); pond.rotation.x=-Math.PI/2; pond.position.set(12,.05,-14); scene.add(pond);
  // bandada de pteranodones volando en círculos
  const flock=[];
  for(let i=0;i<3;i++){
    const f=buildDinosaur('ptera'); f.group.scale.setScalar(.8);
    scene.add(f.group); flock.push({g:f.group, parts:f.parts, def:f.def, r:14+i*3, h:12+i*2, sp:.25+i*.06, ph:i*2.1, kart:{wheels:[]}, dino:f.group, rig:f.group});
    f.group.userData.s0=.8;
  }
  const motes = makeSparks(scene, 0, 6, -6, 0xfff59b, 50, 16);
  player=makePlayer('trex',0,false,state.kart); player.rig.position.set(-8,0.3,-2.3); scene.add(player.rig);
  camera.position.set(-2.6,3.2,3.6); camera.lookAt(-4.6,1.5,-3.2);
  const menuAnim=()=>{
    if(state.mode==='menu'||state.mode==='dino'||state.mode==='track'){
      // el braquiosaurio no gira: posa de perfil (cuello hacia la izquierda)
      // para mostrar la S y la cabeza fuera de la tarjeta
      if(player.def.id==='braqui') player.rig.rotation.y += (-0.55-player.rig.rotation.y)*.05;
      else player.rig.rotation.y+=.008;
      animDino(player,elapsed,.016,{speed:4,steer:Math.sin(elapsed*.6)*.12});
      for(const b of flock){
        b.ph+=.016*b.sp;
        b.g.position.set(Math.cos(b.ph)*b.r, b.h+Math.sin(elapsed+b.ph)*.8, -6+Math.sin(b.ph)*b.r*.6);
        b.g.rotation.y=-b.ph;
        animDino(b, elapsed+b.ph, .016, {speed:8, steer:0, airY:2});
      }
      updateFx({swayers:[], lavaMats:[], sparks:motes}, .016, elapsed);
      // el escaparate sigue al dino elegido
      if(player.def.id!==state.dinoId){
        scene.remove(player.rig);
        const di=DINOS.findIndex(d=>d.id===state.dinoId);
        player=makePlayer(state.dinoId,di,false,state.kart); player.rig.position.set(-8,0.3,-2.3); scene.add(player.rig);
        dinoRoar(player,.3);
      }
      // al braquiosaurio se le encuadra a la izquierda en el menú
      // (medido: cabeza proyectada fuera de la tarjeta con esta cámara)
      const tallM = player.def.id==='braqui';
      camera.position.lerp(new THREE.Vector3(tallM?-5.6:Math.sin(elapsed*.3)*.6-2.6,tallM?5.6:3.2,tallM?8:3.6),.03);
      if(tallM) camera.lookAt(-0.7,4.4,-3.2);
      else camera.lookAt(-4.2,1.5,-3.2);
    }
    requestAnimationFrame(menuAnim);
  };
  menuAnim();
  show('screen-menu'); setHUD(false); resize(); loop();
}

wireUI();

// gancho para pruebas automatizadas
window.__DINO_RACE__ = { DINOS, TRACKS, DINO_BUILDERS, buildDinosaur, buildKart, buildWorld, spawnEntities, Input, state, music, dinoRoar, animDino, getEnts:()=>ents, getWorld:()=>world, getCamera:()=>camera, getPlayer:()=>player, getRivals:()=>rivals, THREE };
