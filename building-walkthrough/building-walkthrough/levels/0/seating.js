import * as THREE from '../../vendor/three.module.js';

// Schematic adults on 600 mm stools at the existing 880 mm laboratory benches.
// Instance repeated parts so the fully occupied floor stays economical to draw.
export function createLabSeating(benches){
 const group=new THREE.Group();group.name='Fully seated ground-floor labs';
 const seats=[],blocks=[],batches=new Map();
 const sphere=new THREE.SphereGeometry(1,12,8),cylinder=new THREE.CylinderGeometry(1,1,1,8);
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.85});
 const shirts=['#39667b','#965d48','#6b718d','#627b58'].map(material);
 const skin=material('#bb9b7c'),trousers=material('#334553'),stool=material('#477b80'),metal=material('#3a4b50');
 const up=new THREE.Vector3(0,1,0),identity=new THREE.Quaternion();
 function part(geometry,mat,position,scale,rotation=identity){
  const key=geometry.uuid+mat.uuid;
  if(!batches.has(key))batches.set(key,{geometry,mat,matrices:[]});
  batches.get(key).matrices.push(new THREE.Matrix4().compose(position,rotation,scale));
 }
 for(const [tableIndex,b] of benches.entries()){
  const longX=b.width>=b.depth,long=longX?b.width:b.depth,short=longX?b.depth:b.width;
  for(const side of [-1,1])for(const along of [-long/4,long/4]){
   const across=side*(short/2+.26);
   const x=b.x+(longX?along:across),p=b.p+(longX?across:along);
   const forward=longX?{x:0,p:-side}:{x:-side,p:0};
   const right={x:forward.p,p:-forward.x};
   const local=(a,y,f)=>new THREE.Vector3(x+right.x*a+forward.x*f,y,-(p+right.p*a+forward.p*f));
   const shirt=shirts[seats.length%shirts.length];
   function limb(a,b,r,mat){const start=local(...a),end=local(...b),delta=end.clone().sub(start);part(cylinder,mat,start.clone().add(end).multiplyScalar(.5),new THREE.Vector3(r,delta.length(),r),new THREE.Quaternion().setFromUnitVectors(up,delta.normalize()));}
   part(cylinder,stool,local(0,.60,0),new THREE.Vector3(.19,.045,.19));
   for(const a of [-.13,.13])for(const f of [-.13,.13])limb([a,.58,f],[a*1.2,.025,f*1.2],.017,metal);
   part(sphere,skin,local(0,1.31,-.055),new THREE.Vector3(.105,.105,.105));
   limb([0,.74,-.035],[0,1.10,-.065],.155,shirt);
   for(const s of [-1,1]){
    limb([s*.10,.67,0],[s*.10,.625,.29],.071,trousers);
    limb([s*.10,.625,.29],[s*.10,.09,.32],.054,trousers);
    limb([s*.10,.055,.32],[s*.10,.055,.43],.055,trousers);
    limb([s*.18,1.08,-.06],[s*.21,.94,.075],.046,shirt);
    limb([s*.21,.94,.075],[s*.19,.94,.38],.037,skin);
   }
   // The occupied envelope includes stool, shoulders and feet for manual walking.
   const corners=[local(-.25,0,-.21),local(.25,0,.49),local(-.25,0,.49),local(.25,0,-.21)];
   blocks.push({x0:Math.min(...corners.map(v=>v.x)),x1:Math.max(...corners.map(v=>v.x)),p0:Math.min(...corners.map(v=>-v.z)),p1:Math.max(...corners.map(v=>-v.z))});
   seats.push({tableIndex,lab:b.lab,x,p,side,along,forward});
  }
 }
 for(const {geometry,mat,matrices} of batches.values()){
  const mesh=new THREE.InstancedMesh(geometry,mat,matrices.length);
  matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
  mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;
  group.add(mesh);
 }
 return {group,blocks,seats};
}
