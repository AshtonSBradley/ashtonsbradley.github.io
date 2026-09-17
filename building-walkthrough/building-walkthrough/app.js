import * as THREE from 'three';
import DESIGN from './design-state.js';
import {positionNorthEastSun} from './sunlight.js?v=20260914-ne-sun';
import {OrbitControls} from './vendor/OrbitControls.js';
import {CEILING,SEMINAR,SEMINAR_ROWS,TIER_EDGES,AREAS,areaAt,floorElevation,clearAt} from './layout.js?v=20260914-desk-aligned-tiers';
import {RACK,STORE_DOOR} from './store-geometry.js?v=20260914-full-store-rack';
import {createStoreLift} from './store-lift.js?v=20260914-full-store-rack';
import {createSeating} from './seating.js?v=20260914-wide-overflow';

// Metres. Lab 123: x=-10.75..0, p=0..9; Lab 122: x=0..8.4, p=0..15;
// Seminar room 121: x=8.4..16.763, p=0..11.998. The upper hallway is p=15..17.
// p increases towards the upper wall of the source plans. World z=-p.
const $=id=>document.getElementById(id),CH=CEILING,canvas=$('scene'),viewport=$('viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e5ebeb');
const camera=new THREE.PerspectiveCamera(62,1,.025,120);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('loading').textContent='3D graphics could not start. Try a browser with WebGL enabled.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.minDistance=2;orbit.maxDistance=45;orbit.maxPolarAngle=Math.PI*.49;
const state={mode:'orbit',view:'overview',eye:1.65,wall:'glass',privacy:false,writing:false,doors:true,screens121:true,ceiling:false,cutaway:true,electric:true,chairsUnder:false,fullySeated:false,overflowSeated:false};
let storeLift=null;
const solids=[],outer=[],doorLeaves=[],sharedPanes=[],whiteboards=[],writing=[],fixtures=[],ceiling=new THREE.Group(),electric=new THREE.Group(),screens121Group=new THREE.Group();scene.add(ceiling,electric,screens121Group);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.72,...extra});
const m={wall:mat('#e7e9e4'),edge:mat('#34535e'),wood:mat('#d3bd9d'),metal:mat('#46575e',{metalness:.35,roughness:.45}),teal:mat('#50878a'),white:mat('#fbfcf5'),board:mat('#fcfcf4',{roughness:.22}),storage:mat('#93aaa3'),equipment:mat('#808fa4'),dark:mat('#172d3a'),glass:mat('#bfdfdf',{transparent:true,opacity:.14,roughness:.08,depthWrite:false,side:THREE.DoubleSide}),curtain:mat('#c4c9c7'),glow:mat('#fff9e9',{emissive:'#fff7dd',emissiveIntensity:1.5}),floor122:mat('#9aa8aa'),floor123:mat('#a5b5ad'),floor121:mat('#a6b6ae'),corridor:mat('#c8d0cf'),tier:mat('#94aaa6'),screen:mat('#17677c',{roughness:.28})};
function box(x,p,y,w,d,h,material,parent=scene,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,-p);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o;}
function block(x0,p0,x1,p1){solids.push({x0,p0,x1,p1});}
const seating=createSeating({scene,solids,state,go});
function wall(x0,p0,x1,p1,cut=false){const v=x0===x1,g=new THREE.Group();scene.add(g);box((x0+x1)/2,(p0+p1)/2,1.5,v?.14:x1-x0,v?p1-p0:.14,3,m.wall,g);box((x0+x1)/2,(p0+p1)/2,.06,v?.17:x1-x0,v?p1-p0:.17,.12,m.edge,g);block(x0-.07,p0-.07,x1+.07,p1+.07);if(cut)outer.push(g);return g;}
function texture(lines,bg='#173441',fg='#fff',size=55){const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,1024,512);}ctx.fillStyle=fg;ctx.font=`500 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((s,i)=>ctx.fillText(s,512,256+(i-(lines.length-1)/2)*size*1.5));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function label(x,p,y,w,h,lines,rotation=0,bg='#173441',fg='#fff'){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture(lines,bg,fg),transparent:!bg,side:THREE.DoubleSide,depthWrite:!!bg}));o.position.set(x,y,-p);o.rotation.y=rotation;scene.add(o);return o;}
function floorLabel(x,p,lines,w=2.5){const o=label(x,p,.031,w,w/2,lines,0,null,'#244c58');o.rotation.x=-Math.PI/2;return o;}
function bench(x0,p0,w,d,{height=.90,cabinet=false}={}){box(x0+w/2,p0+d/2,height,w,d,.065,m.wood);if(cabinet){box(x0+w/2,p0+d/2,height/2-.02,w-.05,d-.06,height-.09,m.storage);}else{for(const x of [x0+.08,x0+w-.08])for(const p of [p0+.08,p0+d-.08])box(x,p,height/2,.045,.045,height,m.metal);box(x0+w/2,p0+d/2,.69,w-.10,.06,.08,m.teal);}block(x0,p0,x0+w,p0+d);}
function cabinet(x0,p0,w,d,h=2.4){box(x0+w/2,p0+d/2,h/2+.035,w,d,h,m.storage);block(x0,p0,x0+w,p0+d);const n=Math.max(1,Math.round(w/.7));for(let i=0;i<n;i++){box(x0+(i+.5)*w/n,p0-.017,h/2,w/n-.025,.025,h-.09,m.storage);box(x0+(i+.8)*w/n,p0-.045,1.12,.025,.03,.24,m.metal);}}
function openShelving(x0,p0,w,d){
  const g=new THREE.Group();g.name='store-open-shelving';scene.add(g);
  // Open racks: full-height posts and deep shelves, without cupboard carcasses or doors.
  for(const y of RACK.levels)box(x0+w/2,p0+d/2,y,w,d,.045,m.wood,g);
  const bays=RACK.bays;
  for(let i=0;i<=bays;i++)for(const p of [p0+.025,p0+d-.025])box(x0+.025+i*(w-.05)/bays,p,CH/2,.05,.05,CH,m.metal,g);
  block(x0,p0,x0+w,p0+d);return g;
}
function chair(x,p,north,{floor=0,width=.43,depth=.43,material=m.teal,seatHeight=.47,collision=true,tuck=0,occupant=false,fold=false,overflow=false}={}){const g=new THREE.Group();g.position.set(x,floor,-p);g.rotation.y=north?0:Math.PI;scene.add(g);box(0,0,seatHeight,width,depth,.065,material,g);box(0,-depth/2+.015,seatHeight+.25,width,.055,.43,material,g);for(const a of [-width*.37,width*.37])for(const b of [-depth*.35,depth*.35])box(a,b,seatHeight/2,.025,.025,seatHeight,m.metal,g);if(seatHeight>=.65)box(0,.32,.25,width*.8,.045,.04,m.metal,g);let chairBlock;if(collision){block(x-width/2,p-depth/2,x+width/2,p+depth/2);chairBlock=solids.at(-1);}seating.register(g,{x,p,north,width,depth,seatHeight,tuck,occupant,fold,overflow,block:chairBlock});return g;}
function apparatus(x,p,w=.5,d=.32){box(x,p,1.03,w,d,.23,m.equipment);box(x,p-d/2-.012,1.05,w*.6,.02,.105,m.dark);for(let i=0;i<3;i++)box(x-w*.25+i*w*.25,p-d/2-.03,.97,.025,.025,.025,m.white);}
function door(x,p,width,closed,opened,shared=false,solid=false){const hinge=new THREE.Group();hinge.position.set(x,0,-p);scene.add(hinge);box(width/2,0,1.1,width,.045,2.2,solid?m.white:m.glass,hinge,solid);for(const xx of [0,width])box(xx,0,1.1,.04,.065,2.2,m.metal,hinge);for(const y of [.025,2.2])box(width/2,0,y,width,.065,.05,m.metal,hinge);box(width-.13,-.07,1.0,.04,.06,.28,m.metal,hinge);doorLeaves.push({hinge,x,p,width,closed,opened,shared});}

box(3.0,8.0,-.22,42,32,.12,mat('#dce4e4'),scene,false);
// Slab tops meet the underside of the 40 mm floor finish at y=-.04.
// Coplanar slab/finish tops at y=0 cause visible z-fighting while moving.
box(4.2,7.5,-.13,8.54,15.14,.18,m.edge);box(4.2,7.5,-.02,8.4,15,.04,m.floor122);
box(-5.375,4.5,-.13,10.75,9,.18,m.edge);box(-5.375,4.5,-.02,10.75,9,.04,m.floor123);
const X121=8.4,W121=8.363,H121=11.998;
box(X121+W121/2,H121/2,-.13,W121+.14,H121+.14,.18,m.edge);box(X121+W121/2,H121/2,-.02,W121,H121,.04,m.floor121);
box(3.0065,15.85,-.06,27.513,1.7,.12,m.corridor);box(15.7565,13.499,-.06,2.013,3.002,.12,m.corridor);
// Existing ancillary store retained from the laboratory walkthrough.
box(11.575,13.499,-.06,6.35,3.002,.12,m.floor122);
// Solid opposite wall of 122, with the documented door openings retained.
wall(8.4,0,8.4,10.4);wall(8.4,11.8,8.4,STORE_DOOR.p);wall(8.4,STORE_DOOR.p+STORE_DOOR.width,8.4,15);
box(STORE_DOOR.x,STORE_DOOR.p+STORE_DOOR.width/2,2.6,.14,STORE_DOOR.width,.8,m.wall);
// Retain the solid north back wall of all three small labs even in cutaway views.
wall(0,15,5.965,15).name='small-labs-north-wall';wall(7.965,15,8.4,15,true);
wall(0,8.94,0,9);wall(0,9,0,15,true);
wall(-10.75,0,-10.75,7.14,true);wall(-10.75,8.94,-10.75,9,true);
// Solid north wall behind 1.23 storage continues to the northeast connecting door.
wall(-10.75,9,0,9).name='lab123-north-wall';
wall(8.4,11.998,14.75,11.998);wall(14.75,11.998,14.75,15);wall(16.763,5.74,16.763,16.7,true);
wall(-10.75,16.7,16.763,16.7,true);wall(-10.75,15,-10.75,16.7,true);wall(-10.75,15,0,15,true);wall(8.4,15,14.75,15,true);
wall(14.75,11.998,14.95,11.998);wall(16.39,11.998,16.763,11.998);
box(15.67,11.998,2.6,1.44,.14,.8,m.wall);
// South-facing windows; noticeable direct sun comes from the north-east.
function windowWall(x0,x1,sill=.96){const g=new THREE.Group();scene.add(g);outer.push(g);const w=x1-x0;box((x0+x1)/2,0,sill/2,w,.14,sill,m.wall,g);box((x0+x1)/2,0,2.80,w,.14,.4,m.wall,g);box((x0+x1)/2,0,(sill+2.6)/2,w,.024,2.6-sill,m.glass,g,false);for(let x=x0;x<=x1+.01;x+=w/Math.ceil(w)){box(x,0,(sill+2.6)/2,.055,.11,2.6-sill,m.white,g);}block(x0,-.08,x1,.08);}
windowWall(-10.75,0);windowWall(0,8.4);windowWall(8.4,16.763,1.3);
const rightWindows=new THREE.Group();scene.add(rightWindows);outer.push(rightWindows);
box(16.763,2.87,.65,.14,5.74,1.3,m.wall,rightWindows);box(16.763,2.87,2.8,.14,5.74,.4,m.wall,rightWindows);
box(16.763,2.87,1.95,.024,5.74,1.3,m.glass,rightWindows,false);
for(let p=0;p<=5.74;p+=5.74/5)box(16.763,p,1.95,.11,.055,1.3,m.white,rightWindows);
block(16.683,0,16.843,5.74);
// Shared partition: the bay beside the door is permanently whiteboard-faced
// up to the 2.20 m door head. The next two bays switch only at y=1.00..2.20 m.
const shared=new THREE.Group(),clearGlass=new THREE.Group(),solidWall=new THREE.Group(),curtain=new THREE.Group();scene.add(shared,clearGlass,solidWall,curtain);
box(0,3.57,.12,.12,7.14,.24,m.wall,shared);box(0,3.57,2.94,.14,7.14,.12,m.metal,shared);block(-.075,0,.075,7.14);
// Clear-glass option: floor-to-ceiling panes with slim perimeter tracks,
// no solid plinth and no horizontal smart-glass subdivisions.
for(let i=0;i<5;i++){
  const p0=.07+i*1.4,bottom=i===4?2.20:0;
  box(0,p0+.7,(bottom+CH)/2,.026,1.365,CH-bottom,m.glass,clearGlass,false);
  box(0,p0,CH/2,.065,.035,CH,m.metal,clearGlass);
}
box(0,7.11,CH/2,.065,.035,CH,m.metal,clearGlass);
for(const y of [.015,CH-.015])box(0,3.57,y,.06,7.14,.03,m.metal,clearGlass);
for(let i=0;i<5;i++){
  const p0=.07+i*1.4;
  if(i===4){
    // Only the over-door-height portion of this bay remains glazed.
    box(0,p0+.7,2.55,.026,1.365,.66,m.glass,shared,false);
  }else if(i===2||i===3){
    box(0,p0+.7,.62,.026,1.365,.72,m.glass,shared,false);
    const pane=box(0,p0+.7,1.60,.026,1.365,1.20,m.glass.clone(),shared,false);
    sharedPanes.push(pane);
    box(0,p0+.7,2.55,.026,1.365,.66,m.glass,shared,false);
    for(const y of [1.00,2.20])box(0,p0+.7,y,.055,1.4,.035,m.metal,shared);
  }else box(0,p0+.7,1.57,.026,1.365,2.62,m.glass,shared,false);
  box(0,p0,1.57,.065,.035,2.74,m.metal,shared);
}
box(0,7.11,1.57,.065,.035,2.74,m.metal,shared);
const permanentBoard=new THREE.Group();permanentBoard.name='permanent-whiteboard-beside-door';scene.add(permanentBoard);
box(0,6.405,1.10,.14,1.47,2.20,m.wall,permanentBoard);
for(const x of [-.09,.09]){
  box(x,6.405,1.22,.024,1.435,1.96,m.board,permanentBoard);
  box(x,6.405,2.20,.045,1.47,.025,m.metal,permanentBoard);
}
box(0,3.57,1.5,.14,7.14,3,m.wall,solidWall);
for(const x of [-.09,.09]){const board=box(x,2.865,1.64,.024,5.45,1.35,m.board,solidWall);whiteboards.push(board);box(x,2.865,.96,.12,5.45,.03,m.metal,solidWall);}
// The curtain stops before the permanent whiteboard so that it stays usable.
for(let i=0;i<51;i++)box(.14+(i%2)*.025,.10+i*.108,CH/2,.035,.112,CH-.04,m.curtain,curtain);
box(.14,2.83,CH-.03,.13,5.58,.055,m.metal,clearGlass);
// Sample writing uses separate bays on the two faces, avoiding overlapping text.
writing.push(label(.105,4.27,1.60,2.4,.95,['F = ma','Measure · compare · explain'],Math.PI/2,null,'#164d75'));
writing.push(label(-.105,6.405,1.60,1.28,.80,['Energy in = energy out','P = ΔE / Δt'],-Math.PI/2,null,'#164d75'));
box(0,8.04,2.62,.14,1.8,.76,m.wall);
door(0,7.14,.9,Math.PI/2,Math.PI,true);door(0,8.94,.9,-Math.PI/2,Math.PI,true);
door(-10.75,7.14,.9,Math.PI/2,0);door(-10.75,8.94,.9,-Math.PI/2,0);
door(5.965,15,1,0,-Math.PI/2);door(7.965,15,1,Math.PI,-Math.PI/2);
// Fire exit from 1.21 into 1.22: two solid leaves opening into 1.22.
door(8.4,10.4,.7,Math.PI/2,Math.PI,false,true);door(8.4,11.8,.7,-Math.PI/2,Math.PI,false,true);
// Widen northward from the retained south hinge; keep the inward swing.
door(STORE_DOOR.x,STORE_DOOR.p,STORE_DOOR.width,Math.PI/2,0);
door(14.95,11.998,.72,0,-Math.PI/2);door(16.39,11.998,.72,Math.PI,-Math.PI/2);
label(-.09,8.04,2.59,.93,.28,['LAB 1.22'],-Math.PI/2);label(.09,8.04,2.59,.93,.28,['LAB 1.23'],Math.PI/2);
// 123: two six-place-per-side islands, 24 chairs, centred service dividers.
for(const p of [2.6,5.5]){bench(-8.165,p,6.1,1.5,{height:.82});box(-5.065,p+.75,.97,5.66,.14,.30,m.teal);for(let n=0;n<6;n++){const x=-7.695+n*1.02;chair(x,p-.31,true,{tuck:.25});chair(x,p+1.81,false,{tuck:.25});}for(let n=1;n<6;n++)box(-8.165+n*6.1/6,p+.75,.855,.008,1.48,.003,m.metal);const serviceLabel=label(-5.065,p+.75,1.126,3.9,.12,['COMPUTER AND SERVICE PARTITION · POWER + NETWORK'],0,null,'#244c58');serviceLabel.rotation.x=-Math.PI/2;}
for(let i=0;i<10;i++)cabinet(-8.9375+i*.7125,8.35,.68,.61,2.65);
for(const [p,h] of [[1.45,.72],[2.66,.76],[3.87,.76],[5.08,.76],[6.402,.76]]){box(-10.39,p+h/2,.82,.57,h,1.64,m.equipment);block(-10.67,p,-10.10,p+h);box(-10.08,p+h/2,1.19,.025,h*.65,.26,m.dark);}
bench(-10.65,.1,3.82,.60,{cabinet:true});box(-10.15,.4,.94,.6,.32,.025,m.metal);
for(const x of [-6.45,-5.39,-4.29,-3.19,-2.09]){box(x+.41,.59,.62,.82,.84,1.24,m.equipment);block(x,.17,x+.82,1.01);}
floorLabel(-5.2,7.72,['1.23','24 teaching places'],3.3);
// 122: 3 horizontal bench islands from the September 2 source, not the older PNG.
const names=[['Flexible experiments',''],['ChMass / FO analysis','MI / MI analysis'],['MI / MI analysis','ChMass / AOM analysis']];
[2.228,5.578,8.928].forEach((p,i)=>{bench(1.855,p,3.9,1.85);box(3.805,p+.925,.936,.012,1.84,.005,m.metal);box(3.805,p+.925,.936,3.88,.012,.005,m.metal);const lab=label(3.805,p+.95,.94,2.8,1.15,names[i],0,null,'#244c58');lab.rotation.x=-Math.PI/2;if(i){apparatus(2.50,p+.35);apparatus(4.6,p+1.48);}});
bench(.15,.05,8.2,.70,{cabinet:true});apparatus(5.17,.40,.78,.4);box(7.48,.40,.94,.65,.38,.025,m.metal);
for(const [p,d] of [[.75,1.95],[2.7,1.9],[4.6,2.64]])bench(7.46,p,.89,d,{cabinet:true});
for(let p=.88;p<7;p+=1.56){box(8.18,p+.69,1.95,.34,1.37,.92,m.storage);box(7.98,p+.69,1.91,.025,.035,.24,m.metal);}
// Printer station replaces the low green storage south of the fixed column.
bench(7.72,7.70,.63,1.08,{cabinet:true});apparatus(8.03,8.24,.41,.46);
const sharedExitColumn=DESIGN.level1.sharedExitColumn;
box(sharedExitColumn.x+sharedExitColumn.width/2,sharedExitColumn.p+sharedExitColumn.depth/2,1.5,sharedExitColumn.width,sharedExitColumn.depth,3,m.equipment);
block(sharedExitColumn.x,sharedExitColumn.p,sharedExitColumn.x+sharedExitColumn.width,sharedExitColumn.p+sharedExitColumn.depth);
box(8.285,14.69,1.5,.23,.62,3,m.equipment);block(8.17,14.38,8.4,15);
bench(.05,10.778,.475,1.522,{cabinet:true});box(.30,11.54,1.16,.03,.46,.33,m.dark);
box(.10,9.839,1.65,.035,1.76,1.22,m.board);label(.123,9.839,1.7,1.45,.72,['Observe','Model · test · refine'],Math.PI/2,null,'#164d75');
// Function rooms have 0.8 m access openings and illustrative furnishings.
for(let i=0;i<3;i++){const x=i*1.92,c=x+.96;wall(x,12.256,c-.4,12.256);wall(c+.4,12.256,x+1.92,12.256);wall(x+1.92,12.256,x+1.92,15);door(c-.4,12.256,.8,0,Math.PI/2);label(c,12.16,2.53,1.2,.32,[[ 'BIG-G','HeNe','Rb'][i]]);const bx=i===0?.05:x+1.47;bench(bx,12.36,.4,2.57);apparatus(bx+.2,14.0,.30,.45);}
// One 1.2 m-deep rack on the north wall. Nominal clear aisle to the south
// wall face is 1.632 m; keep the west door and its inward swing unobstructed.
const storeRack=openShelving(RACK.x,RACK.p,RACK.width,RACK.depth);
floorLabel(6.8,11.8,['1.22'],1.8);floorLabel(8.3,15.85,['UPPER HALLWAY'],3.8);floorLabel(-5,15.85,['UPPER HALLWAY'],3.8);
floorLabel(11.1,13.2,['STORE'],1.65);

// Room 1.21 follows the current dimensioned concept, not the furniture on the
// reference screenshot: six main rows, one desked rear row, two fold-downs.
const platformMat=mat('#c4b299');
TIER_EDGES.forEach((edge,i)=>{
  const back=TIER_EDGES[i+1]??0,level=(i+1)*SEMINAR.rise/TIER_EDGES.length;
  box(X121+W121/2,(edge+back)/2,level/2,W121,edge-back,level,i===TIER_EDGES.length-1?platformMat:m.tier);
  // Light nosing lines also show the steps in the two side access aisles.
  for(const [x,w] of [[X121+.58,1.16],[X121+7.79,1.14]])box(x,edge-.012,level+.003,w,.026,.006,m.white,scene,false);
});
function seminarDesk(x,p,w,base){
  box(x+w/2,p+.225,base+.723,w,.45,.025,m.white);
  for(const xx of [x+.10,x+w-.10])box(xx,p+.23,base+.35,.05,.30,.70,m.metal);
  box(x+w/2,p+.225,base+.65,w-.2,.06,.055,m.teal);
  block(x,p,x+w,p+.45);
  for(let j=1;j<w/.6-.01;j++)box(x+j*.6,p+.225,base+.737,.006,.445,.003,m.metal,scene,false);
}
let fixedSeatCount=0;
for(let row=0;row<SEMINAR_ROWS.length;row++){
  const top=SEMINAR_ROWS[row],base=row*SEMINAR.rise/TIER_EDGES.length,count=row===0?8:10;
  seminarDesk(X121+1.2265,top-.45,count*.6,base);
  for(let j=0;j<count;j++){
    chair(X121+1.5265+j*.6,top-.71,true,{floor:base,width:.44,depth:.38,tuck:.30,occupant:true});fixedSeatCount++;
  }
}
// Fold-down seats are stowed initially to keep the drawn wheelchair bay clear.
box(X121+6.6265,9.25,.027,1.20,1.50,.01,mat('#bed9df'),scene,false);
for(const x of [X121+6.3265,X121+6.9265]){
  const stowed=new THREE.Group();scene.add(stowed);
  box(x,8.67,.73,.44,.08,.42,m.teal,stowed);box(x,8.62,.45,.44,.07,.38,m.teal,stowed);
  box(x,8.62,.22,.055,.07,.44,m.metal,stowed);block(x-.22,8.575,x+.22,8.71);
  seating.registerFold(stowed,solids.at(-1));
  chair(x,8.79,true,{width:.44,depth:.38,occupant:true,fold:true});
}
floorLabel(X121+6.6265,9.30,['WC / 2 FD'],1.05);
// Occupied wheelchair replaces the two fold-down places in seated scenarios.
const wheelchair=new THREE.Group();wheelchair.name='Occupied wheelchair in 1.21 bay';
wheelchair.position.set(X121+6.6265,0,-9.23);scene.add(wheelchair);
box(0,0,.50,.46,.44,.065,m.teal,wheelchair);
box(0,-.22,.77,.46,.06,.51,m.teal,wheelchair);
for(const x of [-.32,.32]){
 const tyre=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.045,24),m.dark);tyre.rotation.z=Math.PI/2;tyre.position.set(x,.32,.08);wheelchair.add(tyre);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(.24,.018,6,24),m.metal);rim.rotation.y=Math.PI/2;rim.position.copy(tyre.position);rim.position.x+=Math.sign(x)*.028;wheelchair.add(rim);
 box(x*.85,0,.69,.05,.48,.05,m.dark,wheelchair);box(x*.85,0,.43,.025,.025,.49,m.metal,wheelchair);
 const caster=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.045,12),m.dark);caster.rotation.z=Math.PI/2;caster.position.set(x*.75,.095,-.45);wheelchair.add(caster);
 box(x*.65,.39,.26,.025,.24,.025,m.metal,wheelchair);box(x*.4,.49,.15,.20,.18,.035,m.dark,wheelchair);
}
block(X121+6.6265-.37,8.78,X121+6.6265+.37,9.88);
seating.register(wheelchair,{x:X121+6.6265,p:9.23,north:true,width:.74,depth:1.10,seatHeight:.5,occupant:true,wheelchair:true,block:solids.at(-1)});
// Offset lectern: 1.68 x .80 m; upper edge aligns with emergency-exit jamb.
box(X121+2.0665,10.00,.43,1.58,.70,.84,m.teal);
box(X121+2.0665,10.00,.89,1.68,.80,.045,m.wood);block(X121+1.2265,9.60,X121+2.9065,10.40);
box(X121+1.60,10.20,.94,.34,.20,.06,m.dark);
// Two under/over board pairs, each with a 3.10 m 16:9 display and a .12 m gap.
for(const [left,name] of [[0,'SCREEN 1'],[3.22,'SCREEN 2']]){
  const center=X121+left+1.55;
  for(const y of [1.175,2.365]){
    box(center,11.89,y,3.08,.045,1.15,m.metal);
    box(center,11.85,y,3.02,.025,1.09,m.board);
  }
  for(const x of [center-1.54,center+1.54])box(x,11.90,1.78,.055,.12,2.44,m.metal);
  box(center,11.78,2.965,3.10,.17,.07,m.white);
  const screen=box(center,11.76,3-3.10*9/32,3.10,.028,3.10*9/16,m.screen,screens121Group,false);
  screen.userData.screenWidth=3.10;
  const caption=label(center,11.738,2.10,2.6,.60,[name,name==='SCREEN 1'?'Remote speakers':'Teaching display']);
  screens121Group.attach(caption);
}
// Rear row gains a desk on the shortened +600 mm platform.
seminarDesk(X121+1.2265,SEMINAR.platformDepth-.45,6,.6);
for(let j=0;j<10;j++){chair(X121+1.5265+j*.6,SEMINAR.platformDepth-.71,true,{floor:.6,width:.50,depth:.50,seatHeight:.44,material:m.teal,occupant:true,tuck:.30});fixedSeatCount++;}
for(const x of [X121+.43,X121+1.03]){
  const stack=[];
  for(let i=0;i<5;i++)stack.push(chair(x,.30,true,{floor:.6+i*.08,width:.38,depth:.42,seatHeight:.49,material:m.white,collision:false}));
  block(x-.25,.05,x+.25,.55);
  seating.registerStack(stack,solids.at(-1));
}
// Overflow extends into both rear side aisles at 780 mm centres.
// End chairs stay inside the rear whiteboard and the counter's right return.
for(let j=0;j<10;j++)chair(X121+.60+j*.78,.70,true,{floor:.6,width:.46,depth:.46,seatHeight:.70,material:m.white,occupant:true,overflow:true});
// Rear counter and short right return: depths measured from the room walls.
box(X121+4.8115,.20,1.50,6.303,.40,.045,m.wood);block(X121+1.66,0,X121+7.963,.40);
box(X121+8.163,.6375,1.50,.40,1.275,.045,m.wood);block(X121+7.963,0,X121+8.363,1.275);
for(const x of [X121+1.75,X121+4.80,X121+7.86])box(x,.20,1.05,.045,.045,.9,m.metal);
// Permanent rear whiteboard; no projector, screen or projector support remains.
box(X121+.10,1.30,1.86,.04,2.20,1.45,m.metal);
box(X121+.13,1.30,1.86,.025,2.14,1.39,m.board);
box(X121+.18,1.30,1.17,.14,2.14,.035,m.white);
// Projections retained from the developed room concept.
for(const [x,p,w,d] of [[8.298,5.995,.13,.51],[1.485,.115,.35,.23],[6.965,.115,.35,.23]]){
  box(X121+x,p,1.5,w,d,3,m.equipment);block(X121+x-w/2,p-d/2,X121+x+w/2,p+d/2);
}
label(15.67,12.08,2.60,.90,.27,['1.21'],Math.PI);
label(6.965,15.09,2.60,.90,.27,['1.22'],Math.PI);
floorLabel(X121+4.25,10.95,['1.21','SEMINAR ROOM'],3.4);
// 3 m ceilings. Ordinary lights are deliberately separate from daylight.
for(const a of AREAS)box((a.x0+a.x1)/2,(a.p0+a.p1)/2,3.07,a.x1-a.x0,a.p1-a.p0,.14,m.white,ceiling);
for(const [x,ps] of [[2.0,[2,5.4,8.8,13.7]],[6.3,[2,5.4,8.8,13.7]],[-8,[2,5,7.8]],[-3,[2,5,7.8]],[10.5,[2,5.4,8.8,11.7]],[14.7,[2,5.4,8.8,11.7]],[4,[16]],[8,[16]],[12,[16]],[16,[16]]])for(const p of ps){const fixture=box(x,p,2.94,.18,1.2,.055,m.glow);fixtures.push(fixture);const l=new THREE.PointLight('#fff3de',11,6.5,2);l.position.set(x,2.78,-p);electric.add(l);}
scene.add(new THREE.HemisphereLight('#e4f4ff','#737b77',1.35));
const daylight=new THREE.DirectionalLight('#fff8e6',2.3);positionNorthEastSun(daylight,3,8);daylight.castShadow=true;daylight.shadow.mapSize.set(2048,2048);Object.assign(daylight.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:.1,far:60});daylight.shadow.normalBias=.03;scene.add(daylight,daylight.target);

const views={
 overview:{label:'All three rooms',mode:'orbit',pos:[-19,24,18],target:[3.2,0,-8]},
 hallway:{label:'Upper hallway',x:15.8,p:15.85,eye:1.65,target:[5,1.65,-15.85]},
 seminar:{label:'Enter Room 1.21',x:15.75,p:13.7,eye:1.65,target:[15.1,1.4,-6]},
 seminarmodel:{label:'Room 1.21 · seating and access',mode:'orbit',pos:[21,14,2],target:[12.6,.6,-6.3]},
 platform:{label:'Room 1.21 rear platform',x:12.6,p:1.25,eye:1.65,target:[13.17,2.1,-11.76]},
 entry:{label:'Enter Lab 1.22',x:6.95,p:13.2,target:[3.8,1.3,-4]},
 shared:{label:'1.22 / 1.23 connection',x:-1.45,p:8.04,target:[3.8,1.5,-8.04]},
 energy:{label:'Lab 1.23 teaching view',x:-.8,p:4.7,target:[-7,1.2,-4.7]},
 student:{label:'1.23 student’s view',x:-5.655,p:2.29,eye:1.2,target:[0,1.6,-3.2],seated:true,exit:[-1.25,2.1]},
 windows:{label:'1.22 window end',x:6.45,p:1.35,target:[2.5,1.4,-8]},
 connection:{label:'Connecting doors',x:-1.45,p:8.04,target:[3.8,1.5,-8.04]},
 store:{label:'Store · deep shelving & hand fork lift',x:9.55,p:13.30,target:[13.65,1.25,-13.72]},
 storetest:{label:'Store · lift clearance test',mode:'orbit',pos:[11.2,7,-13.6],target:[11.2,0,-13.7]},
 storetest3d:{label:'Store · lift test in 3D',mode:'orbit',pos:[10,5,-9.7],target:[11.5,.7,-13.8]},
 seat45:{label:'1.21 · Seat 45',x:X121+5.1265,p:3.99,eye:1.2,target:[X121+4.77,2.1,-11.76],seated:true,exit:[X121+.72,3.99]},
 speaker:{label:'1.21 · Presenter',x:X121+3.5,p:10.15,eye:1.65,target:[X121+4.18,1.5,-1.59]},
 wheelchair:{label:'1.21 · Wheelchair bay',x:X121+6.63,p:9.32,eye:1.2,target:[X121+4.77,2.1,-11.76]}
};
let yaw=0,pitch=0,drag=null,seated=false,toastTimer;const keys=new Set();
function notify(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
function appearance(){shared.visible=state.wall==='smart';clearGlass.visible=state.wall==='glass';solidWall.visible=state.wall==='solid';curtain.visible=state.wall==='glass'&&state.privacy;for(const pane of sharedPanes){const opaque=state.wall==='smart'&&state.privacy;pane.material.color.set(opaque?'#edf0e9':'#bfdfdf');pane.material.opacity=opaque?.96:.14;pane.material.depthWrite=opaque;pane.castShadow=opaque;}
writing.forEach(o=>o.visible=state.writing);screens121Group.visible=state.screens121;ceiling.visible=state.ceiling;electric.visible=state.electric;fixtures.forEach(o=>{o.visible=state.ceiling;o.material=state.electric?m.glow:m.white;});outer.forEach(o=>o.visible=!state.cutaway);doorLeaves.forEach(d=>d.hinge.rotation.y=state.doors?d.opened:d.closed);
for(const id of ['screens121','doors','ceiling','cutaway','electric','writing','privacy'])$(id).checked=state[id];$('wall').value=state.wall;$('privacylabel').hidden=state.wall==='solid';$('privacytext').textContent=state.wall==='smart'?'Make glass opaque':'Close curtain';
$('wallnote').textContent=state.wall==='solid'?'Solid wall with whiteboards on both sides; the permanent bay beside the door extends to the 2.20 m door head.':state.wall==='smart'?(state.privacy?'Only the next two bays turn opaque, from handle height (1.00 m) to door head (2.20 m). The door-side whiteboard stays solid; all remaining glazing stays clear.':'Two switchable bays span 2.80 m nominal width between 1.00 and 2.20 m height. The bay beside the door is a permanent whiteboard; the remaining glazing stays clear.'):(state.privacy?'The full-height curtain covers the floor-to-ceiling glazed bays and stops before the permanent whiteboard beside the door.':'Floor-to-ceiling clear glass (3.00 m), with a permanent whiteboard beside the door, extending to door-head height (2.20 m).');}
function updateUI(){for(const b of document.querySelectorAll('[data-view]'))b.classList.toggle('selected',b.dataset.view===state.view);for(const id of ['walk','orbit']){$(id).classList.toggle('active',state.mode===id);$(id).setAttribute('aria-pressed',String(state.mode===id));}$('viewname').textContent=state.view==='free'?(areaAt(camera.position.x,-camera.position.z)?.id==='hallway'?'Upper hallway':`Room ${areaAt(camera.position.x,-camera.position.z)?.id==='121'?'1.21':areaAt(camera.position.x,-camera.position.z)?.id==='123'?'1.23':'1.22'} · Free walk`):(views[state.view]?.label||'Free walk');$('eye').textContent=state.mode==='orbit'?'Orbit view':`${state.eye.toFixed(2)} m eye height · floor +${floorElevation(camera.position.x,-camera.position.z).toFixed(2)} m`;$('height').value=state.eye;$('heightvalue').textContent=state.eye.toFixed(2)+' m';$('detailview').value=Object.hasOwn(views,state.view)?state.view:'';$('walkpad').hidden=state.mode!=='walk';$('help').textContent=state.mode==='walk'?'Drag to look · W A S D / arrows to walk · Shift for faster movement':'Drag to orbit · scroll to zoom · right-drag to pan';}
function look(){camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
function go(id){const v=views[id];if(!v)return;storeLift?.setActive(id.startsWith('storetest'));keys.clear();drag=null;state.view=id;state.mode=v.mode||'walk';orbit.enabled=state.mode==='orbit';seated=!!v.seated;if(orbit.enabled){state.cutaway=true;state.ceiling=false;camera.position.set(...v.pos);orbit.target.set(...v.target);orbit.update();}else{state.cutaway=false;state.ceiling=true;state.eye=v.eye||1.65;camera.position.set(v.x,state.eye+floorElevation(v.x,v.p),-v.p);const t=new THREE.Vector3(...v.target).sub(camera.position);yaw=Math.atan2(-t.x,-t.z);pitch=Math.atan2(t.y,Math.hypot(t.x,t.z));look();}appearance();updateUI();canvas.focus({preventScroll:true});}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>go(b.dataset.view);
$('orbit').onclick=()=>go('overview');$('walk').onclick=()=>go('hallway');
$('detailview').onchange=e=>go(e.target.value);
for(const id of ['screens121','doors','ceiling','cutaway','electric','writing','privacy'])$(id).onchange=()=>{state[id]=$(id).checked;appearance();};
$('wall').onchange=()=>{state.wall=$('wall').value;state.privacy=false;appearance();};$('height').oninput=()=>{state.eye=Number($('height').value);if(state.mode==='walk')camera.position.y=state.eye+floorElevation(camera.position.x,-camera.position.z);updateUI();};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.body.classList.toggle('fullscreen');resize();}};
document.addEventListener('fullscreenchange',()=>{document.body.classList.toggle('fullscreen',!!document.fullscreenElement);$('full').textContent=document.fullscreenElement?'Exit full screen':'Full screen ↗';resize();});
canvas.onpointerdown=e=>{if(state.mode!=='walk')return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus();};
canvas.onpointermove=e=>{if(!drag||state.mode!=='walk')return;yaw-=(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.y)*.004,-1.3,1.3);drag.x=e.clientX;drag.y=e.clientY;look();};
canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};canvas.oncontextmenu=e=>e.preventDefault();
window.addEventListener('keydown',e=>{if(storeLift?.active||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||state.mode!=='walk')return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();drag=null;});
for(const b of document.querySelectorAll('[data-move]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.move);}
function isFree(x,p){return clearAt(x,p,solids,doorLeaves);}
function step(dx,dz){let x=camera.position.x,p=-camera.position.z;const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.04));for(let i=0;i<n;i++){if(isFree(x+dx/n,p))x+=dx/n;if(isFree(x,p-dz/n))p-=dz/n;}camera.position.set(x,state.eye+floorElevation(x,p),-p);}
const map=$('map'),ctx=map.getContext('2d'),scale=20,ox=235,oy=430;
function drawMap(){ctx.clearRect(0,0,map.width,map.height);const rect=(x,p,w,d,color)=>{ctx.fillStyle=color;ctx.fillRect(ox+x*scale,oy-(p+d)*scale,w*scale,d*scale);};for(const a of AREAS)rect(a.x0,a.p0,a.x1-a.x0,a.p1-a.p0,a.color);rect(X121,0,W121,SEMINAR.platformDepth,'#d8c6aa');for(const b of solids)if(!b.disabled)rect(b.x0,b.p0,b.x1-b.x0,b.p1-b.p0,'#69818b');for(const edge of TIER_EDGES)rect(X121,edge,W121,.03,'#95aaa5');for(const left of [0,3.22])rect(X121+left,11.76,3.1,.11,state.screens121?'#006d8f':'#f4f7f3');rect(-.10,0,.20,7.14,state.wall==='solid'?'#344d58':state.wall==='glass'&&state.privacy?'#f7fbf9':'#009ca7');if(state.wall==='smart'&&state.privacy)rect(-.10,2.87,.20,2.8,'#f7fbf9');rect(-.13,5.67,.26,1.47,'#f7fbf9');if(!state.doors)rect(-.06,7.14,.12,1.8,'#344d58');ctx.fillStyle='#163b48';ctx.font='600 19px system-ui';ctx.textAlign='center';ctx.fillText('1.23',ox-5.4*scale,oy-4.7*scale);ctx.fillText('1.22',ox+4.2*scale,oy-7.9*scale);ctx.fillText('1.21',ox+12.58*scale,oy-10.75*scale);ctx.font='13px system-ui';ctx.fillText('24 places',ox-5.4*scale,oy-4.0*scale);ctx.fillText('upper hallway',ox+3*scale,oy-15.85*scale);ctx.fillText('store',ox+11.6*scale,oy-13.7*scale);ctx.strokeStyle='#039baa';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ox-10.6*scale,oy+4);ctx.lineTo(ox+16.6*scale,oy+4);ctx.stroke();ctx.fillStyle='#426873';ctx.fillText('exterior windows',ox+3*scale,oy+28);
if(state.mode==='walk'){ctx.save();ctx.translate(ox+camera.position.x*scale,oy+camera.position.z*scale);ctx.rotate(-yaw);ctx.fillStyle='#006d80';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(-8,7);ctx.lineTo(0,3);ctx.lineTo(8,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}
map.onclick=e=>{const b=map.getBoundingClientRect(),x=((e.clientX-b.left)*map.width/b.width-ox)/scale,p=(oy-(e.clientY-b.top)*map.height/b.height)/scale;if(isFree(x,p)){if(state.mode!=='walk')go(x<0?'energy':x>8.4?'seminar':'entry');camera.position.set(x,state.eye+floorElevation(x,p),-p);state.view='free';seated=false;updateUI();}else notify('Choose a clear floor area, or use a named viewpoint.');};
function resize(){const b=viewport.getBoundingClientRect();renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(viewport);
let last=performance.now(),mapTick=0;function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;storeLift.tick(dt);if(state.mode==='orbit')orbit.update();else if(!storeLift.active){const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),r=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);if(f||r){if(seated){const [x,p]=views[state.view].exit;camera.position.set(x,state.eye+floorElevation(x,p),-p);seated=false;notify('Moved to the end aisle to leave the seat.');}state.view='free';const speed=dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?2.5:1.35)/Math.max(1,Math.hypot(f,r));step((-Math.sin(yaw)*f+Math.cos(yaw)*r)*speed,(-Math.cos(yaw)*f-Math.sin(yaw)*r)*speed);}}renderer.render(scene,camera);if(now-mapTick>100){drawMap();updateUI();if(storeLift.active)$('help').textContent='W / S drive · A / D turn · Q / E lower / raise · drag to orbit';mapTick=now;}}
window.level1Walkthrough={snapshot:()=>({...state,designRevision:DESIGN.revision,sharedExitColumn,lab123:DESIGN.level1.lab123,position:camera.position.toArray(),places121:fixedSeatCount+2,seminar:SEMINAR,seminarRows:SEMINAR_ROWS,tierEdges:TIER_EDGES,fixedSeats121:fixedSeatCount,places123:24,ceilingHeight:CH,platformHeight:.6,seating:seating.snapshot(),lift:storeLift?.snapshot()}),views:Object.keys(views),isFree,go};
window.labsWalkthrough=window.level1Walkthrough;
if(document.modelContext?.registerTool){const life=new AbortController();window.addEventListener('pagehide',()=>life.abort());try{Promise.resolve(document.modelContext.registerTool({name:'configure_lab_view',description:'Navigate the lab walkthrough or compare one shared-wall option.',inputSchema:{type:'object',properties:{view:{type:'string',enum:Object.keys(views)},wall:{type:'string',enum:['solid','glass','smart']},privacy:{type:'boolean'}},additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['view','wall','privacy'].includes(k))||(input.view!==undefined&&!Object.hasOwn(views,input.view))||(input.wall!==undefined&&!['solid','glass','smart'].includes(input.wall))||(input.privacy!==undefined&&typeof input.privacy!=='boolean'))throw new Error('Invalid view configuration');if(input.view)go(input.view);if(input.wall)state.wall=input.wall;if(input.privacy!==undefined)state.privacy=input.privacy;appearance();return window.labsWalkthrough.snapshot();}},{signal:life.signal})).catch(()=>{});}catch{}}
storeLift=createStoreLift({scene,rack:storeRack,solids,canvas,go,doorsOpen:()=>state.doors});
seating.apply();go('overview');resize();$('loading').classList.add('hidden');requestAnimationFrame(animate);
