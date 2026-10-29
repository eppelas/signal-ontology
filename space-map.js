import {
  buildSpaceLayout,describeNode,getNode,nodeKey,fitCamera,toScreen,toPlane,
  zoomCamera,placeLabels,shortVisualLabel,intersectsViewport,clamp,smoothstep
} from './space-layout.js';

const TAU=Math.PI*2;
const now=()=>globalThis.performance?.now?.()??Date.now();
const rgba=(hex,alpha)=>{
  const colour=hex.replace('#','');
  return `rgba(${parseInt(colour.slice(0,2),16)},${parseInt(colour.slice(2,4),16)},${parseInt(colour.slice(4,6),16)},${clamp(alpha,0,1)})`;
};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const sameNode=(a,b)=>a?.key===b?.key;
const countLabel=(n,one,few,many)=>`${n} ${n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many}`;
const inside=(point,width,height,padding=0)=>point.x>=-padding&&point.y>=-padding&&point.x<=width+padding&&point.y<=height+padding;

/**
 * Stable semantic space with real Canvas 2D perspective/depth and readable DOM
 * labels. The canvas never rotates on its own; frames run only for interaction,
 * camera transitions, visibility and resize. No input device permission, sensor,
 * sound, network access, dependency or arbitrary association is created here.
 */
export class SpaceMap {
  constructor({canvas,labels,onFocus,onSelect,onCameraChange}={}) {
    if(!canvas?.getContext||!labels?.append)throw new TypeError('SpaceMap needs a canvas and a DOM label container');
    this.canvas=canvas;this.ctx=canvas.getContext('2d');
    if(!this.ctx)throw new Error('Canvas 2D unavailable');
    this.labels=labels;this._callbacks={onFocus,onSelect,onCameraChange};
    this._layout=null;this._mode='inputs';this._focus=null;this._scope=null;
    this._viewport={width:1,height:1};this._camera={x:0,y:0,scale:1};this._overviewCamera={...this._camera};
    this._limits={min:.001,max:32};this._animation=null;this._raf=null;this._destroyed=false;this._userCamera=false;
    this._pointers=new Map();this._gesture=null;this._buttons=new Map();this._screenNodes=[];this._placed=[];this._hoverKey=null;
    this._lastFocusKey=null;this._lastView=null;this._listeners=[];this._visitedViews=new Map();
    this._hidden=typeof document!=='undefined'&&Boolean(document.hidden);
    this._motionQuery=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
    this._reducedMotion=Boolean(this._motionQuery?.matches);
    this._layer=document.createElement('div');this._layer.className='semantic-space-labels';
    Object.assign(this._layer.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'hidden',userSelect:'none'});
    this.labels.append(this._layer);
    this._oldTouchAction=canvas.style.touchAction;this._oldCursor=canvas.style.cursor;
    canvas.style.touchAction='none';canvas.style.cursor='grab';
    for(const target of [canvas,this._layer]){
      this._listen(target,'wheel',event=>this._wheel(event),{passive:false});
      this._listen(target,'pointerdown',event=>this._pointerDown(event),{passive:false});
      this._listen(target,'pointermove',event=>this._pointerMove(event),{passive:false});
      this._listen(target,'pointerup',event=>this._pointerUp(event),{passive:false});
      this._listen(target,'pointercancel',event=>this._pointerUp(event,true),{passive:false});
    }
    this._listen(canvas,'lostpointercapture',event=>this._pointerUp(event,true));
    this._listen(this.labels,'pointerleave',()=>{if(!this._pointers.size&&this._hoverKey){this._hoverKey=null;this.canvas.style.cursor='grab';this._request();}});
    this._listen(document,'visibilitychange',()=>{
      this._hidden=Boolean(document.hidden);
      if(this._hidden){this._cancelPointers();if(this._raf!==null)cancelAnimationFrame(this._raf);this._raf=null;if(this._animation){this._camera={...this._animation.to};this._animation=null;}}
      else this._request();
    });
    this._onReducedMotion=event=>{
      this._reducedMotion=Boolean(event.matches);
      if(this._reducedMotion&&this._animation){this._camera={...this._animation.to};this._animation=null;}
      this._request();
    };
    if(this._motionQuery?.addEventListener)this._motionQuery.addEventListener('change',this._onReducedMotion);
    else this._motionQuery?.addListener?.(this._onReducedMotion);
    this._observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>this.resize()):null;
    this._observer?.observe(canvas);
    this._listen(window,'resize',()=>this.resize(),{passive:true});
    this.resize();
  }

  _listen(target,type,fn,options){target.addEventListener(type,fn,options);this._listeners.push({target,type,fn,options});}
  _alive(){if(this._destroyed)throw new Error('SpaceMap has been destroyed');}
  _call(name,value){const callback=this._callbacks[name];if(typeof callback==='function'){try{callback(value);}catch(error){globalThis.console?.error?.(`SpaceMap ${name} callback failed`,error);}}}
  _overviewDescriptor(){return {kind:'overview',id:null,label:this._mode==='inputs'?'Все направления':'Вся выразительность',count:this._layout?.[this._mode].roots.length||0};}
  _descriptor(node=this._focus){return node?describeNode(node):this._overviewDescriptor();}

  setData(data){
    this._alive();this._layout=buildSpaceLayout(data);this._focus=null;this._scope=null;this._userCamera=false;this._animation=null;this._visitedViews.clear();this._lastFocusKey=null;
    for(const node of this._layout.nodes)if(node.kind==='domain'||node.kind==='family')node.labelSide=node.x>0?'left':'right';
    for(const button of this._buttons.values())button.remove();this._buttons.clear();this._placed=[];
    this._updateOverview();this._camera={...this._overviewCamera};this._notifyFocus('data');this._request();return this.getView();
  }
  setMode(mode){
    this._alive();if(!['inputs','outputs'].includes(mode))throw new RangeError('SpaceMap mode must be inputs or outputs');
    if(mode===this._mode)return this.getView();
    this._rememberView();this._mode=mode;this._focus=null;this._scope=null;this._userCamera=false;this._updateOverview();
    this._moveCamera(this._overviewCamera);this._notifyFocus('mode');return this.getView();
  }
  focus(descriptor={kind:'overview'}){
    this._alive();if(!this._layout)return this.getView();
    const node=getNode(this._layout,descriptor);
    this._rememberView();
    const changedMode=node&&node.mode!==this._mode,isLeaf=node&&(node.kind==='signal'||node.kind==='output');
    if(changedMode){this._mode=node.mode;this._updateOverview();}
    this._focus=node;
    if(isLeaf){
      // Selecting a nearby labelled point opens its existing detail. It never
      // recentres the category or changes scale merely to select another leaf.
      if(changedMode){this._userCamera=false;this._moveCamera(this._overviewCamera);}
      else{this._animation=null;this._request();}
    }else{this._userCamera=false;this._moveCamera(this._cameraFor(node));}
    this._notifyFocus('focus');
    if(isLeaf)this._call('onSelect',describeNode(node));
    return this.getView();
  }
  overview(){return this.focus({kind:'overview'});}
  back(){
    this._alive();if(!this._layout)return this.getView();
    if(!this._focus)return this.overview();
    const parent=this._focus?.parentKey?this._layout.byKey.get(this._focus.parentKey):null;
    this._rememberView();this._focus=parent;this._userCamera=false;
    const saved=this._visitedViews.get(`${this._mode}:${parent?.key||'overview'}`);
    const camera=saved?{...saved.camera,scale:clamp(saved.camera.scale,this._limits.min,this._limits.max)}:this._cameraFor(parent);
    this._moveCamera(camera);this._notifyFocus('back');return this.getView();
  }
  _rememberView(){
    if(!this._layout)return;
    this._visitedViews.set(`${this._mode}:${this._focus?.key||'overview'}`,{camera:{...(this._animation?.to||this._camera)},viewport:{...this._viewport}});
  }
  zoomBy(factor){
    this._alive();if(!this._layout)return this.getView();
    this._applyZoom(factor,{x:this._viewport.width/2,y:this._viewport.height/2});return this.getView();
  }
  panBy(x,y){
    this._alive();if(!this._layout||!Number.isFinite(x)||!Number.isFinite(y))return this.getView();
    this._animation=null;this._userCamera=true;this._camera.x+=x/this._camera.scale;this._camera.y+=y/this._camera.scale;
    this._request();return this.getView();
  }
  _updateOverview(){
    if(!this._layout)return;
    this._overviewCamera=fitCamera(this._layout[this._mode].bounds,this._viewport,{fill:.78});
    this._limits={min:this._overviewCamera.scale*.55,max:32};
  }
  _cameraFor(node){
    if(!node)return {...this._overviewCamera};
    const parent=node.parentKey?this._layout.byKey.get(node.parentKey):null;
    const group=node.kind==='signal'||node.kind==='output'?parent:node;
    const camera=fitCamera(group.bounds,this._viewport,{fill:.77,maxScale:this._limits.max});
    if(node.kind==='signal'||node.kind==='output'){
      camera.x+=(node.plane.x-camera.x)*.08;camera.y+=(node.plane.y-camera.y)*.08;camera.scale*=1.035;
    }
    return camera;
  }
  _moveCamera(camera){
    const target={...camera,scale:clamp(camera.scale,this._limits.min,this._limits.max)};
    if(this._reducedMotion||this._hidden||Math.abs(target.scale-this._camera.scale)<.00001&&distance(target,this._camera)<.01){this._camera=target;this._animation=null;}
    else this._animation={from:{...this._camera},to:target,start:null,duration:230};
    this._request();
  }
  resize(){
    if(this._destroyed)return;
    const rect=this.canvas.getBoundingClientRect(),width=Math.max(1,rect.width||this.canvas.clientWidth||300),height=Math.max(1,rect.height||this.canvas.clientHeight||200);
    const previous=this._viewport;this._viewport={width,height};this._dpr=clamp(Number(globalThis.devicePixelRatio)||1,1,2);
    const pixelWidth=Math.round(width*this._dpr),pixelHeight=Math.round(height*this._dpr);
    if(this.canvas.width!==pixelWidth)this.canvas.width=pixelWidth;
    if(this.canvas.height!==pixelHeight)this.canvas.height=pixelHeight;
    this._updateOverview();
    if(this._layout){
      if(!this._userCamera){this._camera=this._cameraFor(this._focus);this._animation=null;}
      else this._camera.scale=clamp(this._camera.scale,this._limits.min,this._limits.max);
    }
    this._request();return this.getView();
  }
  _request(){if(!this._destroyed&&!this._hidden&&this._raf===null)this._raf=requestAnimationFrame(time=>this._frame(time));}
  _frame(time){
    this._raf=null;if(this._destroyed||this._hidden)return;
    if(this._animation){
      const animation=this._animation;if(animation.start===null)animation.start=time;
      const u=clamp((time-animation.start)/animation.duration,0,1),ease=1-Math.pow(1-u,3);
      this._camera={x:animation.from.x+(animation.to.x-animation.from.x)*ease,y:animation.from.y+(animation.to.y-animation.from.y)*ease,scale:Math.exp(Math.log(animation.from.scale)+(Math.log(animation.to.scale)-Math.log(animation.from.scale))*ease)};
      if(u===1){this._camera={...animation.to};this._animation=null;}
    }
    this._draw();
    if(this._layout&&!this._animation&&this._userCamera)this._syncSemantic();
    this._lastView=this.getView();this._call('onCameraChange',this._lastView);
    if(this._animation)this._request();
  }
  _closest(nodes){
    let best=null,bestScore=Infinity;
    for(const node of nodes){
      const dx=Math.max(node.bounds.minX-this._camera.x,0,this._camera.x-node.bounds.maxX),dy=Math.max(node.bounds.minY-this._camera.y,0,this._camera.y-node.bounds.maxY);
      const score=Math.hypot(dx,dy)*4+distance(node.plane,this._camera)*.15;
      if(score<bestScore){best=node;bestScore=score;}
    }
    return best;
  }
  _scopes(){
    if(!this._layout)return null;
    const roots=this._layout[this._mode].roots.map(key=>this._layout.byKey.get(key)),root=this._closest(roots);
    if(!root)return null;
    const rootFit=this._cameraFor(root),rootProgress=smoothstep(rootFit.scale*.38,rootFit.scale*.85,this._camera.scale);
    const hasCategories=root.children.some(key=>this._layout.byKey.get(key).kind==='output-category');
    if(this._mode==='outputs'&&!hasCategories)return {root,category:null,rootProgress,leafProgress:rootProgress,level:rootProgress>.55?'family':'overview'};
    const categories=root.children.map(key=>this._layout.byKey.get(key)),category=this._closest(categories);
    const leafFit=category?this._cameraFor(category):rootFit;
    const leafProgress=rootProgress*smoothstep(leafFit.scale*.38,leafFit.scale*.85,this._camera.scale);
    return {root,category,rootProgress,leafProgress,level:leafProgress>.55?'category':rootProgress>.55?(this._mode==='inputs'?'domain':'family'):'overview'};
  }
  _syncSemantic(){
    const scope=this._scope;if(!scope)return;
    let next=scope.level==='overview'?null:scope.level==='category'?scope.category:scope.root;
    if(this._focus&&(this._focus.kind==='signal'||this._focus.kind==='output')&&this._focus.parentKey===next?.key)next=this._focus;
    if(!sameNode(next,this._focus)){this._focus=next;this._notifyFocus('zoom');this._request();}
  }
  _notifyFocus(reason){
    const key=`${this._mode}:${this._focus?.key||'overview'}`;
    if(key!==this._lastFocusKey){this._lastFocusKey=key;this._call('onFocus',{...this._descriptor(),reason});}
  }

  _point(event){const rect=this.canvas.getBoundingClientRect();return {x:event.clientX-rect.left,y:event.clientY-rect.top};}
  _wheel(event){
    if(!this._layout||this._destroyed)return;event.preventDefault();
    const unit=event.deltaMode===1?16:event.deltaMode===2?this._viewport.height:1;
    this._applyZoom(Math.exp(clamp(-event.deltaY*unit*.0014,-.85,.85)),this._point(event));
  }
  _applyZoom(factor,anchor){
    this._animation=null;this._userCamera=true;this._camera=zoomCamera(this._camera,factor,anchor,this._viewport,this._limits);this._request();
  }
  _pointerDown(event){
    if(!this._layout||this._destroyed||event.button>0)return;
    event.preventDefault();this._animation=null;const point=this._point(event);
    this._pointers.set(event.pointerId,{...point});
    if(this._pointers.size===1)this._gesture={start:point,moved:false,labelKey:event.target.closest?.('[data-space-key]')?.dataset.spaceKey||null};
    else if(this._gesture){this._gesture.moved=true;this._gesture.labelKey=null;}
    try{this.canvas.setPointerCapture(event.pointerId);}catch{}
    this.canvas.style.cursor='grabbing';
  }
  _pointerMove(event){
    if(this._destroyed)return;
    if(!this._pointers.has(event.pointerId)){
      const key=event.target.closest?.('[data-space-key]')?.dataset.spaceKey||this._hit(this._point(event))?.key||null;
      if(key!==this._hoverKey){this._hoverKey=key;this.canvas.style.cursor=key?'pointer':'grab';this._request();}
      return;
    }
    event.preventDefault();
    const before=[...this._pointers.values()],old=this._pointers.get(event.pointerId),point=this._point(event);
    this._pointers.set(event.pointerId,point);const after=[...this._pointers.values()];
    if(after.length>=2){
      const oldCentre=midpoint(before[0],before[1]),newCentre=midpoint(after[0],after[1]);
      const factor=distance(after[0],after[1])/Math.max(1,distance(before[0],before[1]));
      const anchored=zoomCamera(this._camera,factor,oldCentre,this._viewport,this._limits);
      anchored.x-=(newCentre.x-oldCentre.x)/anchored.scale;anchored.y-=(newCentre.y-oldCentre.y)/anchored.scale;
      this._camera=anchored;this._userCamera=true;if(this._gesture)this._gesture.moved=true;this._request();return;
    }
    if(!this._gesture)return;
    if(distance(this._gesture.start,point)>4)this._gesture.moved=true;
    if(this._gesture.moved){
      this._camera.x-=(point.x-old.x)/this._camera.scale;this._camera.y-=(point.y-old.y)/this._camera.scale;
      this._userCamera=true;this._request();
    }
  }
  _pointerUp(event,cancelled=false){
    if(!this._pointers.has(event.pointerId))return;
    const point=this._point(event),gesture=this._gesture;this._pointers.delete(event.pointerId);
    try{this.canvas.releasePointerCapture(event.pointerId);}catch{}
    if(!this._pointers.size){
      this.canvas.style.cursor='grab';this._gesture=null;
      if(!cancelled&&gesture&&!gesture.moved){
        const key=gesture.labelKey||this._hit(point)?.key;
        if(key){const node=this._layout.byKey.get(key);if(node)this.focus(describeNode(node));}
      }
    }else{const first=[...this._pointers.values()][0];this._gesture={start:first,moved:true,labelKey:null};}
  }
  _hit(point){
    return this._screenNodes.filter(row=>row.interactive&&distance(row,point)<Math.max(15,row.radius+8)).sort((a,b)=>distance(a,point)-distance(b,point))[0]?.node||null;
  }
  _cancelPointers(){
    const ids=[...this._pointers.keys()];this._pointers.clear();this._gesture=null;this.canvas.style.cursor='grab';
    for(const id of ids){try{this.canvas.releasePointerCapture(id);}catch{}}
  }

  _draw(){
    const ctx=this.ctx,{width,height}=this._viewport;
    ctx.setTransform(this._dpr,0,0,this._dpr,0,0);ctx.clearRect(0,0,width,height);
    ctx.fillStyle='#07090d';ctx.fillRect(0,0,width,height);
    if(!this._layout)return;
    this._scope=this._scopes();const scope=this._scope,positions=new Map(),rows=[];
    const activeKey=this._hoverKey||this._focus?.key;
    for(const node of this._layout.nodes){
      if(node.mode!==this._mode)continue;
      const point=toScreen(node.plane,this._camera,this._viewport);
      const inRoot=node.groupKey===scope.root.key,inCategory=node.parentKey===scope.category?.key;
      const selected=this._focus?.key===node.key,hovered=this._hoverKey===node.key;
      const base=node.kind==='domain'||node.kind==='family'?2.6:node.kind==='category'||node.kind==='output-category'?1.8:1.05;
      const radius=selected||hovered?base+1.35:base;
      const interactive=node.kind==='domain'||node.kind==='family'||['domain','family'].includes(scope.level)&&['category','output-category'].includes(node.kind)&&inRoot||scope.level==='category'&&inCategory||scope.level==='family'&&!scope.category&&node.kind==='output'&&inRoot;
      const row={...point,node,radius,selected,hovered,inRoot,inCategory,interactive};
      positions.set(node.key,row);if(inside(point,width,height,30))rows.push(row);
    }
    // Membership is the only relation drawn. Adjacent edges receive emphasis;
    // geometry never invents associations or a second cross-link network.
    for(const edge of this._layout.edges){
      if(edge.mode!==this._mode)continue;
      const from=positions.get(edge.from),to=positions.get(edge.to);if(!from||!to)continue;
      const rect={x:Math.min(from.x,to.x),y:Math.min(from.y,to.y),width:Math.abs(from.x-to.x),height:Math.abs(from.y-to.y)};
      if(!intersectsViewport(rect,this._viewport,20))continue;
      const adjacent=edge.from===activeKey||edge.to===activeKey;
      const local=to.inCategory||to.inRoot&&['domain','family'].includes(from.node.kind);
      ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);
      ctx.strokeStyle=adjacent?'rgba(153,179,195,.47)':local?'rgba(121,133,151,.12)':'rgba(113,125,144,.055)';
      ctx.lineWidth=adjacent?.8:.55;ctx.stroke();
    }
    for(const row of rows){
      const {x,y,radius,selected,hovered,inRoot,inCategory}=row;
      ctx.beginPath();ctx.arc(x,y,radius,0,TAU);
      ctx.fillStyle=selected||hovered?'#a8c5d0':inCategory?'#818b99':inRoot?'#6d7786':'#525d6d';
      ctx.shadowBlur=0;ctx.fill();
    }
    this._screenNodes=rows;this._renderLabels(scope,positions);
  }
  _drawRegions(){/* No enclosing circles, islands, grid boundaries or posters. */}
  _labelSpec(node,positions,{primary=false,opacity=1,contextPin=false}={}){
    const point=positions.get(node.key);if(!point)return null;
    const expanded=this._focus?.key===node.key||this._hoverKey===node.key||contextPin;
    const text=shortVisualLabel(node.label,node.kind,{full:expanded});
    const mono=document.documentElement?.dataset.graphType!=='sans',font=13;
    const button=this._buttonFor(node,text,expanded,contextPin);
    // These bounds only describe visibility; they never move or pack labels.
    const width=contextPin?Math.min(this._viewport.width-28,text.length*font*.61+8):text.length*font*(mono?.61:.53)+8;
    return {key:node.key,node,anchorX:point.x,anchorY:point.y,width,height:24,opacity,primary,contextPin,labelSide:node.labelSide||'right',button};
  }
  _buttonFor(node,text,expanded,contextPin){
    let button=this._buttons.get(node.key);
    if(!button){
      button=document.createElement('button');button.type='button';button.className='semantic-space-label';
      button.dataset.spaceKey=node.key;button.dataset.kind=node.kind;
      const title=document.createElement('span');title.className='semantic-space-label-title';
      const meta=document.createElement('span');meta.className='semantic-space-label-meta';meta.hidden=true;
      button.append(title,meta);
      Object.assign(button.style,{position:'absolute',left:'0',top:'0',width:'max-content',boxSizing:'border-box',margin:'0',background:'transparent',border:'0',whiteSpace:'nowrap',pointerEvents:'auto',cursor:'pointer',touchAction:'none',userSelect:'none'});
      button.onclick=event=>{if(event.detail===0&&!this._destroyed)this.focus(describeNode(node));};
      button.addEventListener('focus',()=>{if(!this._destroyed){this._hoverKey=node.key;this._request();}});
      button.addEventListener('blur',()=>{if(this._hoverKey===node.key&&!this._destroyed){this._hoverKey=null;this._request();}});
      this._layer.append(button);this._buttons.set(node.key,button);
    }
    if(button.children[0].textContent!==text)button.children[0].textContent=text;
    button.dataset.expanded=String(expanded);button.dataset.contextPin=String(contextPin);
    button.dataset.labelSide=contextPin?'right':node.labelSide||'right';
    button.dataset.active=String(this._focus?.key===node.key||this._hoverKey===node.key);
    button.style.maxWidth=contextPin?`${Math.max(0,this._viewport.width-28)}px`:'none';
    button.setAttribute('aria-label',node.label);
    button.setAttribute('aria-pressed',String(this._focus?.key===node.key));
    return button;
  }
  _renderLabels(scope,positions){
    const items=new Map(),active=new Set();
    const add=(node,options)=>{const item=this._labelSpec(node,positions,options);if(item){items.set(node.key,item);active.add(node.key);}};
    for(const key of this._layout[this._mode].roots){
      const node=this._layout.byKey.get(key),point=positions.get(key);
      if(scope.level==='overview'||inside(point,this._viewport.width,this._viewport.height,180))add(node,{primary:scope.level==='overview',opacity:scope.level==='overview'?1:.42});
    }
    if((this._mode==='inputs'||scope.category)&&scope.rootProgress>.08){
      for(const key of scope.root.children){
        const node=this._layout.byKey.get(key),current=key===scope.category?.key;
        const opacity=scope.level==='category'?(current?.82:.22):Math.max(.28,scope.rootProgress);
        add(node,{primary:scope.level==='domain'||scope.level==='family',opacity});
      }
      if(scope.category&&scope.leafProgress>.08)for(const key of scope.category.children){
        add(this._layout.byKey.get(key),{primary:true,opacity:Math.max(.28,scope.leafProgress)});
      }
    }
    if(this._mode==='outputs'&&!scope.category&&scope.rootProgress>.08)for(const key of scope.root.children){
      add(this._layout.byKey.get(key),{primary:true,opacity:Math.max(.28,scope.rootProgress)});
    }
    for(const key of [this._focus?.key,this._hoverKey]){
      const node=this._layout.byKey.get(key);if(node&&node.mode===this._mode)add(node,{primary:true,opacity:1});
    }
    if(document.body?.classList.contains('map-only')&&scope.level!=='overview'){
      const parent=scope.level==='category'?scope.category:scope.root;
      if(parent)add(parent,{primary:false,opacity:.9,contextPin:true});
    }
    for(const [key,button] of this._buttons)if(!active.has(key)){button.remove();this._buttons.delete(key);}
    this._placed=placeLabels([...items.values()],this._viewport).map(item=>{
      if(item.labelSide!=='left'||item.contextPin)return item;
      const rect={...item,x:item.anchorX-9-item.width};
      return {...rect,visible:intersectsViewport(rect,this._viewport)};
    });
    if(this._mode==='outputs'&&scope.level==='overview'&&this._viewport.width<760){
      // A narrow overview cannot fit sixteen long names at the accepted13px.
      // Cull colliding names at their fixed anchors; never move or re-pack them.
      // Every node stays clickable, and its name appears on hover/focus or zoom.
      const accepted=[],priority=item=>item.key===this._hoverKey?2:item.key===this._focus?.key?1:0;
      for(const item of [...this._placed].sort((a,b)=>priority(b)-priority(a))){
        if(!item.visible)continue;
        const collides=accepted.some(other=>item.x<other.x+other.width+10&&item.x+item.width+10>other.x&&item.y<other.y+other.height+3&&item.y+item.height+3>other.y);
        if(collides)item.visible=false;else accepted.push(item);
      }
    }
    for(const item of this._placed){
      const visible=item.visible&&item.opacity>.18,button=item.button;
      const left=item.labelSide==='left'&&!item.contextPin,originX=left?item.anchorX-9:item.x;
      button.style.transform=`translate3d(${originX.toFixed(2)}px,${item.y.toFixed(2)}px,0)${left?' translateX(-100%)':''}`;
      button.style.opacity=String(item.opacity);button.style.visibility=visible?'visible':'hidden';
      button.style.pointerEvents=visible?'auto':'none';button.tabIndex=visible?0:-1;
      button.setAttribute('aria-hidden',String(!visible));button.dataset.visible=String(visible);
    }
    this._layer.dataset.level=scope.level;this._layer.dataset.mode=this._mode;
  }

  getView(){
    const focus=this._descriptor(),breadcrumbs=[];
    let parent=this._focus;
    while(parent){breadcrumbs.unshift(describeNode(parent));parent=parent.parentKey?this._layout?.byKey.get(parent.parentKey):null;}
    breadcrumbs.unshift(this._overviewDescriptor());
    const visibleLabels=this._placed.filter(label=>!label.hidden&&label.visible&&label.opacity>.18).map(label=>({kind:label.node.kind,id:label.node.id,label:label.node.label,x:label.x,y:label.y,width:label.width,height:label.height,primary:label.primary,opacity:label.opacity,contextPin:Boolean(label.contextPin)}));
    const clippedLabels=this._placed.filter(label=>label.primary&&(!label.visible||label.x<0||label.y<0||label.x+label.width>this._viewport.width||label.y+label.height>this._viewport.height)).map(label=>label.node.id);
    return {
      mode:this._mode,focus,camera:{...this._camera},zoom:this._camera.scale/this._overviewCamera.scale,
      minZoom:this._limits.min/this._overviewCamera.scale,maxZoom:this._limits.max/this._overviewCamera.scale,
      canBack:Boolean(this._focus)||Math.abs(this._camera.scale/this._overviewCamera.scale-1)>.08||distance(this._camera,this._overviewCamera)>10,
      breadcrumbs,lod:this._scope?.level||'overview',semanticScope:this._scope?describeNode(this._scope.category&&this._scope.level==='category'?this._scope.category:this._scope.root):this._overviewDescriptor(),
      viewport:{...this._viewport,dpr:this._dpr||1},animating:Boolean(this._animation),reducedMotion:this._reducedMotion,hidden:this._hidden,destroyed:this._destroyed,
      visibleLabels,primaryLabelCount:this._placed.filter(label=>label.primary).length,clippedLabels,
      visibleNodeCount:this._screenNodes.length,layoutDiagnostics:this._layout?.diagnostics||null,
      labelPolicy:'Single-line DOM names anchored to stable nodes. Zoom reveals the active level; hover/selection expands at the same origin. No rectangle packing.',
      relation:'Parent → child membership only; positions/depth do not encode measured values or causal links'
    };
  }
  destroy(){
    if(this._destroyed)return;this._destroyed=true;
    if(this._raf!==null)cancelAnimationFrame(this._raf);this._raf=null;this._animation=null;
    for(const {target,type,fn,options} of this._listeners)target.removeEventListener(type,fn,options);this._listeners=[];
    if(this._motionQuery?.removeEventListener)this._motionQuery.removeEventListener('change',this._onReducedMotion);else this._motionQuery?.removeListener?.(this._onReducedMotion);
    this._observer?.disconnect();for(const id of this._pointers.keys()){try{this.canvas.releasePointerCapture(id);}catch{}}
    this._pointers.clear();this._buttons.clear();this._visitedViews.clear();this._layer.remove();
    this.canvas.style.touchAction=this._oldTouchAction;this.canvas.style.cursor=this._oldCursor;
  }
}
