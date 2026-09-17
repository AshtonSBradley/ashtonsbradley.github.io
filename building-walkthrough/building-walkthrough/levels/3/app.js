import * as THREE from 'three';
import DESIGN from '../../design-state.js';
import {positionNorthEastSun} from '../../sunlight.js?v=20260914-ne-sun';
import { OrbitControls } from '../../vendor/OrbitControls.js';

// Plan coordinates: x increases east, p increases north; world z = -p.
// Room envelope from the concept plan; furniture revised for occupied access.
const W=15.34,H=5.98,PART=8.56,CH=3;
const columns=[{x:PART,p:0,w:.6},{x:PART,p:H,w:.6}];
const teachingRuns=DESIGN.level3.teachingRuns, teachingDeskDepth=DESIGN.level3.teachingDeskDepth;
// East-facing teaching rows; the north entrance is at the east end of the frontage.
const lectureRows=DESIGN.level3.teachingRows;
// All six four-place groups are present, including the reinstated rear/north desks.
const teachingGroups=lectureRows.flatMap(x=>teachingRuns.map(p=>({x,p,w:teachingDeskDepth,d:2.4})));
const teachingDoor=DESIGN.level3.teachingDoor;
const teachingChairs=[];
// Match the ground-floor south/west bench footprint; four stools per bench.
// Reserve working space between seated envelopes and the new perimeter services.
const labBenchHeight=.90,labStoolHeight=.62;
const labBenchLength=1.246*1.58,labBenchDepth=.623*1.58;
const westBench={x:.08,p:.32,w:.70,d:4.40,h:.90};
const pvGear={x:7.68,p:.38,w:.72,d:1.10,h:1.90};
const labLayout={x0:.80,x1:7.60,p0:.10,p1:5.94};
// Short-end gap is for reaching plugs only, not a circulation route.
const labGapX=.40;
const labOuterGapX=(labLayout.x1-labLayout.x0-2*labBenchLength-labGapX)/2;
const labStoolOffset=.28,labOccupiedDepth=.53;
const labLongGap=DESIGN.level3.longEdgeGap,labNorthGap=DESIGN.level3.northOccupiedGap;
const labGapP=labLongGap-2*labOccupiedDepth;
const labNorthP=labLayout.p1-labNorthGap-labOccupiedDepth-labBenchDepth;
const labSouthP=labNorthP-labBenchDepth-labLongGap;
const labBenches=[0,1].flatMap(col=>[0,1].map(row=>({
 x:labLayout.x0+labOuterGapX+col*(labBenchLength+labGapX),
 p:labSouthP+row*(labBenchDepth+labLongGap),w:labBenchLength,d:labBenchDepth,h:labBenchHeight
})));
const electronicsCupboards=[{x:7.65,p:1.60,w:.75,d:2.05,h:2.10}];
const printerBench={x:7.62,p:3.85,w:.78,d:1.70};
const printerOffsets=[.14,.94];
const $=id=>document.getElementById(id), canvas=$('scene'), viewport=$('viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e5ebeb');
const camera=new THREE.PerspectiveCamera(58,1,.025,120);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('loading').textContent='This browser could not start 3D graphics. Please open this walkthrough in a browser with WebGL enabled.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.minDistance=2;orbit.maxDistance=32;orbit.maxPolarAngle=Math.PI*.49;orbit.target.set(5.2,0,-4.2);
const state={mode:'orbit',view:'overview',eye:1.65,doors:true,retracted:false,ceiling:false,cutaway:true,storageOpen:false,clearances:true,yaw:0,pitch:0};
const solid=[],doorBlocks=[],outerCut=[],doorLeaves=[],screenMeshes=[],boardPanels=[];
const lectern={x:lectureRows[0]+teachingDeskDepth,p:teachingRuns[0]+.25,w:.56,d:.80};
let boardSlide=0;
const roof=new THREE.Group(),lights=new THREE.Group();scene.add(roof,lights);
const materials={
 wall:new THREE.MeshStandardMaterial({color:'#e9e9e2',roughness:.94}),
 partition:new THREE.MeshStandardMaterial({color:'#d8e1da',roughness:.9}),
 base:new THREE.MeshStandardMaterial({color:'#455e65',roughness:.8}),
 wood:new THREE.MeshStandardMaterial({color:'#d6ba91',roughness:.62}),
 teal:new THREE.MeshStandardMaterial({color:'#477b80',roughness:.88}),
 metal:new THREE.MeshStandardMaterial({color:'#3a4b50',metalness:.45,roughness:.48}),
 white:new THREE.MeshStandardMaterial({color:'#f4f5f0',roughness:.5}),
 board:new THREE.MeshStandardMaterial({color:'#fffef6',roughness:.28}),
 glass:new THREE.MeshStandardMaterial({color:'#b0ddd9',transparent:true,opacity:.20,roughness:.07,metalness:.13,depthWrite:false,side:THREE.DoubleSide}),
 column:new THREE.MeshStandardMaterial({color:'#a7afa9',roughness:.95}),
 storage:new THREE.MeshStandardMaterial({color:'#91a99a',roughness:.72}),
 dark:new THREE.MeshStandardMaterial({color:'#172c39',roughness:.35}),
 glow:new THREE.MeshStandardMaterial({color:'#fff9e5',emissive:'#fff8dd',emissiveIntensity:1.8})
};
function box(x,p,y,sx,sp,sy,mat,parent=scene,shadow=true){let mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sp),mat);mesh.position.set(x,y,-p);mesh.castShadow=shadow;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function cylinder(x,p,y,r,ht,mat,parent=scene){let m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,ht,12),mat);m.position.set(x,y,-p);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function block(x0,p0,x1,p1,kind='fixed'){const b={x0,p0,x1,p1,kind};(kind==='door'?doorBlocks:solid).push(b);return b;}
function wall(x0,p0,x1,p1,mat=materials.wall,cut=false){let vertical=x0===x1;let m=box((x0+x1)/2,(p0+p1)/2,CH/2,vertical?.14:Math.abs(x1-x0),vertical?Math.abs(p1-p0):.14,CH,mat);block(Math.min(x0,x1)-.07,Math.min(p0,p1)-.07,Math.max(x0,x1)+.07,Math.max(p0,p1)+.07);if(cut)outerCut.push(m);let trim=box((x0+x1)/2,(p0+p1)/2,.065,vertical?.17:Math.abs(x1-x0),vertical?Math.abs(p1-p0):.17,.13,materials.base);if(cut)outerCut.push(trim);return m;}
function textTexture(lines,{bg='#173441',fg='#ffffff',w=1024,h=512,size=64}={}){let c=document.createElement('canvas');c.width=w;c.height=h;let ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=fg;ctx.font=`500 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((s,i)=>ctx.fillText(s,w/2,h/2+(i-(lines.length-1)/2)*size*1.4));let t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function sign(x,p,y,width,height,lines,rotation=0){const tex=textTexture(lines);let m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.position.set(x,y,-p);m.rotation.y=rotation;scene.add(m);return m;}
function floorMat(color){let c=document.createElement('canvas');c.width=c.height=128;let ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,128,128);let seed=17;for(let i=0;i<6000;i++){seed=(seed*16807)%2147483647;const x=seed%128;seed=(seed*16807)%2147483647;ctx.fillStyle=i%2?'#ffffff0b':'#0000000b';ctx.fillRect(x,seed%128,1,1);}let t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,5);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:t,roughness:1});}

const labFloor=floorMat('#a9aaa0'),teachingFloor=floorMat('#839599'),corridorFloor=floorMat('#c2c8c7');
box(W/2,H/2,-.13,W+.22,H+.22,.26,materials.base);
box(PART/2,H/2,.005,PART,H,.035,labFloor);
box((PART+W)/2,H/2,.005,W-PART,H,.035,teachingFloor);
box(W/2,H+.8,-.045,W+2,1.6,.10,corridorFloor);
box(W/2,-.8,-.045,W+2,1.6,.10,corridorFloor);
for(let x of [-.5,W+.5])box(x,H/2,-.045,1,H,.10,corridorFloor);
wall(PART,.3,PART,H-.3,materials.partition);
for(const c of columns){box(c.x,c.p,CH/2,c.w,c.w,CH,materials.column);block(c.x-.3,c.p-.3,c.x+.3,c.p+.3);}
wall(0,0,0,H,materials.wall,true);wall(W,0,W,H,materials.wall,true);
const southGroup=new THREE.Group();scene.add(southGroup);outerCut.push(southGroup);
// Continuous south clerestory across both rooms, interrupted by structure.
// Keep the lab whiteboard on the solid wall below the high-level glazing.
box(W/2,0,1.03,W,.14,2.06,materials.wall,southGroup);
// Three south-wall whiteboards, below the existing clerestory windows.
const southBoards=[1.0,3.35,5.70].map(x=>({x,p:.10,w:2.15,h:1.30}));
for(const b of southBoards){box(b.x+b.w/2,b.p,1.30,b.w,.05,b.h,materials.metal);box(b.x+b.w/2,b.p+.031,1.30,b.w-.06,.015,b.h-.06,materials.board);box(b.x+b.w/2,b.p+.09,.67,b.w,.15,.035,materials.metal);}
box(W/2,0,2.84,W,.14,.32,materials.wall,southGroup);
box(W/2,0,2.38,W,.035,.60,materials.glass,southGroup,false);
for(let x=0;x<W;x+=1.05)box(x,0,2.38,.035,.055,.62,materials.metal,southGroup);
block(0,-.08,W,.08);
// Denser frosted film with superposed sinusoidal waves, clear above/below.
// Visual film representation only, not a light-transmission or privacy simulation.
const privacyFilm={rooms:['3.12','3.14'],...DESIGN.level3.privacyFilm,panels:[]};
function privacyPattern(x0,x1,p,parent=scene,kind='fixed',room='3.14'){
 const width=x1-x0-.07;if(width<=0)return;
 const height=privacyFilm.top-privacyFilm.bottom;
 const c=document.createElement('canvas');c.width=Math.max(32,Math.ceil(width*420));c.height=512;
 const ctx=c.getContext('2d');
 for(let y=0;y<c.height;y++){
  const density=Math.min(1,3*Math.min(y/c.height,1-y/c.height));
  const alpha=privacyFilm.edgeOpacity+(privacyFilm.centreOpacity-privacyFilm.edgeOpacity)*density;
  ctx.fillStyle=`rgba(240,246,245,${alpha})`;ctx.fillRect(0,y,c.width,1);
 }
 // Two close spatial frequencies create repeating beats/nodes across the glass.
 // Use world-aligned phase so the motif continues onto the closed door.
 const phaseX=kind==='door'?(room==='3.12'?.25:teachingDoor.x)+x0+.035:x0+.035;
 for(let row=0;row<9;row++){
  ctx.beginPath();
  for(let u=0;u<=c.width;u+=2){
   const x=phaseX+u/c.width*width;
   const displacement=.040*(Math.sin(2*Math.PI*x/.78+row*.42)+Math.sin(2*Math.PI*x/1.05-row*.42));
   const y=(.16+row*.096+displacement)/height*c.height;
   if(u===0)ctx.moveTo(u,y);else ctx.lineTo(u,y);
  }
  ctx.strokeStyle='rgba(255,255,255,.96)';ctx.lineWidth=8;ctx.stroke();
  ctx.strokeStyle='rgba(63,112,122,.38)';ctx.lineWidth=2;ctx.stroke();
 }
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const film=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
 film.position.set((x0+x1)/2,(privacyFilm.bottom+privacyFilm.top)/2,-p-.017);parent.add(film);
 privacyFilm.panels.push({room,x0,x1,p,kind,bottom:privacyFilm.bottom,top:privacyFilm.top,waves:9});
}
function glassWall(x0,x1,privacy=false){
 box((x0+x1)/2,H,1.5,x1-x0,.026,2.98,materials.glass,scene,false);
 if(privacy)privacyPattern(x0,x1,H,scene,'fixed',x0<PART?'3.12':'3.14');
 for(let y of [.035,2.965])box((x0+x1)/2,H,y,x1-x0,.08,.07,materials.metal);
 let n=Math.ceil(x1-x0);for(let i=0;i<=n;i++)box(x0+(x1-x0)*i/n,H,1.5,.035,.065,3,materials.metal);
 block(x0,H-.04,x1,H+.04);
}
glassWall(0,.25,true);glassWall(1.25,PART-.3,true);glassWall(PART+.3,teachingDoor.x,true);glassWall(teachingDoor.x+teachingDoor.width,W,true);
function door(x,p,width,angleClosed,angleOpen,rect){let hinge=new THREE.Group();hinge.position.set(x,0,-p);scene.add(hinge);let local=new THREE.Group();hinge.add(local);box(width/2,0,1.08,width,.028,2.16,materials.glass,local,false);box(width/2,0,.035,width,.06,.07,materials.metal,local);box(width/2,0,2.15,width,.06,.06,materials.metal,local);for(let xx of [.02,width-.02])box(xx,0,1.08,.04,.06,2.16,materials.metal,local);box(width-.12,-.055,1.0,.035,.07,.36,materials.metal,local);doorLeaves.push({hinge,closed:angleClosed,open:angleOpen});block(...rect,'door');return hinge;}
const labDoorHinge=door(.25,H,1,0,-Math.PI/2,[.25,H-.05,1.25,H+.05]);
privacyPattern(0,1,0,labDoorHinge,'door','3.12');
const teachingDoorHinge=door(teachingDoor.x,H,teachingDoor.width,0,-Math.PI/2,[teachingDoor.x,H-.05,teachingDoor.x+teachingDoor.width,H+.05]);
privacyPattern(0,1,0,teachingDoorHinge,'door');
for(const [x,label] of [[.75,'3.12 / FLEXIBLE LAB'],[teachingDoor.x+teachingDoor.width/2,'3.14 / TEACHING']]){
 box(x,H,2.61,1,.028,.78,materials.glass,scene,false);
 sign(x,H+.035,2.5,.9,.25,[label],Math.PI);
}
box(1.31,H+.075,1.15,.085,.055,.15,materials.dark);
box(1.31,H+.108,1.185,.04,.006,.025,materials.teal);
sign(1.72,H+.035,1.16,.55,.16,['CARDAX'],Math.PI);
function desk(x0,p0,sx,sp){box(x0+sx/2,p0+sp/2,.715,sx,sp,.055,materials.wood);box(x0+sx/2,p0+sp/2,.665,sx-.12,sp-.12,.055,materials.teal);for(const x of [x0+.075,x0+sx-.075])for(const p of [p0+.10,p0+sp-.10])box(x,p,.335,.035,.035,.67,materials.metal);}
function chair(x,p,facing){const group=new THREE.Group();group.position.set(x,0,-p);group.rotation.y=facing;scene.add(group);box(0,0,.445,.43,.46,.07,materials.teal,group);box(0,-.215,.695,.44,.06,.45,materials.teal,group);for(let a of [-.165,.165])for(let b of [-.16,.16])box(a,b,.21,.027,.027,.42,materials.metal,group);}
// Floor overlays and navigation reserve occupied space, not just small seats.
// Planning assumptions, not anthropometric or accessibility certification.
const occupiedZones=[],clearanceGroup=new THREE.Group();scene.add(clearanceGroup);
const clearanceMat=new THREE.MeshBasicMaterial({color:'#cf9546',transparent:true,opacity:.24,depthWrite:false});
function occupied(x,p,w,d){
 occupiedZones.push({x,p,w,d});block(x,p,x+w,p+d,'occupied');
 box(x+w/2,p+d/2,.035,w,d,.008,clearanceMat,clearanceGroup,false);
}
// Twelve 1200 x 600 desks: three complete eight-place rows, 24 places.
for(const {x,p:p0} of teachingGroups){
 for(let n=0;n<2;n++)desk(x,p0+n*1.2,teachingDeskDepth,1.2);
 block(x,p0,x+teachingDeskDepth,p0+2.4);
 for(let n=0;n<4;n++){const p=p0+.30+n*.60;chair(x-.28,p,-Math.PI/2);teachingChairs.push({x:x-.28,p,facing:-Math.PI/2});occupied(x-.75,p-.275,.75,.55);}
}
function stool(x,p){
 cylinder(x,p,labStoolHeight,.19,.06,materials.teal);
 for(let dx of [-.11,.11])for(let dp of [-.11,.11])box(x+dx,p+dp,.30,.027,.027,.60,materials.metal);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.15,.014,6,16),materials.metal);ring.rotation.x=Math.PI/2;ring.position.set(x,.24,-p);scene.add(ring);
 block(x-.19,p-.19,x+.19,p+.19);
}
// Two seats each long side; stools drawn in 70 mm, with 530 mm occupied projection.
const serviceBlue=new THREE.MeshStandardMaterial({color:'#267ca6',roughness:.6});
const benchPower=[],benchComputers=[],computerParts=[];
for(const b of labBenches){
 box(b.x+b.w/2,b.p+b.d/2,b.h-.03,b.w,b.d,.06,materials.wood);
 box(b.x+b.w/2,b.p+b.d/2,.79,b.w-.12,b.d-.12,.10,materials.teal);
 for(const x of [b.x+.08,b.x+b.w-.08])for(const p of [b.p+.10,b.p+b.d-.10])box(x,p,.42,.045,.045,.84,materials.metal);
 block(b.x,b.p,b.x+b.w,b.p+b.d);
 for(const x of [b.x+b.w*.25,b.x+b.w*.75]){
  stool(x,b.p-labStoolOffset);stool(x,b.p+b.d+labStoolOffset);
  occupied(x-.275,b.p-labOccupiedDepth,.55,labOccupiedDepth);occupied(x-.275,b.p+b.d,.55,labOccupiedDepth);
 }
 // Retain overhead supply, descending at an end corner to below-top sockets.
 // Nothing runs along the worktop centre; the computer remains at the end.
 const centerP=b.p+b.d/2,end=b.x+b.w-.10,dropP=b.p+.10;
 box(end,(3+dropP)/2,2.68,.055,Math.abs(3-dropP)+.055,.055,serviceBlue);
 box(end,dropP,1.655,.035,.035,2.05,serviceBlue);
 // Cable containment follows the underside edge, not the shared work surface.
 box(b.x+b.w/2,dropP,.69,b.w-.12,.035,.035,serviceBlue);
 const sockets=[];
 for(const [x,face] of [[b.x+.055,-1],[b.x+b.w-.055,1]]){
  box(x,centerP,.69,.075,.60,.105,serviceBlue);
  box(x,(dropP+centerP)/2,.69,.035,centerP-dropP,.035,serviceBlue);
  for(const p of [centerP-.16,centerP+.16]){
   box(x+face*.044,p,.69,.015,.12,.080,materials.white);
   for(const dp of [-.025,.025])box(x+face*.054,p+dp,.692,.006,.012,.03,materials.dark);
   sockets.push({x,p,y:.69});
  }
 }
 // Slim vertical end post; the monitor swivels directly on the post, without an arm.
 box(end-.02,centerP,.64,.16,.23,.30,materials.dark);
 const stand=box(b.x+b.w-DESIGN.level3.pcEndInset,centerP,1.105,.035,.035,.41,materials.metal);
 box(stand.position.x,centerP,b.h+.01,.08,.10,.02,materials.metal);
 const pivotX=stand.position.x;
 cylinder(pivotX,centerP,1.31,.045,.075,materials.metal);
 const swivel=new THREE.Group();scene.add(swivel);
 box(-.035,0,1.31,.045,.57,.36,materials.dark,swivel);
 const screenFace=box(-.062,0,1.31,.012,.53,.32,serviceBlue,swivel);
 const keyboard=new THREE.Group();scene.add(keyboard);
 box(0,0,.926,.18,.42,.025,materials.dark,keyboard);
 for(let row=0;row<4;row++)for(let key=0;key<10;key++)box(-.060+row*.038,-.174+key*.038,.942,.027,.027,.008,materials.metal,keyboard);
 benchPower.push({x:end,p:dropP,feed:'overhead',mount:'under-bench ends',outlets:4,sockets,midlineRail:false});
 benchComputers.push({x:end,p:centerP,mount:'bench end',angle:0,keyboardPulled:false});
 computerParts.push({swivel,screenFace,stand,keyboard,pivotX});
}
function setComputerStation(index,angle,keyboardPulled){
 const c=benchComputers[index],parts=computerParts[index],b=labBenches[index];
 if(!c||!Number.isFinite(angle))return;
 c.angle=Math.max(-90,Math.min(90,angle));c.keyboardPulled=!!keyboardPulled;
 const radians=c.angle*Math.PI/180,pivotX=parts.pivotX;
 parts.swivel.position.set(pivotX,0,-c.p);parts.swivel.rotation.y=radians;
 const keyboardX=c.keyboardPulled?b.x+b.w*.75:c.x-.25;
 const keyboardP=c.keyboardPulled?(c.angle<0?b.p+b.d-.20:b.p+.20):c.p;
 const keyboardAngle=c.keyboardPulled?radians:0;
 parts.keyboard.position.set(keyboardX,0,-keyboardP);parts.keyboard.rotation.y=keyboardAngle;
 c.monitor={x:pivotX,p:c.p,angle:c.angle};
 const facePosition=parts.screenFace.getWorldPosition(new THREE.Vector3());
 c.monitor.face={x:facePosition.x,p:-facePosition.z};
 c.stand={x:parts.stand.position.x,p:-parts.stand.position.z};
 c.arm=null;
 c.keyboard={x:keyboardX,p:keyboardP,angle:keyboardAngle*180/Math.PI};
}
benchComputers.forEach((c,i)=>setComputerStation(i,0,false));
box(4.15,3,2.68,7.35,.08,.065,serviceBlue);
sign(4.15,3,2.81,2.4,.20,['POWER TO BENCHES · INDICATIVE']);
// West-wall services replace the former display/board, clear of the entry door.
box(.43,2.52,.40,.66,4.40,.78,materials.storage);
for(const [p0,p1] of [[.32,.65],[1.30,4.72]])box(.43,(p0+p1)/2,.87,.70,p1-p0,.06,materials.wood);
for(const x of [.13,.73])box(x,.975,.87,.10,.65,.06,materials.wood);
// Open sink basin, not a dark patch on an uninterrupted worktop.
box(.43,.975,.70,.50,.65,.035,materials.metal);
for(const x of [.195,.665])box(x,.975,.79,.03,.65,.18,materials.metal);
for(const p of [.665,1.285])box(.43,p,.79,.50,.03,.18,materials.metal);
cylinder(.17,1.39,1.06,.024,.36,materials.metal);box(.30,1.39,1.23,.28,.045,.045,materials.metal);
sign(.11,1.0,1.65,.64,.22,['SINK'],Math.PI/2);
// Solder station and local capture arm; extraction routing is schematic.
box(.47,3.50,.915,.53,.85,.025,materials.teal);
box(.28,3.83,1.01,.25,.27,.18,materials.dark);
box(.52,3.72,.975,.12,.23,.10,materials.metal);
cylinder(.16,3.93,1.43,.045,1.05,materials.dark);
box(.34,3.93,1.91,.40,.075,.075,materials.dark);
cylinder(.53,3.93,1.65,.045,.52,materials.dark);
box(.53,3.93,1.37,.25,.24,.12,materials.dark);
box(.12,3.93,2.39,.11,.11,.99,serviceBlue);
sign(.11,3.33,2.10,1.50,.26,['SOLDER · LOCAL EXTRACTION'],Math.PI/2);
block(westBench.x,westBench.p,westBench.x+westBench.w,westBench.p+westBench.d);
// Two compact enclosed printers on the north section of the east equipment wall.
const printerX=printerBench.x+printerBench.w/2;
box(printerX,printerBench.p+printerBench.d/2,.43,printerBench.w,printerBench.d,.82,materials.storage);
box(printerX,printerBench.p+printerBench.d/2,.87,printerBench.w+.04,printerBench.d+.04,.055,materials.wood);block(printerBench.x,printerBench.p,printerBench.x+printerBench.w,printerBench.p+printerBench.d);
for(const offset of printerOffsets){
 const p=printerBench.p+offset+.28;
 box(printerBench.x+.02,p,.46,.025,.65,.72,materials.storage);
 box(printerBench.x-.005,p,.69,.04,.25,.025,materials.metal);
 box(printerX,p,.94,.70,.56,.12,materials.dark);
 box(printerX,p,1.61,.70,.56,.07,materials.dark);
 for(let x of [printerX-.32,printerX+.32])for(let pp of [p-.25,p+.25])box(x,pp,1.28,.055,.055,.64,materials.dark);
 box(printerX-.33,p,1.28,.02,.49,.56,materials.glass,scene,false);
 box(printerX,p-.27,1.28,.60,.015,.56,materials.glass,scene,false);
 box(printerX,p+.27,1.28,.60,.015,.56,materials.glass,scene,false);
 box(printerX,p,1.08,.50,.40,.025,materials.metal);
 box(printerX+.06,p,1.24,.045,.47,.035,materials.metal);
 box(printerX,p,1.22,.12,.09,.13,materials.teal);
 cylinder(printerX-.08,p,1.145,.065,.10,materials.white);
}
sign(8.475,printerBench.p+printerBench.d/2,2.16,1.55,.32,['2 × 3D PRINTERS'],-Math.PI/2);
// One wide electronics cabinet on the east wall, between PV gear and printers.
// External depth 750 mm; shelf depth 650 mm, clear width 2000 mm. Illustrative
// ELVIS kits are 500 x 400 x 180 mm envelopes, not a verified equipment model.
const cupboardDoors=[];
for(const c of electronicsCupboards){
 const mid=c.p+c.d/2;
 box(c.x+c.w-.02,mid,c.h/2,.04,c.d,c.h,materials.storage);
 for(const p of [c.p+.02,c.p+c.d-.02])box(c.x+c.w/2,p,c.h/2,c.w,.04,c.h,materials.storage);
 for(const y of [.08,.42,.76,1.10,1.44,1.78,2.08])box(c.x+c.w/2,mid,y,.65,c.d-.05,.025,materials.wood);
 const doors=new THREE.Group();scene.add(doors);cupboardDoors.push(doors);
 for(const p of [c.p+c.d/4,c.p+3*c.d/4]){
  box(c.x+.015,p,1.08,.035,c.d/2-.015,2.0,materials.storage,doors);
  box(c.x-.018,p+(p<mid?1:-1)*(c.d/4-.07),1.02,.05,.025,.18,materials.metal,doors);
 }
 // Four illustrative kit envelopes per shelf; not a verified storage capacity.
 for(const y of [.42,.76,1.10,1.44,1.78]){
  box(c.x+.37,mid,y+.035,.58,c.d-.14,.045,materials.dark);
  for(const p of [mid-.70,mid-.23,mid+.23,mid+.70]){
   box(c.x+.38,p,y+.13,.50,.40,.16,materials.white);
   box(c.x+.38,p,y+.218,.37,.30,.018,materials.teal);
  }
 }
 block(c.x,c.p,c.x+c.w,c.p+c.d);
 sign(c.x-.032,mid,1.87,.74,.17,['ELECTRONICS / ELVIS'],-Math.PI/2);
}
// Photovoltaic conversion demonstration equipment: south end of the EAST wall.
// No energized wiring, ratings or safe working clearances are specified here.
box(8.40,pvGear.p+pvGear.d/2,1.03,.045,pvGear.d,1.80,materials.metal);
box(8.10,pvGear.p+.62,1.24,.50,.58,.88,materials.white);
box(7.837,pvGear.p+.62,1.40,.02,.30,.17,materials.dark);
for(let p of [pvGear.p+.35,pvGear.p+.51,pvGear.p+.67,pvGear.p+.83])box(7.832,p,1.02,.02,.065,.20,materials.metal);
box(8.02,pvGear.p+.18,.69,.35,.22,.29,serviceBlue);
box(7.83,pvGear.p+.18,.71,.045,.10,.10,materials.dark);
box(8.34,pvGear.p+.56,.42,.08,.89,.08,serviceBlue);
box(8.34,pvGear.p+1.0,1.35,.08,.08,1.80,serviceBlue);
box(8.05,pvGear.p+.55,.13,.62,.96,.20,materials.storage);
sign(7.79,pvGear.p+.56,1.93,1.02,.25,['PV CONVERTER GEAR'],-Math.PI/2);
block(pvGear.x,pvGear.p,pvGear.x+pvGear.w,pvGear.p+pvGear.d);
// Lectern touches the front (east) edge of the first south teaching desk.
box(lectern.x+lectern.w/2,lectern.p+lectern.d/2,.41,lectern.w-.04,lectern.d-.04,.70,materials.teal);
box(lectern.x+lectern.w/2,lectern.p+lectern.d/2,.79,lectern.w,lectern.d,.055,materials.wood);
box(lectern.x+lectern.w/2,lectern.p+lectern.d/2,.84,.38,.34,.035,materials.dark);
block(lectern.x,lectern.p,lectern.x+lectern.w,lectern.p+lectern.d);
// Paired 1.8 m, 16:9 displays, separated by 150 mm along the wall.
// Each has independent over/under board tracks behind it. Heights are illustrative.
for(const p0 of [.88,2.90]){
 const center=p0+1;
 for(let p of [p0+.025,p0+1.975])box(W-.08,p,1.76,.10,.055,2.48,materials.metal);
 for(let i=0;i<2;i++){
  const g=new THREE.Group();scene.add(g);g.position.y=1.165+i*1.20;
  const x=W-.085-i*.05;
  box(x,center,0,.035,1.91,1.17,materials.metal,g);
  box(x-.025,center,0,.014,1.85,1.11,materials.board,g);
  box(x-.05,center,-.48,.025,.32,.025,materials.metal,g);
  g.userData.lower=i===0;boardPanels.push(g);
 }
}
// The precise screen centres differ from the slightly wider board centres.
for(const p of [1.895,3.845]){
 const g=new THREE.Group();g.position.set(W-.23,1.95,-p);scene.add(g);
 box(0,0,0,.075,1.8,1.0125,materials.dark,g);
 const texture=textTexture(['3.14','TEACHING SPACE'],{w:1280,h:720,size:68,bg:'#173b49',fg:'#bce6df'});
 const face=new THREE.Mesh(new THREE.PlaneGeometry(1.72,.9325),new THREE.MeshBasicMaterial({map:texture}));
 face.position.set(-.041,0,0);face.rotation.y=-Math.PI/2;g.add(face);screenMeshes.push(g);
 box(W-.23,p,2.94,.16,1.84,.10,materials.white);
}
box(W/2,H/2,3.07,W,H,.14,materials.white,roof);
for(let x of [1.6,4.2,6.8,9.5,12,14.3])for(let p of [1.7,4.4]){
 box(x,p,2.96,.12,1.35,.055,materials.metal,lights);
 box(x,p,2.927,.09,1.31,.012,materials.glow,lights,false);
}
const hemi=new THREE.HemisphereLight('#f2f9ff','#929689',2);scene.add(hemi);
const key=new THREE.DirectionalLight('#fff5dc',2.4);positionNorthEastSun(key,7.67,2.99);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-18,right:18,top:14,bottom:-14,near:.1,far:55});key.shadow.normalBias=.025;scene.add(key,key.target);
const fill=new THREE.DirectionalLight('#d9eeff',1.3);fill.position.set(16,6,-13);scene.add(fill);
for(const [x,p] of [[3,3],[6.5,3],[11.5,3]]){let l=new THREE.PointLight('#fff2dc',16,8,2);l.position.set(x,2.75,-p);scene.add(l);}
box(W/2,3,-.27,36,25,.06,new THREE.MeshStandardMaterial({color:'#dfe6e5',roughness:1}),scene,false);

const views={
 overview:{label:'Whole floor',pos:[20,14,12],target:[7.5,0,-3],mode:'orbit'},
 labmodel:{label:'Lab overview',pos:[-6,11,8],target:[4.3,0,-3],mode:'orbit'},
 entry:{label:'Lab entrance',x:.77,p:6.65,eye:1.65,target:[4.4,1.25,-2.8]},
 maker:{label:'Electronics lab · 16 places',x:1.40,p:3.475,eye:1.65,target:[5.7,1.1,-4.0]},
 desking:{label:'Powered benches & south whiteboards',x:1.40,p:1.25,eye:1.65,target:[3.4,1.15,-.08]},
 storage:{label:'Wide electronics & ELVIS cabinet',x:7.2,p:2.62,eye:1.65,target:[8.30,1.2,-2.62]},
 services:{label:'West workbench · sink & solder extraction',x:1.15,p:3.0,eye:1.65,target:[.35,1.2,-3.6]},
 power:{label:'Photovoltaic converter equipment',x:7.2,p:1.0,eye:1.65,target:[8.15,1.2,-.95]},
 student:{label:'Student’s view · facing east',x:11.17,p:4.30,eye:1.2,target:[14.99,1.95,-3.05],seated:true},
 speaker:{label:'Teaching space · east-wall screens',x:14.5,p:2.95,eye:1.65,target:[11.4,1.1,-3]},
 corridor:{label:'Upper glazed corridor',x:5.8,p:6.8,eye:1.65,target:[14.74,1.3,-5.98]},
 teachingentry:{label:'3.14 entrance · east end',x:14.74,p:6.65,eye:1.65,target:[14.74,1.3,-3.4]}
};
let yaw=0,pitch=0,seated=false,retract=0,toastTimer=0,drag=null,moved=false;
function notify(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500);}
function appearance(){roof.visible=state.ceiling;lights.visible=state.ceiling;outerCut.forEach(m=>m.visible=!state.cutaway);doorLeaves.forEach(d=>d.hinge.rotation.y=state.doors?d.open:d.closed);cupboardDoors.forEach(g=>g.visible=!state.storageOpen);clearanceGroup.visible=state.clearances;$('clearances').checked=state.clearances;$('storageOpen').checked=state.storageOpen;$('screens').checked=state.retracted;$('doors').checked=state.doors;$('ceiling').checked=state.ceiling;$('cutaway').checked=state.cutaway;}
function updateUI(){for(let name of ['orbit','walk']){$(name).classList.toggle('active',state.mode===name);$(name).setAttribute('aria-pressed',state.mode===name);}$('walkpad').hidden=state.mode!=='walk';$('eye').textContent=state.mode==='orbit'?'Orbit view':`${state.eye.toFixed(2)} m eye level`;$('height').value=state.eye;$('heightvalue').value=state.eye.toFixed(2)+' m';$('help').textContent=state.mode==='orbit'?'Drag to orbit · scroll to zoom · right-drag to pan':'Drag to look · W A S D / arrows to move · Shift to move faster';document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===state.view));}
function look(target){let d=new THREE.Vector3(...target).sub(camera.position).normalize();yaw=Math.atan2(d.x,-d.z);pitch=Math.asin(d.y);updateLook();}
function updateLook(){camera.lookAt(camera.position.clone().add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))));}
function go(name){let v=views[name];if(!v)throw new Error('Unknown viewpoint');state.view=name;state.mode=v.mode??'walk';orbit.enabled=state.mode==='orbit';state.ceiling=state.mode==='walk';state.cutaway=state.mode==='orbit';seated=!!v.seated;keys.clear();if(v.pos){camera.position.set(...v.pos);orbit.target.set(...v.target);orbit.update();}else{state.eye=v.eye;camera.position.set(v.x,state.eye,-v.p);look(v.target);}appearance();$('viewname').textContent=v.label;updateUI();canvas.focus({preventScroll:true});}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
$('orbit').onclick=()=>go('overview');$('walk').onclick=()=>{if(state.mode!=='walk')go('entry');};
for(let [id,key] of [['screens','retracted'],['doors','doors'],['ceiling','ceiling'],['cutaway','cutaway']])$(id).onchange=e=>{state[key]=e.target.checked;appearance();if(id==='screens')notify(state.retracted?'Screens raised · four whiteboard panels exposed':'Screens lowered');};
$('boards').oninput=e=>{boardSlide=Number(e.target.value)/100;$('boardvalue').textContent=boardSlide===0?'Spread':boardSlide===1?'Swapped':'Sliding';state.retracted=true;appearance();};
$('storageOpen').onchange=e=>{state.storageOpen=e.target.checked;appearance();};
function computerControls(){
 const c=benchComputers[Number($('computerBench').value)||0];
 $('monitorAngle').value=c.angle;
 $('monitorAngleValue').textContent=c.angle===0?'Parked':`${Math.abs(c.angle)}° ${c.angle<0?'north':'south'}`;
 $('keyboardPulled').checked=c.keyboardPulled;
}
function adjustComputer(angle,pulled){setComputerStation(Number($('computerBench').value)||0,angle,pulled);computerControls();}
$('computerBench').onchange=computerControls;
$('monitorAngle').oninput=e=>adjustComputer(Number(e.target.value),$('keyboardPulled').checked);
$('keyboardPulled').onchange=e=>adjustComputer(Number($('monitorAngle').value),e.target.checked);
$('computerSouth').onclick=()=>adjustComputer(90,true);
$('computerNorth').onclick=()=>adjustComputer(-90,true);
$('computerPark').onclick=()=>adjustComputer(0,false);
computerControls();
$('clearances').onchange=e=>{state.clearances=e.target.checked;appearance();};
$('height').oninput=e=>{state.eye=Number(e.target.value);if(state.mode==='walk')camera.position.y=state.eye;updateUI();};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.body.classList.toggle('fullscreen');resize();}};
document.addEventListener('fullscreenchange',()=>{document.body.classList.toggle('fullscreen',!!document.fullscreenElement);resize();});
const keys=new Set();
window.addEventListener('keydown',e=>{if(e.target.matches?.('input,select,button'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)&&state.mode==='walk'){e.preventDefault();keys.add(e.code);}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();drag=null;});
document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();keys.add(b.dataset.move);b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.move);});
canvas.addEventListener('pointerdown',e=>{if(state.mode!=='walk')return;canvas.focus({preventScroll:true});drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||state.mode!=='walk')return;yaw+=(e.clientX-drag.x)*.004;pitch=Math.max(-1.2,Math.min(1.2,pitch-(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY;updateLook();});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('contextmenu',e=>e.preventDefault());
function allowed(x,z){let p=-z,r=.25;if(x<-.85||x>W+.85||p< -1.35||p>H+1.35)return false;for(let b of (state.doors?solid:solid.concat(doorBlocks))){if(x>b.x0-r&&x<b.x1+r&&p>b.p0-r&&p<b.p1+r)return false;}return true;}
function step(dx,dz){let n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));for(let i=0;i<n;i++){if(allowed(camera.position.x+dx/n,camera.position.z))camera.position.x+=dx/n;if(allowed(camera.position.x,camera.position.z+dz/n))camera.position.z+=dz/n;}}
// Map uses the exact same coordinate data as the model and reads camera pose.
const map=$('map'),ctx=map.getContext('2d'),scale=30,ox=39,oy=250;
function mapRect(x,p,sx,sp,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(ox+x*scale,oy-(p+sp)*scale,sx*scale,sp*scale);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.strokeRect(ox+x*scale,oy-(p+sp)*scale,sx*scale,sp*scale);}}
function drawMap(){
 ctx.clearRect(0,0,map.width,map.height);
 mapRect(-1,-1.2,W+2,H+2.4,'#dfe5e5');
 mapRect(0,0,PART,H,'#e6e1d6','#6b8a90');mapRect(PART,0,W-PART,H,'#d2e4e6','#6b8a90');
 if(state.clearances)for(const z of occupiedZones)mapRect(z.x,z.p,z.w,z.d,'#e5c58f');
 for(const {x,p,w,d} of teachingGroups)mapRect(x,p,w,d,'#668c91');
 for(const b of labBenches){mapRect(b.x,b.p,b.w,b.d,'#aa9679');for(const p of [b.p-labStoolOffset,b.p+b.d+labStoolOffset])for(const x of [b.x+b.w*.25,b.x+b.w*.75])mapRect(x-.19,p-.19,.38,.38,'#477b80');for(const x of [b.x+.055,b.x+b.w-.055])mapRect(x-.0375,b.p+b.d/2-.30,.075,.60,'#267ca6');}
 for(const c of benchComputers){
  ctx.save();ctx.translate(ox+c.monitor.x*scale,oy-c.monitor.p*scale);ctx.rotate(-c.angle*Math.PI/180);ctx.fillStyle='#172c39';ctx.fillRect(-.0575*scale,-.285*scale,.045*scale,.57*scale);ctx.restore();
  ctx.save();ctx.translate(ox+c.keyboard.x*scale,oy-c.keyboard.p*scale);ctx.rotate(-c.keyboard.angle*Math.PI/180);ctx.fillStyle='#304e59';ctx.fillRect(-.09*scale,-.21*scale,.18*scale,.42*scale);ctx.restore();
 }
 mapRect(westBench.x,westBench.p,westBench.w,westBench.d,'#aa9679');
 mapRect(.18,.65,.50,.65,'#a9bdc7','#526875');
 mapRect(.20,3.15,.54,.95,'#477b80');
 mapRect(pvGear.x,pvGear.p,pvGear.w,pvGear.d,'#267ca6');
 mapRect(printerBench.x,printerBench.p,printerBench.w,printerBench.d,'#94a68e');
 for(const c of electronicsCupboards)mapRect(c.x,c.p,c.w,c.d,'#718d7a');
 for(const b of southBoards)mapRect(b.x,b.p,b.w,.06,'#ffffff','#7b8c8c');
 mapRect(lectern.x,lectern.p,lectern.w,lectern.d,'#456b78');
 for(let p of [.995,2.945])mapRect(W-.2675,p,.075,1.8,'#183b49');
 mapRect(PART-.07,.3,.14,H-.6,'#546e70');
 for(let c of columns)mapRect(c.x-.3,c.p-.3,.6,.6,'#92998f');
 ctx.fillStyle='#218e95';ctx.fillRect(ox,oy-H*scale-2,W*scale,3);
 for(let x of [.25,teachingDoor.x])mapRect(x,H-.04,1,.08,'#dfe5e5');
 ctx.fillStyle='#304e59';ctx.font='15px system-ui';ctx.textAlign='center';
 ctx.fillText('3.12 · 16 PLACES',ox+3.7*scale,oy-3.02*scale);
 ctx.fillText(`3.14 · ${teachingChairs.length} SEATS`,ox+12.1*scale,oy-2.85*scale);
 ctx.font='12px system-ui';ctx.fillText('UPPER CORRIDOR · FULL-HEIGHT GLASS',ox+W/2*scale,oy-6.75*scale);
 if(state.mode==='walk'){const cx=ox+camera.position.x*scale,cy=oy+camera.position.z*scale;ctx.save();ctx.translate(cx,cy);ctx.rotate(yaw);ctx.fillStyle='#057e88';ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(-9,7);ctx.lineTo(0,3);ctx.lineTo(9,7);ctx.closePath();ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
}
map.onclick=e=>{const b=map.getBoundingClientRect(),x=((e.clientX-b.left)*map.width/b.width-ox)/scale,p=(oy-(e.clientY-b.top)*map.height/b.height)/scale;go(p>H?'corridor':x>PART?'speaker':p<2.8?'desking':'maker');};
map.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go('maker');}};

function resize(){let r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(viewport);
let last=performance.now();function animate(now){requestAnimationFrame(animate);let dt=Math.min((now-last)/1000,.05);last=now;if(state.mode==='orbit')orbit.update();else{let f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),r=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);if(f||r){if(seated){camera.position.set(11.17,state.eye,-2.95);seated=false;notify('Moved to the side aisle to leave the seat');}const rate=dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?2.8:1.4)/Math.max(1,Math.hypot(f,r));step((Math.sin(yaw)*f+Math.cos(yaw)*r)*rate,(-Math.cos(yaw)*f+Math.sin(yaw)*r)*rate);}updateLook();}let goal=state.retracted?1:0;retract=THREE.MathUtils.damp(retract,goal,7,dt);for(let m of screenMeshes){m.position.y=1.95+1.56*retract;m.visible=retract<.985;}for(const panel of boardPanels)panel.position.y=panel.userData.lower?1.165+1.2*boardSlide:2.365-1.2*boardSlide;renderer.render(scene,camera);drawMap();}
go('overview');resize();$('loading').classList.add('hidden');requestAnimationFrame(animate);

// Read-only snapshot; uses the same plan data as geometry and navigation.
window.level3={snapshot:()=>({designRevision:DESIGN.revision,mode:state.mode,view:state.view,eye:state.eye,position:camera.position.toArray(),ceilingHeight:CH,lectern,labLayout,labGapX,labOuterGapX,labGapP,labLongGap,labNorthGap,labStoolOffset,labOccupiedDepth,teachingSeats:teachingChairs.length,teachingGroups,privacyFilm,teachingChairs,teachingScreens:screenMeshes.map(g=>({x:g.position.x,p:-g.position.z,faceRotation:g.children[1].rotation.y})),teachingDoor:{x:doorLeaves[1].hinge.position.x,p:-doorLeaves[1].hinge.position.z,width:teachingDoor.width},lectureRows,teachingRuns,teachingDeskDepth,occupiedZones,clearances:state.clearances,labBenches,labBenchHeight,labStoolHeight,benchPower,benchComputers,westBench,pvGear,southBoards,westWallDisplay:false,sink:{x:.18,p:.65,w:.50,d:.65},solderStation:{x:.20,p:3.15,w:.54,d:.95,extraction:true},printerBench,labStools:labBenches.length*4,electronicsCupboards,cupboardShelfDepth:.65,storageOpen:state.storageOpen,labSouthWall:'whiteboard below continuous high-level windows',southWindows:{x0:0,x1:W,sill:2.08,head:2.68},printers:printerOffsets.length,partition:PART,columns,screenWidth:1.8,screenGap:.15,screenRetraction:retract,doorsOpen:state.doors}),views:Object.keys(views),isFree:(x,p)=>allowed(x,-p)};
// Optional browser-native navigation, using exactly the same action as the buttons.
const modelContext=document.modelContext;
if(modelContext?.registerTool){
 const lifetime=new AbortController();window.addEventListener('pagehide',()=>lifetime.abort());
 try{Promise.resolve(modelContext.registerTool({name:'navigate_level3_view',description:'Show a named viewpoint in the Level 3 lab and teaching walkthrough.',inputSchema:{type:'object',properties:{view:{type:'string',enum:Object.keys(views)}},required:['view'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!Object.hasOwn(views,input.view))throw new Error('Choose a listed viewpoint');go(input.view);return {view:state.view,mode:state.mode,eyeHeight:state.eye};}},{signal:lifetime.signal})).catch(()=>{});}catch{}
}
