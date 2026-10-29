/** Overlay only the expressive-output catalogue. The raw input catalogue and
 * the original fifty-control draft remain intact and separately recoverable. */
export function withExpandedOutputs(original,expanded){
  const list=(value,name)=>{if(!Array.isArray(value))throw new TypeError(`Нет списка ${name}`);return value;};
  const families=list(expanded?.families,'семейств'),categories=list(expanded?.categories,'категорий'),parameters=list(expanded?.parameters,'параметров');
  const ids=(items,name)=>{const map=new Map();for(const item of items){if(typeof item.id!=='string'||map.has(item.id))throw new TypeError(`Повтор ${name}`);map.set(item.id,item);}return map;};
  const fs=ids(families,'семейства'),cs=ids(categories,'категории'),ps=ids(parameters,'параметра');
  for(const category of categories)if(!fs.has(category.family))throw new TypeError('Категория вне семейства');
  for(const parameter of parameters){
    const category=cs.get(parameter.category);
    if(!category||category.family!==parameter.family||!fs.has(parameter.family))throw new TypeError('Нарушена иерархия параметра');
    if(!parameter.source_urls?.length||!parameter.what_changes)throw new TypeError('Параметр без определения или источников');
  }
  for(const originalParameter of original.outputs.parameters)if(!ps.has(originalParameter.id))throw new TypeError('Потерян исходный параметр');
  if(expanded.parameter_count!==parameters.length||expanded.category_count!==categories.length||expanded.family_count!==families.length)throw new TypeError('Число записей не совпадает с каталогом');
  return {...original,outputs:expanded,metadata:{...original.metadata,counts:{...original.metadata?.counts,outputParameterDefinitions:parameters.length,outputFamilies:families.length,outputCategories:categories.length},countingNote:expanded.counting_unit}};
}
