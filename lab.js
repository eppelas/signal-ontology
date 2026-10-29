import {ExpressionEngine} from './expression-engine.js';
import {TRANSFORMS,createConnection,exportPatch,validatePatch,evaluateConnections,transformValue} from './mapping-core.js';
import {buildAgentPrompt} from './ideation.js';

const STORE='signal-ontology.patch.v1';
const MAX_CONNECTIONS=4;
const MAX_IMPORT_BYTES=100000;
const instances=new WeakMap();
let instanceSequence=0;
const copy=value=>JSON.parse(JSON.stringify(value));
const bounded=value=>Math.min(1,Math.max(0,value));
const ru=value=>String(value??'').replace(/(^|[\s(«])([АаВвИиКкОоСсУуЯя]|[Нн][АаЕеОо]|[Пп][Оо]|[Дд][АаОо]|[Ии][Зз]|[Оо][Тт]|[Зз][Аа]|[Нн][Ии]|[Бб][Ыы])[ \t]+(?=\S)/g,'$1$2\u00a0');
const text=(element,value)=>{const next=ru(value);if(element.textContent!==next)element.textContent=next;};
const transformNames={direct:'Прямая зависимость',inverse:'Инверсия',smoothstep:'S-кривая',threshold:'Порог 50%',steps:'Пять уровней'};
const units={ratio:'×',scene_unit:'ед.',px:'px',degree:'°',percent:'%',percent_HSB:'% HSB',Hz:'Гц',rad:'рад','scene_unit/s':'ед./с','scene_unit/s^2':'ед./с²','1/s':'1/с','rad/s':'рад/с','particles/s':'частиц/с',particles:'частиц',s:'с',linear_gain:'×',Q_ratio:'Q',normalized_pan:'пан',ms:'мс'};
function valueText(value){
  if(typeof value==='number')return Number(value.toFixed(3)).toLocaleString('ru-RU');
  if(typeof value==='string')return value.length>80?value.slice(0,80)+'…':value||'Пустая строка';
  if(Array.isArray(value)){
    if(value.length>6||value.some(v=>Array.isArray(v)))return `${value.length} ${value.some(v=>Array.isArray(v))?'точек':'элементов'}`;
    return value.map(v=>typeof v==='number'?Number(v.toFixed(2)).toLocaleString('ru-RU'):valueText(v)).join(' · ');
  }
  if(value&&typeof value==='object')return Object.entries(value).map(([key,v])=>`${({angle:'угол',axis:'ось',horizontal:'по горизонтали',vertical:'по вертикали'})[key]||key}: ${valueText(v)}`).join('; ');
  return '';
}
function pick(array){
  if(!array.length)return null;
  const n=globalThis.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]/4294967296:Math.random();
  return array[Math.floor(n*array.length)];
}

/**
 * Optional lab for the full ontology. Native showModal/inert/opener focus belong
 * to the caller. open() may run before showModal(): the engine waits for host.open.
 * getConnections() returns defensive patch.v1 connection records, never live objects.
 */
export function createLab({host,data,notify}={}){
  if(!host||host.tagName?.toLowerCase()!=='dialog')throw new TypeError('createLab requires a native dialog host');
  if(instances.has(host))throw new Error('A lab is already attached to this dialog');
  if(!Array.isArray(data?.signals)||!data.signals.length||!Array.isArray(data?.outputs?.parameters)||!data.outputs.parameters.length)throw new TypeError('Lab ontology data is unavailable');
  const signals=new Map(data.signals.map(s=>[s.id,s]));
  const outputs=new Map(data.outputs.parameters.map(p=>[p.id,p]));
  if(signals.size!==data.signals.length||outputs.size!==data.outputs.parameters.length)throw new Error('Ontology IDs must be unique');
  const inputIds=new Set(signals.keys()),outputIds=new Set(outputs.keys()),supported=new Set(ExpressionEngine.supportedIds);
  const domains=new Map((data.domains||[]).map(d=>[d.id,d]));
  const families=new Map((data.outputs.families||[]).map(f=>[f.id,f]));
  const defaultInput=signals.has('WORLD029')?'WORLD029':data.signals[0].id;
  const defaultOutput=outputs.has('geometry.scale')?'geometry.scale':data.outputs.parameters[0].id;
  const prefix=`${host.id||'signal-lab'}-content-${++instanceSequence}`;
  const previousLabel=host.getAttribute('aria-labelledby'),hadClass=host.classList.contains('signal-lab');
  host.classList.add('signal-lab');host.setAttribute('aria-labelledby',prefix+'-title');
  const shell=document.createElement('div');shell.className='lab-shell';
  shell.innerHTML=`
    <header class="lab-header">
      <div><h2 id="${prefix}-title">Проба связей</h2><p>Ручные значения и живой указатель</p></div>
      <button type="button" class="lab-button lab-close" data-lab-action="close" data-lab-close>Закрыть</button>
    </header>
    <div class="lab-body">
      <section class="lab-preview" aria-label="Отклик общей сцены">
        <div class="lab-stage" data-lab-role="stage">
          <canvas data-lab-role="canvas" role="img" aria-label="Форма, движение и цвет в ответ на выбранные значения"></canvas>
          <p class="lab-empty-stage" data-lab-role="empty-stage" hidden></p>
        </div>
        <p class="lab-actual" data-lab-role="actual" aria-live="off"></p>
        <p class="lab-note" data-lab-role="preview-note"></p>
        <div class="lab-playback">
          <button type="button" class="lab-button" data-lab-action="pause" aria-pressed="false">Пауза</button>
          <button type="button" class="lab-button" data-lab-action="audio" aria-pressed="false">Включить звук</button>
        </div>
        <p class="lab-note" data-lab-role="playback-note"></p>
        <p class="lab-note" data-lab-role="mix-note"></p>
      </section>
      <section class="lab-editor" aria-label="Настройки связей">
        <div class="lab-section-heading"><h3>Связи</h3><span data-lab-role="count"></span></div>
        <ol class="lab-connections" data-lab-role="connections"></ol>
        <button type="button" class="lab-button lab-add" data-lab-action="add">Добавить связь</button>
        <div class="lab-fields">
          <label class="lab-field"><span>Найти вход</span><input type="search" data-lab-field="search" placeholder="Например, дыхание или температура" autocomplete="off"></label>
          <label class="lab-field"><span>Входной сигнал</span><select data-lab-field="input" autofocus></select></label>
          <p class="lab-note lab-search-count" data-lab-role="search-count"></p>
          <label class="lab-field"><span>Выразительный параметр</span><select data-lab-field="output"></select></label>
          <label class="lab-field" data-lab-role="mode-field" hidden><span>Источник значения</span><select data-lab-field="mode"><option value="test">Ручное значение</option><option value="pointer-x">Указатель · по ширине окна</option><option value="pointer-y">Указатель · по высоте окна</option></select></label>
          <label class="lab-field"><span>Преобразование</span><select data-lab-field="transform"></select></label>
          <div class="lab-test-value"><label for="${prefix}-value">Значение от 0 до 1</label><output for="${prefix}-value" data-lab-role="normalized" aria-live="off"></output></div>
          <input id="${prefix}-value" class="lab-slider" type="range" min="0" max="1" step="0.001" data-lab-field="value" aria-describedby="${prefix}-value-help">
          <p id="${prefix}-value-help" class="lab-note" data-lab-role="value-help"></p>
          <details class="lab-model"><summary>Условия пробы</summary><p class="lab-note" data-lab-role="model-note"></p><p class="lab-note" data-lab-role="demo-range"></p></details>
        </div>
      </section>
    </div>
    <section class="lab-footer" aria-label="Идеи и перенос связей">
      <div class="lab-actions">
        <button type="button" class="lab-button" data-lab-action="idea">Предложить сочетание</button>
        <button type="button" class="lab-button" data-lab-action="prompt">Промпт для агента</button>
        <button type="button" class="lab-button" data-lab-action="export">Экспорт JSON</button>
        <button type="button" class="lab-button" data-lab-action="import">Импорт JSON</button>
        <input type="file" data-lab-field="file" accept="application/json,.json" hidden>
      </div>
      <p class="lab-note" data-lab-role="saved"></p>
      <p class="lab-status" data-lab-role="status" role="status" aria-live="polite"></p>
      <section class="lab-idea" data-lab-role="idea-panel" hidden>
        <h3 data-lab-role="idea-title"></h3><p class="lab-note">Художественное сочетание для пробы. Реальный источник потребует выбора признака и нормализации.</p>
        <div class="lab-actions"><button type="button" class="lab-button" data-lab-action="another-idea">Другое сочетание</button><button type="button" class="lab-button" data-lab-action="try-idea">Добавить идею</button></div>
      </section>
      <section class="lab-prompt" data-lab-role="prompt-panel" hidden>
        <label class="lab-field" for="${prefix}-prompt"><span>Промпт для агента</span></label>
        <textarea id="${prefix}-prompt" data-lab-field="prompt" rows="10" spellcheck="false" wrap="soft" maxlength="30000"></textarea>
        <p class="lab-note" data-lab-role="prompt-note">Текст можно отредактировать перед копированием.</p>
        <div class="lab-actions"><button type="button" class="lab-button" data-lab-action="regenerate-prompt">Обновить из связей</button><button type="button" class="lab-button" data-lab-action="copy-prompt">Скопировать</button><button type="button" class="lab-button" data-lab-action="download-prompt">Скачать .txt</button></div>
      </section>
    </section>`;
  host.append(shell);
  const role=name=>shell.querySelector(`[data-lab-role="${name}"]`);
  const field=name=>shell.querySelector(`[data-lab-field="${name}"]`);
  const action=name=>shell.querySelector(`[data-lab-action="${name}"]`);
  const refs={canvas:role('canvas'),stage:role('stage'),empty:role('empty-stage'),actual:role('actual'),previewNote:role('preview-note'),playbackNote:role('playback-note'),mixNote:role('mix-note'),count:role('count'),connections:role('connections'),searchCount:role('search-count'),normalized:role('normalized'),valueHelp:role('value-help'),modelNote:role('model-note'),demoRange:role('demo-range'),saved:role('saved'),status:role('status'),modeField:role('mode-field'),ideaPanel:role('idea-panel'),ideaTitle:role('idea-title'),promptPanel:role('prompt-panel'),promptNote:role('prompt-note')};
  const state={connections:[createConnection(defaultInput,defaultOutput)],active:0,requestedOpen:false,hasOpened:false,playing:true,query:'',candidate:null,promptDirty:false,promptSignature:'',destroyed:false};
  let engine=null,engineState=null,importToken=0,lifecycleToken=0,pointerFrame=null,latestPointer=null,pointerAttached=false,audioBusy=false,audioAction='',restoreError='';
  const blobTimers=new Map();
  const current=()=>state.connections[state.active];
  const isActive=()=>!state.destroyed&&state.requestedOpen&&host.open;
  function announce(message){
    if(state.destroyed)return;
    text(refs.status,message);
    if(typeof notify==='function'){try{notify(message);}catch(error){console.warn('Lab notification failed',error);}}
  }
  function assertAlive(){if(state.destroyed)throw new Error('Lab has been destroyed');}
  function saveNow(){
    if(state.destroyed||!state.hasOpened)return false;
    try{localStorage.setItem(STORE,JSON.stringify(exportPatch(state.connections)));text(refs.saved,'Сохранено в этом браузере');return true;}
    catch{text(refs.saved,'Сохранение недоступно. Используйте экспорт JSON.');return false;}
  }
  function restore(){
    restoreError='';
    try{
      const raw=localStorage.getItem(STORE);if(!raw)return;
      const restored=validatePatch(JSON.parse(raw),inputIds,outputIds);
      state.connections=restored.connections;state.active=Math.min(state.active,state.connections.length-1);
      text(refs.saved,'Связи восстановлены из этого браузера');
    }catch{restoreError='Сохранённые связи не прочитались. Открыта новая проба.';text(refs.saved,'Новые изменения можно сохранить или экспортировать.');}
  }
  function option(value,label){const node=document.createElement('option');node.value=value;node.textContent=ru(label);return node;}
  function fillInputs(){
    const select=field('input'),query=state.query.trim().toLocaleLowerCase('ru-RU');
    const filtered=data.signals.filter(s=>!query||String(s.searchText||`${s.signal} ${s.category} ${s.observable}`).toLocaleLowerCase('ru-RU').includes(query));
    select.replaceChildren();
    for(const [domainId,domain] of domains){
      const rows=filtered.filter(s=>s.domain===domainId);if(!rows.length)continue;
      const group=document.createElement('optgroup');group.label=domain.label;
      for(const signal of rows)group.append(option(signal.id,`${signal.signal} — ${signal.category}`));
      select.append(group);
    }
    const ungrouped=filtered.filter(s=>!domains.has(s.domain));
    if(ungrouped.length){const group=document.createElement('optgroup');group.label='Другие входы';for(const s of ungrouped)group.append(option(s.id,s.signal));select.append(group);}
    if(!filtered.some(s=>s.id===current().inputId)){
      const group=document.createElement('optgroup');group.label='Выбранный вход';const s=signals.get(current().inputId);group.append(option(s.id,s.signal));select.append(group);
    }
    select.value=current().inputId;
    text(refs.searchCount,query?(filtered.length?`Найдено: ${filtered.length}`:'Совпадений нет. Измените запрос.'):`${data.signals.length} входов во всех направлениях`);
  }
  function fillOutputs(){
    const select=field('output');select.replaceChildren();
    for(const [familyId,family] of families){
      const group=document.createElement('optgroup');group.label=family.name_ru;
      for(const p of data.outputs.parameters.filter(p=>p.family===familyId))group.append(option(p.id,p.name_ru+(supported.has(p.id)?'':' — без пробы')));
      if(group.children.length)select.append(group);
    }
    const other=data.outputs.parameters.filter(p=>!families.has(p.family));
    if(other.length){const group=document.createElement('optgroup');group.label='Другие параметры';for(const p of other)group.append(option(p.id,p.name_ru));select.append(group);}
  }
  for(const t of TRANSFORMS)field('transform').append(option(t.id,transformNames[t.id]||t.label));
  fillOutputs();
  function renderRoutes(){
    refs.connections.replaceChildren();
    state.connections.forEach((c,index)=>{
      const li=document.createElement('li');li.className='lab-connection';li.dataset.connection=c.id;
      const select=document.createElement('button');select.type='button';select.className='lab-route';select.dataset.labAction='select-route';select.dataset.index=String(index);
      const number=document.createElement('span');number.className='lab-route-number';number.textContent=String(index+1);
      const label=document.createElement('span');label.className='lab-route-label';label.textContent=ru(`${signals.get(c.inputId).signal} → ${outputs.get(c.outputId).name_ru}`);select.append(number,label);
      const tools=document.createElement('div');tools.className='lab-route-tools';
      const enabledLabel=document.createElement('label');enabledLabel.className='lab-enabled';
      const enabled=document.createElement('input');enabled.type='checkbox';enabled.dataset.labField='enabled';enabled.dataset.index=String(index);enabled.checked=c.enabled;enabled.setAttribute('aria-label',`Включить связь ${index+1}`);enabledLabel.append(enabled,document.createTextNode('Включена'));
      const remove=document.createElement('button');remove.type='button';remove.className='lab-remove';remove.dataset.labAction='remove';remove.dataset.index=String(index);remove.textContent='Удалить';remove.setAttribute('aria-label',`Удалить связь ${index+1}`);remove.disabled=state.connections.length===1;if(remove.disabled)remove.title='Последнюю связь можно выключить';
      tools.append(enabledLabel,remove);li.append(select,tools);refs.connections.append(li);
    });
    updateRouteState();
  }
  function updateRouteState(){
    [...refs.connections.children].forEach((li,i)=>{
      const c=state.connections[i];li.classList.toggle('is-current',i===state.active);li.classList.toggle('is-disabled',!c.enabled);
      li.querySelector('[data-lab-action="select-route"]').setAttribute('aria-pressed',String(i===state.active));
      li.querySelector('[data-lab-field="enabled"]').checked=c.enabled;
    });
    text(refs.count,`${state.connections.length} из ${MAX_CONNECTIONS}`);
    action('add').disabled=state.connections.length>=MAX_CONNECTIONS;
    action('try-idea').disabled=state.connections.length>=MAX_CONNECTIONS;
  }
  function renderForm({search=true}={}){
    const c=current();if(search)fillInputs();
    field('output').value=c.outputId;field('mode').value=c.mode;field('transform').value=c.transform;field('value').value=String(c.value);
    refs.modeField.hidden=c.inputId!=='CW001';field('value').disabled=c.mode!=='test';
    text(refs.valueHelp,c.mode==='test'?'Ручное нормированное значение. Реальный вход не подключён.':`Координата указателя по ${c.mode==='pointer-x'?'ширине':'высоте'} окна. На паузе указатель не считывается.`);
    updateReadouts();
  }
  function soundConnected(){return state.connections.some(c=>c.enabled&&c.outputId.startsWith('sound.')&&supported.has(c.outputId));}
  function updateReadouts(){
    const c=current(),p=outputs.get(c.outputId),normal=transformValue(c.value,c.transform),channel=engineState?.parameters?.[c.outputId];
    field('value').value=String(c.value);field('value').setAttribute('aria-valuetext',`${Number(c.value.toFixed(3)).toLocaleString('ru-RU')} из 1`);
    text(refs.normalized,`${Number(c.value.toFixed(3)).toLocaleString('ru-RU')} → ${Number(normal.toFixed(3)).toLocaleString('ru-RU')}`);
    const evaluated=evaluateConnections(state.connections,supported),previewAvailable=evaluated.length>0;
    refs.canvas.hidden=!previewAvailable;refs.empty.hidden=previewAvailable;
    text(refs.empty,!c.enabled?'Включите связь, чтобы увидеть отклик.':!supported.has(c.outputId)?'Для этого параметра нужна отдельная среда.':'Добавьте или включите связь для пробы.');
    const last=state.connections.findLastIndex(other=>other.enabled&&other.outputId===c.outputId);
    let actual='';
    if(!c.enabled)actual='Эта связь выключена';
    else if(!supported.has(c.outputId))actual='Параметр доступен в каталоге, без пробы';
    else if(last>state.active)actual=`Значение задаёт связь ${last+1}`;
    else if(channel?.applied===false)actual='Форму определяет другая связь';
    else if(channel?.actualValue!=null){const v=channel.actualValue,numeric=typeof v==='number'||Array.isArray(v)&&v.every(x=>typeof x==='number');actual=`${p.name_ru}: ${valueText(v)}${numeric&&units[p.unit]?' '+units[p.unit]:''}`;}
    else actual=p.name_ru;
    text(refs.actual,actual);
    text(refs.previewNote,p.what_changes);
    text(refs.modelNote,supported.has(p.id)?(channel?.modelNote||p.limitations):`${p.availability}. ${p.limitations}`);
    const domain=channel?.demoRange;
    const range=domain?.kind==='demo_domain'?`${valueText(domain.min)}…${valueText(domain.max)} ${units[p.unit]||p.unit}`:domain?.kind==='coupled_normalized_path'?`${valueText(domain.at0)} → ${valueText(domain.at1)} ${units[p.unit]||p.unit}`:null;
    text(refs.demoRange,!supported.has(p.id)?'Сцене нужен отдельный адаптер.':range?`Диапазон этой пробы: ${range}`:'Структурированное значение меняется по заданному образцу.');
    const enabled=state.connections.filter(row=>row.enabled),duplicates=new Set(enabled.map(row=>row.outputId)).size<enabled.length;
    text(refs.mixNote,engineState?.connections?.some(row=>row.supported&&!row.applied)?'Последняя настройка формы заменяет несовместимую геометрию.':duplicates?'Один параметр выбран несколько раз. Действует последняя включённая связь.':'');
    action('pause').disabled=!previewAvailable;action('pause').setAttribute('aria-pressed',String(!state.playing));text(action('pause'),state.playing?'Пауза':'Продолжить');
    action('audio').disabled=!previewAvailable||!state.playing||!soundConnected()||audioBusy;
    action('audio').setAttribute('aria-pressed',String(Boolean(engineState?.audioEnabled)));
    text(action('audio'),audioBusy?(audioAction==='off'?'Выключаем звук…':'Включаем звук…'):engineState?.audioError?'Звук недоступен':engineState?.audioEnabled?'Выключить звук':'Включить звук');
    text(refs.playbackNote,!soundConnected()?'Для прослушивания добавьте звуковой параметр.':engineState?.reducedMotion?'Движение отключено настройками устройства. Звук можно включить отдельно.':!state.playing?'Проба на паузе. Звук выключен.':'Звук включается только по кнопке.');
    if(state.promptDirty&&state.promptSignature!==signature())text(refs.promptNote,'Связи изменились. Ваш текст сохранён; обновить его можно кнопкой ниже.');
  }
  function ensureEngine(){
    if(engine||!isActive())return;
    const instance=new ExpressionEngine(refs.canvas,{onState:preview=>{if(state.destroyed)return;engineState=preview;updateReadouts();}});
    engine=instance;engineState=instance.getState();
  }
  function applyScene(){
    if(!isActive()){updateReadouts();return;}
    const evaluated=evaluateConnections(state.connections,supported);
    if(evaluated.length)ensureEngine();
    if(engine){
      // A catalogue control need not have a local Canvas/WebAudio adapter.
      // Keep other supported connections running without sending unknown IDs
      // to the deliberately bounded demonstration engine.
      if(supported.has(current().outputId))engine.setParameter(current().outputId);
      engine.setConnections(evaluated);
      engine.setPlaying(state.playing&&evaluated.length>0);
      if(!soundConnected()&&engine.getState().audioEnabled)void engine.setAudio(false).catch(()=>{});
      engineState=engine.getState();
    }
    syncPointer();updateReadouts();
  }
  function changed({routes=false,form=false,search=false}={}){
    if(routes)renderRoutes();if(form)renderForm({search});
    applyScene();saveNow();
  }
  function focusCurrent(){refs.connections.querySelectorAll('[data-lab-action="select-route"]')[state.active]?.focus();}
  function appendConnection(inputId=current().inputId,outputId){
    if(state.connections.length>=MAX_CONNECTIONS){announce('В сцене уже четыре связи. Уберите одну, чтобы добавить новую.');return false;}
    const used=new Set(state.connections.map(c=>c.outputId));
    const chosen=outputId||['color.hue','particles.birth_rate','motion.angular_velocity','sound.frequency'].find(id=>outputs.has(id)&&!used.has(id))||defaultOutput;
    state.connections.push(createConnection(inputId,chosen));state.active=state.connections.length-1;state.query='';field('search').value='';
    changed({routes:true,form:true,search:true});focusCurrent();return true;
  }
  function applyPointer(){
    if(!latestPointer||!isActive()||!state.playing)return;
    const {x,y}=latestPointer;latestPointer=null;let updated=false;
    for(const c of state.connections){if(c.enabled&&c.inputId==='CW001'&&c.mode!=='test'){c.value=bounded(c.mode==='pointer-x'?x:y);updated=true;}}
    if(updated){applyScene();saveNow();}
  }
  function onPointer(event){
    if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return;
    latestPointer={x:bounded(event.clientX/Math.max(1,window.innerWidth)),y:bounded(event.clientY/Math.max(1,window.innerHeight))};
    if(pointerFrame===null)pointerFrame=requestAnimationFrame(()=>{pointerFrame=null;applyPointer();});
  }
  function syncPointer(){
    const needed=isActive()&&state.playing&&state.connections.some(c=>c.enabled&&c.inputId==='CW001'&&c.mode!=='test');
    if(needed&&!pointerAttached){window.addEventListener('pointermove',onPointer,{passive:true});pointerAttached=true;}
    else if(!needed&&pointerAttached){window.removeEventListener('pointermove',onPointer);pointerAttached=false;}
    if(!needed){if(pointerFrame!==null)cancelAnimationFrame(pointerFrame);pointerFrame=null;latestPointer=null;}
  }
  function stopResources(){
    importToken++;lifecycleToken++;audioBusy=false;audioAction='';
    if(pointerFrame!==null){cancelAnimationFrame(pointerFrame);pointerFrame=null;}
    // Save the latest received pointer sample before detaching the optional input.
    if(latestPointer&&isActive()&&state.playing)applyPointer();
    latestPointer=null;
    if(pointerAttached){window.removeEventListener('pointermove',onPointer);pointerAttached=false;}
    if(engine){const previous=engine;engine=null;try{previous.setPlaying(false);void previous.setAudio(false).catch(()=>{});}catch{}previous.destroy();}
    engineState=null;state.playing=false;
    saveNow();updateReadouts();
  }
  function signature(){return JSON.stringify(state.connections.map(({inputId,outputId,transform,value,enabled,mode})=>({inputId,outputId,transform,value,enabled,mode})));}
  function regeneratePrompt(){
    field('prompt').value=buildAgentPrompt(data,state.connections,engineState||{});state.promptDirty=false;state.promptSignature=signature();
    text(refs.promptNote,'Текст можно отредактировать перед копированием.');
  }
  function showPrompt(){
    if(!field('prompt').value||!state.promptDirty)regeneratePrompt();
    refs.promptPanel.hidden=false;refs.promptPanel.scrollIntoView?.({block:'nearest'});field('prompt').focus();
  }
  function suggest(){
    const nonempty=[...domains.values()].filter(d=>data.signals.some(s=>s.domain===d.id));
    const domain=pick(nonempty),rows=domain?data.signals.filter(s=>s.domain===domain.id):data.signals;
    const s=pick(rows),p=pick(data.outputs.parameters.filter(p=>supported.has(p.id)));
    if(!s||!p){announce('Для сочетания пока недостаточно данных.');return;}
    state.candidate={inputId:s.id,outputId:p.id};refs.ideaPanel.hidden=false;
    text(refs.ideaTitle,`${s.signal} → ${p.name_ru}`);action('try-idea').disabled=state.connections.length>=MAX_CONNECTIONS;
    refs.ideaPanel.scrollIntoView?.({block:'nearest'});
  }
  function download(value,type,name){
    const url=URL.createObjectURL(new Blob([value],{type})),a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;shell.append(a);a.click();a.remove();
    const timer=setTimeout(()=>{URL.revokeObjectURL(url);blobTimers.delete(url);},2000);blobTimers.set(url,timer);
  }
  async function importFile(file){
    const token=++importToken;
    try{
      if(file.size>MAX_IMPORT_BYTES)throw new Error('Файл больше 100 КБ.');
      const raw=JSON.parse(await file.text());
      const patch=validatePatch(raw,inputIds,outputIds);
      if(state.destroyed||token!==importToken||!isActive())return;
      state.connections=patch.connections.map(c=>({...c,mode:'test'}));state.active=0;state.query='';field('search').value='';
      changed({routes:true,form:true,search:true});announce('Связи импортированы. Все входы переведены в ручной тест.');
    }catch(error){if(!state.destroyed&&token===importToken)announce(`Импорт: ${error.message}`);}
    finally{if(!state.destroyed)field('file').value='';}
  }
  async function toggleAudio(){
    if(!isActive()||!engine||!state.playing||!soundConnected()||audioBusy)return;
    const instance=engine,wanted=!instance.getState().audioEnabled,token=lifecycleToken;
    audioBusy=true;audioAction=wanted?'on':'off';updateReadouts();
    try{const result=await instance.setAudio(wanted);if(state.destroyed||token!==lifecycleToken||instance!==engine)return;engineState=result;if(result.audioError)announce('Звук недоступен в этом браузере.');}
    catch{if(!state.destroyed&&token===lifecycleToken)announce('Не удалось включить звук.');}
    finally{if(!state.destroyed&&token===lifecycleToken){audioBusy=false;audioAction='';updateReadouts();}}
  }
  async function onClick(event){
    const button=event.target.closest?.('[data-lab-action]');if(!button||!shell.contains(button)||button.disabled)return;
    const name=button.dataset.labAction,index=Number(button.dataset.index);
    if(name==='close'){close();return;}
    if(name==='select-route'){if(!Number.isInteger(index)||!state.connections[index])return;state.active=index;state.query='';field('search').value='';updateRouteState();renderForm({search:true});applyScene();return;}
    if(name==='add'){appendConnection();return;}
    if(name==='remove'){
      if(state.connections.length<=1||!Number.isInteger(index)||!state.connections[index])return;
      state.connections.splice(index,1);if(index<state.active)state.active--;else if(index===state.active)state.active=Math.min(index,state.connections.length-1);
      state.query='';field('search').value='';changed({routes:true,form:true,search:true});focusCurrent();return;
    }
    if(name==='pause'){
      state.playing=!state.playing;if(!state.playing&&engine)void engine.setAudio(false).catch(()=>{});applyScene();return;
    }
    if(name==='audio'){void toggleAudio();return;}
    if(name==='idea'||name==='another-idea'){suggest();return;}
    if(name==='try-idea'){if(state.candidate&&appendConnection(state.candidate.inputId,state.candidate.outputId))announce('Сочетание добавлено в сцену.');return;}
    if(name==='prompt'){showPrompt();return;}
    if(name==='regenerate-prompt'){regeneratePrompt();return;}
    if(name==='copy-prompt'){
      const token=lifecycleToken;
      try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(field('prompt').value);if(isActive()&&token===lifecycleToken)announce('Промпт скопирован.');}
      catch{if(isActive()&&token===lifecycleToken){field('prompt').focus();field('prompt').select();announce('Текст выделен. Используйте команду «Копировать».');}}return;
    }
    if(name==='download-prompt'){download(field('prompt').value,'text/plain;charset=utf-8','signal-ontology-prompt.txt');return;}
    if(name==='export'){download(JSON.stringify(exportPatch(state.connections),null,2),'application/json','signal-ontology-connections.json');return;}
    if(name==='import')field('file').click();
  }
  function onInput(event){
    if(state.destroyed)return;const target=event.target,name=target.dataset?.labField;
    if(name==='search'){state.query=target.value;fillInputs();return;}
    if(name==='value'){
      const value=Number(target.value);if(!Number.isFinite(value)||value<0||value>1||current().mode!=='test')return;
      current().value=value;applyScene();saveNow();return;
    }
    if(name==='prompt'){state.promptDirty=true;text(refs.promptNote,'Ваш текст сохранён в открытой пробе.');}
  }
  function onChange(event){
    if(state.destroyed)return;const target=event.target,name=target.dataset?.labField,c=current();
    if(name==='file'){const file=target.files?.[0];if(file)void importFile(file);return;}
    if(name==='enabled'){
      const i=Number(target.dataset.index);if(!state.connections[i])return;state.connections[i].enabled=target.checked;updateRouteState();applyScene();saveNow();return;
    }
    if(name==='input'&&signals.has(target.value)){c.inputId=target.value;c.mode='test';changed({routes:true,form:true,search:false});return;}
    if(name==='output'&&outputs.has(target.value)){c.outputId=target.value;changed({routes:true,form:true,search:false});return;}
    if(name==='transform'&&TRANSFORMS.some(t=>t.id===target.value)){c.transform=target.value;changed();return;}
    if(name==='mode'&&['test','pointer-x','pointer-y'].includes(target.value)&&(target.value==='test'||c.inputId==='CW001')){c.mode=target.value;changed({form:true,search:false});}
  }
  function onNativeCancel(event){event.preventDefault();close();}
  function onNativeClose(){if(state.destroyed)return;stopResources();state.requestedOpen=false;}
  function syncVisibility(){
    if(state.destroyed)return;
    if(isActive())applyScene();
    else if(engine||pointerAttached){stopResources();state.requestedOpen=false;}
  }
  function open({inputId,outputId}={}){
    assertAlive();if(inputId!==undefined&&!signals.has(inputId))throw new RangeError('Unknown lab input');if(outputId!==undefined&&!outputs.has(outputId))throw new RangeError('Unknown lab output');
    if(!state.requestedOpen)restore();
    state.requestedOpen=true;state.hasOpened=true;state.playing=true;audioBusy=false;audioAction='';importToken++;lifecycleToken++;
    if(engine)void engine.setAudio(false).catch(()=>{});
    if(inputId!==undefined){current().inputId=inputId;current().mode='test';}
    if(outputId!==undefined)current().outputId=outputId;
    state.query='';field('search').value='';renderRoutes();renderForm({search:true});
    if(inputId!==undefined||outputId!==undefined)saveNow();
    text(refs.status,restoreError);syncVisibility();
    return getConnections();
  }
  function close(){
    if(state.destroyed)return;
    stopResources();state.requestedOpen=false;
    if(host.open)host.close();
  }
  function getConnections(){return copy(state.connections);}
  function destroy(){
    if(state.destroyed)return;close();state.destroyed=true;importToken++;
    observer?.disconnect();shell.removeEventListener('click',onClick);shell.removeEventListener('input',onInput);shell.removeEventListener('change',onChange);
    host.removeEventListener('cancel',onNativeCancel);host.removeEventListener('close',onNativeClose);window.removeEventListener('pagehide',onPageHide);
    for(const [url,timer] of blobTimers){clearTimeout(timer);URL.revokeObjectURL(url);}blobTimers.clear();
    shell.remove();if(!hadClass)host.classList.remove('signal-lab');
    if(previousLabel===null)host.removeAttribute('aria-labelledby');else host.setAttribute('aria-labelledby',previousLabel);
    instances.delete(host);
  }
  const onPageHide=()=>close();
  shell.addEventListener('click',onClick);shell.addEventListener('input',onInput);shell.addEventListener('change',onChange);
  host.addEventListener('cancel',onNativeCancel);host.addEventListener('close',onNativeClose);window.addEventListener('pagehide',onPageHide);
  const observer=typeof MutationObserver==='function'?new MutationObserver(syncVisibility):null;
  observer?.observe(host,{attributes:true,attributeFilter:['open']});
  renderRoutes();renderForm({search:true});text(refs.saved,'Связи сохраняются в этом браузере');
  const api={open,close,destroy,getConnections};instances.set(host,api);return api;
}
