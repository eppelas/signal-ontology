// Normalized artistic test mappings. Descriptive catalog rows are never treated
// as live numeric feeds. No device/network access occurs in this module.
export const TRANSFORMS = Object.freeze([
  {id:'direct', label:'Прямо'},
  {id:'inverse', label:'Наоборот'},
  {id:'smoothstep', label:'Мягкая кривая'},
  {id:'threshold', label:'Порог 50%'},
  {id:'steps', label:'Пять ступеней'}
]);

export const clamp = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
let connectionSequence=0;
// randomUUID is restricted to secure contexts. LAN preview also runs over HTTP.
const connectionId=()=>globalThis.crypto?.randomUUID?.()||`connection-${Date.now().toString(36)}-${(++connectionSequence).toString(36)}`;
function connectionMode(mode, inputId) {
  const value=mode===undefined?'test':mode;
  if(!['test','pointer-x','pointer-y'].includes(value)) throw new Error('Неизвестный источник значения связи.');
  if(value!=='test'&&inputId!=='CW001') throw new Error('Режим указателя доступен только для входа CW001.');
  return value;
}
export function transformValue(value, transform='direct') {
  const v=clamp(value);
  if(transform==='inverse') return 1-v;
  if(transform==='smoothstep') return v*v*(3-2*v);
  if(transform==='threshold') return v>=0.5 ? 1 : 0;
  if(transform==='steps') return Math.round(v*4)/4;
  return v;
}

export function createConnection(inputId='WORLD029', outputId='geometry.scale') {
  return {id:connectionId(),inputId,outputId,transform:'direct',value:0.35,enabled:true,mode:'test'};
}

export function validatePatch(raw, inputIds, outputIds) {
  if(!raw || raw.schema!=='signal-ontology.patch.v1' || !Array.isArray(raw.connections)) throw new Error('Неизвестный формат связей.');
  if(raw.connections.length<1 || raw.connections.length>4) throw new Error('Нужно от одной до четырёх связей.');
  const validTransforms=new Set(TRANSFORMS.map(t=>t.id));
  const connections=raw.connections.map((connection,index)=>{
    if(!connection || typeof connection!=='object' || Array.isArray(connection)) throw new Error(`Связь ${index+1} должна быть объектом.`);
    if(!inputIds.has(connection.inputId)) throw new Error(`Неизвестный вход в связи ${index+1}.`);
    if(!outputIds.has(connection.outputId)) throw new Error(`Неизвестный параметр в связи ${index+1}.`);
    if(!validTransforms.has(connection.transform)) throw new Error(`Неизвестное преобразование в связи ${index+1}.`);
    if(typeof connection.value!=='number' || !Number.isFinite(connection.value) || connection.value<0 || connection.value>1) throw new Error(`Тестовое значение связи ${index+1} должно быть от 0 до 1.`);
    if(connection.enabled!==undefined && typeof connection.enabled!=='boolean') throw new Error(`Активность связи ${index+1} должна быть true или false.`);
    return {id:connectionId(),inputId:connection.inputId,outputId:connection.outputId,transform:connection.transform,value:connection.value,enabled:connection.enabled!==false,mode:connectionMode(connection.mode,connection.inputId)};
  });
  return {connections,active:0};
}

export function exportPatch(connections) {
  return {
    schema:'signal-ontology.patch.v1',
    createdAt:new Date().toISOString(),
    valueSource:'normalized_test_values or CW001 page pointer; no external sensor connections',
    duplicateOutputPolicy:'last enabled connection wins',
    connections:connections.map(({inputId,outputId,transform,value,enabled,mode})=>({inputId,outputId,transform,value,enabled,mode:connectionMode(mode,inputId)}))
  };
}

export function evaluateConnections(connections, supportedIds) {
  return connections.filter(c=>c.enabled && supportedIds.has(c.outputId)).map(c=>({parameterId:c.outputId,normalized:transformValue(c.value,c.transform)}));
}
