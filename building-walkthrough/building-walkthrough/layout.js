// Metres in the developed room plans. p increases toward the upper hallway.
// The September 12 image supplies adjacency and the enclosing room/hall outlines.
export const CEILING = 3;
export const SEMINAR = {x:8.4, width:8.363, depth:11.998, platformDepth:2.3, rise:0.6};
export const SEMINAR_ROWS = [9.5,8.3,7.1,5.9,4.7,3.5];
// First row is on the level floor; every raised row starts at its desk front.
export const TIER_EDGES = [...SEMINAR_ROWS.slice(1),SEMINAR.platformDepth];
export const AREAS = [
  {id:'123', x0:-10.75,p0:0,x1:0,p1:9,color:'#b7cec7'},
  {id:'122', x0:0,p0:0,x1:8.4,p1:15,color:'#c5d3d5'},
  {id:'121', x0:8.4,p0:0,x1:16.763,p1:SEMINAR.depth,color:'#b8cac4'},
  {id:'store',x0:8.4,p0:SEMINAR.depth,x1:14.75,p1:15,color:'#d8ddcd'},
  {id:'hallway',x0:-10.75,p0:15,x1:16.763,p1:16.7,color:'#d8dfdf'},
  {id:'entry121',x0:14.75,p0:SEMINAR.depth,x1:16.763,p1:15,color:'#d8dfdf'}
];
export function areaAt(x,p) {
  return AREAS.find(a=>x>=a.x0&&x<=a.x1&&p>=a.p0&&p<=a.p1);
}
export function floorElevation(x,p) {
  if(x<=SEMINAR.x||x>=SEMINAR.x+SEMINAR.width||p<0||p>SEMINAR.depth) return 0;
  return TIER_EDGES.filter(edge=>p<=edge).length*SEMINAR.rise/TIER_EDGES.length;
}
export function clearAt(x,p,solids,doors,radius=.18) {
  // A small circular footprint must remain inside the union, including doorways.
  if(!areaAt(x,p)) return false;
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    if(!areaAt(x+Math.cos(a)*radius,p+Math.sin(a)*radius)) return false;
  }
  for(const b of solids) if(!b.disabled&&x>b.x0-radius&&x<b.x1+radius&&p>b.p0-radius&&p<b.p1+radius) return false;
  for(const d of doors) {
    const a=d.hinge.rotation.y,dx=d.width*Math.cos(a),dp=d.width*Math.sin(a);
    const t=Math.max(0,Math.min(1,((x-d.x)*dx+(p-d.p)*dp)/(d.width*d.width)));
    if(Math.hypot(x-d.x-t*dx,p-d.p-t*dp)<radius+.03) return false;
  }
  return true;
}
