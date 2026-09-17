
const root=document.getElementById('ground-labs-tour');
const $=s=>root.querySelector(s),canvas=$('.lab-scene'),loading=$('.lab-loading');
try {
const THREE=await import('../../vendor/three.module.js');
const {default:DESIGN}=await import('../../design-state.js');
const {positionNorthEastSun}=await import('../../sunlight.js');
const {createLabSeating}=await import('./seating.js');
// Metre-like model units use one centimetre on the editable drawing as one unit.
// This keeps the two plan scales, their horizontal offset and corridor depth intact.
const LOWER_H=4.95*1.58, GAP=2.3005054945, UBASE=LOWER_H+GAP;
const U=(x,p,y=1.65)=>new THREE.Vector3(2.04+1.45*x,y,-(UBASE+1.512*p));
const L=(x,p,y=1.65)=>new THREE.Vector3(1.58*x,y,-1.58*p);
// Register the supplied whole-floor map to the established laboratory outline.
// Pixel anchors preserve the existing east/south laboratory furniture geometry.
function interpolate(v,points){let i=0;while(i<points.length-2&&v>points[i+1][0])i++;const [a,b]=[points[i],points[i+1]];return a[1]+(v-a[0])*(b[1]-a[1])/(b[0]-a[0]);}
const mapX=x=>interpolate(x,[[57,(57-978)*18.407/863],[978,0],[1068,2.04],[1841,18.407],[1849,18.57]]);
const mapP=y=>interpolate(y,[[140,UBASE+6.15*1.512],[579,UBASE],[679,LOWER_H],[1045,0],[1138,-93*LOWER_H/366]]);
const M=(x,y,h=1.65)=>new THREE.Vector3(mapX(x),h,-mapP(y));
// Register only the added foyer context to the 17 September full-floor plan.
// Existing laboratory and corridor coordinates are deliberately unchanged.
const foyerX=x=>interpolate(x,[[300,57],[344,125],[446,255]]);
const foyerY=y=>interpolate(y,[[73,140],[398,579],[472,679],[695,975],[794,1077]]);
const F=(x,y,h=1.65)=>M(foyerX(x),foyerY(y),h);
const C=(x,p,h=1.65)=>new THREE.Vector3(x,h,-p);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(58,1,.035,150);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
function token(name){const e=document.createElement('span');e.style.color=`var(${name})`;root.append(e);const c=new THREE.Color(getComputedStyle(e).color);e.remove();return c;}
const fg=token('--foreground'),bg=token('--background'),accent=token('--viz-series-1'),service=token('--viz-series-2');
const illumination=(fg.r+fg.g+fg.b>bg.r+bg.g+bg.b?fg:bg).clone();
const mix=(a,b,t)=>a.clone().lerp(b,t);
function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.75,...extra});}
const mat={wall:material('#e9e9e2'),floor:material('#8ba5a3'),corridor:material('#bfc9c9'),
  frame:material('#3a4b50'),bench:material('#477b80'),legs:material('#3a4b50'),
  cupboard:material('#91a99a'),service:material('#d6a061'),column:material('#a7afa9'),
  screen:material('#f4f5f0',{emissive:'#dae8e9',emissiveIntensity:.12}),
  glass:material(accent,{transparent:true,opacity:.12,roughness:.08,depthWrite:false,side:THREE.DoubleSide}),
  light:material(mix(bg,fg,.02),{emissive:mix(bg,fg,.02),emissiveIntensity:.7})};
const walls=new THREE.Group(),ceilings=new THREE.Group(),labels=new THREE.Group();scene.add(walls,ceilings,labels);
const coreWalls=new THREE.Group();coreWalls.name='Permanent solid service-core walls';scene.add(coreWalls);
const southHallLabWall=new THREE.Group();southHallLabWall.name='Permanent solid south hallway laboratory wall';scene.add(southHallLabWall);
const fixedEnvelope=new THREE.Group();fixedEnvelope.name='Solid lobby and laboratory envelope with north windows';scene.add(fixedEnvelope);
const solids=[];
const walkAreas=[],hallDoors=[];
let entranceOption='proposed';
const existingEntrance=new THREE.Group(),proposedEntrance=new THREE.Group();
existingEntrance.name='Existing foyer wall and manual lobby doors';proposedEntrance.name='Additional direct entrance and powered glass lobby doors';
scene.add(existingEntrance,proposedEntrance);proposedEntrance.visible=false;
const existingBounds=[],proposedBounds=[];
function box(x,p,y,w,d,h,m,parent=scene){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);a.position.set(x,y,-p);a.castShadow=m!==mat.glass&&parent!==ceilings;a.receiveShadow=true;parent.add(a);return a;}
function obstacle(x,p,w,d){solids.push({x0:x-w/2,x1:x+w/2,p0:p-d/2,p1:p+d/2});}
function rect(T,x0,p0,x1,p1,h,m,{parent=scene,collide=true,y=h/2}={}){const a=T(x0,p0,0),b=T(x1,p1,0),x=(a.x+b.x)/2,p=-(a.z+b.z)/2,w=Math.abs(a.x-b.x),d=Math.abs(a.z-b.z);const o=box(x,p,y,w,d,h,m,parent);if(collide)obstacle(x,p,w,d);return o;}
function wall(T,x0,p0,x1,p1,{glass=false,parent=walls}={}){const a=T(x0,p0),b=T(x1,p1),x=(a.x+b.x)/2,p=-(a.z+b.z)/2,w=Math.max(.10,Math.abs(a.x-b.x)),d=Math.max(.10,Math.abs(a.z-b.z));box(x,p,1.5,w,d,3,glass?mat.glass:mat.wall,glass?scene:parent);obstacle(x,p,w,d);if(glass){box(x,p,.04,w,d,.08,mat.frame);box(x,p,2.97,w,d,.06,mat.frame);const n=Math.ceil(Math.max(w,d)/1.5);for(let i=0;i<=n;i++)box(a.x+(b.x-a.x)*i/n,-a.z-(b.z-a.z)*i/n,1.5,.035,.055,3,mat.frame);}}
function sprite(text,x,p,y,size=1.2){const c=document.createElement('canvas');c.width=512;c.height=80;const ct=c.getContext('2d');ct.fillStyle='#'+fg.getHexString();let fontSize=40;ct.font=`500 ${fontSize}px sans-serif`;while(ct.measureText(text).width>490&&fontSize>12){fontSize--;ct.font=`500 ${fontSize}px sans-serif`;}ct.textAlign='center';ct.textBaseline='middle';ct.fillText(text,256,40);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.position.set(x,y,-p);s.scale.set(size,size*80/512,1);labels.add(s);}
rect(U,0,0,11.4,6.15,.10,mat.floor,{collide:false,y:-.05});
rect(L,0,0,10.58,4.95,.10,mat.floor,{collide:false,y:-.05});
rect(L,10.58,.519,11.65,4.95,.10,mat.floor,{collide:false,y:-.05});
// Hallways and lift lobby, traced from the supplied 12 September map.
function floorArea(x0,y0,x1,y1){rect(M,x0,y0,x1,y1,.1,mat.corridor,{collide:false,y:-.05});const a=M(x0,y0),b=M(x1,y1);walkAreas.push({x0:a.x,x1:b.x,p0:-b.z,p1:-a.z});rect(M,x0,y0,x1,y1,.12,mat.wall,{parent:ceilings,collide:false,y:3.06});}
floorArea(125,579,1907,679); // Main north corridor.
floorArea(125,540,255,579); // Western return by the toilets.
floorArea(503,679,599,983); // Link beside Store 3 and the service shaft.
floorArea(57,679,253,975); // Lift lobby.
floorArea(57,975,255,1077); // Landing outside the southern lobby door.


// Southern hallway follows the combined-workshop frontage, including its steps.
const southHall=DESIGN.level0.southHall;
function polygonSlab(points,material,name){
 const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const a of points.slice(1))shape.lineTo(...a);shape.closePath();
 const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material);mesh.rotation.x=-Math.PI/2;mesh.position.y=-.003;mesh.name=name;mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
polygonSlab(southHall.floorPolygon,mat.corridor,'Stepped south hallway floor');
polygonSlab(southHall.workshopPolygon,mat.column,'Expanded workshop — northern end only');
for(const [x0,p0,x1,p1] of southHall.wallSegments)wall(C,x0,p0,x1,p1);
const workshopCut=southHall.workshopPolygon.at(-1)[1],workshopLeft=southHall.workshopPolygon[0][0],workshopRight=southHall.workshopPolygon.at(-2)[0];
wall(C,workshopLeft,workshopCut,workshopLeft,southHall.workshopPolygon[0][1]);
wall(C,workshopRight,workshopCut,workshopRight,southHall.workshopPolygon.at(-3)[1]);
sprite('EXPANDED WORKSHOP',(workshopLeft+workshopRight)/2,workshopCut+.9,.08,7);
sprite('LOADING DOCK',(workshopRight+18.57)/2,workshopCut+1.2,.08,3);
function inPolygon(x,p,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>p)!==(b[1]>p)&&x<(b[0]-a[0])*(p-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
// Enclosing walls stop at the openings shown on the map.
for(const a of [[125,540,255,540],[57,679,128,679],[212,679,503,679],[599,679,978,679],[253,679,253,975],[57,975,146,975],[230,975,253,975],[255,983,255,991],[255,983,503,983],[599,983,978,983],[503,679,503,983],[599,679,599,983],[1849,579,1907,579],[1907,579,1907,679]])wall(M,...a);
wall(M,125,540,125,679,{parent:existingEntrance});existingBounds.push(solids.pop());
wall(M,57,679,57,975,{parent:fixedEnvelope});
// Main foyer: retain the old entrance and route around the west stair core.
// The drawing is cropped to the west, so no invented enclosing wall is added there.
for(const a of [[0,219,195,492],[0,492,108,688],[0,688,195,794],[195,330,344,472],[195,472,300,492],[195,688,300,695],[195,695,446,794]])floorArea(foyerX(a[0]),foyerY(a[1]),foyerX(a[2]),foyerY(a[3]));
// The northern rooms are context only; the F/M labels follow the user's correction.
rect(F,195,73,456,215,.1,mat.column,{collide:false,y:-.05});
rect(F,275,215,456,330,.1,mat.column,{collide:false,y:-.05});
for(const a of [[195,73,456,73],[195,73,195,219],[195,219,195,330],[195,330,344,330],[344,330,456,330],[456,73,456,377],[275,215,456,215],[275,215,275,330]])wall(F,...a);
const foyerReturnTop=F(344,330);wall(C,foyerReturnTop.x,-foyerReturnTop.z,DESIGN.level0.entrance.x,DESIGN.level0.entrance.north);
// Walk east from the foyer to the landing aligned with the display-cabinet wall.
// Restore the intermediate landing half a floor above the foyer (1.5 m).
const stairStart=F(108,543),stairEnd=F(233,636),landingEnd=F(300,688),stairRise=1.5,stairCount=10;
const stairRun=stairEnd.x-stairStart.x,stairDepth=stairEnd.z-stairStart.z;
const stairAreas=[{x0:stairStart.x,x1:stairEnd.x,p0:-stairEnd.z,p1:-stairStart.z},{x0:stairEnd.x,x1:landingEnd.x,p0:-landingEnd.z,p1:-F(233,492).z}];
walkAreas.push(...stairAreas);
for(let i=0;i<stairCount;i++){
 const h=(i+1)*stairRise/stairCount,x=stairStart.x+(i+.5)*stairRun/stairCount,p=-(stairStart.z+stairEnd.z)/2;
 box(x,p,h/2,stairRun/stairCount,stairDepth,h,mat.column);
 box(x-stairRun/stairCount/2+.025,p,h+.008,.05,stairDepth,.016,mat.frame);
}
rect(F,233,492,300,688,.16,mat.column,{collide:false,y:stairRise-.08});
wall(F,233,492,300,492);wall(F,233,688,300,688);
// Upper-level guards rise above the landing, not from the ground-floor datum.
for(const [x0,y0,x1,y1] of [[233,492,300,492],[233,688,300,688],[300,492,300,688]]){
 const a=F(x0,y0),b=F(x1,y1),x=(a.x+b.x)/2,p=-(a.z+b.z)/2,w=Math.max(.06,Math.abs(b.x-a.x)),d=Math.max(.06,Math.abs(b.z-a.z));
 box(x,p,stairRise+.5,w,d,1,mat.glass);box(x,p,stairRise+1,w,d,.06,mat.frame);
 for(const v of [a,b])box(v.x,-v.z,stairRise+.5,.06,.06,1,mat.frame);
}
// Stair handrails follow the eastward rise; landing rails prevent walking off its edges.
for(const p of [-stairStart.z,-stairEnd.z]){
 const rail=box((stairStart.x+stairEnd.x)/2,p,.9+stairRise/2,Math.hypot(stairRun,stairRise),.055,.055,mat.frame);rail.rotation.z=Math.atan2(stairRise,stairRun);
 for(let i=0;i<=stairCount;i+=2)box(stairStart.x+i*stairRun/stairCount,p,.45+i*stairRise/stairCount,.04,.04,.9,mat.frame);
 obstacle((stairStart.x+stairEnd.x)/2,p,stairRun,.06);
}
for(const [y0,y1] of [[492,543],[636,688]]){
 const a=F(233,y0),b=F(233,y1);box(a.x,-(a.z+b.z)/2,stairRise+.5,.06,Math.abs(b.z-a.z),1,mat.glass);obstacle(a.x,-(a.z+b.z)/2,.06,Math.abs(b.z-a.z));
}
function walkingHeight(x,z){const p=-z;if(stairAreas[1]&&x>=stairAreas[1].x0&&x<=stairAreas[1].x1&&p>=stairAreas[1].p0&&p<=stairAreas[1].p1)return stairRise;if(x>=stairStart.x&&x<stairEnd.x&&p>=-stairEnd.z&&p<=-stairStart.z)return Math.min(stairRise,Math.ceil((x-stairStart.x)/stairRun*stairCount)*stairRise/stairCount);return 0;}
wall(F,195,794,446,794);
// Retained glazed main foyer entrance, shown open on the reference's north edge.
const foyerEntryA=F(6,219),foyerEntryB=F(178,219);
doorPair(C,foyerEntryA.x,foyerEntryB.x,-foyerEntryA.z,-1);
// Keep the fountain at the former label location, with its rear against the toilet wall.
const fountain=F(221,330);fountain.z+=.05+.44/2;
const fountainGroup=new THREE.Group();fountainGroup.name='Drinking fountain at former G.01a label';scene.add(fountainGroup);
box(fountain.x,-fountain.z,.43,.48,.40,.86,mat.column,fountainGroup);
box(fountain.x,-fountain.z,.88,.53,.44,.05,mat.frame,fountainGroup);
box(fountain.x,-fountain.z,.91,.35,.29,.025,mat.screen,fountainGroup);
box(fountain.x+.14,-fountain.z+.08,.96,.035,.035,.1,mat.frame,fountainGroup);obstacle(fountain.x,-fountain.z,.53,.44);
for(const [text,x,y,size] of [['G.MF · MAIN FOYER',60,425,4],['G.01 · FEMALE TOILETS',337,145,3.8],['G.02 · MALE TOILETS',365,273,3.4],['DRINKING FOUNTAIN',221,355,2.6],['WEST STAIRS',194,584,3],['EXISTING ENTRANCE · RETAINED',91,230,3.5]]){const v=F(x,y);sprite(text,v.x,-v.z,3.35,size);}
for(const [x,y] of [[100,300],[260,410],[60,560],[110,725],[350,738]]){const v=F(x,y);box(v.x,-v.z,2.97,.1,1,.04,mat.light,ceilings);}
// Glazed display cases face the lifts from the opposite, solid west lobby wall.
const displayCases=new THREE.Group();displayCases.name='Lift lobby display cabinets';scene.add(displayCases);
const displayWest=mapX(57)+.10,displayDepth=.52,displayStart=mapP(949),displayEnd=mapP(710),displayCount=6,displayBay=(displayEnd-displayStart)/displayCount;
for(let i=0;i<displayCount;i++){
 const x=displayWest+displayDepth/2,p=displayStart+(i+.5)*displayBay,d=displayBay-.025;
 box(x,p,.24,displayDepth,d,.48,mat.cupboard,displayCases);
 box(displayWest+.025,p,1.25,.05,d,1.50,mat.cupboard,displayCases);
 box(x,p,2.07,displayDepth,d,.065,mat.cupboard,displayCases);
 box(displayWest+displayDepth-.02,p,1.27,.025,d-.065,1.52,mat.glass,displayCases);
 for(const pp of [p-d/2+.025,p+d/2-.025]){
  box(x,pp,1.27,displayDepth,.025,1.52,mat.glass,displayCases);
  box(displayWest+displayDepth-.02,pp,1.27,.035,.035,1.56,mat.frame,displayCases);
 }
 for(const h of [.53,1.03,1.53])box(x,p,h,displayDepth-.065,d-.065,.025,mat.glass,displayCases);
 box(displayWest+displayDepth+.012,p-.08,1.17,.035,.022,.15,mat.frame,displayCases);
 obstacle(x,p,displayDepth,d);
}
sprite('DISPLAY CABINETS',displayWest+.26,(displayStart+displayEnd)/2,2.35,2.9);
// Solid north walls below and above a continuous run of glazed window bays.
// Window sill/head heights are illustrative within the confirmed 3 m ceiling.
function northWindowWall(T,x0,p0,x1,p1){
 const a=T(x0,p0),b=T(x1,p1),x=(a.x+b.x)/2,p=-(a.z+b.z)/2,w=b.x-a.x,sill=1.10,head=2.75,thickness=.16;
 box(x,p,sill/2,w,thickness,sill,mat.wall,fixedEnvelope);
 box(x,p,(3+head)/2,w,thickness,3-head,mat.wall,fixedEnvelope);
 box(x,p,(sill+head)/2,w-.12,.028,head-sill,mat.glass,fixedEnvelope);
 for(const h of [sill,head])box(x,p,h,w,.18,.06,mat.frame,fixedEnvelope);
 const bays=Math.ceil(w/1.5);
 for(let i=0;i<=bays;i++)box(a.x+w*i/bays,p,(sill+head)/2,i===0||i===bays?.12:.045,.16,head-sill,mat.frame,fixedEnvelope);
 obstacle(x,p,w,thickness);
}
// These four service spaces have permanent opaque, full-height enclosures.
// Outer-wall cutaway affects the laboratories and hallways, not these walls.
function contextRoom(x0,y0,x1,y1,name){
 rect(M,x0,y0,x1,y1,.10,mat.column,{collide:false,y:-.05});
 const a=M(x0,y0),b=M(x1,y1),x=(a.x+b.x)/2,p=-(a.z+b.z)/2,w=b.x-a.x,d=Math.abs(b.z-a.z),t=.14;
 const enclosure=new THREE.Group();enclosure.name=name+' solid walls';coreWalls.add(enclosure);
 for(const xx of [a.x+t/2,b.x-t/2])box(xx,p,1.5,t,d,3,mat.wall,enclosure);
 for(const pp of [-a.z-t/2,-b.z+t/2])box(x,pp,1.5,w,t,3,mat.wall,enclosure);
 box(x,p,3.06,w,d,.12,mat.wall,ceilings);
 obstacle(x,p,w,d);
 sprite(name,x,p,3.25,Math.min(3,w));
}
contextRoom(255,695,365,975,'LIFTS');contextRoom(375,695,503,975,'STORE 3');
contextRoom(615,695,821,967,'SERVICE SHAFT');contextRoom(827,695,960,967,'STORE');
// Lift-car doors remain separate from the inward-swinging glass lobby doors.
for(const y of [757,898]){const v=M(254,y);box(v.x-.035,-v.z,1.1,.035,1.45,2.2,mat.frame);for(const dy of [-.36,.36])box(v.x-.06,-v.z+dy,1.07,.024,.70,2.1,mat.column);}
function glazedLeaf(width){const g=new THREE.Group();box(width/2,0,1.1,width,.035,2.2,mat.glass,g);for(const x of [.025,width-.025])box(x,0,1.1,.05,.065,2.2,mat.frame,g);for(const y of [.025,2.175])box(width/2,0,y,width,.065,.05,mat.frame,g);box(width/2,0,1.10,width,.039,.045,mat.screen,g);return g;}
function outwardFoyerDoor(cfg){
 const leaves=[],w=cfg.openingWidth/2,name='Double foyer doors';
 for(const [p,closed,open] of [[cfg.north,-Math.PI/2,-Math.PI],[cfg.south,Math.PI/2,Math.PI]]){
  const leaf=glazedLeaf(w);leaf.position.set(cfg.x,0,-p);proposedEntrance.add(leaf);
  box(w-.12,-.06,1,.035,.08,.25,mat.frame,leaf);
  leaves.push({mesh:leaf,closed,open});
 }
 box(cfg.x,(cfg.north+cfg.south)/2,2.67,.10,cfg.openingWidth,.66,mat.wall,proposedEntrance);
 const door={name,kind:'entrance-pair',leaves,w,option:'proposed',open:false,amount:0,bounds:[]};hallDoors.push(door);return door;
}
function swingingLobbyDoor(x0,x1,y,name,inward,option='existing'){
 const a=M(x0,y),b=M(x1,y),count=option==='proposed'?1:2,w=(b.x-a.x)/count,leaves=[];
 const parent=option==='proposed'?proposedEntrance:existingEntrance;
 for(let i=0;i<count;i++){
  const leaf=glazedLeaf(w);box(w-.12,-.06,1,.035,.08,.25,mat.frame,leaf);leaf.position.set(i?b.x:a.x,0,a.z);parent.add(leaf);
  // Opposite jambs rotate in opposite directions, into the same lobby interior.
  const closed=i?Math.PI:0,open=closed+(i?-inward:inward)*Math.PI/2;
  leaves.push({mesh:leaf,closed,open});
  if(option==='proposed'){
   box((i?b.x:a.x)+(i?-.20:.20),-a.z+inward*.08,2.27,.40,.16,.13,mat.frame,parent);
   box(.23,inward*.08,2.22,.40,.045,.045,mat.column,leaf);
  }
 }
 box((a.x+b.x)/2,-a.z,2.67,b.x-a.x,.10,.66,mat.wall,parent);
 const d={name,kind:'swingpair',leaves,w,option,inward,open:false,amount:option==='existing'?1:0,bounds:[]};hallDoors.push(d);return d;
}
swingingLobbyDoor(128,212,679,'North lobby — existing',-1);swingingLobbyDoor(146,230,975,'South lobby — existing',1);
const northLobbyDoor=swingingLobbyDoor(128,212,679,'North lobby',-1,'proposed');
const southLobbyDoor=swingingLobbyDoor(146,230,975,'South lobby',1,'proposed');
const directDoor=outwardFoyerDoor(DESIGN.level0.entrance);
// High-contrast, large push pads on both approaches, outside the clear opening.
// Wall-mounted on both wall faces; 1.0 m centre height is illustrative, not certification.
const accessPads=[];
function accessPad(x,y,door,face=1,axis='p'){
 const v=M(x,y),g=new THREE.Group();g.name=door.name+' wall-mounted accessible control';proposedEntrance.add(g);
 // Wall is 100 mm thick; the backing plate sits flush against its selected face.
 if(axis==='p')v.z-=face*(.05+.075/2);else v.x+=face*(.05+.075/2);
 box(v.x,-v.z,1,axis==='p'?.24:.075,axis==='p'?.075:.24,.28,mat.frame,g);
 const pad=box(v.x+(axis==='x'?face*.045:0),-v.z+(axis==='p'?face*.045:0),1,axis==='p'?.17:.035,axis==='p'?.035:.17,.18,mat.service,g);pad.userData.accessDoor=door;accessPads.push(pad);
 // A contrasting central push target remains readable at seated eye height.
 box(v.x+(axis==='x'?face*.066:0),-v.z+(axis==='p'?face*.066:0),1,axis==='p'?.09:.008,axis==='p'?.008:.09,.09,mat.screen,g);
 obstacle(v.x,-v.z,axis==='p'?.24:.14,axis==='p'?.14:.24);const bound=solids.pop();pad.userData.bound=bound;
}
accessPad(233,679,northLobbyDoor,1);accessPad(233,679,northLobbyDoor,-1);
accessPad(125,975,southLobbyDoor,1);accessPad(125,975,southLobbyDoor,-1);
// Two equal glass entrance leaves swing west into the foyer. Operator choice remains unassigned.
// Solid south-hall entrance with a real aperture for a narrow vision panel.
// Its western jamb is east of the southern lift-lobby doorway.
const hardHinge=M(255,991),hardEnd=M(255,1077),hardW=Math.abs(hardHinge.z-hardEnd.z),hard=new THREE.Group();
hard.position.copy(hardHinge);hard.position.y=0;scene.add(hard);
const paneW=.16,paneX=hardW-.34,paneBottom=1.08,paneTop=1.96;
box((paneX-paneW/2)/2,0,1.1,paneX-paneW/2,.055,2.2,mat.service,hard);
box((paneX+paneW/2+hardW)/2,0,1.1,hardW-paneX-paneW/2,.055,2.2,mat.service,hard);
box(paneX,0,paneBottom/2,paneW,.055,paneBottom,mat.service,hard);
box(paneX,0,(paneTop+2.2)/2,paneW,.055,2.2-paneTop,mat.service,hard);
box(paneX,0,(paneBottom+paneTop)/2,paneW,.022,paneTop-paneBottom,mat.glass,hard);
for(const x of [paneX-paneW/2,paneX+paneW/2])box(x,0,(paneBottom+paneTop)/2,.022,.069,paneTop-paneBottom,mat.frame,hard);
for(const h of [paneBottom,paneTop])box(paneX,0,h,paneW+.022,.069,.022,mat.frame,hard);
box(hardW-.12,-.06,1.0,.035,.09,.28,mat.frame,hard);
box(hardHinge.x,-(hardHinge.z+hardEnd.z)/2,2.6,.1,hardW,.8,mat.wall,walls);
hallDoors.push({kind:'hinged',mesh:hard,w:hardW,x:hardHinge.x,p:-hardHinge.z,amount:1,bounds:[]});
let hallwayDoorsOpen=true;
function updateHallDoors(dt=1){for(const d of hallDoors){
 d.bounds=[];if(d.option&&d.option!==entranceOption)continue;
 const target=d.option==='proposed'?d.open:hallwayDoorsOpen;
 d.amount=THREE.MathUtils.damp(d.amount,target?1:0,6,dt);
 if(d.leaves){for(const l of d.leaves){
  l.mesh.rotation.y=THREE.MathUtils.lerp(l.closed,l.open,d.amount);
  l.mesh.updateWorldMatrix(true,false);const a=l.mesh.localToWorld(new THREE.Vector3()),b=l.mesh.localToWorld(new THREE.Vector3(d.w,0,0));
  d.bounds.push({x0:Math.min(a.x,b.x)-.03,x1:Math.max(a.x,b.x)+.03,p0:Math.min(-a.z,-b.z)-.03,p1:Math.max(-a.z,-b.z)+.03});
 }}else{const angle=-Math.PI/2*(1-d.amount);d.mesh.rotation.y=angle;const endX=d.x+Math.cos(angle)*d.w,endP=d.p+Math.sin(angle)*d.w;d.bounds.push({x0:Math.min(d.x,endX)-.025,x1:Math.max(d.x,endX)+.025,p0:Math.min(d.p,endP)-.025,p1:Math.max(d.p,endP)+.025});}
}}
updateHallDoors();
// West lab G.04 retains the map's stair recess on its southern frontage.
rect(M,255,140,1068,511,.1,mat.floor,{collide:false,y:-.05});rect(M,255,511,369,579,.1,mat.floor,{collide:false,y:-.05});rect(M,698,511,1068,579,.1,mat.floor,{collide:false,y:-.05});
rect(M,255,140,1068,511,.12,mat.wall,{parent:ceilings,collide:false,y:3.06});rect(M,255,511,369,579,.12,mat.wall,{parent:ceilings,collide:false,y:3.06});rect(M,698,511,1068,579,.12,mat.wall,{parent:ceilings,collide:false,y:3.06});
// The northwest lab's west end remains a solid 3 m wall in every view.
wall(M,255,140,255,579,{parent:fixedEnvelope});
for(const a of [[369,511,698,511],[369,511,369,579],[698,511,698,579]])wall(M,...a);
northWindowWall(M,255,140,1068,140);
// Match the upper-floor wave pattern, at 35% strength for lighter ground-floor frosting.
// Visual film representation only, not an optical diffusion simulation.
const hallwayFrost=new THREE.Group();hallwayFrost.name='North hallway privacy frosting';scene.add(hallwayFrost);
const privacyFilm={...DESIGN.level2.privacyFilm};
function wavePrivacyFilm(width,phaseX){
 const height=privacyFilm.top-privacyFilm.bottom;
 const c=document.createElement('canvas');c.width=Math.max(32,Math.ceil(width*420));c.height=512;
 const ctx=c.getContext('2d');
 for(let y=0;y<c.height;y++){
  const density=Math.min(1,3*Math.min(y/c.height,1-y/c.height));
  const alpha=privacyFilm.edgeOpacity+(privacyFilm.centreOpacity-privacyFilm.edgeOpacity)*density;
  ctx.fillStyle=`rgba(240,246,245,${alpha})`;ctx.fillRect(0,y,c.width,1);
 }
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
 const film=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}));
 film.position.y=(privacyFilm.bottom+privacyFilm.top)/2;hallwayFrost.add(film);
 return film;
}
function corridorGlazing(T,x0,p0,x1,p1){
 wall(T,x0,p0,x1,p1,{glass:true});
 const a=T(x0,p0),b=T(x1,p1),width=Math.abs(b.x-a.x),bays=Math.ceil(width/1.5);
 for(let i=0;i<bays;i++){
  const left=a.x+(b.x-a.x)*i/bays+.035,w=width/bays-.07;
  if(w<=0)continue;
  const film=wavePrivacyFilm(w,left);
  film.position.x=left+w/2;film.position.z=(a.z+b.z)/2-.052;
 }
}
// Glazed frontage around the two 1.5-width west-lab doors and the stair core.
const westSouth=mapP(579),westDoorWidth=1.11*1.45;
const westDoorCenters=[mapX(314),mapX(747)],westDoors=westDoorCenters.map(x=>[x-westDoorWidth/2,x+westDoorWidth/2]);
for(const [a,b] of [[mapX(255),westDoors[0][0]],[westDoors[0][1],mapX(369)],[mapX(698),westDoors[1][0]],[westDoors[1][1],mapX(1068)]])corridorGlazing(C,a,westSouth,b,westSouth);
// Stair context descends behind its existing enclosing wall.
rect(M,369,511,698,579,.1,mat.column,{collide:false,y:-.05});for(let i=0;i<10;i++)rect(M,373+i*31,515,400+i*31,575,.12,mat.frame,{collide:false,y:-.02-i*.14});
// External walls and uninterrupted, full-height corridor glazing around doors.
// Continuous solid 3 m partition behind the screens on both north-lab sides.
wall(U,0,0,0,6.15,{parent:fixedEnvelope});
northWindowWall(U,0,6.15,11.4,6.15);
wall(U,11.4,1.17,11.4,6.15,{parent:fixedEnvelope});
wall(U,11.4,0,11.4,.12,{parent:fixedEnvelope});
for(const [a,b] of [[0,.05],[1.16,9.64],[10.75,11.4]])corridorGlazing(U,a,0,b,0);
wall(L,0,0,0,4.95);
wall(L,0,0,10.58,0,{parent:southHallLabWall});
wall(L,10.58,0,10.58,.519,{parent:southHallLabWall});
wall(L,10.58,.519,11.65,.519,{parent:southHallLabWall});
wall(L,11.65,.519,11.65,4.95,{parent:fixedEnvelope});
for(const [a,b] of [[0,.15],[1.5,10.15],[11.5,11.65]])corridorGlazing(L,a,4.95,b,4.95);
rect(U,0,0,11.4,6.15,.12,mat.wall,{parent:ceilings,collide:false,y:3.06});
rect(L,0,0,10.58,4.95,.12,mat.wall,{parent:ceilings,collide:false,y:3.06});
rect(L,10.58,.519,11.65,4.95,.12,mat.wall,{parent:ceilings,collide:false,y:3.06});
// All doors retain their drawn opening widths and their 2:1 leaf split.
function doorPair(T,a,b,p,inward,largeOnRight=false,privacy=false){const start=T(a,p),end=T(b,p),width=end.x-start.x;const large=width*2/3,small=width/3;
  for(const [x,len] of [[start.x,largeOnRight?small:large],[end.x,largeOnRight?large:small]]){
    const pp=-start.z+inward*len/2;box(x,pp,1.10,.04,len,2.20,mat.glass);box(x,pp,2.19,.06,len,.06,mat.frame);box(x,pp,.03,.06,len,.06,mat.frame);
    if(privacy){const film=wavePrivacyFilm(len-.07,x+.035);film.rotation.y=Math.PI/2;film.position.x=x+.022;film.position.z=-pp;}
    for(const q of [-start.z,-start.z+inward*len])box(x,q,1.10,.045,.045,2.20,mat.frame);obstacle(x,pp,.04,len);
  }
  box((start.x+end.x)/2,-start.z,2.6,width,.035,.8,mat.glass);
}
doorPair(U,.05,1.16,0,1,false,true);doorPair(U,9.64,10.75,0,1,true,true);
doorPair(L,.15,1.5,4.95,-1,false,true);doorPair(L,10.15,11.5,4.95,-1,true,true);
for(const [a,b] of westDoors)doorPair(C,a,b,westSouth,1,false,true);
// Retained electrical cupboard on the east wall, with its double doors open.
for(const p of [.12,1.17]){const v=U(11.1375,p);box(v.x,-v.z,1.05,.525*1.45,.045,2.1,mat.service);obstacle(v.x,-v.z,.525*1.45,.045);}
const elec=U(11.46,.645);box(elec.x,-elec.z,1.1,.035,1.05*1.512,2.2,mat.frame);
// All bench footprints are transcribed from the current editable plan.
const labBenches=[];
function bench(T,x,p,w,d){const v=T(x,p),sx=T(w,0).x-T(0,0).x,sd=Math.abs(T(0,d).z-T(0,0).z);box(v.x,-v.z,.88,sx,sd,.065,mat.bench);box(v.x,-v.z,.78,sx-.10,sd-.10,.12,mat.frame);for(const dx of [-sx/2+.09,sx/2-.09])for(const dp of [-sd/2+.09,sd/2-.09])box(v.x+dx,-v.z+dp,.40,.045,.045,.8,mat.legs);obstacle(v.x,-v.z,sx,sd);labBenches.push({x:v.x,p:-v.z,width:sx,depth:sd,lab:T===U?'east':T===L?'south':'west'});}
for(const [x,p] of [[2.4825,5.4005],[4.1915,5.4005],[6.1595,5.4085],[7.9405,5.439],[9.7715,5.439],[1.792,.6795],[3.413,.703],[5.364,.7415],[7.138,.7185],[9.008,.626]])bench(U,x,p,.678,1.300);
for(const [x,p] of [[5.015,3.37],[7.014,3.37],[10.3145,3.37]])bench(U,x,p,1.356,.650);
for(const [x,p] of [[1.90125,4.2685],[3.32425,4.2685],[4.90925,4.2975],[6.38475,3.92],[8.10375,4.29],[9.74875,4.2685]])bench(L,x,p,.623,1.246);
for(const [x,p] of [[2.0745,1.986],[3.3495,1.986],[5.6915,1.994],[8.2115,1.994],[9.4855,2]])bench(L,x,p,1.246,.623);
// West lab uses precisely the same physical bench module as the south lab.
const benchShort=.623*1.58,benchLong=1.246*1.58;
for(const b of DESIGN.level0.g04.benches)bench(C,b.x+b.width/2,b.p+b.depth/2,b.width,b.depth);
const labSeating=createLabSeating(labBenches);scene.add(labSeating.group);
function setFullySeated(on){
 labSeating.group.visible=on;$('#fully-seated').checked=on;
 $('#seating-note').textContent=on?`${labSeating.seats.length} people across ${labBenches.length} tables: two on each long side. Seated bodies and stools obstruct manual walking. Existing table positions are unchanged; this is not a clearance approval.`:'Unoccupied layout. Turn on Fully seated to compare space around the tables.';
}
setFullySeated(true);
// Floor markings show the requested four-person-per-table layout capacity.
const labCapacities=Object.fromEntries(['west','east','south'].map(lab=>[lab,labBenches.filter(b=>b.lab===lab).length*4]));
function capacityMark(lab,v){
 const c=document.createElement('canvas');c.width=1024;c.height=320;
 const ctx=c.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.lineJoin='round';ctx.strokeStyle='#243b43';ctx.fillStyle='#ffffff';ctx.lineWidth=10;
 ctx.font='bold 142px sans-serif';
 const title=`MAX ${labCapacities[lab]} SEATS`;
 ctx.strokeText(title,512,122);ctx.fillText(title,512,122);
 ctx.font='bold 48px sans-serif';ctx.lineWidth=5;
 ctx.strokeText('4 PEOPLE PER TABLE',512,245);ctx.fillText('4 PEOPLE PER TABLE',512,245);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const mark=new THREE.Mesh(new THREE.PlaneGeometry(3.5,1.094),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));
 mark.name=`${lab} lab capacity: ${labCapacities[lab]}`;mark.rotation.x=-Math.PI/2;
 mark.position.set(v.x,.015,v.z);scene.add(mark);
}
capacityMark('west',M(700,365));capacityMark('east',U(5.7,2.10));capacityMark('south',L(5.3,3.13));
for(const x of [535,849])rect(M,x-15,328,x+15,349,3,mat.column);
for(const [x,p] of [[1.18,3.155],[5.78,3.155],[10.97,3.155]])rect(U,x,p,x+.43,p+.43,3,mat.column);
rect(L,5.62,.64,6.20,1.22,3,mat.column);rect(L,5.68,4.55,6.11,4.98,3,mat.column);
// Low cubbies are open on the room side, with two tiers and a continuous top.
function cubbies(T,x0,p0,x1,p1,face){const a=T(x0,p0),b=T(x1,p1),x=(a.x+b.x)/2,p=-(a.z+b.z)/2,w=b.x-a.x,d=Math.abs(b.z-a.z);obstacle(x,p,w,d);for(const y of [.06,.43,.84])box(x,p,y,w,d,.045,mat.cupboard);box(face==='east'?a.x+.02:b.x-.02,p,.45,.035,d,.78,mat.cupboard);const n=Math.round(d/.72);for(let i=0;i<=n;i++)box(x,-a.z+d*i/n,.45,w,.035,.78,mat.cupboard);}
cubbies(U,.08,1.38,.435,4.78,'east');cubbies(L,11.247,.519,11.573,4.09,'west');
function cabinet(T,x0,p0,x1,p1,kind='cupboard'){const r=rect(T,x0,p0,x1,p1,.82,kind==='cupboard'?mat.cupboard:mat.service);const a=T(x0,p0),b=T(x1,p1);const w=b.x-a.x,d=Math.abs(b.z-a.z),x=(a.x+b.x)/2,p=-(a.z+b.z)/2;box(x,p,.855,w,d,.05,kind==='ds'?mat.service:mat.bench);
 if(kind==='sink'){box(x,p,.888,Math.min(.65,w*.7),Math.min(.42,d*.65),.02,mat.frame);box(x+.14,p+.10,1.03,.025,.025,.29,mat.frame);box(x+.14,p+.03,1.17,.025,.16,.025,mat.frame);}
 if(kind==='ds'){box(x,p,1.10,.34,.035,.23,mat.frame);box(x,p,.97,.035,.035,.20,mat.frame);}
 if(kind==='cupboard'){const alongX=w>d,n=Math.max(1,Math.round((alongX?w:d)/.70));for(let i=1;i<n;i++)box(alongX?a.x+w*i/n:x,alongX?p:-a.z+d*i/n,.43,alongX?.012:w+.004,alongX?d+.004:.012,.75,mat.frame);}
 return r;
}
cabinet(U,.08,4.86,.60,6.07,'sink');cabinet(U,1.72,3.04,2.20,3.68,'ds');
cabinet(U,10.95,3.585,11.337,5.376);cabinet(U,10.98,1.298,11.337,3.013);
cabinet(L,0,.074,5.484,.415);cabinet(L,6.210,.089,7.396,.445,'sink');cabinet(L,7.441,.089,9.932,.430);cabinet(L,9.932,.074,10.554,.459,'ds');
// West arrival zone: bag storage and DS beside the left-hand corridor door.
cubbies(C,mapX(260),mapP(528),mapX(282),mapP(395),'east');
const ds=DESIGN.level0.g04.demonstrator;
cabinet(C,ds.x,ds.p,ds.x+ds.width,ds.p+ds.depth,'ds');
cabinet(C,mapX(260),mapP(173),mapX(384),mapP(145),'sink');
cabinet(C,mapX(388),mapP(173),mapX(1062),mapP(145));

function screen(T,x,p0,p1,face){const a=T(x,p0),b=T(x,p1),p=-(a.z+b.z)/2,d=Math.abs(b.z-a.z);box(a.x,p,2.03,.065,d,1.65,mat.frame);box(a.x+face*.04,p,2.03,.02,d-.08,1.57,mat.screen);box(a.x,p,2.91,.15,d+.10,.10,mat.frame);
 // Simple projected diagram establishes which way the screen faces.
 for(let i=0;i<4;i++)box(a.x+face*.055,p+(i-1.5)*d*.17,1.87+i*.065,.006,d*.085,.1+i*.11,mat.bench);
}
// Plan screen bars sit outside the outline for clarity; surfaces face into rooms.
screen(U,.025,.82,2.83,1);screen(U,.025,4.10,6.11,1);
screen(L,.12,1.60,3.48,1);screen(L,11.60,1.56,3.29,-1);
for(const d of DESIGN.level0.g04.displays)screen(C,d.x,d.p-d.width/2,d.p+d.width/2,d.face);
// Illustrative ceiling projectors, aimed at the end screens.
for(const [T,x,p] of [[U,3,1.825],[U,3,5.105],[L,3,2.54],[L,8.7,2.425]]){const v=T(x,p);box(v.x,-v.z,2.76,.32,.25,.12,mat.frame,ceilings);box(v.x,-v.z,2.91,.035,.035,.20,mat.frame,ceilings);}
// Keep illumination independent of ceiling visibility for the cutaway view.
// Shadowless local lights are illustrative, not a photometric/lux simulation.
const electricLights=new THREE.Group();electricLights.name='Ground floor electric lighting';scene.add(electricLights);
function electricFixture(v){
 box(v.x,-v.z,2.97,.10,1.0,.04,mat.light,ceilings);
 const light=new THREE.PointLight('#fff5e4',16,7,2);
 light.position.set(v.x,2.72,v.z);electricLights.add(light);
}
function setElectricLighting(on){electricLights.visible=on;mat.light.emissiveIntensity=on?1.2:0;$('#electric-lighting').checked=on;}
for(const [T,ys] of [[U,[1.8,4.3]],[L,[1.0,3.0]]])for(const x of [2,5,8,10])for(const p of ys)electricFixture(T(x,p));
for(const x of [400,650,900])for(const y of [260,415])electricFixture(M(x,y));
for(const y of [252,440]){const v=M(927,y);box(v.x,-v.z,2.76,.32,.25,.12,mat.frame,ceilings);box(v.x,-v.z,2.91,.035,.035,.20,mat.frame,ceilings);}
for(const [x,y] of [[170,740],[170,900],[290,627],[670,627],[1180,627],[1660,627],[550,810],[700,1045],[1190,1090]])electricFixture(M(x,y));
setElectricLighting(true);
for(const [x,y] of [[100,300],[260,410],[60,560],[110,725],[350,738]])electricFixture(F(x,y));
scene.add(new THREE.HemisphereLight(illumination,mix(illumination,accent,.25),1.6));
const sun=new THREE.DirectionalLight(illumination,2.0);positionNorthEastSun(sun,0,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:.1,far:70});sun.shadow.normalBias=.03;scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight(mix(illumination,accent,.2),.6);fill.position.set(23,14,-25);scene.add(fill);
sprite('G.06 / G.07',10.3,15,3.35,4);sprite('G.09 / G.08',9.2,4.2,3.35,4);
sprite('CORRIDOR',8.5,(LOWER_H+UBASE)/2,.1,3);
for(const [text,x,y,size] of [['G.04 · WEST LAB',660,370,4],['LIFT LOBBY',151,830,3],['NORTH HALLWAY',670,625,3],['SOUTH HALLWAY',750,1065,3],['STAIR',530,546,2]]){const v=M(x,y);sprite(text,v.x,-v.z,3.35,size);}
for(const [T,x,p,text] of [[U,1.96,3.36,'DEMONSTRATOR'],[L,10.243,.267,'DEMONSTRATOR'],[U,.7,2.2,'Cubbies'],[L,11.1,2.7,'Cubbies']]){const v=T(x,p);sprite(text,v.x,-v.z,1.1,text==='DEMONSTRATOR'?2.2:1.8);}
sprite('DEMONSTRATOR',ds.x+ds.width/2,ds.p+ds.depth/2,1.35,2.2);
for(const [T,x,p] of [[U,.34,5.465],[L,6.803,.267],[C,mapX(322),mapP(159)]]){const v=T(x,p);sprite('SINK',v.x,-v.z,1.3,1.3);}
const corridorP=(LOWER_H+UBASE)/2;
const stops=[
 {name:'Main foyer & drinking fountain',pos:F(120,355),look:fountain.clone().setY(1.1),text:'The existing entrance is retained. The drinking fountain is at the former G.01a label position; G.01 is female and G.02 male.'},
 {name:'Entrance beside G.02',pos:F(305,430),look:M(140,621,1.4),via:[F(120,425)],text:'The current double glass doors beside G.02 open outward into the main foyer, giving a full-width route into the north hallway.'},
 {name:'Foyer to G.C route',pos:M(175,626),look:M(600,626,1.55),via:[],text:''},
 {name:'Lift lobby',pos:M(158,837),look:M(57,823,1.35),via:[M(170,656),M(170,711)],text:'Display cabinets line the solid wall opposite the lifts. The proposed option adds push-button powered glass doors at both ends.'},
 {name:'North hallway',pos:M(172,626),look:M(1150,626,1.55),via:[M(170,711),M(170,656)],text:'The north hallway serves the west and east labs, then continues past the south lab.'},
 {name:'West lab arrival',pos:M(315,524),look:C(ds.x+ds.width/2,ds.p+ds.depth/2,1.05),via:[M(314,626),M(314,562)],text:'Enter G.04 beside the cubbies; the demonstrator is west of the western column; the stair recess remains in place.'},
 {name:'West lab teaching view',pos:M(716,365),look:M(258,250,2.05),via:[M(345,524),M(345,383),M(455,379),M(716,379)],text:'Twelve benches, two west-wall displays and one central east-wall display; the new table meets the east column.'},
 {name:'East lab approach',pos:new THREE.Vector3(-.6,1.65,-corridorP),look:U(.605,.6),via:[M(749,375),M(747,541),M(747,628)],text:'Continue east along the glazed corridor frontage to G.06 / G.07.'},
 {name:'Enter G.06 / G.07',pos:U(.65,1.6),look:U(1.96,3.36,1.2),via:[U(.605,-.55),U(.605,.9)],text:'Enter through the inward-opening, 1.5-width door; the demonstrator station is ahead.'},
 {name:'Briefing and bag storage',pos:U(2.8,2.5),look:U(.4,3.3,1.25),via:[U(.65,2.45)],text:'Receive the briefing at DS, then use the low cubbies along the left wall.'},
 {name:'Bench and screen view',pos:U(4.0,2.05),look:U(.025,1.825,2.03),text:'The two separated screens serve the bench area on either side of the column sightline.'},
 {name:'Demonstrator circulation',pos:U(8.5,2.10),look:U(5.3,4.3,1.1),text:'The aisle between bench rows provides access to students and experiments.'},
 {name:'East lab exit',pos:U(10.20,1.55),look:U(11.4,.645,1.2),text:'The right-hand exit sits clear of the retained electrical-cupboard double doors.'},
 {name:'Cross into the south lab',pos:L(10.825,4.28),look:L(10.67,2.9,1.25),via:[U(10.195,.8),U(10.195,-.5),L(10.825,5.40)],text:'Cross the corridor and enter G.09 / G.08 through its right-hand 1.5-width door.'},
 {name:'South briefing and cubbies',pos:L(10.68,.94),look:L(10.243,.267,1.05),via:[L(10.68,3.4)],text:'Store bags in the right-wall cubbies; the second demonstrator station is at the end of the cupboard run.'},
 {name:'Sink and storage wall',pos:L(7.0,.90),look:L(6.803,.267,.9),text:'Cupboards run along the bottom wall; the sink sits to the right of the column, with a clear gap behind it.'},
 {name:'South lab screen view',pos:L(6.97,2.73),look:L(.12,2.54,2.03),via:[L(6.97,1.1)],text:'Projection at both ends serves this narrower space around the two columns.'},
 {name:'Shared supervision',pos:new THREE.Vector3(9.8,1.65,-corridorP),look:U(5.3,2.8,1.35),via:[L(10.68,2.73),L(10.825,4.28),L(10.825,5.40)],text:'Hallway glazing and lab doors have a much lighter version of the Levels 2 and 3 wave pattern, from 0.75–1.85 m. Clear glass remains above and below; the faint frosting preserves views through the labs.'},
 {name:'South hallway entrance',pos:M(192,1031),look:M(268,1031,1.45),via:[M(170,626),M(170,713),M(180,916),M(186,999)],text:'East of the southern inward-opening glass lobby doors, a solid hinged door with a narrow vision panel leads into the south hallway.'},
 {name:'South hallway',pos:M(440,1033),look:M(1120,1090,1.55),via:[M(242,1031),M(280,1031)],text:'The south hallway runs east past the stores and service shaft, then alongside the south laboratory.'}
];
function setEntranceRoute(){
 stops[2].via=entranceOption==='proposed'?[M(80,621),M(170,621)]:[F(75,430),F(75,725),F(375,735),M(188,1020),M(188,900),M(170,711)];
 stops[2].text=entranceOption==='proposed'?'Use the additional direct entrance beside G.02 to reach G.C without passing through the lift lobby. The existing entrance remains available.':'The existing route goes around the west stairs, through the southern lift-lobby doors and out through the northern doors into G.C.';
}
setEntranceRoute();
const nav=$('.destinations');stops.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.dataset.stop=i;const num=document.createTextNode(String(i+1).padStart(2,'0')+' '),label=document.createElement('span');label.textContent=s.name;b.append(num,label);b.onclick=()=>{stopPlay();go(i);};nav.append(b);});
let index=-1,playing=false,pauseUntil=0,animation=null,mode='overview';
let yaw=0,pitch=0,azimuth=-.08,elevation=1.04,radius=29;
const orbitTarget=new THREE.Vector3(-5.5,0,-9.8),keys=new Set();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function lookAt(v){const d=v.clone().sub(camera.position).normalize();yaw=Math.atan2(d.x,-d.z);pitch=Math.asin(d.y);orient();}
function orient(){camera.lookAt(camera.position.clone().add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))));}
function orbit(){camera.position.set(orbitTarget.x+radius*Math.sin(azimuth)*Math.cos(elevation),radius*Math.sin(elevation),orbitTarget.z+radius*Math.cos(azimuth)*Math.cos(elevation));camera.lookAt(orbitTarget);}
function update(){walls.visible=mode!=='overview';ceilings.visible=mode!=='overview';labels.visible=mode==='overview';$('.lab-move').hidden=mode==='overview';$('.lab-help').textContent=mode==='overview'?'Drag to orbit · scroll to zoom':'Drag to look · WASD or buttons to walk';$('.lab-count').textContent=index<0?'Overview':`${index+1} / ${stops.length}`;$('.lab-caption').textContent=index<0?'Main foyer, three laboratories, the lift lobby and hallways. Compare the entrance options above.':stops[index].text;$('.lab-view-label').textContent=index<0?'Ground Floor Laboratories':stops[index].name;root.querySelectorAll('[data-stop]').forEach(b=>{const selected=Number(b.dataset.stop)===index;b.classList.toggle('selected',selected);b.setAttribute('aria-current',selected?'step':'false');});$('#ceiling').checked=ceilings.visible;$('#cutaway').checked=!walls.visible;$('.lab-eye').textContent=mode==='overview'?'Orbit view':'1.65 m eye level';for(const a of ['overview','walk']){const active=mode===a;$('[data-action="'+a+'"]').classList.toggle('active',active);$('[data-action="'+a+'"]').setAttribute('aria-pressed',String(active));}$('[data-action="next"]').textContent=index<0?'Start walkthrough':index===stops.length-1?'Finish':'Next';$('[data-action="previous"]').disabled=index<0;$('[data-action="play"]').textContent=playing?'Pause tour':'Play tour';$('[data-action="play"]').setAttribute('aria-pressed',String(playing));}
function go(n,animated=false){const old=index;index=n;animation=null;keys.clear();if(n<0){mode='overview';orbit();}else{mode='walk';hallwayDoorsOpen=true;$('#hall-doors').checked=true;if(animated||playing){for(const d of hallDoors)if(d.option==='proposed')d.open=true;updateHallDoors(2);}const s=stops[n];if(animated&&old===n-1&&old>=0&&!reduced){const pts=[camera.position.clone(),...(s.via||[]),s.pos],lengths=[];let total=0;for(let i=1;i<pts.length;i++){const l=pts[i].distanceTo(pts[i-1]);lengths.push(l);total+=l;}animation={pts,lengths,total,start:performance.now(),duration:Math.max(1300,total/2.1*1000),target:s.look.clone()};}else{camera.position.copy(s.pos);lookAt(s.look);}pauseUntil=performance.now()+4800;}update();}
function openAccessDoor(door){if(entranceOption!=='proposed'||!door)return;door.open=true;$('.door-status').textContent=door.name+' opening; held open until reset.';}
function setEntranceOption(option){
 if(!['existing','proposed'].includes(option))return;
 entranceOption=option;playing=false;animation=null;keys.clear();existingEntrance.visible=option==='existing';proposedEntrance.visible=option==='proposed';
 for(const d of hallDoors)if(d.option==='proposed'){d.open=false;d.amount=0;}
 setEntranceRoute();updateHallDoors(2);
 for(const key of ['existing','proposed'])$('[data-option="'+key+'"]').setAttribute('aria-pressed',String(key===option));
 $('.access-controls').hidden=option!=='proposed';
 $('.option-caption').textContent=option==='proposed'?'Existing entrance retained. Full-width double glass doors into the north hallway, opening outward into the main foyer; matching push-button single glass doors at both ends of the lift lobby.':'Existing entrance retained. Reach G.C through the lift lobby.';
 $('.door-status').textContent='Use the controls here to preview the double foyer doors; gold push pads operate the lobby doors.';
 // Reposition safely if the option changes while standing in the new opening.
 if(mode==='walk'&&!allowed(camera.position.x,camera.position.z)){camera.position.copy(stops[1].pos);index=1;lookAt(stops[1].look);}
 update();
}
for(const option of ['existing','proposed'])$('[data-option="'+option+'"]').onclick=()=>setEntranceOption(option);
for(const [key,door] of [['direct',directDoor],['north',northLobbyDoor],['south',southLobbyDoor]])$('[data-open-door="'+key+'"]').onclick=()=>openAccessDoor(door);
$('[data-action="close-access"]').onclick=()=>{playing=false;animation=null;for(const d of hallDoors)if(d.option==='proposed')d.open=false;$('.door-status').textContent='Doors closing. Use the controls here to reopen; lobby doors also have gold push pads.';update();};
function stopPlay(){playing=false;update();}
$('[data-action="overview"]').onclick=()=>{stopPlay();go(-1);};
$('[data-action="previous"]').onclick=()=>{stopPlay();go(index-1);};
$('[data-action="next"]').onclick=()=>{stopPlay();go(index===stops.length-1?-1:index+1,true);};
$('[data-action="play"]').onclick=()=>{playing=!playing;if(playing&&(index<0||index===stops.length-1))go(0);pauseUntil=performance.now()+3200;update();};
$('[data-action="walk"]').onclick=()=>{stopPlay();go(index<0?0:index);};
$('#fully-seated').onchange=e=>setFullySeated(e.target.checked);
$('#electric-lighting').onchange=e=>setElectricLighting(e.target.checked);
$('#ceiling').onchange=e=>{ceilings.visible=e.target.checked;};
$('#cutaway').onchange=e=>{walls.visible=!e.target.checked;};
$('#hall-doors').onchange=e=>{hallwayDoorsOpen=e.target.checked;for(const d of hallDoors)if(d.option==='proposed')d.open=e.target.checked;playing=false;animation=null;update();};
$('[data-action="fullscreen"]').onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();};
document.addEventListener('fullscreenchange',resize);
let drag=null;
canvas.onpointerdown=e=>{animation=null;stopPlay();drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;if(mode==='overview'){azimuth-=dx*.006;elevation=Math.max(.2,Math.min(1.54,elevation+dy*.006));orbit();}else{yaw-=dx*.004;pitch=Math.max(-1.25,Math.min(1.25,pitch+dy*.004));orient();}};
canvas.onpointerup=e=>{if(drag&&entranceOption==='proposed'&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6){const r=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);scene.updateMatrixWorld(true);const hit=ray.intersectObjects(accessPads)[0];if(hit)openAccessDoor(hit.object.userData.accessDoor);}drag=null;};
canvas.onpointercancel=()=>drag=null;
canvas.addEventListener('wheel',e=>{if(mode==='overview'){e.preventDefault();radius=Math.max(15,Math.min(80,radius+e.deltaY*.02));orbit();}},{passive:false});
function allowed(x,z){const p=-z,r=.15,insideLower=x>=r&&x<=18.407-r&&p>=r&&p<=LOWER_H+.1&&!(x>10.58*1.58-r&&p<.519*1.58+r),insideUpper=x>=2.04+r&&x<=18.57-r&&p>=UBASE-.1&&p<=UBASE+6.15*1.512-r,insideWest=x>=mapX(255)+r&&x<=2.04-r&&p>=westSouth-.1&&p<=mapP(140)-r&&!(x>mapX(369)-r&&x<mapX(698)+r&&p<mapP(511)+r),insideHall=walkAreas.some(b=>x>=b.x0&&x<=b.x1&&p>=b.p0&&p<=b.p1)||inPolygon(x,p,southHall.floorPolygon);if(!insideLower&&!insideUpper&&!insideWest&&!insideHall)return false;const bounds=solids.concat(entranceOption==='existing'?existingBounds:proposedBounds.concat(accessPads.map(pad=>pad.userData.bound)),hallDoors.flatMap(d=>d.bounds),labSeating.group.visible?labSeating.blocks:[]);return !bounds.some(b=>x>b.x0-r&&x<b.x1+r&&p>b.p0-r&&p<b.p1+r);}
function move(dx,dz){for(let i=0,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.05));i<n;i++){if(allowed(camera.position.x+dx/n,camera.position.z))camera.position.x+=dx/n;if(allowed(camera.position.x,camera.position.z+dz/n))camera.position.z+=dz/n;}camera.position.y=1.65+walkingHeight(camera.position.x,camera.position.z);}
// The clickable plan uses the model's own footprints and collision rules.
const map=$('#map'),mapCtx=map.getContext('2d'),mapWidth=680,mapHeight=400,mapPadding=22;
const mapFloors=[];
scene.traverse(mesh=>{if(mesh.isMesh&&mesh.geometry.type==='BoxGeometry'&&mesh.position.y<0&&[mat.floor,mat.corridor,mat.column].includes(mesh.material)){
 const {width,depth}=mesh.geometry.parameters;
 mapFloors.push({x0:mesh.position.x-width/2,x1:mesh.position.x+width/2,p0:-mesh.position.z-depth/2,p1:-mesh.position.z+depth/2,color:mesh.material===mat.floor?'#d2e4e6':mesh.material===mat.corridor?'#e6e1d6':'#c5ced0'});
}});
const contextPolygons=[{points:southHall.floorPolygon,color:'#e6e1d6'},{points:southHall.workshopPolygon,color:'#c5ced0'}];
for(const item of contextPolygons){const xs=item.points.map(a=>a[0]),ps=item.points.map(a=>a[1]);mapFloors.push({x0:Math.min(...xs),x1:Math.max(...xs),p0:Math.min(...ps),p1:Math.max(...ps),boundsOnly:true});}
const mapMinX=Math.min(...mapFloors.map(b=>b.x0)),mapMaxX=Math.max(...mapFloors.map(b=>b.x1));
const mapMinP=Math.min(...mapFloors.map(b=>b.p0)),mapMaxP=Math.max(...mapFloors.map(b=>b.p1));
const mapScale=Math.min((mapWidth-mapPadding*2)/(mapMaxX-mapMinX),(mapHeight-mapPadding*2)/(mapMaxP-mapMinP));
const mapOX=(mapWidth-(mapMaxX-mapMinX)*mapScale)/2-mapMinX*mapScale,mapOY=(mapHeight-(mapMaxP-mapMinP)*mapScale)/2+mapMaxP*mapScale;
function mapRect(b,color){mapCtx.fillStyle=color;mapCtx.fillRect(mapOX+b.x0*mapScale,mapOY-b.p1*mapScale,Math.max(1.5,(b.x1-b.x0)*mapScale),Math.max(1.5,(b.p1-b.p0)*mapScale));}
function drawMap(){
 mapCtx.clearRect(0,0,mapWidth,mapHeight);
 for(const b of mapFloors)if(!b.boundsOnly)mapRect(b,b.color);
 for(const item of contextPolygons){mapCtx.beginPath();item.points.forEach((a,i)=>mapCtx[i?'lineTo':'moveTo'](mapOX+a[0]*mapScale,mapOY-a[1]*mapScale));mapCtx.closePath();mapCtx.fillStyle=item.color;mapCtx.fill();}
 for(const b of stairAreas)mapRect(b,'#c8b89f');
 for(let i=0;i<stairCount;i++)mapRect({x0:stairStart.x+i*stairRun/stairCount,x1:stairStart.x+i*stairRun/stairCount+.025,p0:-stairEnd.z,p1:-stairStart.z},'#6b7e83');
 for(const b of solids)mapRect(b,'#70888d');
 for(const b of entranceOption==='existing'?existingBounds:proposedBounds)mapRect(b,'#405c68');
 for(const d of hallDoors)for(const b of d.bounds)mapRect(b,'#147d79');
 if(entranceOption==='proposed')for(const pad of accessPads)mapRect(pad.userData.bound,'#c88428');
 mapCtx.textAlign='center';mapCtx.textBaseline='middle';mapCtx.font='600 32px system-ui';
 for(const [label,v] of [['West lab',M(650,368)],['East lab',U(5.7,3.05)],['South lab',L(5.4,2.95)],['Foyer',F(90,398)],['Workshop',C((workshopLeft+workshopRight)/2,workshopCut+1.2)]]){
  const x=mapOX+v.x*mapScale,y=mapOY+v.z*mapScale,w=mapCtx.measureText(label).width;
  mapCtx.fillStyle='#f8fafae8';mapCtx.fillRect(x-w/2-5,y-20,w+10,40);mapCtx.fillStyle='#183541';mapCtx.fillText(label,x,y);
 }
 if(mode==='walk'){
  const x=mapOX+camera.position.x*mapScale,y=mapOY+camera.position.z*mapScale;
  mapCtx.save();mapCtx.translate(x,y);mapCtx.rotate(yaw);mapCtx.beginPath();mapCtx.moveTo(0,-15);mapCtx.lineTo(10,9);mapCtx.lineTo(0,5);mapCtx.lineTo(-10,9);mapCtx.closePath();mapCtx.fillStyle='#d98620';mapCtx.fill();mapCtx.strokeStyle='#fff';mapCtx.lineWidth=3;mapCtx.stroke();mapCtx.restore();
 }
}
function enterMapPoint(x,p){
 if(!allowed(x,-p)){$('.map-status').textContent='Choose a clear floor area, or use a named room button.';return false;}
 playing=false;animation=null;keys.clear();mode='walk';
 // Keep the nearest tour stop as the context for Previous / Next.
 index=stops.reduce((best,s,i)=>Math.hypot(s.pos.x-x,s.pos.z+p)<Math.hypot(stops[best].pos.x-x,stops[best].pos.z+p)?i:best,0);
 camera.position.set(x,1.65+walkingHeight(x,-p),-p);orient();update();
 $('.map-status').textContent='Moved to the selected floor position. Drag the view to look around.';
 $('.lab-view-label').textContent='Map-selected position';drawMap();return true;
}
map.onclick=e=>{const b=map.getBoundingClientRect();enterMapPoint(((e.clientX-b.left)*mapWidth/b.width-mapOX)/mapScale,(mapOY-(e.clientY-b.top)*mapHeight/b.height)/mapScale);};
map.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();stopPlay();go(0);}};
root.querySelectorAll('[data-map-stop]').forEach(button=>{button.onclick=()=>{stopPlay();go(Number(button.dataset.mapStop));$('.map-status').textContent='Viewing '+stops[Number(button.dataset.mapStop)].name+'.';drawMap();};});
// Keep floor changes fresh, like the other floors' shared menu.
root.querySelectorAll('.floor-selector a').forEach(link=>{link.addEventListener('click',()=>{const url=new URL(link.href);url.searchParams.set('v',String(Date.now()));link.href=url.href;});});
const keymap={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
window.addEventListener('keydown',e=>{if(mode!=='walk'||['SELECT','INPUT'].includes(e.target.tagName)||!keymap[e.code])return;e.preventDefault();animation=null;playing=false;keys.add(keymap[e.code]);update();});
window.addEventListener('keyup',e=>keys.delete(keymap[e.code]));window.addEventListener('blur',()=>keys.clear());
root.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();animation=null;stopPlay();keys.add(b.dataset.move);b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.move);});
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(mode==='overview'){radius=Math.max(42,52/Math.min(camera.aspect,1.7));orbit();}}
new ResizeObserver(resize).observe($('.lab-viewport'));
let last=performance.now(),lastMap=0;
function frame(now){if(!root.isConnected){renderer.dispose();return;}requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
 updateHallDoors(dt);
 if(animation){const a=animation,t=Math.min(1,(now-a.start)/a.duration);let d=t*a.total,i=0;while(i<a.lengths.length-1&&d>a.lengths[i])d-=a.lengths[i++];camera.position.copy(a.pts[i]).lerp(a.pts[i+1],a.lengths[i]?d/a.lengths[i]:1);const aim=t<.8?a.pts[Math.min(i+1,a.pts.length-1)].clone():a.target.clone();if(aim.distanceTo(camera.position)<.1)aim.copy(a.target);const targetDir=aim.sub(camera.position).normalize(),targetYaw=Math.atan2(targetDir.x,-targetDir.z),targetPitch=Math.asin(targetDir.y);yaw+=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw))*Math.min(1,dt*5);pitch+=(targetPitch-pitch)*Math.min(1,dt*5);orient();if(t>=1){animation=null;lookAt(stops[index].look);pauseUntil=now+4800;}}
 else if(mode==='walk'){const f=(keys.has('forward')?1:0)-(keys.has('back')?1:0),r=(keys.has('right')?1:0)-(keys.has('left')?1:0);if(f||r){const speed=dt*1.8/Math.max(1,Math.hypot(f,r));move((Math.sin(yaw)*f+Math.cos(yaw)*r)*speed,(-Math.cos(yaw)*f+Math.sin(yaw)*r)*speed);orient();}}
 if(playing&&!animation&&now>pauseUntil){if(index===stops.length-1)stopPlay();else go(index+1,true);}
 renderer.render(scene,camera);if(now-lastMap>100){drawMap();lastMap=now;}
}
setEntranceOption('proposed');go(-1);resize();drawMap();loading.hidden=true;requestAnimationFrame(frame);
window.groundLabs={snapshot:()=>({designRevision:DESIGN.revision,design:DESIGN.level0,labBenches,labTables:labBenches.length,fullySeated:labSeating.group.visible,seatedPeople:labSeating.group.visible?labSeating.seats.length:0,entranceDoor:{leaves:directDoor.leaves.length,leafWidth:directDoor.w,openingWidth:directDoor.w*2,swingDirection:'west into main foyer',amount:directDoor.amount},electricLighting:electricLights.visible,view:index,mode,ceilingHeight:3,ceilingVisible:ceilings.visible,cutaway:!walls.visible,playing,position:camera.position.toArray(),viewpoints:stops.length,labs:['west','east','south'],entranceOption,existingEntranceRetained:true,mainFoyer:true,toilets:{G01:'Female',G02:'Male'},fountain:'Former G.01a text position',hallwayDoorsOpen,lobbyDoors:entranceOption==='proposed'?'push-button single glass leaves opening into lobby':'manual inward-swinging glass pairs',stairs:'rise east to landing at display-cabinet wall',stairLandingHeight:stairRise,accessPadHeight:1,southHallDoor:'solid with narrow vision panel',southHallDoorEastOfLobby:true}),go:n=>go(n),setEntranceOption,setFullySeated,openDoor:key=>openAccessDoor({north:northLobbyDoor,south:southLobbyDoor,direct:directDoor}[key])};
} catch(error) {loading.textContent='The 3D view could not load. Please reopen this walkthrough with WebGL and network access enabled.';console.error(error);}
