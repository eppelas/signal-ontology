/**
 * Pure spatial hierarchy. Coordinates, depths and colours are presentation
 * choices, never measured signal values or inferred semantic relationships.
 * Every edge is an actual ontology parent → child membership.
 */
export const SPACE_PALETTE = Object.freeze([
  '#a7e2e3', '#aebdf2', '#c3b2ee', '#a6d3cf', '#9fcbe7', '#b5d8c7', '#d0bfed', '#a9c1e9', '#b7d7dc'
]);
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const smoothstep = (a, b, value) => { const u=clamp((value-a)/(b-a),0,1); return u*u*(3-2*u); };
export const nodeKey = (kind,id) => `${kind}:${id}`;

// Fixed, shallow 3D projection. No rotating camera or time-dependent geometry.
export function projectWorld(point) {
  const angle=0.075, cy=Math.cos(angle), sy=Math.sin(angle);
  const y=point.y*cy-point.z*sy, depth=point.y*sy+point.z;
  const perspective=10000/(10000+depth);
  return {x:point.x*perspective,y:y*perspective,depth,perspective};
}
export function toScreen(point,camera,viewport) {
  return {x:(point.x-camera.x)*camera.scale+viewport.width/2,y:(point.y-camera.y)*camera.scale+viewport.height/2};
}
export function toPlane(point,camera,viewport) {
  return {x:(point.x-viewport.width/2)/camera.scale+camera.x,y:(point.y-viewport.height/2)/camera.scale+camera.y};
}
export function zoomCamera(camera,factor,anchor,viewport,limits={min:0.001,max:32}) {
  if(!Number.isFinite(factor)||factor<=0)throw new RangeError('Zoom factor must be positive and finite');
  const plane=toPlane(anchor,camera,viewport),scale=clamp(camera.scale*factor,limits.min,limits.max);
  return {x:plane.x-(anchor.x-viewport.width/2)/scale,y:plane.y-(anchor.y-viewport.height/2)/scale,scale};
}
export function boundsOf(points,padding=0) {
  if(!points.length)return {minX:-1,minY:-1,maxX:1,maxY:1,width:2,height:2,cx:0,cy:0};
  const minX=Math.min(...points.map(p=>p.x))-padding,minY=Math.min(...points.map(p=>p.y))-padding;
  const maxX=Math.max(...points.map(p=>p.x))+padding,maxY=Math.max(...points.map(p=>p.y))+padding;
  return {minX,minY,maxX,maxY,width:Math.max(1,maxX-minX),height:Math.max(1,maxY-minY),cx:(minX+maxX)/2,cy:(minY+maxY)/2};
}
export function fitCamera(bounds,viewport,{fill=.76,minScale=0,maxScale=32}={}) {
  const scale=clamp(Math.min(Math.max(1,viewport.width)*fill/bounds.width,Math.max(1,viewport.height)*fill/bounds.height),Math.max(.001,minScale),maxScale);
  return {x:bounds.cx,y:bounds.cy,scale};
}
function constellation(count,xStep,yStep,phase=0) {
  // Codex visual fallback, 2026-10-28. Seeded irregular attachment points are
  // relaxed once at construction, never by the render/interaction loop.
  let seed=(Math.round((phase+13)*104729)>>>0)||1;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed+.5)/4294967296;};
  const spread=Math.sqrt(Math.max(1,count))*.34;
  const points=Array.from({length:count},()=>{
    const r=Math.sqrt(-2*Math.log(Math.max(.00001,random()))),a=random()*Math.PI*2;
    return {x:Math.cos(a)*r*xStep*spread,y:Math.sin(a)*r*yStep*spread};
  });
  const origins=points.map(p=>({...p}));
  for(let pass=0;pass<48;pass++){
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],dx=(a.x-b.x)/xStep,dy=(a.y-b.y)/yStep,d=Math.hypot(dx,dy);
      if(d>=.9)continue;
      const push=(.9-d)*.19/Math.max(.001,d),px=dx*push*xStep,py=dy*push*yStep;
      a.x+=px;a.y+=py;b.x-=px;b.y-=py;
    }
    points.forEach((p,i)=>{p.x+=(origins[i].x-p.x)*.012;p.y+=(origins[i].y-p.y)*.012;});
  }
  return points;
}
function assertArray(value,name) { if(!Array.isArray(value))throw new TypeError(`Ontology ${name} must be an array`);return value; }

// Fit output clusters to their actual contents. The original draft used a
// fixed 2250-unit family stride around 90-unit leaves, making empty space
// dominate the view. These one-time sibling placements have no semantic metric.
function packBranches(branches,phase,gap=100){
  if(!branches.length)return [];
  if(branches.length===1)return [{x:0,y:0}];
  const radii=branches.map(branch=>Math.max(70,branch.radius));
  const mean=radii.reduce((sum,r)=>sum+r,0)/radii.length;
  const points=constellation(branches.length,mean*1.8+gap,mean*1.3+gap,phase);
  for(let pass=0;pass<120;pass++){
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],dx=a.x-b.x,dy=(a.y-b.y)/.76;
      const distance=Math.hypot(dx,dy),minimum=radii[i]+radii[j]+gap;
      if(distance>=minimum)continue;
      const angle=(i+1)*2.399963+j*.31;
      const ux=distance>.001?dx/distance:Math.cos(angle),uy=distance>.001?dy/distance:Math.sin(angle);
      const push=(minimum-distance)*.35;
      a.x+=ux*push;a.y+=uy*push*.76;b.x-=ux*push;b.y-=uy*push*.76;
    }
    const centre=points.reduce((sum,p)=>({x:sum.x+p.x/points.length,y:sum.y+p.y/points.length}),{x:0,y:0});
    for(const point of points){point.x-=centre.x;point.y-=centre.y;}
  }
  return points;
}

export function buildSpaceLayout(data) {
  const domains=assertArray(data?.domains,'domains'),signals=assertArray(data?.signals,'signals');
  const families=assertArray(data?.outputs?.families,'outputs.families'),parameters=assertArray(data?.outputs?.parameters,'outputs.parameters');
  const nodes=[],byKey=new Map(),edges=[],signalSources=new Map(),outputSources=new Map(),seenSignals=new Set(),seenOutputs=new Set();
  function sources(items,target,name){for(const item of items){if(!item||typeof item.id!=='string'||target.has(item.id))throw new TypeError(`Invalid or duplicate ${name} id`);target.set(item.id,item);}}
  sources(signals,signalSources,'signal');sources(parameters,outputSources,'output');
  function add(kind,source,parent,position,colour,mode){
    const id=source.id,key=nodeKey(kind,id);if(byKey.has(key))throw new TypeError(`Duplicate spatial node ${key}`);
    const label=source.label||source.signal||source.name_ru||id;
    const node={key,kind,id,label,mode,parentKey:parent?.key||null,groupKey:parent?.groupKey||key,domain:mode==='inputs'?(kind==='domain'?id:parent.domain):undefined,family:mode==='outputs'?(kind==='family'?id:parent.family):undefined,colour,children:[],x:position.x,y:position.y,z:position.z,source};
    node.plane=projectWorld(node);nodes.push(node);byKey.set(key,node);
    if(parent){parent.children.push(key);edges.push({from:parent.key,to:key,relation:'contains',mode});}
    return node;
  }
  const inputRoots=[];
  domains.forEach((domain,di)=>{
    // Unequal attachment distances and angles avoid a six-part circular fence.
    // No positions are recomputed in response to focus, zoom, pan or resize.
    const anchors=[[-300,-180],[-6900,-4100],[600,-7100],[7400,-1900],[4900,5100],[-1800,6700],[-7500,2400]];
    const anchor=anchors[di]||[Math.cos(di*2.17)*8500,Math.sin(di*1.83)*7100];
    const centre={x:anchor[0],y:anchor[1]};
    const colour=SPACE_PALETTE[di%SPACE_PALETTE.length];
    const root=add('domain',domain,null,{...centre,z:-180+(di%3)*85},colour,'inputs');inputRoots.push(root.key);
    const categories=assertArray(domain.categories,`${domain.id}.categories`),places=constellation(categories.length,900,500,di*.71);
    categories.forEach((category,ci)=>{
      const p=places[ci],cat=add('category',category,root,{x:centre.x+p.x,y:centre.y+p.y+35,z:-20+Math.sin(ci*1.7)*60},colour,'inputs');
      const ids=assertArray(category.signalIds,`${category.id}.signalIds`),leafPlaces=constellation(ids.length,190,125,ci*.83+di*.47);
      ids.forEach((id,si)=>{
        const signal=signalSources.get(id);if(!signal)throw new TypeError(`Missing signal ${id}`);
        if(seenSignals.has(id))throw new TypeError(`Signal has several spatial parents: ${id}`);
        if(signal.domain!==domain.id||signal.category!==category.label)throw new TypeError(`Signal membership disagrees: ${id}`);
        seenSignals.add(id);const q=leafPlaces[si];
        add('signal',signal,cat,{x:cat.x+q.x,y:cat.y+q.y+12,z:100+(si%4)*17},colour,'inputs');
      });
    });
  });
  if(seenSignals.size!==signals.length)throw new TypeError('Ontology contains signals outside its category hierarchy');
  const outputRoots=[],outputCategories=data.outputs.categories||[];
  const branches=families.map((family,fi)=>{
    const categories=outputCategories.filter(category=>category.family===family.id);
    const groups=categories.length?categories.map(category=>({category,outputs:parameters.filter(output=>output.category===category.id&&output.family===family.id)})):[{category:null,outputs:parameters.filter(output=>output.family===family.id)}];
    groups.forEach((group,gi)=>{
      group.leaves=constellation(group.outputs.length,190,125,fi*.71+gi*.83);
      group.radius=Math.max(95,...group.leaves.map(p=>Math.hypot(p.x,p.y/.76)))+45;
    });
    const places=categories.length?packBranches(groups,fi*.71,95):[{x:0,y:0}];
    groups.forEach((group,gi)=>Object.assign(group,{position:places[gi]}));
    return {family,groups,radius:Math.max(120,...groups.map(group=>Math.hypot(group.position.x,group.position.y/.76)+group.radius))+65};
  });
  // Slightly bring families together after the user's full-map review, while
  // preserving every local branch and the accepted input layout unchanged.
  const familyPlaces=packBranches(branches,.5,100).map(point=>({x:point.x*.94,y:point.y*.94}));
  branches.forEach(({family,groups},fi)=>{
    const p=familyPlaces[fi],colour=SPACE_PALETTE[(fi+1)%SPACE_PALETTE.length];
    const root=add('family',family,null,{x:p.x,y:p.y,z:-120+(fi%3)*90},colour,'outputs');outputRoots.push(root.key);
    groups.forEach((group,gi)=>{
      const parent=group.category?add('output-category',group.category,root,{x:root.x+group.position.x,y:root.y+group.position.y,z:-20+Math.sin(gi*1.7)*60},colour,'outputs'):root;
      group.outputs.forEach((output,oi)=>{
        if(seenOutputs.has(output.id))throw new TypeError(`Output has several spatial parents: ${output.id}`);
        const q=group.leaves[oi];seenOutputs.add(output.id);add('output',output,parent,{x:parent.x+q.x,y:parent.y+q.y+12,z:110+(oi%4)*25},colour,'outputs');
      });
    });
  });
  if(seenOutputs.size!==outputSources.size)throw new TypeError('Ontology contains outputs outside its family hierarchy');
  for(let i=nodes.length-1;i>=0;i--){
    const node=nodes[i],descendants=[node.plane];
    for(const key of node.children){const b=byKey.get(key).bounds;descendants.push({x:b.minX,y:b.minY},{x:b.maxX,y:b.maxY});}
    node.bounds=boundsOf(descendants,node.kind==='signal'||node.kind==='output'?5:['category','output-category'].includes(node.kind)?38:85);
    node.count=node.children.length;
    node.leafCount=node.kind==='signal'||node.kind==='output'?1:node.children.reduce((sum,key)=>sum+byKey.get(key).leafCount,0);
  }
  const modeBounds=roots=>boundsOf(roots.flatMap(key=>{const b=byKey.get(key).bounds;return [{x:b.minX,y:b.minY},{x:b.maxX,y:b.maxY}];}),210);
  const layout={nodes,byKey,edges,inputs:{roots:inputRoots,bounds:modeBounds(inputRoots)},outputs:{roots:outputRoots,bounds:modeBounds(outputRoots)}};
  layout.diagnostics=checkSpaceLayout(layout);
  if(!layout.diagnostics.ok)throw new TypeError(layout.diagnostics.errors.join('; '));
  return layout;
}

export function describeNode(node) {
  if(!node)return {kind:'overview',id:null,label:'Все направления'};
  return {kind:node.kind,id:node.id,label:node.label,domain:node.domain,family:node.family,parent:node.parentKey,count:node.count,leafCount:node.leafCount};
}
export function getNode(layout,descriptor) {
  if(!descriptor||descriptor.kind==='overview')return null;
  const exact=layout.byKey.get(nodeKey(descriptor.kind,descriptor.id));if(exact)return exact;
  if(descriptor.kind==='category'){
    const candidates=layout.nodes.filter(n=>n.kind==='category'&&(n.label===descriptor.id||n.label===descriptor.label)&&(!descriptor.domain||n.domain===descriptor.domain));
    if(candidates.length===1)return candidates[0];
  }
  throw new RangeError(`Unknown spatial focus ${descriptor.kind}:${descriptor.id}`);
}
export function checkSpaceLayout(layout) {
  const errors=[],counts={domain:0,category:0,signal:0,family:0,'output-category':0,output:0};
  for(const node of layout.nodes){
    counts[node.kind]++;
    if(![node.x,node.y,node.z,node.plane.x,node.plane.y,node.bounds.width,node.bounds.height].every(Number.isFinite))errors.push(`Non-finite coordinate ${node.key}`);
    if(node.parentKey&&!layout.byKey.get(node.parentKey)?.children.includes(node.key))errors.push(`Unresolved parent ${node.key}`);
  }
  const expected=new Set(layout.nodes.filter(n=>n.parentKey).map(n=>`${n.parentKey}>${n.key}`));
  const actual=new Set(layout.edges.map(e=>`${e.from}>${e.to}`));
  if(actual.size!==expected.size||layout.edges.some(e=>e.relation!=='contains'||!expected.has(`${e.from}>${e.to}`)))errors.push('Edges differ from actual parent membership');
  return {ok:errors.length===0,errors,counts,nodes:layout.nodes.length,edges:layout.edges.length,coordinateRole:'Stable presentation layout; no metric/causal meaning',relation:'Ontology parent → child membership only'};
}

export function rectsOverlap(a,b,gap=0) { return a.x+a.width+gap>b.x&&a.x<b.x+b.width+gap&&a.y+a.height+gap>b.y&&a.y<b.y+b.height+gap; }
export function intersectsViewport(rect,viewport,padding=0) {return rect.x+rect.width>=-padding&&rect.y+rect.height>=-padding&&rect.x<=viewport.width+padding&&rect.y<=viewport.height+padding;}

export function stableLabelOffset(key,kind) {
  let hash=2166136261;
  for(const char of String(key))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
  return {dx:kind==='domain'||kind==='family'?9:7,dy:((hash>>>5)%3-1)*2};
}

export function shortVisualLabel(label,kind,{full=false}={}) {
  let text=String(label);
  // Display casing only. Proper names and the untouched source/aria label stay
  // intact; Latin words and initialisms never match this Cyrillic-only rule.
  const proper=/^(?:Алиса|Алекса|Обсидиан|Ньютон|Фурье|Калман|Винер|Байес|Шеннон|Гейгер|Лоренц|Пуанкаре|Ляпунов)(?:\s|$)/;
  if(!proper.test(text))text=text.replace(/^[А-ЯЁ](?=[а-яё])/u,c=>c.toLocaleLowerCase('ru-RU'));
  if(full)return text;
  const limit=kind==='category'||kind==='output-category'?30:kind==='signal'||kind==='output'?39:34;
  if(text.length<=limit)return text;
  const end=text.lastIndexOf(' ',limit-1);
  return text.slice(0,end>limit*.6?end:limit-1).trimEnd()+'…';
}

/** Stable anchor projection. No collision search, sorting or camera-dependent
 * repositioning: hover only changes the string drawn at this same origin.
 * The export is retained for callers, but no longer promises disjoint boxes.
 */
export function placeLabels(items,viewport) {
  return items.map(item=>{
    const offset=stableLabelOffset(item.key,item.node?.kind);
    const x=item.contextPin?14:item.anchorX+offset.dx;
    const y=item.contextPin?12:item.anchorY+offset.dy-item.height/2;
    const rect={...item,x,y,hidden:false};
    return {...rect,visible:intersectsViewport(rect,viewport)};
  });
}

/** Pure diagnostics used by the renderer and available to independent tests. */
export function testSpaceLayout(data) {
  const layout=buildSpaceLayout(data),again=buildSpaceLayout(data),checks=[];
  const check=(name,condition)=>checks.push({name,pass:Boolean(condition)});
  check('all supplied signals represented once',layout.nodes.filter(n=>n.kind==='signal').length===data.signals.length);
  check('all supplied outputs represented once',layout.nodes.filter(n=>n.kind==='output').length===data.outputs.parameters.length);
  check('deterministic world positions',layout.nodes.every((n,i)=>n.key===again.nodes[i].key&&n.x===again.nodes[i].x&&n.y===again.nodes[i].y&&n.z===again.nodes[i].z));
  check('only real containment edges',layout.diagnostics.ok);
  const camera={x:90,y:-20,scale:.3},viewport={width:1200,height:800},anchor={x:330,y:220};
  const before=toPlane(anchor,camera,viewport),after=toPlane(anchor,zoomCamera(camera,1.8,anchor,viewport),viewport);
  check('zoom is anchored at pointer',Math.abs(before.x-after.x)<1e-8&&Math.abs(before.y-after.y)<1e-8);
  const fixtures=[{width:1440,height:900},{width:1024,height:768},{width:390,height:700}];
  for(const vp of fixtures){
    for(const rootKey of layout.inputs.roots){
      const root=layout.byKey.get(rootKey),cam=fitCamera(root.bounds,vp,{fill:.77});
      const items=root.children.map(key=>{const n=layout.byKey.get(key),p=toScreen(n.plane,cam,vp);return {key,anchorX:p.x,anchorY:p.y,width:190,height:83,priority:100,primary:true};});
      const labels=placeLabels(items,vp);
      check(`all primary names retained ${vp.width}/${root.id}`,labels.every(l=>!l.hidden)&&labels.length===root.count);
      check(`labels do not overlap ${vp.width}/${root.id}`,labels.every((a,i)=>labels.slice(i+1).every(b=>!rectsOverlap(a,b))));
    }
    for(const parent of layout.nodes.filter(n=>n.kind==='category'||n.kind==='family')){
      const cam=fitCamera(parent.bounds,vp,{fill:.77});
      const items=parent.children.map(key=>{const n=layout.byKey.get(key),p=toScreen(n.plane,cam,vp);return {key,anchorX:p.x,anchorY:p.y,width:208,height:70,priority:100,primary:true};});
      const labels=placeLabels(items,vp);
      check(`all leaf names retained ${vp.width}/${parent.id}`,labels.length===parent.count&&labels.every(label=>!label.hidden));
      check(`leaf labels do not overlap ${vp.width}/${parent.id}`,labels.every((a,i)=>labels.slice(i+1).every(b=>!rectsOverlap(a,b))));
    }
  }
  return {ok:checks.every(c=>c.pass),checks,diagnostics:layout.diagnostics};
}
