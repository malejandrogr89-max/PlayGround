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
  { id:'trex',   name:'T. Rex',          emoji:'🦖', color:0x4caf50, belly:0xcde8b0, desc:'¡El rey fuerte con dientes grandes y bracitos!' },
  { id:'braqui', name:'Braquiosaurio',   emoji:'🦕', color:0x7bb661, belly:0xe8f0c8, desc:'¡Cuello larguísimo para verlo todo desde arriba!' },
  { id:'trice',  name:'Tricerátops',     emoji:'🦏', color:0x6fa8dc, belly:0xd6e9ff, desc:'¡Tres cuernos y un escudo genial en la cabeza!' },
  { id:'velo',   name:'Velociraptor',    emoji:'🦅', color:0xef6c3d, belly:0xffe0b8, desc:'¡Rapidísimo, con plumas y una garra curva!' },
  { id:'stego',  name:'Estegosaurio',    emoji:'🦎', color:0x9b7ede, belly:0xe6dcff, desc:'¡Placas en la espalda y cola con pinchos!' },
  { id:'anky',   name:'Anquilosaurio',   emoji:'🐢', color:0xb08954, belly:0xf0dfb8, desc:'¡Armadura de tortuga y cola con maza!' },
  { id:'para',   name:'Parasaurolophus', emoji:'🦆', color:0x3ec6b8, belly:0xd2f7f0, desc:'¡Cresta trompeta para cantar mientras corre!' },
  { id:'ptera',  name:'Pteranodon',      emoji:'🦅', color:0xf2a7c3, belly:0xffe3ef, desc:'¡Alas grandes y pico volador, el rey del cielo!' },
  { id:'tiburon',name:'Tiburón',           emoji:'🦈', color:0x3aa7e0, belly:0xe8f6ff, desc:'¡Aletas, sonrisas y burbujas en su kart marino!' },
];

export const TRACKS = [
  { id:'jungla',  name:'Jungla Verde',   emoji:'🌴', len:1100, sky:0x87d7f5, fog:0xaee6c8, ground:0x55b04e, road:0xd9b382, edge:0x3e8f3e, desc:'Árboles, lianas y monitos. ¡Fácil y alegre!' },
  { id:'desierto',name:'Desierto Sol',   emoji:'🌵', len:1250, sky:0xffd9a3, fog:0xf7cf9a, ground:0xeec25e, road:0xc98d4e, edge:0xb4763a, desc:'Cactus, dunas y solecito. ¡Ponte gafas!' },
  { id:'valle',   name:'Valle Florido',  emoji:'🌸', len:1400, sky:0xa8e6ff, fog:0xc4ecff, ground:0x7ed957, road:0x9c7b54, edge:0x5da33f, desc:'Flores, río y arcoíris. ¡El más bonito!' },
  { id:'volcan',  name:'Volcán Chispa',  emoji:'🌋', len:1550, sky:0x4a3560, fog:0x6b4a7a, ground:0x6e5a6e, road:0x4a4a55, edge:0xff6b35, desc:'Lava que no quema, rocas y chispas. ¡Emoción!' },
];

// ---------- helpers ----------
// Estilo "juguete blando": sombreado suave global (sin facetas planas)
function M(color, opts={}) {
  return new THREE.MeshStandardMaterial({ color, roughness:.65, metalness:.05, flatShading:false, ...opts });
}
function mesh(geo, material, x=0,y=0,z=0, rx=0,ry=0,rz=0, sx=1,sy=1,sz=1){
  const m = new THREE.Mesh(geo, material);
  m.position.set(x,y,z); m.rotation.set(rx,ry,rz); m.scale.set(sx,sy,sz);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const SPH = (w=16,h=12)=>new THREE.SphereGeometry(1,w,h);
const BOX = ()=>new THREE.BoxGeometry(1,1,1);
const CYL = (s=12)=>new THREE.CylinderGeometry(1,1,1,s);
const CONE = (s=12)=>new THREE.ConeGeometry(1,1,s);
const EYE_BIG = 1.45; // factor de ojos grandes (juguete blando)

/* ---------- acabado "juguete blando": pastel + gordito + contorno toon ---------- */
const _softMats = new Set();
function softenToy(group){
  // colores pastel vivos + superficie mate suave (sin tocar ojos/párpados oscuros)
  _softMats.clear();
  const white = new THREE.Color(0xffffff);
  group.traverse(o=>{
    if(o.isMesh && o.material && o.material.isMeshStandardMaterial && !o.userData.isLid){
      const m=o.material;
      if(!_softMats.has(m)){
        _softMats.add(m);
        const c=m.color, lum=0.299*c.r+0.587*c.g+0.114*c.b;
        if(lum>0.12) c.lerp(white,.28);
        m.roughness=Math.max(m.roughness,.8);
        if(m.bumpMap) m.bumpScale=.15;
        m.flatShading=false;
      }
    }
  });
  // cuerpo "gordito": la malla mayor crece a lo ancho (no alarga el torso)
  let big=null, bigR=0;
  const box=new THREE.Box3(), ctr=new THREE.Vector3(), sz=new THREE.Vector3();
  group.traverse(o=>{
    if(o.isMesh && !o.userData.isLid){
      box.setFromObject(o); box.getSize(sz);
      const r=Math.max(sz.x,sz.y,sz.z);
      if(r>bigR){ bigR=r; big=o; }
    }
  });
  if(big){ big.scale.x*=1.1; }
}
function addOutlines(group){
  // contorno suave tipo dibujo animado: cáscara BackSide en las 2 masas
  // principales (la segunda, alejada de la primera: cuerpo + cabeza, no barriga)
  const cands=[];
  const box=new THREE.Box3(), ctr=new THREE.Vector3(), sz=new THREE.Vector3();
  group.traverse(o=>{
    if(o.isMesh && !o.userData.isLid && o.geometry){
      box.setFromObject(o); box.getCenter(ctr); box.getSize(sz);
      cands.push({o, r:Math.max(sz.x,sz.y,sz.z), c:ctr.clone()});
    }
  });
  cands.sort((a,b)=>b.r-a.r);
  const picked=[];
  for(const cd of cands){
    if(cd.r<0.3) continue;
    if(picked.length===0 || picked[0].c.distanceTo(cd.c)>0.8) picked.push(cd);
    if(picked.length===2) break;
  }
  const lineM=new THREE.MeshBasicMaterial({color:0x4a3428, side:THREE.BackSide});
  for(const p of picked){
    const shell=new THREE.Mesh(p.o.geometry, lineM);
    shell.scale.setScalar(1.06); shell.castShadow=false; shell.receiveShadow=false;
    p.o.add(shell);
  }
}

/* ============================================================
   FÁBRICA DE DINOSAURIOS — cada uno anatomía + silueta propia.
   Todos miran hacia -Z. Devuelven {group, parts}.
   parts puede tener: jaw, tail[], legL, legR, armL, armR,
   head, crest, wings[], plates[] para animar.
   ============================================================ */
function baseEyes(head, x, y, z, s=0.11){
  s *= EYE_BIG; // ojos grandes y tiernos (proporción juguete blando)
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
  // cuerpo voluminoso y redondeado en forma de barril
  g.add(mesh(SPH(), skin, 0,1.0,.5, 0,0,0, .86,.8,1.12));
  g.add(mesh(SPH(), bellyM, 0,.82,.42, 0,0,0, .7,.64,.94));
  g.add(mesh(SPH(10,8), skin, 0,1.6,.55, 0,0,0, .6,.44,.65)); // joroba de hombros
  // cola larga y fina: 4 conos ahusados hacia atrás y algo hacia abajo
  const tail = new THREE.Group(); tail.position.set(0,0,0); g.add(tail); P.tail = tail;
  for(let i=0;i<4;i++){
    const r=.2-i*.05;
    tail.add(mesh(CONE(10), skin, 0,1.0-i*.17,1.5+i*.72, Math.PI/2-.18,0,0, r,.95,r));
  }
  // CUELLO en S visible desde atrás: base hacia delante, arco alto en el
  // medio, cabeza hacia delante y abajo + leve S lateral. 11 segmentos.
  const neckPivot = new THREE.Group(); neckPivot.position.set(0,1.35,-.35); g.add(neckPivot);
  const SEG = 11, SGL = .52; // longitud total 5.72 (ratio cuello/torso ≥ 2,5)
  // S suave: la cabeza queda apilada sobre la columna (sin salto en pantalla)
  const tilts = [-.3,-.03,.06,.15,.12,.09,.03,-.03,-.09,-.12,-.09];
  const ztilts = [-.06,-.08,-.05,0,.05,.08,.06,.02,-.03,-.06,-.04]; // S lateral (se lee desde atrás)
  P.neckSegs = [];
  let parent = neckPivot;
  for(let i=0;i<SEG;i++){
    const piv = new THREE.Group();
    if(i>0) piv.position.set(0,SGL,0);
    piv.rotation.x = tilts[i]; piv.rotation.z = ztilts[i];
    parent.add(piv);
    const r = .36 - (i/SEG)*.14; // .36 → .22 (arriba más grueso: no se pierde)
    const seg = mesh(SPH(12,10), skin, 0,SGL/2,0, 0,0,0, r,SGL*.95,r); // solape fuerte = uniones suaves
    piv.add(seg);
    if(i%3===1) piv.add(mesh(SPH(8,6), M(d.belly), r*.7,SGL*.5,r*.35, 0,0,0, .1,.14,.1)); // garganta clara
    P.neckSegs.push({pivot:piv, base:tilts[i], baseZ:ztilts[i]});
    parent = piv;
  }
  P.neck = neckPivot;
  // cabeza un 50 % mayor, con ojos grandes y sonrisa, hija del último segmento
  const head = new THREE.Group(); head.position.set(0,SGL+.05,0); parent.add(head); P.headG = head;
  head.add(mesh(SPH(), skin, 0,0,0, 0,0,0, .39,.36,.48));
  head.add(mesh(SPH(), bellyM, 0,-.15,-.36, 0,0,0, .26,.2,.3)); // hocico
  for(const s of [-1,1]){
    head.add(mesh(SPH(8,6), M(0x3a2a1a), s*.1,.21,-.45, 0,0,0, .05,.065,.04)); // narinas altas
    head.add(mesh(CONE(8), skin, s*.19,.3,-.03, 0,0,s*-.3, .09,.19,.09));
  }
  head.add(mesh(new THREE.TorusGeometry(.15,.028,8,14,Math.PI), M(0x5a3d2b), 0,-.16,-.62, 0,0,Math.PI, 1,1,1)); // sonrisa
  baseEyes(head, .28,.09,-.3,.13);
  const jaw = new THREE.Group(); jaw.position.set(0,-.27,-.22); head.add(jaw); P.jaw = jaw;
  jaw.add(mesh(SPH(), bellyM, 0,0,-.12, 0,0,0, .21,.1,.27));
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
    const e = mesh(SPH(10,8), w, s*.36,1.18,-.5, 0,0,0, .18,.21,.13); g.add(e);
    const p = mesh(SPH(8,6), b, s*.43,1.19,-.57, 0,0,0, .085,.1,.06); g.add(p);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(1,8,6), new THREE.MeshBasicMaterial({color:0xffffff}));
    hl.position.set(s*.46,1.28,-.64); hl.scale.setScalar(.032); g.add(hl);
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
  try { softenToy(built.group); addOutlines(built.group); } catch(e){}
  return { ...built, def: d };
}

/* ============ KART (no tapa cabeza/cuernos/placas/cola) ============ */
const KART_COLORS = [0xff4757,0x1cb0f6,0xffd43b,0x58cc02,0xa55eea,0xff5fa2,0xff7f50,0x3ec6b8,0x00b4d8];
export function buildKart(colorIdx=0, marine=false){
  const g = new THREE.Group();
  const col = marine ? 0xf4f8ff : KART_COLORS[colorIdx % KART_COLORS.length];
  const bodyM = M(col,{roughness:.28, metalness:.25}), darkM = M(0x333344,{roughness:.6});
  const chromeM = M(0xdfe6ee,{roughness:.2, metalness:.75});
  const trimM = M(marine?0x0096c7:col,{roughness:.35});
  // chasis bajo y abierto: el personaje queda visible por completo
  const chassis = mesh(BOX(), bodyM, 0,.42,.15, 0,0,0, 1.15,.22,1.9); g.add(chassis);
  g.add(mesh(BOX(), trimM, 0,.5,-.55, 0,0,0, .9,.14,.5)); // morro
  if(marine){ // franja de olas + salvavidas a los lados (bajos, no tapan)
    g.add(mesh(BOX(), trimM, 0,.42,.15, 0,0,0, 1.17,.08,1.92));
    for(const s of [-1,1]){
      const ring = mesh(new THREE.TorusGeometry(.22,.08,10,20), M(0xff6b35,{roughness:.5}), s*.98,.42,.3, 0,Math.PI/2,0, 1,1,1);
      g.add(ring);
      g.add(mesh(BOX(), M(0xffffff), s*.98,.64,.3, 0,0,0, .1,.08,.1));
      g.add(mesh(BOX(), M(0xffffff), s*.98,.2,.3, 0,0,0, .1,.08,.1));
    }
    g.add(mesh(BOX(), trimM, 0,1.32,1.15, 0,0,0, .5,.3,.06)); // banderita con ola
    g.add(mesh(SPH(8,6), M(0xffffff), 0,1.32,1.19, 0,0,0, .1,.1,.05));
  }
  g.add(mesh(BOX(), bodyM, 0,.34,-1.05, .12,0,0, 1.0,.1,.5)); // alerón delantero
  for(const s of [-1,1]){ // pontones laterales con franja blanca
    g.add(mesh(BOX(), bodyM, s*.72,.4,.3, 0,0,0, .3,.26,1.1));
    g.add(mesh(BOX(), M(0xffffff,{roughness:.35}), s*.72,.48,.3, 0,0,0, .32,.07,1.0));
    g.add(mesh(BOX(), darkM, s*.72,.28,-.75, 0,0,0, .34,.1,.3)); // guardabarros
    g.add(mesh(BOX(), darkM, s*.72,.28,.95, 0,0,0, .34,.1,.3));
  }
  g.add(mesh(SPH(), M(0xfff200,{emissive:0xffee00,emissiveIntensity:.5}), 0,.55,-1.12, 0,0,0, .16,.1,.08)); // faro
  for(const s of [-1,1]) g.add(mesh(SPH(8,6), M(0xff5252,{emissive:0xcc0000,emissiveIntensity:.5}), s*.3,.55,1.28, 0,0,0, .09,.07,.05)); // pilotos
  g.add(mesh(BOX(), darkM, 0,.62,.75, -.25,0,0, .95,.3,.18)); // respaldo bajo (no tapa)
  g.add(mesh(CYL(10), darkM, 0,.5,.35, Math.PI/2,0,0, .42,.42,.12)); // asiento
  g.add(mesh(BOX(), M(0xffd43b,{roughness:.4}), 0,.56,.35, 0,0,0, .3,.06,.3)); // cojín
  const wheel = mesh(new THREE.TorusGeometry(.2,.05,10,20), darkM, 0,.68,-.35, -.5,0,0, 1,1,1); g.add(wheel); // volante
  g.add(mesh(CYL(8), chromeM, 0,.6,-.28, .9,0,0, .035,.035,.3)); // columna
  g.add(mesh(SPH(8,6), bodyM, 0,.68,-.35, 0,0,0, .07,.07,.07));
  // alerón trasero alto pero estrecho (no tapa la cola lateral)
  g.add(mesh(BOX(), bodyM, -.4,.85,1.15, 0,0,0, .08,.5,.08));
  g.add(mesh(BOX(), bodyM, .4,.85,1.15, 0,0,0, .08,.5,.08));
  g.add(mesh(BOX(), M(0xffffff), 0,1.1,1.15, 0,0,0, 1.1,.16,.3));
  // escapes cromados con brillo
  for(const s of [-1,1]){
    g.add(mesh(CYL(8), chromeM, s*.35,.5,1.1, Math.PI/2,0,0, .07,.07,.35));
    g.add(mesh(CYL(8), M(0x222222,{emissive:0xff8800,emissiveIntensity:.25}), s*.35,.5,1.28, Math.PI/2,0,0, .055,.055,.04));
  }
  // ruedas: giran (spin) y las delanteras orientan (steer)
  const wheels = [];
  const tireM = M(0x22222c,{roughness:.9, bumpMap:scaleTexture(), bumpScale:.25}), hubM = M(0xffffff,{roughness:.25, metalness:.4});
  for(const [x,z,front] of [[-.68,-.6,1],[.68,-.6,1],[-.68,.85,0],[.68,.85,0]]){
    const pivot = new THREE.Group(); pivot.position.set(x,.32,z); pivot.userData.baseY=.32; g.add(pivot);
    const tire = mesh(CYL(18), tireM, 0,0,0, 0,0,Math.PI/2, .36,.36,.27); pivot.add(tire);
    const hub = mesh(CYL(12), hubM, 0,0,0, 0,0,Math.PI/2, .17,.17,.29); pivot.add(hub);
    for(let k=0;k<5;k++){ // radios de la llanta
      const sp = mesh(BOX(), M(col,{roughness:.4}), 0,0,0, k*Math.PI/5,0,0, .05,.3,.3);
      pivot.add(sp);
    }
    wheels.push({pivot, tire, front:!!front});
  }
  g.userData.chassis = chassis;
  return { group:g, wheels, steering: wheel };
}
export function mountDinoOnKart(dinoGroup, kartGroup, dinoId){
  // El dino va sentado sobre el asiento, alto para que se vea entero
  dinoGroup.position.set(0,.62,.35);
  const s = dinoId==='braqui' ? .78 : dinoId==='ptera' ? .9 : .95;
  dinoGroup.scale.setScalar(s);
  kartGroup.add(dinoGroup);
}

/* ============ AUDIO: música alegre procedural + SFX ============ */
/* Voces "gruñido grave amistoso": sierra 60-120 Hz con AM 20-40 Hz (bububu),
   ruido filtrado y paso bajo que se abre/cierra como una boca.
   Grande = grave/lento/largo; pequeño = agudo/rápido/corto. */
const ROAR_VOICE = {
  trex:  {f:70,  d:1.4,  am:24}, braqui: {f:62,  d:1.6,  am:20},
  trice: {f:85,  d:1.1,  am:26}, velo:   {f:115, d:0.7,  am:36},
  stego: {f:90,  d:1.0,  am:28}, anky:   {f:75,  d:1.3,  am:22},
  para:  {f:100, d:0.9,  am:30}, ptera:  {f:120, d:0.65, am:38},
  tiburon:{f:85, d:0.6,  am:30},
};
class MusicBox {
  constructor(){
    this.ctx=null; this.playing=false; this.muted=false; this.timer=null; this.step=0;
    this.musicGain=null; this.sfxGain=null; this._roarLock=0; this._noiseBuf=null;
    // valores por defecto razonables aunque lo guardado esté a 0
    const sm=parseFloat(localStorage.getItem('dr3d_mus')), ss=parseFloat(localStorage.getItem('dr3d_sfx'));
    this.musicVol=(sm>0?sm:0.5); this.sfxVol=(ss>0?ss:0.8);
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
      // el audio solo vive tras gesto del usuario: reanudar en cada gesto
      const wake=()=>{ if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); };
      addEventListener('pointerdown',wake); addEventListener('keydown',wake);
      // auto-resume al volver a la pestaña
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
  hit(){ this.beep(160,.25,'sawtooth',.14); }
  fanfare(){ [523,659,784,1047,784,1047,1319].forEach((f,i)=>this.beep(f,.22,'square',.13,i*.14)); }
  click(){ this.beep(600,.07,'square',.1); }
  count(n){ this.beep(n===0?880:440,.25,'square',.16); }
  /* Rugido "gruñido grave amistoso": sierra grave con AM (bububu) + ruido
     filtrado, paso bajo que se abre/cierra como boca y caída final de tono.
     Variación aleatoria ±5 %. Nada fuerte por encima de ~1 kHz. */
  roar(species='trex', vol=.8){
    if(!this.ctx||this.muted) return 0;
    if(this.ctx.state!=='running'){ this.ctx.resume(); }
    if(this._roarLock>this.ctx.currentTime) return 0; // sin solaparse
    const v = ROAR_VOICE[species]||ROAR_VOICE.trex;
    const jit = 1+(Math.random()*0.1-0.05); // ±5 %
    const f = v.f*jit, am = v.am*(1+(Math.random()*0.1-0.05)), dur = v.d;
    const t0 = this.ctx.currentTime, t1 = t0+dur;
    this._roarLock = t1+0.1;
    // voz principal: diente de sierra grave con caída suave al final
    const o=this.ctx.createOscillator(); o.type='sawtooth';
    o.frequency.setValueAtTime(f*1.1,t0);
    o.frequency.setValueAtTime(f,t0+dur*.25);
    o.frequency.exponentialRampToValueAtTime(f*0.72,t1);
    // "boca": paso bajo que se abre y se cierra
    const lp=this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=1.2;
    lp.frequency.setValueAtTime(320,t0);
    lp.frequency.exponentialRampToValueAtTime(950,t0+dur*.4);
    lp.frequency.exponentialRampToValueAtTime(300,t1);
    // "bububu": modulación de amplitud 20-40 Hz
    const g=this.ctx.createGain();
    g.gain.setValueAtTime(0.001,t0);
    g.gain.exponentialRampToValueAtTime(vol,t0+.07);
    g.gain.setValueAtTime(vol,t0+dur*.75);
    g.gain.exponentialRampToValueAtTime(.001,t1+.12);
    const lfo=this.ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=am;
    const depth=this.ctx.createGain(); depth.gain.value=vol*.55;
    lfo.connect(depth); depth.connect(g.gain);
    o.connect(lp); lp.connect(g); g.connect(this.sfxGain);
    o.start(t0); o.stop(t1+.15); lfo.start(t0); lfo.stop(t1+.15);
    // capa de aliento: ruido filtrado suave (sin brillo agresivo)
    if(!this._noiseBuf){
      const len=this.ctx.sampleRate|0, buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
      const ch=buf.getChannelData(0);
      for(let i=0;i<len;i++) ch[i]=Math.random()*2-1;
      this._noiseBuf=buf;
    }
    const nz=this.ctx.createBufferSource(); nz.buffer=this._noiseBuf; nz.loop=true;
    const nlp=this.ctx.createBiquadFilter(); nlp.type='lowpass'; nlp.frequency.value=750;
    const ng=this.ctx.createGain();
    ng.gain.setValueAtTime(0.001,t0);
    ng.gain.exponentialRampToValueAtTime(vol*.22,t0+dur*.35);
    ng.gain.exponentialRampToValueAtTime(.001,t1);
    nz.connect(nlp); nlp.connect(ng); ng.connect(this.sfxGain);
    nz.start(t0); nz.stop(t1+.05);
    if(species==='tiburon') this.bubbles(5,.3);
    return dur+.12;
  }
  /* burbujitas de tiburón: glissandos cortos y suaves (nada estridente) */
  bubbles(n=4, vol=.3){
    if(!this.ctx||this.muted) return;
    for(let i=0;i<n;i++){
      const t0=this.ctx.currentTime+i*.09;
      const o=this.ctx.createOscillator(), g=this.ctx.createGain();
      o.type='sine';
      const f0=300+Math.random()*250;
      o.frequency.setValueAtTime(f0,t0); o.frequency.exponentialRampToValueAtTime(f0*1.6,t0+.08);
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
  bell(freq, vol=.05, when=0){    if(!this.ctx||this.muted) return;
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
  /* pluck: nota redonda de cuerda pulsada en el bus de EFECTOS (hileras) */
  pluck(freq, when=0, vol=.2, dur=.45){
    if(!this.ctx||this.muted) return;
    const t=this.ctx.currentTime+when;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='sine'; o.frequency.value=freq;
    g.gain.setValueAtTime(.001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+.015);
    g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t+dur+.05);
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
  },
  poll(){
    // gamepad Xbox: stick izquierdo/cruceta -> moverse, A -> salto, Start -> pausa
    let gx=0, gjump=false, gpause=false, name='';
    try{
      const gps = navigator.getGamepads?navigator.getGamepads():[];
      for(const gp of gps){ if(!gp||!gp.connected) continue;
        name=gp.id||'Mando';
        const ax = gp.axes[0]||0; if(Math.abs(ax)>0.25) gx=ax;
        if(gp.buttons[14]?.pressed) gx=-1; if(gp.buttons[15]?.pressed) gx=1;
        if(gp.buttons[0]?.pressed) gjump=true;
        if(gp.buttons[9]?.pressed) gpause=true;
        break;
      }
    }catch{}
    this.axis=gx;
    if(name!==this.padName||(!this.padSeen&&name)){ this.padSeen=!!name; this.padName=name; this.padUpdate(); }
    if(gx<-0.25) this.left=true; else if(!this.keys.ArrowLeft&&!this.keys.KeyA&&gx>=-0.25) { if(this.axis!==0||true){} }
    // combinar sin pisar teclado: recalcula
    const kL=!!(this.keys.ArrowLeft||this.keys.KeyA), kR=!!(this.keys.ArrowRight||this.keys.KeyD);
    this.left = kL||gx<-0.25; this.right = kR||gx>0.25;
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
  const fx = { swayers:[], lavaMats:[], sparks:null, river:null };
  function tree(x,z,s=1){
    const t=new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s);
    t.add(mesh(CYL(8), M(0x7a5230,{roughness:.85}), 0,1.1,0, 0,0,0, .28,.28,2.2));
    const leafM=M(0x2e8b3e,{roughness:.8});
    t.add(mesh(SPH(), leafM, 0,2.8,0, 0,0,0, 1.3,1.1,1.3));
    t.add(mesh(SPH(), M(0x3cb54e,{roughness:.8}), .7,2.3,.4, 0,0,0, .85,.75,.85));
    t.add(mesh(SPH(), M(0x3cb54e,{roughness:.8}), -.7,2.4,-.3, 0,0,0, .8,.7,.8));
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
      t.add(mesh(CONE(6), M(0x35a04e,{roughness:.8}), Math.cos(a)*1.1,3.1,Math.sin(a)*1.1, Math.PI/2.6*Math.cos(a),0,Math.PI/2.6*Math.sin(a)+1.2, .4,1.9,.12));
    }
    t.add(mesh(SPH(8,6), M(0x6b4a2a), 0,2.9,0, 0,0,0, .3,.25,.3)); // cocos
    t.add(mesh(SPH(8,6), M(0x6b4a2a), .25,2.8,.1, 0,0,0, .22,.2,.22));
    fx.swayers.push({o:t, ph:Math.random()*9, amt:.03});
    grp.add(t);
  }
  function pine(x,z,s=1){
    const t=new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s);
    t.add(mesh(CYL(8), M(0x6b4a2a), 0,.5,0, 0,0,0, .22,.22,1));
    const g1=M(0x2f7d3e,{roughness:.85});
    t.add(mesh(CONE(10), g1, 0,1.6,0, 0,0,0, 1.1,1.6,1.1));
    t.add(mesh(CONE(10), g1, 0,2.6,0, 0,0,0, .8,1.3,.8));
    grp.add(t);
  }
  function cactus(x,z,s=1){
    const t=new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s);
    const cm=M(0x2f9e44);
    t.add(mesh(CYL(10), cm, 0,.9,0, 0,0,0, .3,.3,1.8));
    t.add(mesh(SPH(10,8), cm, 0,1.85,0, 0,0,0, .3,.3,.3));
    t.add(mesh(CYL(8), cm, -.45,.9,0, 0,0,.5, .18,.18,.8));
    t.add(mesh(CYL(8), cm, .45,1.1,0, 0,0,-.5, .18,.18,.8));
    grp.add(t);
  }
  function flower(x,z){
    const f=new THREE.Group(); f.position.set(x,0,z);
    f.add(mesh(CYL(6), M(0x2e8b3e), 0,.25,0, 0,0,0, .05,.05,.5));
    const cols=[0xff5fa2,0xffd43b,0xff6b6b,0xc084fc,0xffffff];
    f.add(mesh(SPH(8,6), M(cols[(Math.random()*cols.length)|0]), 0,.55,0, 0,0,0, .16,.16,.16));
    grp.add(f);
  }
  function rock(x,z,s=1,c=0x8a8a96){
    const r=mesh(new THREE.DodecahedronGeometry(1,0), M(c,{roughness:.9}), x,.4*s,z, Math.random(),Math.random(),0, s,s*.8,s);
    grp.add(r);
    if(Math.random()<.5) grp.add(mesh(SPH(8,6), M(0x5da33f,{roughness:.9}), x+s*.4,.15,z+s*.3, 0,0,0, s*.4,s*.25,s*.4)); // musgo
  }
  function lava(x,z,s=1){
    const lm=M(0xff5a00,{emissive:0xff4400,emissiveIntensity:1});
    const l=mesh(CYL(18), lm, x,.06,z, 0,0,0, s,s*.1,s);
    grp.add(l); fx.lavaMats.push(lm);
    grp.add(mesh(new THREE.TorusGeometry(s,.22,8,20), M(0x3a2a33,{roughness:.95}), x,.1,z, Math.PI/2,0,0, 1,1,1)); // borde rocoso
  }
  function tuft(x,z,c=0x3e9e3e){
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
    else if(track.id==='desierto'){ cactus(xOut,z,rand(.8,1.4)); rock(xOut2,z,rand(.5,1.2),0xc9a06a); if(i%4===0)rock(rand(-7,7),z+40,rand(.3,.5),0xd9b382); tuft(rand(-20,20),z,0xc2a14d); }
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
  }
  return {grp, fx};
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
function updateFx(fx, dt, t){
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
}

export function buildWorld(scene, track){
  const LEN = track.len;
  const topSky = track.id==='volcan'?0x2c1e44 : track.id==='desierto'?0x6fb7ee : 0x4fa8e8;
  scene.background = new THREE.Color(track.sky);
  const sky = makeSky(topSky, track.sky); sky.position.set(0,0,-LEN/2); scene.add(sky);
  scene.fog = new THREE.Fog(track.fog, 45, 170);
  // iluminación premium: clave con sombras suaves + relleno frío + contraluz cálida
  scene.add(new THREE.HemisphereLight(0xffffff, track.ground, .85));
  const sun = new THREE.DirectionalLight(track.id==='volcan'?0xffd9c0:0xffffff, 1.7);
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
  const {fx} = themeProps(scene, track, LEN);
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
  return { LEN, clouds, meta, fx, sky };
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
  // ESTRELLAS-PREMIO: 20 por circuito en 4 HILERAS de 5 (separación ~6 m)
  // siguiendo la trazada + primera hilera cerca del inicio. Geometría y
  // materiales COMPARTIDOS (una sola estrella clásica de 5 puntas).
  _dotTex=_dotTex||dotTexture();
  if(!_starGeo) _starGeo = starShape5();
  if(!_starMat) _starMat = M(0xffc93b,{emissive:0xcc7a00,emissiveIntensity:.5,roughness:.3});
  if(!_glowMat) _glowMat = new THREE.SpriteMaterial({map:_dotTex,color:0xffe27a,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending});
  starRows = [];
  for(let r=0;r<4;r++){
    const rowZ = -50 - r*(LEN-160)/3, row = [];
    for(let j=0;j<5;j++){
      const s=new THREE.Group();
      const z=rowZ-j*6, x=Math.sin((r*5+j)*1.7)*4.2;
      // arco elevado en la hilera 2 (salto): sube hasta y≈2.8 en el centro
      const y = r===1 ? 1.4+Math.sin(j/4*Math.PI)*1.4 : 1.4;
      s.position.set(x,y,z);
      const star=new THREE.Mesh(_starGeo,_starMat);
      star.scale.setScalar(1.1); star.castShadow=true; s.add(star);
      const glow=new THREE.Sprite(_glowMat);
      glow.scale.set(2.6,2.6,1); s.add(glow);
      s.userData={taken:false,core:star,glow,ph:(r*5+j)*.7,rowIdx:r,baseY:y}; scene.add(s); stars.push(s); row.push(s);
    }
    starRows.push(row);
  }
  return { obstacles, eggs, stars };
}
/* estrella clásica de 5 puntas: exterior 1, interior 0.45, punta arriba,
   extruida con poco grosor y bisel pequeño redondeado */
let _starGeo=null, _starMat=null, _glowMat=null, starRows=[];
const STAR_SWAY = 0.6; // balanceo ±35° (nunca de canto)
function starShape5(){
  const shape=new THREE.Shape();
  for(let i=0;i<10;i++){
    const r=i%2===0?1:0.45, a=Math.PI/2+i*Math.PI/5;
    const x=Math.cos(a)*r, y=Math.sin(a)*r;
    if(i===0) shape.moveTo(x,y); else shape.lineTo(x,y);
  }
  shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:2,steps:1});
  g.center();
  return g;
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
  mode:'menu', dinoId:'trex', trackId:'jungla',
  speed:0, baseSpeed:17, x:0, y:0, vy:0, z:10, targetX:0,
  eggs:0, stars:0, hits:0, time:0, slowT:0, invT:0, finished:false,
};
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

function makePlayer(dinoId, colorIdx){
  const kart = buildKart(colorIdx, dinoId==='tiburon');
  const {group, parts, def} = buildDinosaur(dinoId);
  mountDinoOnKart(group, kart.group, dinoId);
  kart.group.traverse(o=>{ if(o.isMesh){o.castShadow=true;} });
  return { rig:kart.group, kart, dino:group, parts, def };
}

function startRace(){
  clearScene();
  music.ensure(); music.startMusic();
  const track = TRACKS.find(t=>t.id===state.trackId);
  world = buildWorld(scene, track);
  ents = spawnEntities(scene, world.LEN);
  const di = DINOS.findIndex(d=>d.id===state.dinoId);
  player = makePlayer(state.dinoId, di);
  scene.add(player.rig);
  rivals = [];
  for(let i=0;i<2;i++){
    const other = DINOS[(di+3+i*2)%DINOS.length];
    const r = makePlayer(other.id, (di+4+i)%8);
    r.rig.position.set(i===0?-3.4:3.4, 0, 4-i*4);
    scene.add(r.rig);
    rivals.push({ ...r, z:4-i*4, x:i===0?-3.4:3.4, spd:13.5+i*0.9, wob:Math.random()*9 });
  }
  Object.assign(state,{speed:0,x:0,y:0,vy:0,z:10,targetX:0,eggs:0,stars:0,points:0,rowBonus:{},hits:0,time:0,slowT:0,invT:0,finished:false});
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
  $('finish-stats').innerHTML =
    `<div class="stat">⏱️ ${state.time.toFixed(1)}s</div><div class="stat">🥚 ${state.eggs}</div><div class="stat">⭐ ${state.stars}</div><div class="stat">✨ ${state.points||0} pts</div><div class="stat">🏆 ${score} pts</div>`;
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
  p.dino.position.y = .62 + Math.abs(Math.sin(t*9))*.05*(spd/14) + sq*-.06;
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
  if(P.tail){
    P.tail.rotation.y = Math.sin(t*4+P._ph)*.3 + steer*-.25;
    P.tail.rotation.x = air*-.3 + roar*.2;
  }
  // --- personalidad por especie ---
  if(id==='trex'){ // mordisquitos + balanceo de cabezota
    if(P.jaw&&!roar) P.jaw.rotation.x = jawBase + Math.max(0,Math.sin(t*5.2))*.18;
    if(P.head) P.head.rotation.z = Math.sin(t*1.2)*.08;
  } else if(id==='braqui'){ // cuello en S por segmentos con retardo + cabeza curiosa
    if(P.neckSegs) P.neckSegs.forEach((sg,i)=>{
      sg.pivot.rotation.x = sg.base + Math.sin(t*.9-i*.35)*.035 + air*-.025;
      sg.pivot.rotation.z = (sg.baseZ||0) + Math.sin(t*.7-i*.3)*.022 + steer*-.022;
    });
    if(P.headG){ P.headG.rotation.y = Math.sin(t*.8+P._ph)*.35; P.headG.rotation.z = Math.sin(t*1.1)*.1;
      P.headG.rotation.x = -headUp*.7 + Math.sin(t*2)*.06; }
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
// dispara un rugido con sincronización de mandíbula (devuelve duración)
function dinoRoar(p, vol=.75){
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
    const steerIn = (Input.right?1:0)-(Input.left?1:0) + (Math.abs(Input.axis)>0.25?Input.axis:0);
    const steer = Math.max(-1,Math.min(1,steerIn));
    state.targetX = Math.max(-5.2,Math.min(5.2, state.targetX + steer*13*dt));
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
      if(state.vy<-7){ player.parts._squash=1; music.beep(220,.12,'sine',.1); } // aterrizaje suave
      state.vy=0;
    }
    // velocidad (slow temporal tras choque, sin castigo duro)
    state.slowT=Math.max(0,state.slowT-dt); state.invT=Math.max(0,state.invT-dt);
    const spd = (state.slowT>0?9:state.baseSpeed);
    state.speed += (spd-state.speed)*Math.min(1,dt*2);
    state.z -= state.speed*dt;
    state.time += dt; elapsed+=dt;
    player.rig.position.set(state.x, state.y, state.z);
    player.rig.rotation.y = -steer*.18;
    player.rig.rotation.z = -steer*.08;
    animDino(player, elapsed, dt, {speed:state.speed, steer, airY:state.y});
    // rugidos aleatorios mientras conduce (espaciados, nunca molestos)
    state.roarCd=(state.roarCd??12)-dt;
    if(state.roarCd<=0){ dinoRoar(player,.65); state.roarCd=14+Math.random()*12; }
    // rivales decorativos
    for(const r of rivals){
      r.z -= r.spd*dt; r.wob+=dt*2;
      r.x += Math.sin(r.wob)*dt*1.2; r.x=Math.max(-5,Math.min(5,r.x));
      r.rig.position.set(r.x, Math.abs(Math.sin(r.wob*2))*.1, r.z);
      animDino(r, elapsed+r.wob, dt, {speed:r.spd, steer:Math.sin(r.wob)*.3});
    }
    // obstáculos
    for(const o of ents.obstacles){
      if(o.userData.done) continue;
      const dz=o.position.z-state.z, dx=o.position.x-state.x;
      if(Math.abs(dz)<1.6 && Math.abs(dx)<(o.userData.r||1.1)){
        const airbone = state.y>0.9;
        if(airbone){ continue; } // ¡saltado! sin choque
        if(state.invT<=0){
          state.hits++; state.slowT=1.4; state.invT=1.5; music.hit();
          state.vy=5; state.y=Math.max(state.y,.2);
          toast(['¡Ups! ¡Sin problema! 💪','¡Casi! ¡Sigue corriendo! 🦕','¡Buen intento! ¡Tú puedes! ⭐'][state.hits%3]);
          player.rig.rotation.z=.3;
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
      // balanceo suave ±35° + cabeceo (nunca de canto) + flotación
      s.rotation.y=Math.sin(elapsed*2+s.userData.ph)*STAR_SWAY;
      s.rotation.x=Math.sin(elapsed*1.7+s.userData.ph)*.15;
      s.position.y=s.userData.baseY+Math.sin(elapsed*3+s.userData.ph)*.25;
      const gs=2.6+Math.sin(elapsed*5+s.userData.ph)*.5; // brillo pulsante por escala
      s.userData.glow.scale.set(gs,gs,1);
      const dz=s.position.z-state.z, dx=s.position.x-state.x, dy=(s.position.y)-(state.y+1.2);
      // ligera atracción al kart cuando pasa cerca (magnetismo suave)
      if(!s.userData.taken&&dz<8&&dz>-2) s.position.x += (state.x-s.position.x)*Math.min(1,dt*2);
      if(Math.abs(dz)<2.5&&Math.abs(dx)<2.5&&Math.abs(dy)<3){
        s.userData.taken=true; s.visible=false; state.stars++; state.points=(state.points||0)+10;
        music.star(); music.bell(1568,.06); dinoRoar(player,.7);
        burstAt(s.position.x,s.position.y,s.position.z);
        toast('⭐ ¡Estrella! +10');
        // HILERA completa: +20 de bonus, do-re-mi-sol ascendente y destello
        const row=starRows[s.userData.rowIdx]||[];
        if(row.length&&row.every(o=>o.userData.taken)&&!state.rowBonus[s.userData.rowIdx]){
          state.rowBonus[s.userData.rowIdx]=true; state.points+=20;
          [523,587,659,784].forEach((f,i)=>music.pluck(f,i*.09,.22));
          burstAt(s.position.x,s.position.y,s.position.z,28);
          toast('🌟 ¡Hilera completa! +20');
        }
      }
    }
    updateHUD();
    updateDust(dt); updateBursts(dt);
    if(world.fx) updateFx(world.fx, dt, elapsed);
    if(world.sky) world.sky.position.set(state.x, 0, state.z-60);
    // cámara en tercera persona: suave, con leve FOV de velocidad (sin mareos)
    const targetFov = 62 + Math.min(1,state.speed/state.baseSpeed)*6;
    if(Math.abs(camera.fov-targetFov)>.05){ camera.fov += (targetFov-camera.fov)*Math.min(1,dt*2); camera.updateProjectionMatrix(); }
    const cxp = state.x*.55, cyp = 4.7+state.y*.35, czp = state.z+9.8;
    camera.position.lerp(new THREE.Vector3(cxp,cyp,czp), Math.min(1,dt*5));
    // al braquiosaurio se le encuadra más alto para no tapar cuello ni cabeza
    const lookY = (player.def.id==='braqui'?2.4:1.5)+state.y*.3;
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
  const kart=buildKart(di, id==='tiburon'); const {group,parts,def}=buildDinosaur(id);
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
  buildSelectUI(); initPreview(); showPreview(state.dinoId);
  $('btn-start').onclick=()=>{ music.ensure(); music.click(); music.startMusic(); state.mode='dino'; show('screen-dino'); };
  $('btn-help').onclick=()=>{ music.click(); $('help-panel').classList.toggle('hidden'); };
  $('btn-back-menu').onclick=()=>{ music.click(); state.mode='menu'; show('screen-menu'); };
  $('btn-to-track').onclick=()=>{ music.click(); state.mode='track'; show('screen-track'); };
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
      t.add(mesh(CONE(6), M(0x35a04e), Math.cos(fa)*1.1,3.1,Math.sin(fa)*1.1, Math.PI/2.6*Math.cos(fa),0,Math.PI/2.6*Math.sin(fa)+1.2, .4,1.9,.12)); }
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
  player=makePlayer('trex',0); player.rig.position.set(-8,0.3,-2.3); scene.add(player.rig);
  camera.position.set(-2.6,3.2,3.6); camera.lookAt(-4.6,1.5,-3.2);
  const menuAnim=()=>{
    if(state.mode==='menu'||state.mode==='dino'||state.mode==='track'){
      player.rig.rotation.y+=.008;
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
        player=makePlayer(state.dinoId,di); player.rig.position.set(-8,0.3,-2.3); scene.add(player.rig);
        dinoRoar(player,.3);
      }
      // al braquiosaurio se le encuadra más alto también en el menú
      const tallM = player.def.id==='braqui';
      camera.position.lerp(new THREE.Vector3(tallM?-2.6:Math.sin(elapsed*.3)*.6-2.6,tallM?4.2:3.2,3.6),.03);
      camera.lookAt(-4.2,tallM?3.3:1.5,-3.2);
    }
    requestAnimationFrame(menuAnim);
  };
  menuAnim();
  show('screen-menu'); setHUD(false); resize(); loop();
}

wireUI();

// gancho para pruebas automatizadas
window.__DINO_RACE__ = { DINOS, TRACKS, DINO_BUILDERS, buildDinosaur, buildKart, buildWorld, spawnEntities, Input, state, music, dinoRoar, animDino, getEnts:()=>ents, getPlayer:()=>player, getCamera:()=>camera, THREE };
