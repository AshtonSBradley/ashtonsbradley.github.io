// Geometric clearance model, metres. x=east, p=north, y=height.
// Ideal in-place steering; no load stability, operator envelope or rated capacity.
import {SEMINAR} from './layout.js?v=20260914-l1-revision';
// Far end meets the east wall's inside face at x=14.68; door end stays fixed.
export const RACK={x:8.58,p:13.70,width:6.10,depth:1.20,post:.05,bays:3,levels:[.22,.62,1.18,1.74,2.30,2.92]};
export const STORE_DOOR={x:8.4,p:12.18,width:1.40,height:2.20};
export const DEFAULT_LIFT={length:1.35,width:.65,loadSize:1,loadHeight:.30,loaded:true};
export const AISLE=RACK.p-(SEMINAR.depth+.07);
export const BAY_CLEAR=(RACK.width-RACK.post)/RACK.bays-RACK.post;
export function postXs(){return Array.from({length:RACK.bays+1},(_,i)=>RACK.x+.025+i*(RACK.width-.05)/RACK.bays);}
export function pickupPose(bay=1){const xs=postXs();return {x:(xs[bay]+xs[bay+1])/2,p:13.595,angle:Math.PI/2,height:.72};}
export function parkedPose(){return {x:14.35,p:13.14,angle:Math.PI,height:.18};}
export function rectangle(x,p,w,d,angle=0){const c=Math.cos(angle),s=Math.sin(angle);return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>[x+c*u-s*v,p+s*u+c*v]);}
export function liftParts(pose,cfg){
  const f=cfg.length-.20,half=cfg.width/2,parts=[];
  function part(name,u,v,w,d,y0,y1){const c=Math.cos(pose.angle),s=Math.sin(pose.angle);parts.push({name,poly:rectangle(pose.x+c*u-s*v,pose.p+s*u+c*v,w,d,pose.angle),y0,y1});}
  for(const sign of [-1,1]){
    part('base leg',f/2,sign*(half-.08),f,.16,.09,.17);
    part('front roller',f-.10,sign*(half-.08),.10,.13,0,.09);
    part('rear wheel',-.10,sign*(half-.08),.15,.13,0,.15);
    part('fork',f/2,sign*(half-.08),f,.16,pose.height-.06,pose.height);
  }
  part('chassis',-.10,0,.20,cfg.width,0,.30);
  part('mast',0,0,.16,cfg.width-.07,.20,1.68);
  part('handle',-.17,0,.06,.36,.50,1.30);
  if(cfg.loaded)part('experiment',f-.02-cfg.loadSize/2,0,cfg.loadSize,cfg.loadSize,pose.height,pose.height+.10+cfg.loadHeight);
  return parts;
}
export function rackObstacles(){
  const obs=[];
  for(const [i,x] of postXs().entries())for(const p of [RACK.p+.025,RACK.p+RACK.depth-.025])obs.push({name:`shelf upright ${i+1}`,poly:rectangle(x,p,.05,.05),y0:0,y1:3});
  for(const y of RACK.levels)obs.push({name:`shelf at ${y.toFixed(2)} m`,poly:rectangle(RACK.x+RACK.width/2,RACK.p+RACK.depth/2,RACK.width,RACK.depth),y0:y-.0225,y1:y+.0225});
  return obs;
}
export function storeObstacles(doorOpen=true){
  const a=rackObstacles();
  function rect(name,x0,p0,x1,p1,y0=0,y1=3){a.push({name,poly:rectangle((x0+x1)/2,(p0+p1)/2,x1-x0,p1-p0),y0,y1});}
  rect('south wall',8.33,SEMINAR.depth-.07,14.82,SEMINAR.depth+.07);
  rect('north wall',8.33,14.93,14.82,15.07);
  rect('east wall',14.68,SEMINAR.depth-.07,14.82,15.07);
  const {x,p,width,height}=STORE_DOOR;
  rect('south door jamb',x-.07,SEMINAR.depth-.07,x+.07,p);
  rect('north door jamb',x-.07,p+width,x+.07,15.07);
  rect('door head',x-.07,p,x+.07,p+width,height,3);
  // A bounded patch of adjacent 1.22, solely for testing the store threshold.
  rect('test-area boundary in 1.22',6.90,11.9,7.00,15.4);
  rect('test-area boundary in 1.22',6.90,11.9,8.33,12.0);
  rect('test-area boundary in 1.22',6.90,15.3,8.33,15.4);
  a.push({name:doorOpen?'open door leaf':'closed door leaf',poly:doorOpen?rectangle(x+width/2,p,width,.065):rectangle(x,p+width/2,.065,width),y0:0,y1:height});
  return a;
}
function project(poly,axis){const values=poly.map(p=>p[0]*axis[0]+p[1]*axis[1]);return [Math.min(...values),Math.max(...values)];}
export function overlap(a,b,margin=0){
  for(const poly of [a,b])for(let i=0;i<poly.length;i++){
    const q=poly[(i+1)%poly.length],p=poly[i],n=Math.hypot(q[0]-p[0],q[1]-p[1]);
    const axis=[-(q[1]-p[1])/n,(q[0]-p[0])/n],pa=project(a,axis),pb=project(b,axis);
    if(pa[1]<=pb[0]-margin||pb[1]<=pa[0]-margin)return false;
  }
  return true;
}
export function collision(pose,cfg,obstacles=storeObstacles()){
  const parts=liftParts(pose,cfg),load=parts.find(p=>p.name==='experiment');
  if(load)for(const part of parts.filter(p=>['mast','handle','chassis'].includes(p.name))){
    if(load.y1>part.y0&&load.y0<part.y1&&overlap(load.poly,part.poly,.003))return {part:'experiment',obstacle:`lift ${part.name}`};
  }
  for(const part of parts){
    if(part.y0<0)return {part:part.name,obstacle:'floor'};
    if(part.y1>3)return {part:part.name,obstacle:'ceiling'};
    for(const obs of obstacles){
      if(part.y1<=obs.y0+.00001||part.y0>=obs.y1-.00001)continue;
      if(overlap(part.poly,obs.poly,.003))return {part:part.name,obstacle:obs.name};
    }
  }
  return null;
}
// Sample the entire motion, not just its endpoints: <=5 mm or 0.25 degrees.
export function moveChecked(pose,delta,cfg,obstacles=storeObstacles()){
  const n=Math.max(1,Math.ceil(Math.hypot(delta.x||0,delta.p||0)/.005),Math.ceil(Math.abs(delta.angle||0)/(Math.PI/720)),Math.ceil(Math.abs(delta.height||0)/.005));
  let last={...pose};
  for(let i=1;i<=n;i++){
    const candidate={...pose};for(const k of ['x','p','angle','height'])candidate[k]+=(delta[k]||0)*i/n;
    const hit=collision(candidate,cfg,obstacles);
    if(hit)return {pose:last,blocked:hit,attempted:candidate};
    last=candidate;
  }
  return {pose:last,blocked:null,attempted:null};
}
