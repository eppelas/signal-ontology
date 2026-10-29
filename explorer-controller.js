import {SpaceMap} from './space-map.js';
import {withExpandedOutputs} from './output-catalog.js';

const VIEW_KEY='signal-ontology.explorer.v2';
const VIEW_SCHEMA='signal-ontology.explorer.v2';
const NATURE={measured:'Измерение',derived:'Вычисленный признак',inferred:'Оценка модели',external:'Внешние данные',simulated:'Симуляция'};
const TYPES={number:'Число',integer:'Целое число',boolean:'Да или нет',vector2:'Вектор из двух компонентов',vector3:'Вектор из трёх компонентов',enum:'Выбор варианта',string:'Текст',color:'Цвет',curve:'Кривая',field:'Поле значений',mask:'Маска',matrix:'Матрица',array:'Набор значений',event:'Событие',geometry:'Геометрия',texture:'Текстура',audio_buffer:'Звуковой буфер',object:'Структура значений','array<integer>':'Последовательность целых чисел'};
const normalise=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g,'е');
const ru=value=>String(value??'').replace(/(^|[\s(«])([АаВвИиКкОоСсУуЯя]|[Нн][АаЕеОо]|[Пп][Оо]|[Дд][АаОо]|[Ии][Зз]|[Оо][Тт]|[Зз][Аа]|[Нн][Ии]|[Бб][Ыы])[ \t]+(?=\S)/g,'$1$2\u00a0');
const keyOf=descriptor=>`${descriptor.kind}:${descriptor.id}`;
const countText=(number,one,few,many)=>`${number.toLocaleString('ru-RU')} ${number%100>=11&&number%100<=14?many:number%10===1?one:number%10>=2&&number%10<=4?few:many}`;

/** Read-only adapter: source records are referenced, never rewritten. */
export function buildExplorerIndex(data){
  if(!Array.isArray(data?.signals)||!Array.isArray(data?.domains)||!Array.isArray(data?.outputs?.parameters)||!Array.isArray(data?.outputs?.families))throw new TypeError('Неполный каталог.');
  const byKey=new Map(),rows=[],children=new Map(),parents=new Map();
  const add=(kind,record,parent,mode,context='')=>{
    if(!record||typeof record.id!=='string')throw new TypeError('Запись без идентификатора.');
    const label=record.label||record.signal||record.name_ru;
    if(typeof label!=='string'||!label)throw new TypeError('Запись без названия.');
    const descriptor={kind,id:record.id,label,mode};
    const key=keyOf(descriptor);if(byKey.has(key))throw new TypeError('Повтор записи в каталоге.');
    const row={...descriptor,key,record,parentKey:parent?.key||null,context,search:normalise([label,record.id,context,record.searchText||'',record.observable||'',record.what_changes||''].join(' '))};
    if(kind==='domain')row.domain=record.id;
    else if(mode==='inputs')row.domain=parent.domain;
    if(kind==='family')row.family=record.id;
    else if(mode==='outputs')row.family=parent.family;
    byKey.set(key,row);rows.push(row);children.set(key,[]);
    if(parent){children.get(parent.key).push(row);parents.set(key,parent);}
    return row;
  };
  const signalMap=new Map(data.signals.map(s=>[s.id,s])),seen=new Set();
  if(signalMap.size!==data.signals.length)throw new TypeError('Повтор входного сигнала.');
  for(const domain of data.domains){
    const root=add('domain',domain,null,'inputs');
    if(!Array.isArray(domain.categories))throw new TypeError('Нет категорий направления.');
    for(const category of domain.categories){
      const branch=add('category',category,root,'inputs',root.label);
      if(!Array.isArray(category.signalIds))throw new TypeError('Нет сигналов категории.');
      for(const id of category.signalIds){
        const s=signalMap.get(id);if(!s||seen.has(id)||s.domain!==domain.id||s.category!==category.label)throw new TypeError('Нарушена принадлежность сигнала категории.');
        seen.add(id);add('signal',s,branch,'inputs',`${root.label} · ${branch.label}`);
      }
    }
  }
  if(seen.size!==signalMap.size)throw new TypeError('Сигнал вне категорий каталога.');
  const outputIds=new Set();
  for(const family of data.outputs.families){
    const root=add('family',family,null,'outputs');
    const categories=(data.outputs.categories||[]).filter(c=>c.family===family.id),branches=new Map();
    for(const category of categories)branches.set(category.id,add('output-category',category,root,'outputs',root.label));
    for(const output of data.outputs.parameters.filter(p=>p.family===family.id)){
      if(outputIds.has(output.id))throw new TypeError('Повтор выходного параметра.');
      const parent=categories.length?branches.get(output.category):root;
      if(!parent)throw new TypeError('Параметр вне категории.');
      outputIds.add(output.id);add('output',output,parent,'outputs',parent===root?root.label:`${root.label} · ${parent.label}`);
    }
  }
  if(outputIds.size!==data.outputs.parameters.length)throw new TypeError('Параметр вне семейства.');
  return {byKey,rows,children,parents};
}
export function searchExplorer(index,query){
  const words=normalise(query).trim().split(/\s+/).filter(Boolean);
  if(!words.length)return [];
  return index.rows.filter(row=>words.every(word=>row.search.includes(word)));
}
export function resolveExplorerView(raw,index){
  if(!raw||raw.schema!==VIEW_SCHEMA||!['inputs','outputs'].includes(raw.mode))return null;
  if(raw.focus?.kind==='overview')return {mode:raw.mode,focus:{kind:'overview'}};
  if(typeof raw.focus?.kind!=='string'||typeof raw.focus?.id!=='string')return null;
  const row=index.byKey.get(keyOf(raw.focus));
  return row&&row.mode===raw.mode?{mode:row.mode,focus:{kind:row.kind,id:row.id}}:null;
}
export function correctionValue(signal,field){
  const corrections=signal.corrections?.filter(c=>c.field===field&&typeof c.text==='string').map(c=>c.text);
  return corrections?.length?corrections.join('\n'):String(signal[field]??'');
}
export function sourceLinksFor(record){
  const links=[],seen=new Set();
  const add=(url,title)=>{
    if(typeof url!=='string'||seen.has(url))return;
    try{if(!['http:','https:'].includes(new URL(url).protocol))return;}catch{return;}
    seen.add(url);links.push({url,title:title||'Документация источника'});
  };
  for(const source of record.sourceLinks||[])add(source.url,source.title);
  for(const url of record.source_urls||[])add(url,'Документация параметра');
  for(const correction of record.corrections||[])for(const url of correction.sourceUrls||[])add(url,'Документация к уточнению');
  return links;
}

export function createExplorer(){
  const $=id=>document.getElementById(id);
  const required=['scene','world','tab-signals','tab-compose','search','search-results','btn-links','composer','btn-list','drawer','close-drawer','drawer-title','drawer-list','crumbs','focus-title','focus-meta','detail','close-detail','detail-title','detail-content','detail-lab','zoom-out','zoom-reset','zoom-in','btn-back','btn-projects','projects-dialog','projects-content','close-projects','notice','load-error','retry','stage'];
  for(const id of required)if(!$(id))throw new Error(`Не найден элемент интерфейса: ${id}`);
  const listeners=[],timers=new Set(),dialogOpeners=new WeakMap();
  let data,index,map,lab,ready=false,destroyed=false,loading=false,loadAbort,viewTimer,noticeTimer,searchTimer,detailRow=null,drawerOpener=null,detailOpener=null,lastSaved='';
  const state={mode:'inputs',focus:{kind:'overview'},query:''};
  function setMapOnly(value){
    document.body.classList.toggle('map-only',value);
    const button=$('btn-map-mode');button.setAttribute('aria-pressed',String(value));
    button.setAttribute('aria-label',value?'Вернуть меню онтологии':'Скрыть меню и развернуть карту');
    button.textContent=value?'Вернуть меню ↙':'Только карта ⤢';
    closeSearch();closeDrawer(false);requestAnimationFrame(()=>map?.resize());
    try{localStorage.setItem('signal-ontology.map-only.v1',String(value));}catch{}
  }
  const listen=(node,type,fn,options)=>{node.addEventListener(type,fn,options);listeners.push(()=>node.removeEventListener(type,fn,options));};
  const delay=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
  const clearDelay=id=>{if(id!==undefined){clearTimeout(id);timers.delete(id);}};
  const setText=(id,value)=>{$(id).textContent=ru(value);};
  const element=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=ru(text);if(className)node.className=className;return node;};
  const focusElement=node=>{if(node?.isConnected&&!node.hidden&&!node.disabled&&!node.closest?.('[hidden],dialog:not([open])')&&node.getAttribute?.('aria-hidden')!=='true'){node.focus({preventScroll:true});return true;}return false;};
  const focusMapRow=row=>{const node=row&&[...$('world').querySelectorAll('[data-space-key]')].find(item=>item.dataset.spaceKey===row.key);if(!focusElement(node))focusElement($('stage'));};
  const notify=message=>{if(destroyed)return;setText('notice',message);clearDelay(noticeTimer);noticeTimer=delay(()=>{if(!destroyed)setText('notice','');},5000);};
  const controls=['tab-signals','tab-compose','search','btn-links','btn-list','zoom-out','zoom-reset','zoom-in','btn-back','btn-projects','detail-lab'];
  function setReady(value){ready=value;for(const id of controls)$(id).disabled=!value;$('stage').setAttribute('aria-busy',String(!value));$('detail-lab').disabled=!value||!lab||!detailRow;$('btn-links').disabled=!value||!lab;}
  function setModeUI(){
    for(const [id,mode] of [['tab-signals','inputs'],['tab-compose','outputs']]){
      const selected=state.mode===mode;$(id).classList.toggle('is-active',selected);$(id).setAttribute('aria-pressed',String(selected));
    }
  }
  function closeSearch(restore=false){clearDelay(searchTimer);$('search-results').hidden=true;$('search').setAttribute('aria-expanded','false');if(restore)focusElement($('search'));}
  function closeDrawer(restore=true){$('drawer').hidden=true;$('btn-list').setAttribute('aria-expanded','false');if(restore)focusElement(drawerOpener);}
  function closeDetail(restore=true){const previous=detailRow;$('detail').hidden=true;detailRow=null;$('detail-lab').disabled=true;if(restore&&!focusElement(detailOpener))focusMapRow(previous);}
  function rowMeta(row){
    if(row.kind==='domain')return `${countText(row.record.categories.length,'категория','категории','категорий')} · ${countText(row.record.count,'запись','записи','записей')}`;
    if(row.kind==='category')return countText(row.record.signalIds.length,'сигнал','сигнала','сигналов');
    if(row.kind==='output-category')return countText(index.children.get(row.key).length,'параметр','параметра','параметров');
    if(row.kind==='family'){
      const children=index.children.get(row.key),count=data.outputs.parameters.filter(p=>p.family===row.id).length;
      return `${children.some(child=>child.kind==='output-category')?countText(children.length,'категория','категории','категорий')+' · ':''}${countText(count,'параметр','параметра','параметров')}`;
    }
    return row.context;
  }
  function rowsForFocus(){
    const row=index.byKey.get(keyOf(state.focus));
    if(!row)return index.rows.filter(r=>r.mode===state.mode&&!r.parentKey);
    return index.children.get(row.key).length?index.children.get(row.key):index.children.get(row.parentKey)||[];
  }
  function navigate(row){
    if(!ready||!row)return;
    closeSearch();closeDrawer(false);state.query='';$('search').value='';
    map.focus({kind:row.kind,id:row.id});
    if(!['signal','output'].includes(row.kind))requestAnimationFrame(()=>{
      if(!destroyed)focusMapRow(row);
    });
  }
  function renderRows(container,rows){
    container.replaceChildren();
    if(!rows.length){container.append(element('p','Совпадений нет. Попробуйте другое слово.','explorer-empty'));return;}
    const fragment=document.createDocumentFragment();
    for(const row of rows){
      const button=element('button',undefined,'explorer-row');button.type='button';
      button.append(element('span',row.label,'explorer-row-title'),element('span',rowMeta(row),'explorer-row-meta'));
      button.addEventListener('click',()=>navigate(row));fragment.append(button);
    }
    container.append(fragment);
  }
  function renderDrawer(){
    if(!index)return;const matches=state.query.trim()?searchExplorer(index,state.query):null;
    setText('drawer-title',matches?`${countText(matches.length,'совпадение','совпадения','совпадений')}`:state.focus.kind==='overview'?(state.mode==='inputs'?'Все направления':'Что менять'):index.byKey.get(keyOf(state.focus))?.label||'Все направления');
    renderRows($('drawer-list'),matches||rowsForFocus());
  }
  function runSearch(){
    if(!ready)return;state.query=$('search').value;
    if(!state.query.trim()){closeSearch();renderDrawer();return;}
    const matches=searchExplorer(index,state.query);renderRows($('search-results'),matches);
    $('search-results').prepend(element('p',countText(matches.length,'совпадение','совпадения','совпадений'),'explorer-result-count'));
    $('search-results').hidden=false;$('search').setAttribute('aria-expanded','true');if(!$('drawer').hidden)renderDrawer();
  }
  function renderCrumbs(row){
    const chain=[];for(let cursor=row;cursor;cursor=index.parents.get(cursor.key))chain.unshift(cursor);
    const rootButton=element('button',state.mode==='inputs'?'Все сигналы':'Что менять');rootButton.type='button';rootButton.onclick=()=>map.overview();$('crumbs').replaceChildren(rootButton);
    for(const item of chain){const button=element('button',item.label);button.type='button';button.onclick=()=>navigate(item);if(item.key===row?.key)button.setAttribute('aria-current','location');$('crumbs').append(button);}
  }
  function onFocus(descriptor){
    if(destroyed||!index)return;
    const row=descriptor.kind==='overview'?null:index.byKey.get(keyOf(descriptor));
    state.focus=row?{kind:row.kind,id:row.id}:{kind:'overview'};if(row)state.mode=row.mode;setModeUI();renderCrumbs(row);
    setText('focus-title',row?.label||(state.mode==='inputs'?'Все направления сигналов':'Что менять'));
    setText('focus-meta',row?rowMeta(row):state.mode==='inputs'?`${countText(data.domains.length,'направление','направления','направлений')} · ${countText(data.signals.length,'запись','записи','записей')}`:`${countText(data.outputs.families.length,'семейство','семейства','семейств')} · ${countText(data.outputs.parameters.length,'параметр','параметра','параметров')}`);
    if(detailRow?.key!==row?.key)closeDetail(false);
    if(!$('drawer').hidden)renderDrawer();persistView();
  }
  function persistView(immediate=false){
    if(!index||destroyed)return;
    const write=()=>{viewTimer=undefined;try{const raw=JSON.stringify({schema:VIEW_SCHEMA,mode:state.mode,focus:state.focus});if(raw!==lastSaved){localStorage.setItem(VIEW_KEY,raw);lastSaved=raw;}}catch{/* Navigation still works without storage. */}};
    clearDelay(viewTimer);if(immediate)write();else viewTimer=delay(write,250);
  }
  function section(container,title,text){if(text===undefined||text===null||text==='')return;const part=element('section',undefined,'detail-section');part.append(element('h4',title),element('p',text));container.append(part);}
  function renderSources(container,record){
    const part=element('section',undefined,'detail-section');part.append(element('h4','Источники'));
    const list=element('ul',undefined,'source-list');
    for(const source of sourceLinksFor(record)){const item=element('li'),a=element('a',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';item.append(a);list.append(item);}
    if(list.childElementCount)part.append(list);else part.append(element('p','Ссылки не указаны в исходной записи.'));
    container.append(part);
  }
  function rangeText(range){
    if(!range)return '';
    const parts=[];
    if(Array.isArray(range.values))parts.push(range.values.join(' · '));
    if(typeof range.min==='number'||typeof range.max==='number')parts.push(`${range.min??'−∞'}…${range.max??'+∞'}${range.step!==undefined?`; шаг ${range.step}`:''}`);
    if(typeof range.component_min==='number'||typeof range.component_max==='number')parts.push(`${range.length||''} компонента; каждая ${range.component_min??'−∞'}…${range.component_max??'+∞'}`);
    if(typeof range.exclusive_min==='number')parts.push(`Больше ${range.exclusive_min}`);
    if(typeof range.exclusive_max==='number')parts.push(`Меньше ${range.exclusive_max}`);
    if(range.note)parts.push(range.note);
    return parts.length?parts.join('\n'):JSON.stringify(range,null,2);
  }
  function showDetail(descriptor){
    const row=index.byKey.get(keyOf(descriptor));if(!row||!['signal','output'].includes(row.kind))return;
    detailOpener=document.activeElement;detailRow=row;const record=row.record,body=$('detail-content');body.replaceChildren();setText('detail-title',row.label);
    const eyebrow=$('detail').querySelector('.eyebrow');if(eyebrow)eyebrow.textContent=row.kind==='signal'?'Сигнал':'Выразительный параметр';
    if(row.kind==='signal'){
      section(body,'Что считывается',record.observable);
      const nature=[NATURE[record.nature]||record.nature,record.temporalProvenance?.mode==='forecast'?'Модельный прогноз':null].filter(Boolean).join(' · ');
      section(body,'Природа данных',nature);
      if(record.temporalProvenance?.note)section(body,'Происхождение данных',record.temporalProvenance.note);
      section(body,'Как получить',correctionValue(record,'acquisition'));
      section(body,'Где работает',correctionValue(record,'runtime'));
      section(body,'Что нужно',correctionValue(record,'access'));
      section(body,'Ограничения',record.limitations);
      section(body,'Идея для работы',record.art_use_proposal);
    }else{
      section(body,'Что меняется',record.what_changes);section(body,'Тип значения',TYPES[record.type]||record.type);
      if(record.unit&&record.unit!=='none')section(body,'Единицы',record.unit);
      section(body,record.range?.kind==='api_domain'?'Диапазон API':'Диапазон определения',rangeText(record.range));
      section(body,'Где работает',record.availability);section(body,'Ограничения',record.limitations);
      if(record.art_example)section(body,'Идея для работы',record.art_example);
      const bindings=(record.bindings||[]).map(binding=>`${binding.technology}: ${binding.target}`).join('\n');
      section(body,'Способы реализации',bindings);
    }
    renderSources(body,record);
    const developer=element('details',undefined,'developer-details');developer.append(element('summary','Для разработки'));
    const technical={id:record.id,...(row.kind==='signal'?{domain:record.domain,category:record.category,nature:record.nature,runtime_original:record.runtime,access_original:record.access,corrections:record.corrections||[],temporalProvenance:record.temporalProvenance||null}:{family:record.family,category:record.category,type:record.type,unit:record.unit,range:record.range,binding:record.binding,bindings:record.bindings,source_ids:record.source_ids})};
    developer.append(element('pre',JSON.stringify(technical,null,2)));body.append(developer);
    $('detail-lab').disabled=!lab;setText('detail-lab','Добавить в связь ↗');$('detail').hidden=false;focusElement($('close-detail'));
  }
  function openDialog(dialog,opener){
    closeSearch();dialogOpeners.set(dialog,opener||document.activeElement);
    if(!dialog.open)dialog.showModal();
    const close=dialog.querySelector('[data-lab-close],button[id^="close-"]');focusElement(close);
  }
  function openLab(selection={}){
    if(!ready||!lab)return;const opener=document.activeElement;
    try{lab.open(selection);openDialog($('composer'),opener);}catch(error){lab.close?.();notify(`Не удалось открыть пробу. ${error.message}`);}
  }
  function renderProjects(){
    const container=$('projects-content');container.replaceChildren();
    for(const project of data.projectExamples){
      const card=element('article',undefined,'project-card');card.append(element('h3',project.title));
      if(project.creator)card.append(element('p',project.creator));
      section(card,'Вход',project.brief_input);section(card,'Результат',project.brief_effect);
      if(project.constraints){const details=element('details');details.append(element('summary','Условия и ограничения'),element('p',project.constraints));card.append(details);}
      const links=element('div',undefined,'project-links');
      for(const [url,label] of [[project.video_url,'Смотреть видео ↗'],[project.artist_url,'Автор и процесс ↗']]){
        if(!sourceLinksFor({source_urls:[url]}).length)continue;
        const a=element('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);
      }
      card.append(links);container.append(card);
    }
  }
  function switchMode(mode){if(!ready)return;state.mode=mode;closeSearch();state.query='';$('search').value='';closeDetail(false);map.setMode(mode);setModeUI();}
  function onCameraChange(view){
    if(destroyed)return;state.mode=view.mode;setModeUI();$('btn-back').disabled=!ready||!view.canBack;
  }
  function clearError(){const message=$('load-error-text')||$('load-error').querySelector('[data-load-error-message]');if(message)message.textContent='';$('load-error').hidden=true;}
  function showError(error){
    setReady(false);setText('focus-title','Карта недоступна');setText('focus-meta','');$('crumbs').replaceChildren();$('world').replaceChildren();
    let message=$('load-error-text')||$('load-error').querySelector('[data-load-error-message]');if(!message){message=element('p');message.dataset.loadErrorMessage='true';$('load-error').prepend(message);}
    message.textContent=ru(`Не удалось загрузить каталог. ${error.message}. Повторите загрузку.`);$('load-error').hidden=false;$('retry').disabled=false;
  }
  async function boot(){
    if(loading||destroyed||ready)return;loading=true;setReady(false);clearError();setText('focus-title','Загружаем карту…');setText('focus-meta','');$('crumbs').replaceChildren();$('world').replaceChildren();
    loadAbort=new AbortController();
    try{
      const response=await fetch('./data/ontology.json',{cache:'no-cache',signal:loadAbort.signal});if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const original=await response.json();if(destroyed)return;
      if(original.signals?.length!==1101||original.domains?.length!==7||original.outputs?.parameters?.length!==50||original.projectExamples?.length!==13)throw new Error('Неполный набор данных');
      const expandedResponse=await fetch('./data/outputs-expanded.json',{cache:'no-cache',signal:loadAbort.signal});if(!expandedResponse.ok)throw new Error(`HTTP ${expandedResponse.status}`);
      const loaded=withExpandedOutputs(original,await expandedResponse.json());if(destroyed)return;
      index=buildExplorerIndex(loaded);data=loaded;
      let restored=null;try{restored=resolveExplorerView(JSON.parse(localStorage.getItem(VIEW_KEY)||'null'),index);}catch{}
      const requestedMap=new URLSearchParams(location.search).get('map');
      if(['inputs','outputs'].includes(requestedMap))restored={mode:requestedMap,focus:{kind:'overview'}};
      map=new SpaceMap({canvas:$('scene'),labels:$('world'),onFocus,onSelect:showDetail,onCameraChange});map.setData(data);
      if(restored){state.mode=restored.mode;map.setMode(restored.mode);map.focus(restored.focus);}
      try{if(localStorage.getItem('signal-ontology.map-only.v1')==='true')setMapOnly(true);}catch{}
      try{const module=await import('./lab.js');if(destroyed)return;lab=module.createLab({host:$('composer'),data,notify});}catch{notify('Карта доступна. Лаборатория связей пока недоступна.');}
      if(destroyed)return;renderProjects();setReady(true);setModeUI();$('btn-back').disabled=!map.getView().canBack;renderDrawer();persistView();
    }catch(error){if(!destroyed&&error.name!=='AbortError'){map?.destroy();map=null;showError(error);}}
    finally{loading=false;}
  }

  $('stage').tabIndex=-1;$('drawer').hidden=true;$('detail').hidden=true;$('search-results').hidden=true;$('tab-compose').textContent='Визуал и звук';$('tab-compose').removeAttribute('aria-haspopup');$('btn-links').removeAttribute('aria-pressed');$('btn-links').setAttribute('aria-haspopup','dialog');$('search').setAttribute('aria-controls','search-results');$('search').setAttribute('aria-expanded','false');
  listen($('tab-signals'),'click',()=>switchMode('inputs'));listen($('tab-compose'),'click',()=>switchMode('outputs'));
  listen($('btn-links'),'click',()=>openLab());
  listen($('btn-map-mode'),'click',()=>setMapOnly(!document.body.classList.contains('map-only')));
  listen($('detail-lab'),'click',()=>{if(detailRow)openLab(detailRow.kind==='signal'?{inputId:detailRow.id}:{outputId:detailRow.id});});
  listen($('btn-list'),'click',()=>{if(!ready)return;if(!$('drawer').hidden){closeDrawer();return;}drawerOpener=document.activeElement;renderDrawer();$('drawer').hidden=false;$('btn-list').setAttribute('aria-expanded','true');focusElement($('close-drawer'));});
  listen($('close-drawer'),'click',()=>closeDrawer());listen($('close-detail'),'click',()=>closeDetail());
  listen($('search'),'input',()=>{clearDelay(searchTimer);searchTimer=delay(runSearch,80);});listen($('search'),'focus',()=>{if($('search').value.trim())runSearch();});
  listen($('search'),'keydown',event=>{if(event.key==='ArrowDown'&&!$('search-results').hidden){event.preventDefault();focusElement($('search-results').querySelector('button'));}});
  listen($('search-results'),'keydown',event=>{if(!['ArrowDown','ArrowUp'].includes(event.key))return;const buttons=[...$('search-results').querySelectorAll('button')],at=buttons.indexOf(document.activeElement);event.preventDefault();if(event.key==='ArrowUp'&&at<=0)focusElement($('search'));else focusElement(buttons[Math.max(0,Math.min(buttons.length-1,at+(event.key==='ArrowDown'?1:-1)))]);});
  listen($('zoom-in'),'click',()=>map?.zoomBy(1.4));listen($('zoom-out'),'click',()=>map?.zoomBy(1/1.4));listen($('zoom-reset'),'click',()=>map?.overview());listen($('btn-back'),'click',()=>map?.back());
  listen($('btn-projects'),'click',()=>{if(ready)openDialog($('projects-dialog'));});listen($('close-projects'),'click',()=>$('projects-dialog').close());
  if($('close-composer'))listen($('close-composer'),'click',()=>lab?.close());
  for(const dialog of [$('composer'),$('projects-dialog')])listen(dialog,'close',()=>focusElement(dialogOpeners.get(dialog)));
  listen(document,'pointerdown',event=>{if(!event.target.closest?.('#search,#search-results'))closeSearch();});
  listen(document,'keydown',event=>{
    if($('composer').open||$('projects-dialog').open)return;
    const target=event.target,editing=target.matches?.('input,textarea,select')||target.isContentEditable;
    if(event.key==='Escape'){
      if(!$('search-results').hidden){event.preventDefault();closeSearch(true);}
      else if(!$('drawer').hidden){event.preventDefault();closeDrawer();}
      else if(!$('detail').hidden){event.preventDefault();closeDetail();}
      else if(document.body.classList.contains('map-only')){event.preventDefault();setMapOnly(false);}
      return;
    }
    if(editing||event.ctrlKey||event.metaKey||event.altKey||!ready)return;
    const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(directions[event.key]&&!target.closest?.('#drawer,#detail')){event.preventDefault();const [x,y]=directions[event.key],step=event.shiftKey?300:100;map.panBy(x*step,y*step);return;}
    if(event.key==='/'){event.preventDefault();if(document.body.classList.contains('map-only'))setMapOnly(false);focusElement($('search'));}
    else if(event.key.toLowerCase()==='f'){event.preventDefault();setMapOnly(!document.body.classList.contains('map-only'));}
    else if(event.key==='Backspace'){event.preventDefault();map.back();}
    else if(event.key==='+'||event.key==='='){event.preventDefault();map.zoomBy(1.4);}
    else if(event.key==='-'){event.preventDefault();map.zoomBy(1/1.4);}
  });
  listen($('retry'),'click',boot);
  listen(window,'pagehide',event=>{persistView(true);if(!event.persisted)destroy();});
  function destroy(){
    if(destroyed)return;setReady(false);destroyed=true;loadAbort?.abort();for(const id of timers)clearTimeout(id);timers.clear();for(const remove of listeners)remove();lab?.destroy();map?.destroy();
  }
  boot();
  return {destroy,getView:()=>map?.getView()||null,getData:()=>data||null};
}

if(typeof document!=='undefined'){
  const start=()=>{try{createExplorer();}catch(error){const notice=document.getElementById('notice');if(notice)notice.textContent=`Не удалось открыть карту. ${error.message}`;globalThis.console?.error?.(error);}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
