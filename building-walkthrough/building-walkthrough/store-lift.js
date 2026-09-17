import * as THREE from 'three';
import {RACK,DEFAULT_LIFT,AISLE,BAY_CLEAR,pickupPose,parkedPose,liftParts,collision,moveChecked,storeObstacles} from './store-geometry.js?v=20260914-full-store-rack';

// Rendering uses exactly the same oriented boxes as the clearance calculation.
export function createStoreLift({scene,rack,solids,canvas,go,doorsOpen}){
  const group=new THREE.Group();group.name='operable-store-lift';scene.add(group);
  const amber=new THREE.MeshStandardMaterial({color:'#d99231',roughness:.65});
  const metal=new THREE.MeshStandardMaterial({color:'#46575e',metalness:.35,roughness:.45});
  const loadMaterial=new THREE.MeshStandardMaterial({color:'#26818d',roughness:.65});
  const ghostShelf=new THREE.MeshStandardMaterial({color:'#d3bd9d',transparent:true,opacity:.12,depthWrite:false});
  const deckMaterials=new Map(rack.children.filter(o=>o.geometry.parameters.height<.1).map(o=>[o,o.material]));
  const footprintMaterial=new THREE.LineBasicMaterial({color:'#17756a',depthTest:false});
  const footprint=new THREE.Group();scene.add(footprint);
  const walkingBlock={x0:0,p0:0,x1:0,p1:0};solids.push(walkingBlock);
  const cfg={...DEFAULT_LIFT,loaded:false};let pose=parkedPose(),active=false,blocked=null,invalid=null,lastDoors=doorsOpen();
  const held=new Set();
  const panel=document.createElement('section');panel.className='controls lift-panel';
  panel.innerHTML=`<h2>Store · manoeuvring test</h2>
    <button id="lift-start" class="lift-primary">Test store lift</button>
    <div id="lift-controls" hidden>
      <div class="lift-actions"><button id="lift-plan">Plan view</button><button id="lift-perspective">3D view</button><button id="lift-stop">Finish test</button></div>
      <p class="explanation">W / S drive · A / D turn · Q / E lower / raise. Or hold the buttons below.</p>
      <div class="lift-pad"><button data-lift="forward">Forward W</button><button data-lift="back">Reverse S</button><button data-lift="left">Turn left A</button><button data-lift="right">Turn right D</button><button data-lift="down">Lower Q</button><button data-lift="up">Raise E</button></div>
      <p id="lift-status" role="status" aria-live="polite"></p>
      <output id="lift-readout"></output>
      <canvas id="lift-map" width="640" height="310" aria-label="Store plan: shelf bays, lift and experiment footprint. Green is clear; red indicates blocked movement."></canvas>
      <label class="stack">Start position<select id="lift-preset"><option value="1">Middle bay · load on forks</option><option value="0">West bay · load on forks</option><option value="2">East bay · load on forks</option><option value="park">East end · empty lift</option></select></label>
      <button id="lift-reset">Reset to start position</button>
      <details><summary>Test equipment dimensions</summary>
        <label>Lift length (m)<input id="lift-length" type="number" min="1.15" max="1.60" step="0.05" value="1.35"></label>
        <label>Lift width (m)<input id="lift-width" type="number" min="0.55" max="0.80" step="0.05" value="0.65"></label>
        <label>Square load edge (m)<input id="lift-size" type="number" min="0.60" max="1.20" step="0.05" value="1.00"></label>
        <label>Experiment height (m)<input id="lift-load-height" type="number" min="0.10" max="0.80" step="0.05" value="0.30"></label>
        <label>Include experiment<input id="lift-loaded" type="checkbox"></label>
        <p class="explanation">Includes a 100 mm pallet within the square footprint. Presets stage the load already on the forks, 80 mm above the 620 mm shelf. Changing dimensions is a test reset, not a physical pickup.</p>
      </details>
      <p class="explanation">Rack depth 1.20 m · bays ${BAY_CLEAR.toFixed(2)} m clear · aisle ${AISLE.toFixed(2)} m · door 0.90 m. Lowest shelf at 220 mm gives 198 mm underneath for the lift base.</p>
      <p class="explanation">Geometric check only: ideal in-place steering, no operator space, load stability or rated capacity. Upper shelves are ghosted in test views. Rack spans and load ratings need supplier confirmation.</p>
    </div>`;
  document.querySelector('aside').prepend(panel);
  const $=id=>panel.querySelector('#'+id), mini=$('lift-map'),ctx=mini.getContext('2d');
  function clearMeshes(parent){for(const child of [...parent.children]){child.geometry?.dispose();parent.remove(child);}}
  function render(){
    clearMeshes(group);clearMeshes(footprint);
    const parts=liftParts(pose,cfg),all=parts.flatMap(p=>p.poly);
    Object.assign(walkingBlock,{x0:Math.min(...all.map(p=>p[0])),x1:Math.max(...all.map(p=>p[0])),p0:Math.min(...all.map(p=>p[1])),p1:Math.max(...all.map(p=>p[1]))});
    for(const part of parts){
      const poly=part.poly,cx=poly.reduce((a,p)=>a+p[0],0)/4,cp=poly.reduce((a,p)=>a+p[1],0)/4;
      const width=Math.hypot(poly[1][0]-poly[0][0],poly[1][1]-poly[0][1]);
      const depth=Math.hypot(poly[2][0]-poly[1][0],poly[2][1]-poly[1][1]);
      const wheel=/roller|wheel/.test(part.name),h=part.y1-part.y0;
      const mesh=new THREE.Mesh(wheel?new THREE.CylinderGeometry(h/2,h/2,depth,12):new THREE.BoxGeometry(width,h,depth),part.name==='experiment'?loadMaterial:wheel||['mast','handle'].includes(part.name)?metal:amber);
      mesh.position.set(cx,(part.y0+part.y1)/2,-cp);if(wheel)mesh.rotation.x=Math.PI/2;mesh.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),pose.angle));mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
      const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(poly.map(([x,p])=>new THREE.Vector3(x,.035,-p))),footprintMaterial);line.renderOrder=10;footprint.add(line);
    }
    footprintMaterial.color.set(blocked||invalid?'#c23b2e':'#17756a');footprint.visible=active;
    update();
  }
  function drawPlan(){
    const scale=74,ox=42,oy=280,px=x=>ox+(x-7)*scale,py=p=>oy-(p-12)*scale;
    ctx.clearRect(0,0,640,310);ctx.fillStyle='#edf2f1';ctx.fillRect(0,0,640,310);
    function poly(points,fill,stroke){ctx.beginPath();points.forEach(([x,p],i)=>i?ctx.lineTo(px(x),py(p)):ctx.moveTo(px(x),py(p)));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
    for(const o of storeObstacles(doorsOpen())){if(o.name.startsWith('shelf at')){if(o.y0>.3)continue;poly(o.poly,'#e6d6bd');}else if(o.name==='door head')continue;else poly(o.poly,o.name.includes('upright')?'#455a62':'#91a3a7');}
    for(const part of liftParts(pose,cfg))poly(part.poly,part.name==='experiment'?'#72bcc080':'#d99231',blocked||invalid?'#bd3929':'#1c686d');
    ctx.strokeStyle='#122c39';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px(pose.x),py(pose.p));ctx.lineTo(px(pose.x+.45*Math.cos(pose.angle)),py(pose.p+.45*Math.sin(pose.angle)));ctx.stroke();
    ctx.fillStyle='#183541';ctx.font='16px system-ui';ctx.textAlign='center';
    ctx.fillText('N ↑ · 1.20 m deep shelves',px(11.3),24);
    ctx.fillText('West',px(9.51),py(14.53));ctx.fillText('Middle',px(11.32),py(14.53));ctx.fillText('East',px(13.13),py(14.53));
    ctx.fillText(AISLE.toFixed(2)+' m aisle',px(11.5),py(12.48));
    ctx.textAlign='left';ctx.fillText('1.22',8,py(13.8));ctx.fillText('0.90 m',8,py(12.63));
    ctx.strokeStyle='#183541';ctx.beginPath();ctx.moveTo(510,285);ctx.lineTo(584,285);ctx.stroke();ctx.fillText('1 m',532,306);
  }
  function update(){
    const hit=invalid||blocked,text=invalid?`Overlapping: ${hit.part} / ${hit.obstacle}. Reset or reduce dimensions.`:blocked?`Stopped: ${hit.part} meets ${hit.obstacle}. Reverse or turn back.`:'Clear at this position · hold controls to test the next move.';
    if($('lift-status').textContent!==text)$('lift-status').textContent=text;
    $('lift-status').classList.toggle('blocked',!!hit);
    const span=cfg.loadSize*(Math.abs(Math.sin(pose.angle))+Math.abs(Math.cos(pose.angle)));
    $('lift-readout').textContent=`Fork height ${pose.height.toFixed(2)} m · heading ${(((pose.angle*180/Math.PI)%360+360)%360).toFixed(0)}°\n${cfg.loaded?`Load spans ${span.toFixed(2)} m across aisle · ${Math.SQRT2*cfg.loadSize>AISLE?'45° load span exceeds aisle':'45° load span fits aisle (load only)'}`:'Empty lift · no experiment on forks'}`;
    drawPlan();
  }
  function reset(){held.clear();const value=$('lift-preset').value;cfg.loaded=value!=='park';pose=cfg.loaded?pickupPose(Number(value)):parkedPose();$('lift-loaded').checked=cfg.loaded;blocked=null;invalid=collision(pose,cfg,storeObstacles(doorsOpen()));render();}
  function setActive(value){active=value;held.clear();$('lift-start').hidden=active;$('lift-controls').hidden=!active;footprint.visible=active;for(const [deck,material] of deckMaterials)deck.material=active?ghostShelf:material;}
  function start(){setActive(true);reset();go('storetest');panel.scrollIntoView({block:'nearest'});}
  function move(action,seconds){
    if(!active)return;invalid=collision(pose,cfg,storeObstacles(doorsOpen()));if(invalid){update();return;}
    const d={};
    if(action==='forward'||action==='back'){const distance=.35*seconds*(action==='forward'?1:-1);d.x=distance*Math.cos(pose.angle);d.p=distance*Math.sin(pose.angle);}
    else if(action==='left'||action==='right')d.angle=.50*seconds*(action==='left'?1:-1);
    else if(action==='up'||action==='down')d.height=Math.max(.15,Math.min(1.50,pose.height+.18*seconds*(action==='up'?1:-1)))-pose.height;
    else throw new Error('Unknown lift action');
    const result=moveChecked(pose,d,cfg,storeObstacles(doorsOpen()));pose=result.pose;blocked=result.blocked;render();
  }
  $('lift-start').onclick=start;$('lift-stop').onclick=()=>{setActive(false);go('store');};
  $('lift-plan').onclick=()=>go('storetest');$('lift-perspective').onclick=()=>go('storetest3d');
  $('lift-reset').onclick=reset;$('lift-preset').onchange=reset;
  for(const [id,key] of [['lift-length','length'],['lift-width','width'],['lift-size','loadSize'],['lift-load-height','loadHeight']])$(id).onchange=()=>{const input=$(id);if(input.value===''||!input.checkValidity()){input.value=cfg[key].toFixed(2);return;}cfg[key]=Number(input.value);blocked=null;invalid=collision(pose,cfg,storeObstacles(doorsOpen()));render();};
  $('lift-loaded').onchange=()=>{cfg.loaded=$('lift-loaded').checked;blocked=null;invalid=collision(pose,cfg,storeObstacles(doorsOpen()));render();};
  const bindings={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyQ:'down',KeyE:'up'};
  window.addEventListener('keydown',e=>{if(!active||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||!bindings[e.code])return;held.add(bindings[e.code]);e.preventDefault();});
  window.addEventListener('keyup',e=>held.delete(bindings[e.code]));window.addEventListener('blur',()=>held.clear());
  document.addEventListener('visibilitychange',()=>held.clear());panel.addEventListener('focusin',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))held.clear();});
  for(const b of panel.querySelectorAll('[data-lift]')){
    b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.lift);};
    b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>held.delete(b.dataset.lift);
    b.onclick=e=>{if(e.detail===0)move(b.dataset.lift,.25);};
  }
  render();
  return {get active(){return active;},start,setActive,move,reset,
    tick(dt){if(lastDoors!==doorsOpen()){lastDoors=doorsOpen();invalid=collision(pose,cfg,storeObstacles(lastDoors));blocked=null;render();}if(active)for(const action of held)move(action,dt);},
    snapshot(){return {active,pose:{...pose},dimensions:{...cfg},blocked,invalid,aisle:AISLE,bayClear:BAY_CLEAR};}};
}
