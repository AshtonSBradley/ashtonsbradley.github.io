import * as THREE from 'three';
import DESIGN from '../../design-state.js';
import {positionNorthEastSun} from '../../sunlight.js?v=20260914-ne-sun';
import { OrbitControls } from '../../vendor/OrbitControls.js';

// Plan coordinates: x increases east, p increases north; world z = -p.
// Room geometry follows TikZ page 2, with the west entrance recessed below.
const W=10.750,H=8.456,PART=7.480,COL={x:8.530,p:2.806,w:.600},SPLIT=2.806,CH=3;
const westEntry=DESIGN.level2.westEntry;
const $=id=>document.getElementById(id), canvas=$('scene'), viewport=$('viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e5ebeb');
const camera=new THREE.PerspectiveCamera(58,1,.025,120);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('loading').textContent='This browser could not start 3D graphics. Please open this walkthrough in a browser with WebGL enabled.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.minDistance=2;orbit.maxDistance=32;orbit.maxPolarAngle=Math.PI*.49;orbit.target.set(5.2,0,-4.2);
const state={mode:'orbit',view:'overview',eye:1.65,doors:true,retracted:false,ceiling:false,cutaway:true,yaw:0,pitch:0};
const solid=[],doorBlocks=[],outerCut=[],doorLeaves=[],screenMeshes=[],boardPanels=[];
const lectern={x:5.52,p:1.38,w:.75,d:1.30};
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
const lectureFloor=floorMat('#839599'),meetingFloor=floorMat('#a9aaa0'),corridorFloor=floorMat('#c2c8c7');
box(W/2,H/2,-.13,W+.22,H+.22,.26,materials.base);
box(PART/2,H/2,.005,PART,H,.035,lectureFloor);
box((PART+W)/2,(SPLIT+H)/2,.007,W-PART,H-SPLIT,.035,meetingFloor);
box((PART+W)/2,SPLIT/2,.007,W-PART,SPLIT,.035,floorMat('#b6bda9'));
box(W/2,H+.8,-.045,W+3.0,1.6,.10,corridorFloor);
box(W/2,-.8,-.045,W+3.0,1.6,.10,corridorFloor);
box(W+.75,H/2,-.045,1.5,H,.10,corridorFloor);
box(-1.78,1.23,-.045,3.55,2.46,.10,corridorFloor);
const shaft=box(-1.775,(2.46+H)/2,1.5,3.55,H-2.46,3,materials.column);outerCut.push(shaft);block(-3.55,2.46,0,H);
wall(PART,0,PART,H,materials.partition);
wall(PART,SPLIT,W,SPLIT,materials.partition);
box(COL.x,COL.p,CH/2,COL.w,COL.w,CH,materials.column);block(COL.x-.3,COL.p-.3,COL.x+.3,COL.p+.3);
wall(0,2.25,0,H,materials.wall,true);wall(0,0,0,.45,materials.wall,true);
wall(W,0,W,.72,materials.wall,true);wall(W,1.62,W,H,materials.wall,true);
// South wall has high-level borrowed-light glazing, not an exterior view.
let southGroup=new THREE.Group();scene.add(southGroup);outerCut.push(southGroup);
box(W/2,0,1.03,W,.14,2.06,materials.wall,southGroup);box(W/2,0,2.84,W,.14,.32,materials.wall,southGroup);
box(W/2,0,2.38,W,.035,.60,materials.glass,southGroup,false);
for(let x=0;x<W;x+=1.05)box(x,0,2.38,.035,.055,.62,materials.metal,southGroup);
block(0,-.08,W,.08);
// Denser frosted film with superposed sinusoidal waves, clear above/below.
// Visual film representation only, not a light-transmission or privacy simulation.
const privacyFilm={rooms:['2.28','meeting'],...DESIGN.level2.privacyFilm,panels:[]};
function privacyPattern(x0,x1,p,parent=scene,kind='fixed',room='2.28',originX=0){
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
 const phaseX=originX+x0+.035;
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
function glassWall(x0,x1){privacyPattern(x0,x1,H,scene,'fixed',x0<PART?'2.28':'meeting');box((x0+x1)/2,H,1.5,x1-x0,.026,2.98,materials.glass,scene,false);box((x0+x1)/2,H,.035,x1-x0,.08,.07,materials.metal);box((x0+x1)/2,H,2.965,x1-x0,.08,.07,materials.metal);let n=Math.ceil(x1-x0);for(let i=0;i<=n;i++)box(x0+(x1-x0)*i/n,H,1.5,.035,.065,3,materials.metal);block(x0,H-.04,x1,H+.04);}
glassWall(.9,PART);glassWall(PART,8.75);glassWall(9.65,W);
// Doors are hinged glazed leaves; west double doors are set back into a recess.
function door(x,p,width,angleClosed,angleOpen,rect,handleSide=1){let hinge=new THREE.Group();hinge.position.set(x,0,-p);scene.add(hinge);let local=new THREE.Group();hinge.add(local);box(width/2,0,1.08,width,.028,2.16,materials.glass,local,false);box(width/2,0,.035,width,.06,.07,materials.metal,local);box(width/2,0,2.15,width,.06,.06,materials.metal,local);for(let xx of [.02,width-.02])box(xx,0,1.08,.04,.06,2.16,materials.metal,local);box(width-.12,-.055*handleSide,1.0,.035,.07,.36,materials.metal,local);doorLeaves.push({hinge,closed:angleClosed,open:angleOpen});block(...rect,'door');return hinge;}
const westEntryDoors=[
 door(westEntry.x,.45,.9,Math.PI/2,0,[westEntry.x-.06,.45,westEntry.x+.06,1.35],-1),
 door(westEntry.x,2.25,.9,-Math.PI/2,0,[westEntry.x-.06,1.35,westEntry.x+.06,2.25])
];
// Clear glazed returns enclose the door swing outside the original x=0 room line.
for(const p of [westEntry.returnP0,westEntry.returnP1]){
 box(westEntry.x/2,p,1.5,westEntry.depth,.026,3,materials.glass,scene,false);
 for(const x of [westEntry.x,0])box(x,p,1.5,.045,.055,3,materials.metal);
 for(const y of [.035,2.965])box(westEntry.x/2,p,y,westEntry.depth,.055,.07,materials.metal);
 block(westEntry.x,p-.03,0,p+.03);
}
// Narrow fixed sidelights join the unchanged 1.8 m double opening to the returns.
for(const [p0,p1] of [[westEntry.returnP0,westEntry.p0],[westEntry.p1,westEntry.returnP1]]){
 box(westEntry.x,(p0+p1)/2,1.08,.026,p1-p0,2.16,materials.glass,scene,false);
 block(westEntry.x-.03,p0,westEntry.x+.03,p1);
}
box(westEntry.x/2,1.35,.006,westEntry.depth,westEntry.returnP1-westEntry.returnP0,.035,lectureFloor);
box(westEntry.x/2,1.35,3.07,westEntry.depth,westEntry.returnP1-westEntry.returnP0,.14,materials.white,roof);
const northLectureDoor=door(0,H,.9,0,-Math.PI/2,[0,H-.05,.9,H+.05]);
privacyPattern(0,.9,0,northLectureDoor,'door','2.28',0);
const northMeetingDoor=door(8.75,H,.9,0,-Math.PI/2,[8.75,H-.05,9.65,H+.05]);
privacyPattern(0,.9,0,northMeetingDoor,'door','meeting',8.75);
door(W,.72,.9,Math.PI/2,Math.PI,[W-.05,.72,W+.05,1.62]);
// Door heads and signs establish scale in eye-level views.
box(westEntry.x,1.35,2.58,.15,westEntry.returnP1-westEntry.returnP0,.84,materials.wall);outerCut.push(scene.children.at(-1));
for(const [x,w] of [[.45,.9],[9.2,.9]])box(x,H,2.61,w,.055,.78,materials.glass,scene,false);
sign(westEntry.x-.085,1.35,2.38,.80,.24,['2.28 / TEACHING'],-Math.PI/2);
sign(9.2,H+.035,2.52,.68,.25,['MEETING ROOM'],Math.PI);
sign(W+.09,1.17,2.38,.70,.22,['STORE'],Math.PI/2);
function desk(x0,p0,sx,sp){box(x0+sx/2,p0+sp/2,.715,sx,sp,.055,materials.wood);box(x0+sx/2,p0+sp/2,.665,sx-.12,sp-.12,.055,materials.teal);for(const x of [x0+.075,x0+sx-.075])for(const p of [p0+.10,p0+sp-.10])box(x,p,.335,.035,.035,.67,materials.metal);}
function chair(x,p,facing){const group=new THREE.Group();group.position.set(x,0,-p);group.rotation.y=facing;scene.add(group);box(0,0,.445,.43,.46,.07,materials.teal,group);box(0,-.215,.695,.44,.06,.45,materials.teal,group);for(let a of [-.165,.165])for(let b of [-.16,.16])box(a,b,.21,.027,.027,.42,materials.metal,group);}
const lectureRows=[1.4,3.15,4.9];
for(const x of lectureRows){for(let n=0;n<5;n++)desk(x,1.228+n*1.2,.62,1.2);block(x,1.228,x+.62,7.228);for(let n=0;n<10;n++){let p=1.528+n*.6;chair(x-.31,p,-Math.PI/2);block(x-.57,p-.22,x-.08,p+.22);}}
// Shifted 650 mm north: the lectern no longer projects into the south side aisle.
box(5.895,2.03,.41,.71,1.26,.70,materials.teal);box(5.895,2.03,.79,.75,1.30,.055,materials.wood);for(let x of [5.61,6.18])for(let p of [1.49,2.57])cylinder(x,p,.075,.055,.09,materials.metal);box(5.9,2.22,.83,.35,.45,.025,materials.dark);block(lectern.x,lectern.p,lectern.x+lectern.w,lectern.p+lectern.d);
// Meeting table: 3.25 x 1.10 m, centred east-west, shifted .30 m north.
const mc=(PART+W)/2;
desk(mc-.55,4.095,1.10,3.25);block(mc-.55,4.095,mc+.55,7.345);
for(let p of [4.42,5.07,5.72,6.37,7.02]){chair(mc-.79,p,-Math.PI/2);chair(mc+.79,p,Math.PI/2);block(mc-1.04,p-.23,mc-.56,p+.23);block(mc+.56,p-.23,mc+1.04,p+.23);}
// AV console is forward of the column on the meeting side of the return wall.
box(mc,3.346,.36,2,.40,.70,materials.wood);block(mc-1,3.146,mc+1,3.546);
box(mc,3.18,1.64,1.8,.07,1.04,materials.dark);
sign(mc,3.224,1.65,1.69,.94,['MEETING ROOM','10 places'],Math.PI);
box(mc,3.224,2.22,.22,.08,.06,materials.dark);
cylinder(mc,5.72,.76,.085,.035,materials.dark);
// Two side-by-side, twin-panel counter-sliding whiteboards: four panels total.
// Separate depth tracks let the panels pass under/over one another.
// The frames span 0.58–2.95 m; rails terminate at the 3 m ceiling.
for(let p0 of [1.128,4.328]){
 for(let p of [p0+.035,p0+2.965])box(PART-.13,p,1.76,.20,.055,2.48,materials.metal);
 for(let i=0;i<2;i++){
  const g=new THREE.Group();scene.add(g);g.position.y=1.165+i*1.20;
  const x=PART-.13-i*.095;
  box(x,p0+1.5,0,.055,2.91,1.17,materials.metal,g);
  box(x-.035,p0+1.5,0,.024,2.85,1.11,materials.board,g);
  box(x-.077,p0+1.5,-.48,.065,.32,.025,materials.metal,g);
  g.userData.lower=i===0;boardPanels.push(g);
 }
 box(PART-.35,p0+1.5,2.94,.18,3.10,.12,materials.white);
 const screen=box(PART-.40,p0+1.5,2.875-1.6875/2,.035,3,1.6875,materials.white);
 screen.userData.height=1.6875;screenMeshes.push(screen);
}
function cabinet(x0,p0,sx,sp,height){box(x0+sx/2,p0+sp/2,height/2+.04,sx,sp,height,materials.storage);box(x0+sx/2,p0+sp/2,.05,sx-.08,sp-.08,.10,materials.metal);block(x0,p0,x0+sx,p0+sp);}
cabinet(PART+.08,.14,.55,2.14,2.15);
for(let p of [.4075,.9425,1.4775,2.0125]){box(PART+.635,p,1.13,.025,.50,2.07,materials.storage);box(PART+.67,p+.16,1.10,.035,.025,.25,materials.metal);}
cabinet(9.02,.14,1.26,.58,.80);box(9.65,.43,.87,1.30,.62,.055,materials.wood);
cabinet(9.1,1.72,.92,.76,1.10);
for(let p of [1.9,2.22])box(9.56,p,1.23,.56,.22,.18,materials.white);
// Ceiling is exactly 3.000 m above finished floor, as specified by the user.
box(W/2,H/2,3.07,W,H,.14,materials.white,roof);
for(let x of [1.8,3.9,6.1,9.1])for(let p of [2.0,5.5]){box(x,p,2.96,.12,1.50,.055,materials.metal,lights);box(x,p,2.927,.09,1.46,.012,materials.glow,lights,false);}
const hemi=new THREE.HemisphereLight('#f2f9ff','#929689',2.0);scene.add(hemi);
const key=new THREE.DirectionalLight('#fff5dc',2.4);positionNorthEastSun(key,5.375,4.228);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.1,far:55});key.shadow.normalBias=.025;scene.add(key,key.target);
const fill=new THREE.DirectionalLight('#d9eeff',1.3);fill.position.set(12,6,-13);scene.add(fill);
for(let [x,p] of [[3.7,4.2],[9.1,5.7],[9.2,1.5]]){let l=new THREE.PointLight('#fff2dc',16,8,2);l.position.set(x,2.75,-p);scene.add(l);}
// Exterior mat catches soft shadows; corridors receive the same studio light.
box(4,4,-.27,32,27,.06,new THREE.MeshStandardMaterial({color:'#dfe6e5',roughness:1}),scene,false);

const views={
 overview:{label:'Whole floor',pos:[-8.7,13.8,9.8],target:[4.3,0,-4.2],mode:'orbit'},
 entry:{label:'Recessed glass entrance',x:-2.05,p:1.35,eye:1.65,target:[3.2,1.4,-1.35]},
 student:{label:'Student’s view',x:1.4-.31,p:4.228,eye:1.20,target:[7.30,1.65,-4.228],seated:true},
 speaker:{label:'Speaker’s view',x:6.55,p:2.25,eye:1.65,target:[2.6,1.05,-4.9]},
 meeting:{label:'Meeting room',x:8.0,p:7.63,eye:1.65,target:[9.1,1.4,-3.35]},
 store:{label:'Store',x:9.38,p:1.05,eye:1.65,target:[7.75,1.1,-1.6]}
};
let yaw=0,pitch=0,seated=false,retract=0,toastTimer=0,drag=null,moved=false;
function notify(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500);}
function appearance(){roof.visible=state.ceiling;lights.visible=state.ceiling;outerCut.forEach(m=>m.visible=!state.cutaway);doorLeaves.forEach(d=>d.hinge.rotation.y=state.doors?d.open:d.closed);$('screens').checked=state.retracted;$('doors').checked=state.doors;$('ceiling').checked=state.ceiling;$('cutaway').checked=state.cutaway;}
function updateUI(){for(let name of ['orbit','walk']){$(name).classList.toggle('active',state.mode===name);$(name).setAttribute('aria-pressed',state.mode===name);}$('walkpad').hidden=state.mode!=='walk';$('eye').textContent=state.mode==='orbit'?'Orbit view':`${state.eye.toFixed(2)} m eye level`;$('height').value=state.eye;$('heightvalue').value=state.eye.toFixed(2)+' m';$('help').textContent=state.mode==='orbit'?'Drag to orbit · scroll to zoom · right-drag to pan':'Drag to look · W A S D / arrows to move · Shift to move faster';document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===state.view));}
function look(target){let d=new THREE.Vector3(...target).sub(camera.position).normalize();yaw=Math.atan2(d.x,-d.z);pitch=Math.asin(d.y);updateLook();}
function updateLook(){camera.lookAt(camera.position.clone().add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))));}
function go(name){let v=views[name];if(!v)throw new Error('Unknown viewpoint');state.view=name;state.mode=v.mode??'walk';orbit.enabled=state.mode==='orbit';state.ceiling=state.mode==='walk';state.cutaway=state.mode==='orbit';seated=!!v.seated;keys.clear();if(v.pos){camera.position.set(...v.pos);orbit.target.set(...v.target);orbit.update();}else{state.eye=v.eye;camera.position.set(v.x,state.eye,-v.p);look(v.target);}appearance();$('viewname').textContent=v.label;updateUI();canvas.focus({preventScroll:true});}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
$('orbit').onclick=()=>go('overview');$('walk').onclick=()=>{if(state.mode!=='walk')go('entry');};
for(let [id,key] of [['screens','retracted'],['doors','doors'],['ceiling','ceiling'],['cutaway','cutaway']])$(id).onchange=e=>{state[key]=e.target.checked;appearance();if(id==='screens')notify(state.retracted?'Screens raised · four whiteboard panels exposed':'Screens lowered');};
$('boards').oninput=e=>{boardSlide=Number(e.target.value)/100;$('boardvalue').textContent=boardSlide===0?'Spread':boardSlide===1?'Swapped':'Sliding';state.retracted=true;appearance();};
$('height').oninput=e=>{state.eye=Number(e.target.value);if(state.mode==='walk')camera.position.y=state.eye;updateUI();};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.body.classList.toggle('fullscreen');resize();}};
document.addEventListener('fullscreenchange',()=>{document.body.classList.toggle('fullscreen',!!document.fullscreenElement);resize();});
const keys=new Set();
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)&&state.mode==='walk'){e.preventDefault();keys.add(e.code);}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();drag=null;});
document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();keys.add(b.dataset.move);b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.move);});
canvas.addEventListener('pointerdown',e=>{if(state.mode!=='walk')return;canvas.focus({preventScroll:true});drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||state.mode!=='walk')return;yaw+=(e.clientX-drag.x)*.004;pitch=Math.max(-1.2,Math.min(1.2,pitch-(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY;updateLook();});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('contextmenu',e=>e.preventDefault());
function allowed(x,z){let p=-z,r=.15;if(x< -3.3||x>W+1.3||p< -1.35||p>H+1.35)return false;if(x<0&&p>2.46&&p<H)return false;for(let b of (state.doors?solid:solid.concat(doorBlocks))){if(x>b.x0-r&&x<b.x1+r&&p>b.p0-r&&p<b.p1+r)return false;}return true;}
function step(dx,dz){let n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));for(let i=0;i<n;i++){if(allowed(camera.position.x+dx/n,camera.position.z))camera.position.x+=dx/n;if(allowed(camera.position.x,camera.position.z+dz/n))camera.position.z+=dz/n;}}
// Map uses the exact same coordinate data as the model and reads camera pose.
function drawWestEntryMap(){
 mapRect(westEntry.x,westEntry.returnP0,westEntry.depth,westEntry.returnP1-westEntry.returnP0,'#d2e4e6','#6b8a90');
 for(const p of [westEntry.p0,westEntry.p1]){
  if(state.doors)mapRect(westEntry.x,p-.02,westEntry.leafWidth,.04,'#218e95');
  else mapRect(westEntry.x-.02,p===westEntry.p0?p:p-westEntry.leafWidth,.04,westEntry.leafWidth,'#218e95');
 }
}
const map=$('map'),ctx=map.getContext('2d'),scale=33,ox=112,oy=335;
function mapRect(x,p,sx,sp,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(ox+x*scale,oy-(p+sp)*scale,sx*scale,sp*scale);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.strokeRect(ox+x*scale,oy-(p+sp)*scale,sx*scale,sp*scale);}}
function drawMap(){ctx.clearRect(0,0,map.width,map.height);mapRect(-3.4,-1.3,15.5,11.1,'#dfe5e5');mapRect(-3.55,2.46,3.55,H-2.46,'#bec7c7');mapRect(0,0,PART,H,'#d2e4e6','#6b8a90');mapRect(PART,SPLIT,W-PART,H-SPLIT,'#e6e1d6','#6b8a90');mapRect(PART,0,W-PART,SPLIT,'#d9e1d1','#6b8a90');for(let x of lectureRows)mapRect(x,1.228,.62,6,'#668c91');mapRect(lectern.x,lectern.p,lectern.w,lectern.d,'#456b78');mapRect(mc-.55,4.095,1.1,3.25,'#aa9679');mapRect(mc-1,3.146,2,.4,'#456b78');mapRect(COL.x-.3,COL.p-.3,.6,.6,'#92998f');mapRect(PART+.08,.14,.55,2.14,'#94a68e');ctx.fillStyle='#304e59';ctx.font='19px system-ui';ctx.textAlign='center';ctx.fillText('30 seats',ox+3.8*scale,oy-7.85*scale);ctx.font='15px system-ui';ctx.fillText('10 seats',ox+9.1*scale,oy-7.85*scale);ctx.fillText('Store',ox+9.4*scale,oy-1.2*scale);ctx.fillStyle='#218e95';ctx.fillRect(ox+.9*scale,oy-H*scale-2,(W-.9)*scale,3);drawWestEntryMap();if(state.mode==='walk'){const cx=ox+camera.position.x*scale,cy=oy+camera.position.z*scale;ctx.save();ctx.translate(cx,cy);ctx.rotate(yaw);ctx.fillStyle='#057e88';ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(-10,7);ctx.lineTo(0,3);ctx.lineTo(10,7);ctx.closePath();ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();ctx.restore();}}
map.onclick=e=>{const b=map.getBoundingClientRect(),x=((e.clientX-b.left)*map.width/b.width-ox)/scale,p=(oy-(e.clientY-b.top)*map.height/b.height)/scale;if(x>PART)go(p>SPLIT?'meeting':'store');else if(x<0)go('entry');else go('speaker');};
function resize(){let r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(viewport);
let last=performance.now();function animate(now){requestAnimationFrame(animate);let dt=Math.min((now-last)/1000,.05);last=now;if(state.mode==='orbit')orbit.update();else{let f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),r=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);if(f||r){if(seated){camera.position.set(1.03,state.eye,-.64);seated=false;notify('Moved to the side aisle to leave the seat');}const rate=dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?2.8:1.4)/Math.max(1,Math.hypot(f,r));step((Math.sin(yaw)*f+Math.cos(yaw)*r)*rate,(-Math.cos(yaw)*f+Math.sin(yaw)*r)*rate);}updateLook();}let goal=state.retracted?1:0;retract=THREE.MathUtils.damp(retract,goal,7,dt);for(let m of screenMeshes){let factor=Math.max(.015,1-retract);m.scale.y=factor;m.position.y=2.875-m.userData.height*factor/2;}for(const panel of boardPanels)panel.position.y=panel.userData.lower?1.165+1.2*boardSlide:2.365-1.2*boardSlide;renderer.render(scene,camera);drawMap();}
go('overview');resize();$('loading').classList.add('hidden');requestAnimationFrame(animate);
// A minimal structured navigation interface for browsers that support WebMCP.
const modelContext=document.modelContext;
if(modelContext?.registerTool){const lifetime=new AbortController();window.addEventListener('pagehide',()=>lifetime.abort());try{Promise.resolve(modelContext.registerTool({name:'navigate_room_view',description:'Show a named viewpoint in the Room 2.28 walkthrough.',inputSchema:{type:'object',properties:{view:{type:'string',enum:Object.keys(views)}},required:['view'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!Object.hasOwn(views,input.view))throw new Error('Choose a listed viewpoint');go(input.view);return {view:state.view,mode:state.mode,eyeHeight:state.eye};}},{signal:lifetime.signal})).catch(()=>{});}catch{}}
// Read-only diagnostic snapshot for local visual QA.
window.room228={snapshot:()=>({designRevision:DESIGN.revision,mode:state.mode,view:state.view,eye:state.eye,position:camera.position.toArray(),ceilingHeight:CH,lectureSeats:30,meetingSeats:10,westEntry,entryDoorBounds:westEntryDoors.map(hinge=>{const bounds=new THREE.Box3().setFromObject(hinge);return {min:bounds.min.toArray(),max:bounds.max.toArray(),angle:hinge.rotation.y};}),privacyFilm,screenRetraction:retract,ceilingVisible:roof.visible,cutaway:state.cutaway,doorsOpen:state.doors,column:COL}),views:Object.keys(views)};
