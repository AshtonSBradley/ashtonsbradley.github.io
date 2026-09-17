import * as THREE from 'three';

export function createSeating({scene,solids,state,go}){
  const seats=[],folds=[],stacks=[];
  const clothes=['#39667b','#965d48','#6b718d','#627b58'].map(color=>new THREE.MeshStandardMaterial({color,roughness:.85}));
  const skin=new THREE.MeshStandardMaterial({color:'#bb9b7c',roughness:.9});
  const trousers=new THREE.MeshStandardMaterial({color:'#334553',roughness:.9});
  const panel=document.createElement('section');panel.className='controls seating-panel';
  panel.innerHTML=`<h2>Seating &amp; access</h2><div class="seating-actions"><button id="chairs-under" aria-pressed="false">Chairs pushed under</button><button id="fully-seated" aria-pressed="false">1.21 · Fully seated · 69</button><button id="overflow-seated" aria-pressed="false">Fully seated + overflow · 79</button></div><p id="seating-note" class="explanation" role="status">Empty chairs in their normal positions.</p>`;
  document.querySelector('aside').prepend(panel);
  function person(parent,seatHeight,index){
    const g=new THREE.Group();g.name='seated-person';parent.add(g);
    const shirt=clothes[index%clothes.length];
    const foot=seatHeight>=.65?.25:0;
    function sphere(x,p,y,r,material){const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),material);o.position.set(x,y,-p);o.castShadow=true;g.add(o);}
    function limb(a,b,r,material){const start=new THREE.Vector3(a[0],a[2],-a[1]),end=new THREE.Vector3(b[0],b[2],-b[1]);const d=end.clone().sub(start);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),8),material);o.position.copy(start).add(end).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());o.castShadow=true;g.add(o);}
    // Schematic seated adult: head, torso, bent knees and bent arms.
    sphere(0,-.055,seatHeight+.71,.105,skin);
    limb([0,-.035,seatHeight+.14],[0,-.065,seatHeight+.50],.155,shirt);
    for(const s of [-1,1]){
      limb([s*.10,0,seatHeight+.07],[s*.10,.29,seatHeight+.025],.071,trousers);
      limb([s*.10,.29,seatHeight+.025],[s*.10,.32,foot+.09],.054,trousers);
      limb([s*.10,.32,foot+.055],[s*.10,.43,foot+.055],.055,trousers);
      limb([s*.18,-.06,seatHeight+.48],[s*.21,.075,seatHeight+.20],.046,shirt);
      limb([s*.21,.075,seatHeight+.20],[s*.19,.29,seatHeight+.22],.037,skin);
    }
    g.visible=false;return g;
  }
  function register(group,{x,p,north,width,depth,seatHeight,tuck=0,occupant=false,fold=false,overflow=false,wheelchair=false,block}){
    const body=occupant?person(group,seatHeight,seats.length):null;
    const bodyBlock={x0:x-.24,x1:x+.24,p0:0,p1:0,disabled:true};if(body)solids.push(bodyBlock);
    seats.push({group,x,p,north,width,depth,tuck,fold,overflow,wheelchair,block,body,bodyBlock});
  }
  function registerFold(group,block){folds.push({group,block});}
  function registerStack(groups,block){stacks.push({groups,block});}
  function apply(){
    let people=0,moved=0;
    for(const s of seats){
      const p=s.p+(s.north?1:-1)*(state.chairsUnder?s.tuck:0);
      s.group.position.z=-p;s.group.visible=s.overflow?state.overflowSeated:s.wheelchair?state.fullySeated:!s.fold;
      if(s.block)Object.assign(s.block,{p0:p-s.depth/2,p1:p+s.depth/2,disabled:!s.group.visible});
      if(state.chairsUnder&&s.tuck)moved++;
      if(s.body){s.body.visible=state.fullySeated&&s.group.visible;people+=s.body.visible?1:0;Object.assign(s.bodyBlock,{p0:p+(s.north?-.21:-.49),p1:p+(s.north?.49:.21),disabled:!s.body.visible});}
    }
    for(const f of folds){f.group.visible=true;f.block.disabled=false;}
    for(const stack of stacks){stack.groups.forEach(g=>g.visible=!state.overflowSeated);stack.block.disabled=state.overflowSeated;}
    for(const [id,on] of [['chairs-under',state.chairsUnder],['fully-seated',state.fullySeated&&!state.overflowSeated],['overflow-seated',state.overflowSeated]]){const b=panel.querySelector('#'+id);b.setAttribute('aria-pressed',String(on));b.classList.toggle('selected',on);}
    panel.querySelector('#seating-note').textContent=state.overflowSeated?`${people} seated: 68 desk seats, 1 wheelchair user and 10 higher white overflow chairs behind the rear desk row. Overflow seats are 700 mm above the platform and have no desks. Chairs are spaced at 780 mm centres, extending into both rear side aisles. Rear circulation is restricted; this is a layout test, not an approved capacity. The two fold-downs remain stowed.`:state.fullySeated?`${people} seated in 1.21: 68 desk seats (including the ten rear-platform places) and 1 wheelchair user. The two fold-downs remain stowed. Schematic bodies contribute to walking obstructions.`:state.chairsUnder?`${moved} desk chairs pushed 300 mm under in 1.21 and 250 mm in 1.23. Walking obstructions move with them; the rear desk chairs also move; backup stacks stay put.`:'Empty chairs in their normal positions. Choose pushed-under chairs or an occupied 1.21 to compare access.';
  }
  panel.querySelector('#chairs-under').onclick=()=>{state.chairsUnder=!state.chairsUnder;if(state.chairsUnder){state.fullySeated=false;state.overflowSeated=false;}apply();};
  panel.querySelector('#fully-seated').onclick=()=>{state.fullySeated=state.overflowSeated||!state.fullySeated;state.overflowSeated=false;if(state.fullySeated){state.chairsUnder=false;go('seminarmodel');}apply();};
  panel.querySelector('#overflow-seated').onclick=()=>{state.overflowSeated=!state.overflowSeated;state.fullySeated=true;state.chairsUnder=false;go('seminarmodel');apply();};
  return {register,registerFold,registerStack,apply,snapshot:()=>({pushedUnder:state.chairsUnder,fullySeated:state.fullySeated,overflowSeated:state.overflowSeated,wheelchairUsers:state.fullySeated?1:0,overflowPeople:state.overflowSeated?seats.filter(s=>s.overflow&&s.body).length:0,people:seats.filter(s=>s.body?.visible&&s.group.visible).length,movableDeskChairs:seats.filter(s=>s.tuck).length})};
}
