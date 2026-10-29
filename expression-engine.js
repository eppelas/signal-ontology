/**
 * Local expressive-output preview. No sensors, capture, network, downloads or libraries.
 * IDs and units: signal-reference/outputs-draft.json (2026-10-27).
 * Canvas 2D software projection is a demo backend, not a p5/TouchDesigner runtime.
 * Audio is opt-in. Light/haptic bindings remain catalog-only.
 * setConnections replaces the whole scene batch; [] means baseline. In batch
 * mode setParameter selects active metadata and setValue edits only an existing
 * batch member. Neither can resurrect an output omitted from the batch.
 */
const META = {
  "geometry.extent": {
    "name": "Габариты формы",
    "unit": "scene_unit",
    "type": "vector3",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "length": 3,
      "component_min": 1,
      "component_max": 1200,
      "integer_components": false
    }
  },
  "geometry.scale": {
    "name": "Масштаб",
    "unit": "ratio",
    "type": "vector3",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "length": 3,
      "component_min": 0.01,
      "component_max": 8,
      "integer_components": false
    }
  },
  "geometry.stroke_width": {
    "name": "Толщина линии",
    "unit": "px",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0.1,
      "max": 64,
      "step": 0.1
    }
  },
  "geometry.corner_radius": {
    "name": "Радиус углов",
    "unit": "scene_unit",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 300,
      "step": 1
    }
  },
  "geometry.vertices": {
    "name": "Контур из точек",
    "unit": "scene_unit",
    "type": "array<vector3>",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "item_count_min": 2,
      "item_count_max": 256,
      "component_min": -1200,
      "component_max": 1200
    }
  },
  "geometry.mesh_detail": {
    "name": "Детализация сетки",
    "unit": "count",
    "type": "vector2<integer>",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "length": 2,
      "component_min": 3,
      "component_max": 64,
      "integer_components": true
    }
  },
  "color.hue": {
    "name": "Цветовой тон",
    "unit": "degree",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 360,
      "step": 1,
      "wrap": true
    }
  },
  "color.saturation": {
    "name": "Насыщенность",
    "unit": "percent",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 100,
      "step": 1
    }
  },
  "color.brightness": {
    "name": "Яркость цвета HSB",
    "unit": "percent_HSB",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 100,
      "step": 1
    }
  },
  "color.opacity": {
    "name": "Непрозрачность",
    "unit": "ratio",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 1,
      "step": 0.01
    }
  },
  "color.gradient_stops": {
    "name": "Цветовые точки градиента",
    "unit": "position_ratio_and_RGBA",
    "type": "array<color_stop>",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "item_count_min": 2,
      "item_count_max": 8,
      "position_min": 0,
      "position_max": 1,
      "rgba_component_min": 0,
      "rgba_component_max": 1
    }
  },
  "color.blend_mode": {
    "name": "Смешивание слоёв",
    "unit": "none",
    "type": "enum",
    "catalogRange": {
      "kind": "prototype_api_subset",
      "values": [
        "BLEND",
        "ADD",
        "MULTIPLY",
        "SCREEN"
      ]
    }
  },
  "motion.frequency": {
    "name": "Частота повторения",
    "unit": "Hz",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 5,
      "step": 0.01
    }
  },
  "motion.phase": {
    "name": "Фаза цикла",
    "unit": "rad",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 6.283185307179586,
      "step": 0.01,
      "wrap": true
    }
  },
  "motion.velocity": {
    "name": "Скорость перемещения",
    "unit": "scene_unit/s",
    "type": "vector3",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "length": 3,
      "component_min": -1000,
      "component_max": 1000,
      "integer_components": false
    }
  },
  "motion.acceleration": {
    "name": "Ускорение",
    "unit": "scene_unit/s^2",
    "type": "vector3",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "length": 3,
      "component_min": -2000,
      "component_max": 2000,
      "integer_components": false
    }
  },
  "motion.damping_rate": {
    "name": "Скорость затухания",
    "unit": "1/s",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 10,
      "step": 0.01
    }
  },
  "motion.angular_velocity": {
    "name": "Скорость вращения",
    "unit": "rad/s",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": -12.566370614359172,
      "max": 12.566370614359172,
      "step": 0.01
    }
  },
  "particles.birth_rate": {
    "name": "Темп рождения",
    "unit": "particles/s",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 3000,
      "step": 1
    }
  },
  "particles.lifetime": {
    "name": "Срок жизни",
    "unit": "s",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0.05,
      "max": 30,
      "step": 0.05
    }
  },
  "particles.lifetime_variance": {
    "name": "Разброс срока жизни",
    "unit": "s",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 15,
      "step": 0.05
    }
  },
  "particles.burst_count": {
    "name": "Размер выброса",
    "unit": "particles",
    "type": "integer",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 5000,
      "step": 1
    }
  },
  "particles.collision_response": {
    "name": "Реакция на столкновение",
    "unit": "none",
    "type": "enum",
    "catalogRange": {
      "kind": "prototype_api_subset",
      "values": [
        "die",
        "bounce",
        "stick"
      ]
    }
  },
  "particles.seed": {
    "name": "Зерно случайности",
    "unit": "seed",
    "type": "integer",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 2147483647,
      "step": 1
    }
  },
  "space.position": {
    "name": "Положение объекта",
    "unit": "scene_unit",
    "type": "vector3",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "length": 3,
      "component_min": -2000,
      "component_max": 2000,
      "integer_components": false
    }
  },
  "space.orientation": {
    "name": "Ориентация объекта",
    "unit": "rad_and_unit_axis",
    "type": "object<axis_angle>",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "angle_min": -3.141592653589793,
      "angle_max": 3.141592653589793,
      "axis_components_min": -1,
      "axis_components_max": 1,
      "axis_constraint": "normalize nonzero axis"
    }
  },
  "space.camera_position": {
    "name": "Положение камеры",
    "unit": "scene_unit",
    "type": "vector3",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "length": 3,
      "component_min": -3000,
      "component_max": 3000,
      "integer_components": false
    }
  },
  "space.camera_target": {
    "name": "Цель камеры",
    "unit": "scene_unit",
    "type": "vector3",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "length": 3,
      "component_min": -2000,
      "component_max": 2000,
      "integer_components": false
    }
  },
  "space.field_of_view": {
    "name": "Угол обзора",
    "unit": "degree",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 10,
      "max": 120,
      "step": 1
    }
  },
  "text.content": {
    "name": "Текст",
    "unit": "unicode_text",
    "type": "string",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "max_codepoints": 2000
    }
  },
  "text.size": {
    "name": "Размер текста",
    "unit": "px",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 8,
      "max": 240,
      "step": 1
    }
  },
  "text.line_spacing": {
    "name": "Межстрочный интервал",
    "unit": "px",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 8,
      "max": 300,
      "step": 1
    }
  },
  "text.style": {
    "name": "Начертание",
    "unit": "none",
    "type": "enum",
    "catalogRange": {
      "kind": "prototype_api_subset",
      "values": [
        "NORMAL",
        "ITALIC",
        "BOLD",
        "BOLDITALIC"
      ]
    }
  },
  "text.alignment": {
    "name": "Выравнивание",
    "unit": "none",
    "type": "object<text_alignment>",
    "catalogRange": {
      "kind": "prototype_api_subset",
      "horizontal": [
        "LEFT",
        "CENTER",
        "RIGHT"
      ],
      "vertical": [
        "TOP",
        "BOTTOM",
        "CENTER",
        "BASELINE"
      ]
    }
  },
  "sound.frequency": {
    "name": "Частота генератора",
    "unit": "Hz",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 20,
      "max": 2000,
      "step": 1
    }
  },
  "sound.waveform": {
    "name": "Форма звуковой волны",
    "unit": "none",
    "type": "enum",
    "catalogRange": {
      "kind": "prototype_api_subset",
      "values": [
        "sine",
        "square",
        "sawtooth",
        "triangle"
      ]
    }
  },
  "sound.gain": {
    "name": "Уровень звука",
    "unit": "linear_gain",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 1,
      "step": 0.01
    }
  },
  "sound.filter_frequency": {
    "name": "Частота полосового фильтра",
    "unit": "Hz",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 20,
      "max_expression": "min(18000, audioContext.sampleRate/2)",
      "scale": "logarithmic"
    }
  },
  "sound.filter_q": {
    "name": "Добротность полосового фильтра",
    "unit": "Q_ratio",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0.1,
      "max": 30,
      "step": 0.1
    }
  },
  "sound.pan": {
    "name": "Стереопанорама",
    "unit": "normalized_pan",
    "type": "number",
    "catalogRange": {
      "kind": "api_domain",
      "min": -1,
      "max": 1,
      "step": 0.01
    }
  },
  "sound.playback_rate": {
    "name": "Скорость аудиозаписи",
    "unit": "ratio",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0.25,
      "max": 4,
      "step": 0.01
    }
  },
  "sound.delay_time": {
    "name": "Время задержки",
    "unit": "s",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 2,
      "step": 0.001
    }
  },
  "light.color": {
    "name": "Цвет света",
    "unit": "RGB_ratio",
    "type": "vector3",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "length": 3,
      "component_min": 0,
      "component_max": 1,
      "integer_components": false
    }
  },
  "light.intensity": {
    "name": "Интенсивность света",
    "unit": "multiplier",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 0,
      "max": 5,
      "step": 0.01
    }
  },
  "light.type": {
    "name": "Тип источника света",
    "unit": "none",
    "type": "enum",
    "catalogRange": {
      "kind": "prototype_api_subset",
      "values": [
        "point",
        "cone",
        "distant"
      ]
    }
  },
  "light.cone_angle": {
    "name": "Угол светового конуса",
    "unit": "degree",
    "type": "number",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "min": 1,
      "max": 120,
      "step": 1
    }
  },
  "light.shadow_mode": {
    "name": "Характер теней",
    "unit": "none",
    "type": "enum",
    "catalogRange": {
      "kind": "prototype_api_subset",
      "values": [
        "off",
        "hard2d",
        "soft2d"
      ]
    }
  },
  "haptics.pattern": {
    "name": "Рисунок вибрации",
    "unit": "ms",
    "type": "array<integer>",
    "catalogRange": {
      "kind": "prototype_ui_domain",
      "item_count_min": 0,
      "item_count_max": 9,
      "item_min": 0,
      "item_max": 1000
    }
  },
  "haptics.weak_magnitude": {
    "name": "Слабый мотор геймпада",
    "unit": "normalized_magnitude",
    "type": "number",
    "catalogRange": {
      "kind": "api_domain",
      "min": 0,
      "max": 1,
      "step": 0.01
    }
  },
  "haptics.strong_magnitude": {
    "name": "Сильный мотор геймпада",
    "unit": "normalized_magnitude",
    "type": "number",
    "catalogRange": {
      "kind": "api_domain",
      "min": 0,
      "max": 1,
      "step": 0.01
    }
  }
};

const TAU = Math.PI * 2;
const FRAME_MS = 1000 / 60;
const MAX_PARTICLES = 900;
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const lerp = (a, b, t) => a + (b - a) * t;
const logLerp = (a, b, t) => a * Math.pow(b / a, t);
const mixIndex = (u, n) => Math.min(n - 1, Math.floor(u * n));
const vectorAdd = (a, b) => a.map((n, i) => n + b[i]);
const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const normalize = a => { const l = Math.hypot(...a); return l > 1e-8 ? a.map(n => n/l) : [0,0,1]; };
const copy = v => v == null ? v : JSON.parse(JSON.stringify(v));
const scalar = n => Math.round(n * 1000) / 1000;
function convexHull(points){
  const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);
  if(sorted.length<3)return sorted;
  const turn=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const lower=[],upper=[];
  for(const p of sorted){while(lower.length>=2&&turn(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
  for(let i=sorted.length-1;i>=0;i--){const p=sorted[i];while(upper.length>=2&&turn(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
  lower.pop();upper.pop();return lower.concat(upper);
}
function hsv(h, s, v) {
  h = ((h % 360) + 360) % 360 / 60; s /= 100; v /= 100;
  const c = v*s, x = c*(1-Math.abs(h%2-1)), m = v-c;
  const rgb = h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];
  return rgb.map(n => Math.round((n+m)*255));
}
const rgba = (rgb, a=1) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${clamp(a)})`;
function randomGenerator(seed) {
  let n = seed >>> 0;
  return () => { n += 0x6D2B79F5; let t=n; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
}
function rotatePoint(p, angle, axis) {
  const a = normalize(axis), c = Math.cos(angle), s = Math.sin(angle), d = dot(a,p);
  const x = cross(a,p);
  return p.map((v,i) => v*c + x[i]*s + a[i]*d*(1-c));
}
const TEXT_SAMPLE = 'СИГНАЛ\nСТАНОВИТСЯ\nФОРМОЙ';
const ALIGNMENTS = ['LEFT','CENTER','RIGHT'].flatMap(horizontal =>
  ['TOP','BOTTOM','CENTER','BASELINE'].map(vertical => ({horizontal,vertical})));
const NOTES = {
  'geometry.extent':'Связанные габариты [ширина, высота, глубина]; software-проекция эллипсоида. Это не физические размеры.',
  'geometry.scale':'Demo range 0.35–2.5: один скаляр задаёт одинаковый масштаб XYZ. Каталожный range остаётся 0.01–8; габариты и масштаб перемножаются.',
  'geometry.vertices':'Скаляр генерирует 3–32 точки звёздчатого контура. Это пример массива координат, не произвольный редактор вершин.',
  'geometry.mesh_detail':'Скаляр управляет парой [меридианы, параллели]. Сетка сферы действительно перестраивается.',
  'geometry.corner_radius':'Плоский скруглённый прямоугольник; радиус ограничен половиной меньшей стороны.',
  'color.brightness':'Компонента HSB, не физическая яркость дисплея.',
  'color.gradient_stops':'Скаляр генерирует 2–8 цветовых опор; градиент рисуется приложением.',
  'color.blend_mode':'Canvas 2D composition: source-over/lighter/multiply/screen. Цветная подложка делает пересечение видимым.',
  'motion.frequency':'Синусоидальное изменение масштаба; Hz = циклы за секунду. Снимок на паузе сохраняет фазу.',
  'motion.phase':'Начальный сдвиг синусоидального масштаба; сохраняется отдельная частота 0.35 Hz, если она не подключена.',
  'motion.velocity':'Скаляр задаёт связанный XY-вектор скорости. Границы сцены отражают траекторию; линия показывает вектор.',
  'motion.acceleration':'Скаляр задаёт связанный XY-вектор ускорения. Это параметр симуляции, не измерение реального тела.',
  'motion.damping_rate':'После изменения выдаётся одинаковый начальный импульс. v *= exp(-rate*dt); пунктир показывает прогноз пути.',
  'motion.angular_velocity':'Вращение вокруг Z; угловая скорость в rad/s, не скорость кадра.',
  'particles.birth_rate':'Demo range 0–1500 particles/s; каталожный range 0–3000. Одновременно не более 900 частиц; при лимите лишние рождения пропускаются.',
  'particles.lifetime':'Время существования в секундах; при изменении строится одинаковый по seed пример возрастов.',
  'particles.lifetime_variance':'Равномерный разброс life ± variance; scalar 0–1 отображается в 0–min(15, life−0.01)s.',
  'particles.burst_count':'Один выброс при изменении значения/подключения. Scalar 0–1 задаёт 0–900 частиц; это subset каталожного диапазона 0–5000.',
  'particles.collision_response':'Частицы внутри прямоугольной границы исчезают, отражаются или остаются на границе. Изменение проявляется при столкновении; на паузе время не продвигается.',
  'particles.seed':'Детерминированный PRNG меняет направления и возрастную выборку. Это локальный пример, не TD-симуляция.',
  'space.position':'Скаляр задаёт путь [X, Y, Z], а не три независимых slider. Положение показано в единицах модели сцены.',
  'space.orientation':'Поворот вокруг фиксированной единичной оси; angle-axis превращается в реальную 3D-проекцию.',
  'space.camera_position':'Скаляр перемещает камеру по дуге постоянного радиуса. Меридианы и опорные оси показывают ракурс.',
  'space.camera_target':'Скаляр меняет точку взгляда камеры в XY-плоскости.',
  'space.field_of_view':'Вертикальный FOV в градусах, вычисляется perspective projection. Крайние значения могут обрезать объект.',
  'text.content':'Скаляр выбирает длину надписи из фиксированной Unicode-фразы. Это демонстрация текста, не генерация смысла.',
  'text.style':'Canvas system-font style; доступность начертаний зависит от системного sans-serif.',
  'text.alignment':'Скаляр выбирает одну из 12 пар horizontal/vertical. Маленькая точка — общая опора текста.',
  'sound.frequency':'Самосинтезированный генератор. До ручного включения звука виден только математический эскиз волны.',
  'sound.waveform':'sine/square/sawtooth/triangle; звук вручную включается отдельно. Эскиз не является измерением микрофона.',
  'sound.gain':'Линейный GainNode до отдельного выходного ограничения ×0.055. Значение 1 не означает максимальную громкость устройства.',
  'sound.filter_frequency':'Центральная частота bandpass. До включения звука показана аналоговая схема полосы; после — getFrequencyResponse Web Audio.',
  'sound.filter_q':'Q полосового bandpass: безразмерное отношение. Не переносить эту единицу на lowpass/highpass API Q.',
  'sound.pan':'Реальная StereoPannerNode.pan; положение точки — визуальная схема, не измерение локализации звука.',
  'sound.playback_rate':'Looped buffer синтезирован локально. Resampling меняет скорость и высоту, pitch не сохраняется.',
  'sound.delay_time':'Сухой сигнал смешивается с delayed-сигналом. Периодическая огибающая делает задержку слышимой; feedback отсутствует.'
};
function defaults() {
  return {
    extent:[150,150,150], scale:[1,1,1], stroke:1.1, corner:0, vertices:[], mesh:[16,12], shape:'sphere',
    hue:0, saturation:88, brightness:94, opacity:1, stops:null, blend:'BLEND',
    frequency:0.35, phase:0, pulse:false, velocity:[0,0,0], acceleration:[0,0,0], damping:0, angularVelocity:0,
    birthRate:32, life:3, variance:0, burst:0, collision:'bounce', seed:31,
    position:[0,0,0], orientation:{angle:0,axis:[0,0,1]}, camera:[0,0,520], cameraTarget:[0,0,0], fov:48,
    text:TEXT_SAMPLE, textSize:30, leading:38, style:'NORMAL', alignment:{horizontal:'CENTER',vertical:'CENTER'}, showText:false,
    soundFrequency:220, waveform:'sine', soundGain:0.65, filterFrequency:1100, q:1, pan:0, playbackRate:1, delay:0.2
  };
}
function resolve(id,u,sampleRate=48000) {
  switch(id) {
    case 'geometry.extent': return [lerp(40,360,u),lerp(40,260,u),lerp(40,200,u)].map(scalar);
    case 'geometry.scale': return [1,1,1].map(() => scalar(lerp(0.35,2.5,u)));
    case 'geometry.stroke_width': return scalar(lerp(0.1,24,u));
    case 'geometry.corner_radius': return scalar(lerp(0,70,u));
    case 'geometry.vertices': {
      const n=Math.round(lerp(3,32,u));
      return Array.from({length:n},(_,i) => { const a=i/n*TAU-Math.PI/2, r=i%2?64:100; return [scalar(Math.cos(a)*r),scalar(Math.sin(a)*r),0]; });
    }
    case 'geometry.mesh_detail': return [Math.round(lerp(3,48,u)),Math.round(lerp(3,32,u))];
    case 'color.hue': return scalar(u*360);
    case 'color.saturation': case 'color.brightness': return scalar(u*100);
    case 'color.opacity': return scalar(u);
    case 'color.gradient_stops': {
      const n=2+Math.floor(u*6);
      return Array.from({length:n},(_,i) => ({at:scalar(i/(n-1)),rgba:[...hsv(lerp(0,250,i/(n-1)),85,95).map(v => scalar(v/255)),1]}));
    }
    case 'color.blend_mode': return ['BLEND','ADD','MULTIPLY','SCREEN'][mixIndex(u,4)];
    case 'motion.frequency': return scalar(u*5);
    case 'motion.phase': return scalar(u*TAU);
    case 'motion.velocity': return [scalar(lerp(-140,140,u)),scalar(lerp(65,-65,u)),0];
    case 'motion.acceleration': return [scalar(lerp(-180,180,u)),scalar(lerp(70,-70,u)),0];
    case 'motion.damping_rate': return scalar(u*10);
    case 'motion.angular_velocity': return scalar(lerp(-4*Math.PI,4*Math.PI,u));
    case 'particles.birth_rate': return Math.round(u*1500);
    case 'particles.lifetime': return scalar(lerp(0.05,30,u));
    case 'particles.lifetime_variance': return scalar(u*15);
    case 'particles.burst_count': return Math.round(u*MAX_PARTICLES);
    case 'particles.collision_response': return ['die','bounce','stick'][mixIndex(u,3)];
    case 'particles.seed': return Math.round(u*2147483647);
    case 'space.position': return [scalar(lerp(-160,160,u)),scalar(lerp(-50,50,u)),scalar(lerp(-80,80,u))];
    case 'space.orientation': return {angle:scalar(lerp(-Math.PI,Math.PI,u)),axis:normalize([1,2,0.5])};
    case 'space.camera_position': { const a=lerp(-1.2,1.2,u); return [scalar(Math.sin(a)*520),80,scalar(Math.cos(a)*520)]; }
    case 'space.camera_target': return [scalar(lerp(-150,150,u)),scalar(lerp(-60,60,u)),0];
    case 'space.field_of_view': return scalar(lerp(10,120,u));
    case 'text.content': return Array.from(TEXT_SAMPLE).slice(0,Math.round(u*Array.from(TEXT_SAMPLE).length)).join('');
    case 'text.size': return Math.round(lerp(8,240,u));
    case 'text.line_spacing': return Math.round(lerp(8,300,u));
    case 'text.style': return ['NORMAL','ITALIC','BOLD','BOLDITALIC'][mixIndex(u,4)];
    case 'text.alignment': return copy(ALIGNMENTS[mixIndex(u,ALIGNMENTS.length)]);
    case 'sound.frequency': return scalar(logLerp(20,2000,u));
    case 'sound.waveform': return ['sine','square','sawtooth','triangle'][mixIndex(u,4)];
    case 'sound.gain': return scalar(u);
    case 'sound.filter_frequency': return scalar(logLerp(20,Math.min(18000,sampleRate/2),u));
    case 'sound.filter_q': return scalar(lerp(0.1,30,u));
    case 'sound.pan': return scalar(lerp(-1,1,u));
    case 'sound.playback_rate': return scalar(logLerp(0.25,4,u));
    case 'sound.delay_time': return scalar(u*2);
    default:return null;
  }
}
const APPLY = {
  'geometry.extent':(c,v)=>c.extent=v,
  'geometry.scale':(c,v)=>c.scale=v,
  'geometry.stroke_width':(c,v)=>c.stroke=v,
  'geometry.corner_radius':(c,v)=>{c.corner=v;c.shape='rect';},
  'geometry.vertices':(c,v)=>{c.vertices=v;c.shape='polygon';},
  'geometry.mesh_detail':(c,v)=>{c.mesh=v;c.shape='sphere';},
  'color.hue':(c,v)=>c.hue=v,
  'color.saturation':(c,v)=>c.saturation=v,
  'color.brightness':(c,v)=>c.brightness=v,
  'color.opacity':(c,v)=>c.opacity=v,
  'color.gradient_stops':(c,v)=>c.stops=v,
  'color.blend_mode':(c,v)=>c.blend=v,
  'motion.frequency':(c,v)=>{c.frequency=v;c.pulse=true;},
  'motion.phase':(c,v)=>{c.phase=v;c.pulse=true;},
  'motion.velocity':(c,v)=>c.velocity=v,
  'motion.acceleration':(c,v)=>c.acceleration=v,
  'motion.damping_rate':(c,v)=>c.damping=v,
  'motion.angular_velocity':(c,v)=>c.angularVelocity=v,
  'particles.birth_rate':(c,v)=>c.birthRate=v,
  'particles.lifetime':(c,v)=>c.life=v,
  'particles.lifetime_variance':(c,v)=>c.variance=v,
  'particles.burst_count':(c,v)=>c.burst=v,
  'particles.collision_response':(c,v)=>c.collision=v,
  'particles.seed':(c,v)=>c.seed=v,
  'space.position':(c,v)=>c.position=v,
  'space.orientation':(c,v)=>c.orientation=v,
  'space.camera_position':(c,v)=>c.camera=v,
  'space.camera_target':(c,v)=>c.cameraTarget=v,
  'space.field_of_view':(c,v)=>c.fov=v,
  'text.content':(c,v)=>{c.text=v;c.showText=true;},
  'text.size':(c,v)=>{c.textSize=v;c.showText=true;},
  'text.line_spacing':(c,v)=>{c.leading=v;c.showText=true;},
  'text.style':(c,v)=>{c.style=v;c.showText=true;},
  'text.alignment':(c,v)=>{c.alignment=v;c.showText=true;},
  'sound.frequency':(c,v)=>c.soundFrequency=v,
  'sound.waveform':(c,v)=>c.waveform=v,
  'sound.gain':(c,v)=>c.soundGain=v,
  'sound.filter_frequency':(c,v)=>c.filterFrequency=v,
  'sound.filter_q':(c,v)=>c.q=v,
  'sound.pan':(c,v)=>c.pan=v,
  'sound.playback_rate':(c,v)=>c.playbackRate=v,
  'sound.delay_time':(c,v)=>c.delay=v
};
const SUPPORTED = Object.freeze(Object.keys(APPLY));
export class ExpressionEngine {
  static supportedIds = SUPPORTED;
  constructor(canvas,{onState}={}) {
    if(!canvas || typeof canvas.getContext!=='function') throw new TypeError('ExpressionEngine requires a canvas');
    this.canvas=canvas; this.ctx=canvas.getContext('2d');
    if(!this.ctx) throw new Error('Canvas 2D context unavailable');
    this._onState=typeof onState==='function'?onState:null;
    this._destroyed=false;this._playing=true;this._hidden=typeof document!=='undefined'&&Boolean(document.hidden);
    this._revision=1;this._active={parameterId:'geometry.scale',normalized:0.5,revision:1};this._connections=new Map();this._batchMode=false;
    this._audioWanted=false;this._audio=null;this._audioError=null;this._audioQueue=Promise.resolve();this._audioCommand=0;
    this._raf=null;this._lastRender=null;this._lastStep=null;this._time=0;this._angle=0;this._motionPosition=[0,0,0];this._velocity=[0,0,0];
    this._particles=[];this._emission=0;this._trail=[];this._width=1;this._height=1;this._dpr=1;
    this._motionQuery=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
    this._reducedMotion=Boolean(this._motionQuery?.matches);
    this._onVisibility=()=>{this._hidden=Boolean(document.hidden);this._reconcileActivity();this._drawOnChange();this._emit();};
    this._onResize=()=>{this._resize();this._drawOnChange();this._emit();};
    this._onReducedMotion=e=>{this._reducedMotion=Boolean(e.matches);this._reconcileActivity();this._drawOnChange();this._emit();};
    if(typeof document!=='undefined') document.addEventListener('visibilitychange',this._onVisibility);
    if(typeof window!=='undefined') window.addEventListener('resize',this._onResize,{passive:true});
    if(this._motionQuery?.addEventListener)this._motionQuery.addEventListener('change',this._onReducedMotion);
    else this._motionQuery?.addListener?.(this._onReducedMotion);
    this._observer=typeof ResizeObserver==='function'?new ResizeObserver(this._onResize):null;
    this._observer?.observe(canvas);
    this._rebuild(true);this._resize();this._draw();this._reconcileActivity();this._emit();
  }
  _assertAlive(){if(this._destroyed)throw new Error('ExpressionEngine has been destroyed');}
  _validateId(id){if(typeof id!=='string'||!Object.hasOwn(META,id))throw new RangeError(`Unknown output parameter: ${String(id)}`);}
  _validateValue(v){if(typeof v!=='number'||!Number.isFinite(v))throw new TypeError('normalized must be a finite number');return clamp(v);}
  _entries(){
    if(this._batchMode)return [...this._connections.values()].sort((a,b)=>a.revision-b.revision);
    const entries=new Map(this._connections);
    const previous=entries.get(this._active.parameterId);
    if(!previous||previous.revision<=this._active.revision)entries.set(this._active.parameterId,this._active);
    return [...entries.values()].sort((a,b)=>a.revision-b.revision);
  }
  setParameter(id){
    this._assertAlive();this._validateId(id);
    const changed=this._active.parameterId!==id;
    const old=this._connections.get(id);
    this._active={parameterId:id,normalized:old?.normalized??(changed?0.5:this._active.normalized),revision:++this._revision};
    this._rebuild(changed&&!this._batchMode);this._drawOnChange();this._emit();return this.getState();
  }
  setValue(normalized0to1){
    this._assertAlive();const normalized=this._validateValue(normalized0to1);
    const effective=this._entries().find(row=>row.parameterId===this._active.parameterId);
    const unchanged=(effective?.normalized??this._active.normalized)===normalized;
    this._active={...this._active,normalized,revision:++this._revision};
    // Once a batch is supplied, active selection cannot resurrect an omitted
    // output. A later authoritative batch must explicitly include that output.
    if(this._batchMode&&!this._connections.has(this._active.parameterId)){this._emit();return this.getState();}
    if(!unchanged){
      if(this._batchMode&&this._connections.has(this._active.parameterId))this._connections.set(this._active.parameterId,{...this._active});
      const reset={
        particles:['particles.seed','particles.burst_count','particles.lifetime','particles.lifetime_variance'].includes(this._active.parameterId)
          ||(!this._effectivePlaying()&&this._active.parameterId==='particles.birth_rate'),
        motion:this._active.parameterId==='motion.damping_rate'
      };
      this._rebuild(reset);this._drawOnChange();this._emit();
    }
    return this.getState();
  }
  setConnections(connections=[]){
    this._assertAlive();if(!Array.isArray(connections))throw new TypeError('connections must be an array');
    const parsed=connections.map(row=>{
      if(!row||typeof row!=='object')throw new TypeError('connection must be an object');
      this._validateId(row.parameterId);
      return {parameterId:row.parameterId,normalized:this._validateValue(row.normalized)};
    });
    const next=new Map();
    for(const row of parsed)next.set(row.parameterId,{...row,revision:++this._revision});
    const resetIds=['particles.seed','particles.burst_count','particles.lifetime','particles.lifetime_variance'];
    const changedIds=new Set([...this._connections.keys(),...next.keys()].filter(id=>this._connections.get(id)?.normalized!==next.get(id)?.normalized));
    const removedIds=[...this._connections.keys()].filter(id=>!next.has(id));
    const reset={
      particles:resetIds.some(id=>changedIds.has(id))||(!this._effectivePlaying()&&changedIds.has('particles.birth_rate'))||removedIds.some(id=>id.startsWith('particles.')),
      motion:changedIds.has('motion.damping_rate')||removedIds.some(id=>id.startsWith('motion.'))
    };
    this._connections=next;this._batchMode=true;this._rebuild(reset);this._drawOnChange();this._emit();return this.getState();
  }
  setPlaying(playing){
    this._assertAlive();if(typeof playing!=='boolean')throw new TypeError('playing must be boolean');
    this._playing=playing;this._reconcileActivity();this._drawOnChange();this._emit();return this.getState();
  }
  async setAudio(enabled){
    this._assertAlive();if(typeof enabled!=='boolean')throw new TypeError('audio enabled must be boolean');
    this._audioWanted=enabled;this._audioError=null;this._audioCommand++;
    if(this._audioWanted&&!this._audio){
      try{this._createAudio();}catch(error){this._audioWanted=false;this._audioError=String(error?.message||error);}
    }
    if(!this._audioWanted&&this._audio)this._audio.ceiling.gain.value=0;
    this._emit();await this._queueAudioSync();return this.getState();
  }
  _effectivePlaying(){return !this._destroyed&&this._playing&&!this._hidden&&!this._reducedMotion;}
  _effectiveAudio(){return !this._destroyed&&this._playing&&!this._hidden;}
  _drawOnChange(){
    // Live inputs may arrive faster than refresh. A playing scene paints only in
    // the capped RAF chain; a visible paused scene redraws immediately on change.
    if(!this._destroyed&&!this._hidden&&!this._effectivePlaying())this._draw();
  }
  _reconcileActivity(){
    if(this._effectivePlaying()){
      if(this._raf===null){this._lastRender=null;this._lastStep=null;this._raf=requestAnimationFrame(t=>this._frame(t));}
    }else{
      if(this._raf!==null)cancelAnimationFrame(this._raf);
      this._raf=null;this._lastRender=null;this._lastStep=null;
    }
    void this._queueAudioSync();
  }
  _frame(now){
    this._raf=null;if(!this._effectivePlaying())return;
    if(this._lastRender===null){this._lastRender=now;this._lastStep=now;}
    const elapsed=now-this._lastRender;
    if(elapsed+0.001>=FRAME_MS){
      // A tiny timestamp tolerance avoids dropping exact 60Hz frames because
      // binary floating-point places 16.666... just below the deadline.
      this._lastRender+=Math.floor((elapsed+0.001)/FRAME_MS)*FRAME_MS;
      this._step(Math.min((now-this._lastStep)/1000,0.05));this._lastStep=now;this._draw();
    }
    if(this._effectivePlaying())this._raf=requestAnimationFrame(t=>this._frame(t));
  }
  _resize(){
    if(this._destroyed)return;
    const rect=this.canvas.getBoundingClientRect();
    this._width=Math.max(1,rect.width||this.canvas.clientWidth||300);
    this._height=Math.max(1,rect.height||this.canvas.clientHeight||200);
    this._dpr=clamp(Number(globalThis.devicePixelRatio)||1,1,2);
    const w=Math.round(this._width*this._dpr),h=Math.round(this._height*this._dpr);
    if(this.canvas.width!==w)this.canvas.width=w;
    if(this.canvas.height!==h)this.canvas.height=h;
  }
  _rebuild(reset){
    const previousEnabled=this._enabled||new Set();
    const previousVelocity=this._config?.velocity;
    const resetAll=reset===true,resetParticles=resetAll||Boolean(reset?.particles),resetMotion=resetAll||Boolean(reset?.motion);
    const c=defaults();this._enabled=new Set();this._resolved=new Map();
    const sampleRate=this._audio?.context.sampleRate||48000;
    for(const entry of this._entries()){
      if(!Object.hasOwn(APPLY,entry.parameterId))continue;
      const value=resolve(entry.parameterId,entry.normalized,sampleRate);
      this._resolved.set(entry.parameterId,value);this._enabled.add(entry.parameterId);
      APPLY[entry.parameterId](c,value);
    }
    const varianceEntry=this._entries().find(row=>row.parameterId==='particles.lifetime_variance');
    c.variance=varianceEntry?varianceEntry.normalized*Math.min(15,Math.max(0,c.life-0.01)):0;
    c.corner=Math.min(c.corner,c.extent[0]/2,c.extent[1]/2);
    if(this._resolved.has('particles.lifetime_variance'))this._resolved.set('particles.lifetime_variance',scalar(c.variance));
    if(this._resolved.has('geometry.corner_radius'))this._resolved.set('geometry.corner_radius',scalar(c.corner));
    this._config=c;
    const hasLinearMotion=['motion.velocity','motion.acceleration','motion.damping_rate'].some(id=>this._enabled.has(id));
    if(resetAll){this._time=0;this._angle=0;}
    if(resetMotion||!hasLinearMotion){
      this._motionPosition=[0,0,0];
      this._velocity=this._enabled.has('motion.damping_rate')?[140,35,0]:[...c.velocity];
      this._trail=[];
    }
    if(!this._enabled.has('motion.angular_velocity')&&previousEnabled.has('motion.angular_velocity'))this._angle=0;
    if(resetParticles){
      this._random=randomGenerator(c.seed);this._particles=[];this._emission=0;
      const n=this._enabled.has('particles.burst_count')?c.burst:Math.min(800,Math.ceil(c.birthRate*Math.min(c.life,0.2)));
      this._spawn(n,true);
    }
    if(!resetMotion&&this._enabled.has('motion.velocity')&&!this._enabled.has('motion.acceleration')&&!this._enabled.has('motion.damping_rate')
      &&(!previousEnabled.has('motion.velocity')||!previousVelocity||c.velocity.some((v,i)=>v!==previousVelocity[i])))this._velocity=[...c.velocity];
    this._updateAudio();
  }
  _spawn(count,preview=false){
    const c=this._config,remaining=MAX_PARTICLES-this._particles.length;
    const n=Math.min(Math.max(0,Math.floor(count)),remaining);
    for(let i=0;i<n;i++){
      const a=(this._random()-0.5)*1.5,speed=55+this._random()*105;
      const life=Math.max(0.01,c.life+(this._random()*2-1)*c.variance);
      const age=preview?this._random()*Math.min(life,3):0;
      const vx=Math.cos(a)*speed,vy=Math.sin(a)*speed;
      const p={x:-165+vx*age,y:vy*age,z:(this._random()-0.5)*70,vx,vy,age,life,size:0.7+this._random()*1.6,stuck:false};
      const hit=Math.abs(p.x)>190||Math.abs(p.y)>115;
      if(preview&&hit&&c.collision==='die')continue;
      if(Math.abs(p.x)>190){p.x=clamp(p.x,-190,190);p.vx*=-1;}
      if(Math.abs(p.y)>115){p.y=clamp(p.y,-115,115);p.vy*=-1;}
      if(preview&&hit&&c.collision==='stick')p.stuck=true;
      this._particles.push(p);
    }
  }
  _step(dt){
    const c=this._config;this._time+=dt;this._angle+=c.angularVelocity*dt;
    this._velocity=this._velocity.map((v,i)=>(v+c.acceleration[i]*dt)*Math.exp(-c.damping*dt));
    this._motionPosition=this._motionPosition.map((n,i)=>n+this._velocity[i]*dt);
    for(let i=0;i<2;i++){
      const limit=i===0?190:115;
      if(Math.abs(this._motionPosition[i])>limit){this._motionPosition[i]=Math.sign(this._motionPosition[i])*limit;this._velocity[i]*=-1;}
    }
    if(this._enabled.has('motion.velocity')||this._enabled.has('motion.acceleration')||this._enabled.has('motion.damping_rate')){
      this._trail.push([...this._motionPosition]);if(this._trail.length>55)this._trail.shift();
    }
    if(!this._enabled.has('particles.burst_count')){
      this._emission+=c.birthRate*dt;const n=Math.floor(this._emission);this._emission-=n;this._spawn(n);
    }
    const survivors=[];
    for(const p of this._particles){
      p.age+=dt;if(p.age>=p.life)continue;
      if(!p.stuck){p.x+=p.vx*dt;p.y+=p.vy*dt;}
      let hit=false;
      if(Math.abs(p.x)>190){p.x=clamp(p.x,-190,190);p.vx*=-1;hit=true;}
      if(Math.abs(p.y)>115){p.y=clamp(p.y,-115,115);p.vy*=-1;hit=true;}
      if(hit&&c.collision==='die')continue;
      if(hit&&c.collision==='stick')p.stuck=true;
      survivors.push(p);
    }
    this._particles=survivors;
  }
  _project(p){
    if(!this._view)this._prepareProjection();
    const c=this._config,{forward,right,up,focal}=this._view,relative=p.map((n,i)=>n-c.camera[i]);
    const depth=dot(relative,forward);if(depth<=5)return null;
    const k=focal/depth;
    return {x:this._width/2+dot(relative,right)*k,y:this._height*0.46-dot(relative,up)*k,k,depth};
  }
  _prepareProjection(){
    const c=this._config,forward=normalize(c.cameraTarget.map((n,i)=>n-c.camera[i]));
    let right=normalize(cross(forward,[0,1,0]));if(Math.abs(dot(forward,[0,1,0]))>0.999)right=[1,0,0];
    const up=normalize(cross(right,forward));
    const focal=(this._height*0.5)/Math.tan(c.fov*Math.PI/360);
    this._view={forward,right,up,focal};
  }
  _transform(p){
    const c=this._config;
    let point=p.map((n,i)=>n*c.scale[i]);
    point=rotatePoint(point,0.26,[1,0,0]);point=rotatePoint(point,0.34,[0,1,0]);
    point=rotatePoint(point,c.orientation.angle,c.orientation.axis);
    point=rotatePoint(point,this._angle,[0,0,1]);
    return vectorAdd(vectorAdd(point,c.position),this._motionPosition);
  }
  _line(points,color,width=1,closed=false){
    const ctx=this.ctx;ctx.beginPath();let first=true;
    for(const point of points){const p=this._project(point);if(!p){first=true;continue;}if(first){ctx.moveTo(p.x,p.y);first=false;}else ctx.lineTo(p.x,p.y);}
    if(closed)ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  _draw(){
    if(this._destroyed)return;
    const ctx=this.ctx,c=this._config,w=this._width,h=this._height;
    this._prepareProjection();
    ctx.setTransform(this._dpr,0,0,this._dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#050608';ctx.fillRect(0,0,w,h);
    const rgb=hsv(c.hue,c.saturation,c.brightness);
    this._drawSpace(rgb);this._drawParticles(rgb);this._drawMotion(rgb);
    ctx.save();ctx.globalAlpha=c.opacity;
    if(this._enabled.has('color.blend_mode')){
      ctx.fillStyle='#444050';ctx.beginPath();ctx.ellipse(w/2-30,h*.46,78,69,0,0,TAU);ctx.fill();
      ctx.fillStyle='#376775';ctx.beginPath();ctx.ellipse(w/2+30,h*.46,78,69,0,0,TAU);ctx.fill();
    }
    ctx.globalCompositeOperation=({BLEND:'source-over',ADD:'lighter',MULTIPLY:'multiply',SCREEN:'screen'})[c.blend];
    if(c.showText)this._drawText(rgb);else this._drawShape(rgb);
    ctx.restore();
    if([...this._enabled].some(id=>id.startsWith('sound.')))this._drawSound(rgb);
  }
  _drawSpace(rgb){
    const ctx=this.ctx;
    ctx.save();ctx.globalAlpha=0.28;
    this._line([[-210,-125,0],[210,-125,0]],'#53606c',0.6);
    this._line([[-210,-125,-80],[-210,-125,80]],'#53606c',0.6);
    for(let x=-180;x<=180;x+=60)this._line([[x,-125,-65],[x,-125,65]],'#343a45',0.5);
    if([...this._enabled].some(id=>id.startsWith('space.'))){
      const origin=this._config.position;
      this._line([origin,vectorAdd(origin,[110,0,0])],rgba(rgb,.7),1);
      this._line([origin,vectorAdd(origin,[0,110,0])],'#708da4',1);
      this._line([origin,vectorAdd(origin,[0,0,110])],'#7c6f9b',1);
    }
    ctx.restore();
  }
  _drawShape(rgb){
    const ctx=this.ctx,c=this._config;
    const pulse=c.pulse?0.72+0.28*(1+Math.sin(TAU*c.frequency*this._time+c.phase))/2:1;
    const scaled=p=>this._transform(p.map(n=>n*pulse));
    if(c.shape==='rect'){
      // Rounded rectangle sampled in object coordinates, then projected.
      const a=c.extent[0]/2,b=c.extent[1]/2,r=c.corner,points=[];
      for(const [cx,cy,start] of [[a-r,b-r,0],[-a+r,b-r,Math.PI/2],[-a+r,-b+r,Math.PI],[a-r,-b+r,Math.PI*1.5]]){
        for(let j=0;j<=10;j++){const angle=start+j/10*Math.PI/2;points.push(scaled([cx+r*Math.cos(angle),cy+r*Math.sin(angle),0]));}
      }
      this._fillProjected(points,rgb);return;
    }
    if(c.shape==='polygon') {this._fillProjected(c.vertices.map(p=>scaled(p.map((n,i)=>n*c.extent[i]/200))),rgb);return;}
    const [nx,ny]=c.mesh,vertices=[],rings=[];
    for(let j=0;j<=ny;j++){
      const lat=-Math.PI/2+j/ny*Math.PI,ring=[];
      for(let i=0;i<=nx;i++){
        const lon=i/nx*TAU;
        const point=scaled([Math.cos(lat)*Math.cos(lon)*c.extent[0]/2,Math.sin(lat)*c.extent[1]/2,Math.cos(lat)*Math.sin(lon)*c.extent[2]/2]);
        ring.push(point);vertices.push(point);
      }
      rings.push(ring);
    }
    const projected=vertices.map(p=>this._project(p)).filter(Boolean);
    if(projected.length){
      const cx=projected.reduce((s,p)=>s+p.x,0)/projected.length,cy=projected.reduce((s,p)=>s+p.y,0)/projected.length;
      const radius=Math.max(...projected.map(p=>Math.hypot(p.x-cx,p.y-cy)));
      const glow=ctx.createRadialGradient(cx-radius*.23,cy-radius*.3,0,cx,cy,Math.max(1,radius));
      glow.addColorStop(0,rgba(rgb,.29));glow.addColorStop(.65,rgba(rgb,.1));glow.addColorStop(1,rgba(rgb,0));
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,Math.max(1,radius),0,TAU);ctx.fill();
      // A shaded convex silhouette supplies material volume beneath the mesh.
      // This is an illustrative shader, not a physical light-output binding.
      const hull=convexHull(projected),peak=Math.max(...rgb);
      const highlight=rgb.map(n=>Math.min(255,n*1.12+peak*.15));
      const shadow=rgb.map(n=>n*.14);
      const material=ctx.createRadialGradient(cx-radius*.38,cy-radius*.42,Math.max(1,radius*.04),cx+radius*.16,cy+radius*.18,Math.max(2,radius*1.18));
      material.addColorStop(0,rgba(highlight,.88));material.addColorStop(.36,rgba(rgb,.81));
      material.addColorStop(.78,rgba(rgb.map(n=>n*.52),.75));material.addColorStop(1,rgba(shadow,.88));
      ctx.beginPath();hull.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=material;ctx.fill();
    }
    let wireGradient=null;
    if(c.stops&&projected.length){
      const minX=Math.min(...projected.map(p=>p.x)),maxX=Math.max(...projected.map(p=>p.x));
      wireGradient=ctx.createLinearGradient(minX,0,Math.max(minX+1,maxX),0);
      for(const stop of c.stops)wireGradient.addColorStop(stop.at,rgba(stop.rgba.slice(0,3).map(n=>n*255),stop.rgba[3]));
    }
    for(const ring of rings)this._line(ring,wireGradient||rgba(rgb,.18),c.stroke);
    for(let i=0;i<=nx;i++)this._line(rings.map(row=>row[i]),wireGradient||rgba(rgb,.36),c.stroke);
  }
  _fillProjected(points,rgb){
    const ctx=this.ctx,ps=points.map(p=>this._project(p)).filter(Boolean);if(ps.length<2)return;
    ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
    let fill=rgba(rgb,.17);
    if(this._config.stops){
      const x0=Math.min(...ps.map(p=>p.x)),x1=Math.max(...ps.map(p=>p.x));fill=ctx.createLinearGradient(x0,0,Math.max(x0+1,x1),0);
      for(const stop of this._config.stops)fill.addColorStop(stop.at,rgba(stop.rgba.slice(0,3).map(n=>n*255),stop.rgba[3]));
    }
    ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=rgba(rgb,.95);ctx.lineWidth=this._config.stroke;ctx.stroke();
  }
  _drawParticles(rgb){
    const ctx=this.ctx,c=this._config;
    const particleMode=[...this._enabled].some(id=>id.startsWith('particles.'));
    if(particleMode){
      ctx.save();ctx.setLineDash([3,5]);this._line([[-190,-115,0],[190,-115,0],[190,115,0],[-190,115,0]],'#47515b',.7,true);ctx.restore();
    }
    for(const p of this._particles){
      const projected=this._project([p.x,p.y,p.z]);if(!projected)continue;
      const alpha=(1-p.age/p.life)*(particleMode?.75:.26);
      ctx.fillStyle=rgba(rgb,alpha);ctx.beginPath();ctx.arc(projected.x,projected.y,Math.max(.35,p.size*projected.k),0,TAU);ctx.fill();
    }
  }
  _drawMotion(rgb){
    const c=this._config,ctx=this.ctx;
    if(this._trail.length>1)this._line(this._trail.map(p=>vectorAdd(p,c.position)),rgba(rgb,.18),1);
    if(this._enabled.has('motion.velocity')||this._enabled.has('motion.acceleration')){
      const current=vectorAdd(c.position,this._motionPosition),v=this._enabled.has('motion.acceleration')?c.acceleration:this._velocity;
      this._line([current,vectorAdd(current,v.map(n=>n*.4))],rgba(rgb,.8),1.3);
    }
    if(this._enabled.has('motion.damping_rate')){
      ctx.save();ctx.setLineDash([2,4]);
      const points=Array.from({length:22},(_,i)=>{const t=i/21*1.6,f=c.damping>1e-5?(1-Math.exp(-c.damping*t))/c.damping:t;return vectorAdd(c.position,[140*f,35*f,0]);});
      this._line(points,rgba(rgb,.45),1);ctx.restore();
    }
    if(this._enabled.has('motion.frequency')||this._enabled.has('motion.phase')){
      // A one-second phase trace remains inspectable while animation is paused.
      const points=Array.from({length:100},(_,i)=>{const t=i/99;return [-160+t*320,-100+18*Math.sin(TAU*c.frequency*t+c.phase),0];});
      this._line(points,rgba(rgb,.5),1);
    }
    if(this._enabled.has('motion.angular_velocity')){
      const p=this._project(vectorAdd(c.position,this._motionPosition));
      if(p){ctx.save();ctx.strokeStyle=rgba(rgb,.6);ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,24,-Math.PI/2,-Math.PI/2+c.angularVelocity*.4,c.angularVelocity<0);ctx.stroke();ctx.restore();}
    }
  }
  _drawText(rgb){
    const c=this._config,ctx=this.ctx,p=this._project(vectorAdd(c.position,this._motionPosition));if(!p)return;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(this._angle+c.orientation.angle);
    ctx.scale(c.scale[0],c.scale[1]);
    const italic=c.style==='ITALIC'||c.style==='BOLDITALIC',bold=c.style==='BOLD'||c.style==='BOLDITALIC';
    ctx.font=`${italic?'italic ':''}${bold?'700':'400'} ${c.textSize}px sans-serif`;
    ctx.textAlign=({LEFT:'left',CENTER:'center',RIGHT:'right'})[c.alignment.horizontal];
    ctx.textBaseline=({TOP:'top',BOTTOM:'bottom',CENTER:'middle',BASELINE:'alphabetic'})[c.alignment.vertical];
    ctx.fillStyle=rgba(rgb,.95);
    if(c.stops){
      const gradient=ctx.createLinearGradient(-c.textSize*3,0,c.textSize*3,0);
      for(const stop of c.stops)gradient.addColorStop(stop.at,rgba(stop.rgba.slice(0,3).map(n=>n*255),stop.rgba[3]));
      ctx.fillStyle=gradient;
    }
    const lines=c.text.split('\n');lines.forEach((line,i)=>ctx.fillText(line,0,i*c.leading));
    ctx.fillStyle='#ccd0d6';ctx.beginPath();ctx.arc(0,0,2,0,TAU);ctx.fill();ctx.restore();
  }
  _drawSound(rgb){
    const ctx=this.ctx,c=this._config,w=this._width,h=this._height,top=h*.8,amplitude=Math.min(25,h*.12),x0=w*.1,x1=w*.9;
    const filterMode=this._enabled.has('sound.filter_frequency')||this._enabled.has('sound.filter_q');
    ctx.save();ctx.strokeStyle=rgba(rgb,.8);ctx.lineWidth=1.4;ctx.beginPath();
    const n=180,frequencies=new Float32Array(n),magnitudes=new Float32Array(n),phases=new Float32Array(n);
    for(let i=0;i<n;i++)frequencies[i]=logLerp(20,Math.min(18000,(this._audio?.context.sampleRate||48000)/2),i/(n-1));
    let exactResponse=false;
    if(filterMode&&this._audio){try{this._audio.filter.getFrequencyResponse(frequencies,magnitudes,phases);exactResponse=true;}catch{/* deterministic analog fallback below */}}
    for(let i=0;i<n;i++){
      const t=i/(n-1),x=lerp(x0,x1,t);let y;
      if(filterMode){
        const r=frequencies[i]/c.filterFrequency,analog=(r/c.q)/Math.sqrt((1-r*r)**2+(r/c.q)**2);
        const magnitude=exactResponse&&Number.isFinite(magnitudes[i])?magnitudes[i]:analog;
        y=top+amplitude-amplitude*2*clamp(magnitude);
      }else{
        const frequency=this._enabled.has('sound.playback_rate')?220*c.playbackRate:c.soundFrequency;
        const phase=t*frequency*.012*TAU-this._time*2;
        let wave=Math.sin(phase);
        if(c.waveform==='square')wave=wave>=0?1:-1;
        else if(c.waveform==='sawtooth')wave=2*((phase/TAU)%1+1)%2-1;
        else if(c.waveform==='triangle')wave=2/Math.PI*Math.asin(Math.sin(phase));
        y=top-wave*amplitude*c.soundGain;
      }
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.stroke();
    if(this._enabled.has('sound.pan')){ctx.fillStyle=rgba(rgb,.95);ctx.beginPath();ctx.arc(lerp(x0,x1,(c.pan+1)/2),top+amplitude+9,4,0,TAU);ctx.fill();}
    if(this._enabled.has('sound.delay_time')){
      ctx.strokeStyle=rgba(rgb,.28);ctx.beginPath();
      for(let i=0;i<n;i++){const t=i/(n-1),x=lerp(x0,x1,t),y=top+amplitude*2.5-Math.sin(t*TAU*3-this._time*2-c.delay*TAU*2.5)*amplitude*.4;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      ctx.stroke();
    }
    ctx.restore();
  }
  _createAudio(){
    // The only call site is setAudio(true): no context or sound is created implicitly.
    const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AudioContextClass)throw new Error('Web Audio unavailable');
    const context=new AudioContextClass();
    let graph=null;
    try{
      if(typeof context.createStereoPanner!=='function')throw new Error('StereoPannerNode unavailable');
      const oscillator=context.createOscillator(),oscGain=context.createGain(),bufferSource=context.createBufferSource(),bufferGain=context.createGain();
      const pulse=context.createGain(),lfo=context.createOscillator(),lfoDepth=context.createGain(),filter=context.createBiquadFilter(),panner=context.createStereoPanner();
      const delay=context.createDelay(2),dry=context.createGain(),wet=context.createGain(),gain=context.createGain(),ceiling=context.createGain();
      graph={context,oscillator,oscGain,bufferSource,bufferGain,pulse,lfo,lfoDepth,filter,panner,delay,dry,wet,gain,ceiling,nodes:[oscillator,oscGain,bufferSource,bufferGain,pulse,lfo,lfoDepth,filter,panner,delay,dry,wet,gain,ceiling]};
      const buffer=context.createBuffer(1,context.sampleRate,context.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++){const t=i/context.sampleRate,gate=Math.max(0,Math.sin(TAU*4*t));data[i]=(Math.sin(TAU*220*t)*.6+Math.sin(TAU*330*t)*.25+Math.sin(TAU*440*t)*.15)*gate;}
      bufferSource.buffer=buffer;bufferSource.loop=true;
      oscillator.connect(oscGain);bufferSource.connect(bufferGain);oscGain.connect(pulse);bufferGain.connect(pulse);
      pulse.gain.value=.5;lfo.frequency.value=2.5;lfoDepth.gain.value=.5;lfo.connect(lfoDepth);lfoDepth.connect(pulse.gain);
      pulse.connect(filter);filter.connect(panner);panner.connect(dry);panner.connect(delay);delay.connect(wet);dry.connect(gain);wet.connect(gain);gain.connect(ceiling);ceiling.connect(context.destination);
      ceiling.gain.value=0;gain.gain.value=0;
      this._audio=graph;this._rebuild(false);oscillator.start();bufferSource.start();lfo.start();
    }catch(error){
      for(const node of graph?.nodes||[]){try{node.stop?.();}catch{}try{node.disconnect();}catch{}}
      try{void context.close().catch(()=>{});}catch{}
      this._audio=null;throw error;
    }
  }
  _updateAudio(){
    const a=this._audio;if(!a||this._destroyed||a.context.state==='closed')return;
    const c=this._config,now=a.context.currentTime;
    const set=(p,v)=>{try{p.cancelScheduledValues(now);p.setTargetAtTime(v,now,.025);}catch{p.value=v;}};
    set(a.oscillator.frequency,c.soundFrequency);a.oscillator.type=c.waveform;
    const useBuffer=this._enabled.has('sound.playback_rate');
    set(a.oscGain.gain,useBuffer?(this._enabled.has('sound.frequency')?.25:0):1);set(a.bufferGain.gain,useBuffer?1:0);set(a.bufferSource.playbackRate,c.playbackRate);
    const filterMode=this._enabled.has('sound.filter_frequency')||this._enabled.has('sound.filter_q');
    a.filter.type=filterMode?'bandpass':'allpass';set(a.filter.frequency,c.filterFrequency);set(a.filter.Q,c.q);
    set(a.panner.pan,c.pan);set(a.gain.gain,c.soundGain);set(a.delay.delayTime,c.delay);
    const useDelay=this._enabled.has('sound.delay_time');set(a.dry.gain,useDelay?.65:1);set(a.wet.gain,useDelay?.45:0);
  }
  _queueAudioSync(){
    if(!this._audio||this._destroyed)return Promise.resolve();
    // Mute synchronously before queued suspend: an old pending resume cannot leak sound.
    if(!this._audioWanted||!this._effectiveAudio())this._audio.ceiling.gain.value=0;
    this._audioQueue=this._audioQueue.then(async()=>{
      const a=this._audio;if(!a||this._destroyed||a.context.state==='closed')return;
      const command=this._audioCommand;
      const shouldRun=this._audioWanted&&this._effectiveAudio();
      try{
        if(shouldRun&&a.context.state!=='running')await a.context.resume();
        else if(!shouldRun&&a.context.state==='running')await a.context.suspend();
      }catch(error){if(!this._destroyed&&command===this._audioCommand){this._audioError=String(error?.message||error);this._audioWanted=false;}}
      if(this._destroyed){try{if(a.context.state!=='closed')await a.context.close();}catch{}return;}
      const audible=this._audioWanted&&this._effectiveAudio()&&a.context.state==='running';
      a.ceiling.gain.value=audible?.055:0;
      this._emit();
    }).catch(error=>{if(!this._destroyed){this._audioError=String(error?.message||error);this._audioWanted=false;this._emit();}});
    return this._audioQueue;
  }
  _demoRange(id){
    if(!SUPPORTED.includes(id))return null;
    if(id==='particles.lifetime_variance')return {kind:'demo_domain',min:0,max:scalar(Math.min(15,Math.max(0,this._config.life-.01)))};
    const lo=resolve(id,0,this._audio?.context.sampleRate||48000),hi=resolve(id,1,this._audio?.context.sampleRate||48000);
    if(typeof lo==='number'&&typeof hi==='number')return {kind:'demo_domain',min:Math.min(lo,hi),max:Math.max(lo,hi)};
    if(Array.isArray(lo)&&lo.every(x=>typeof x==='number'))return {kind:'coupled_normalized_path',at0:lo,at1:hi};
    if(META[id].catalogRange.values)return {kind:'demo_discrete_values',values:[...META[id].catalogRange.values]};
    return {kind:'generated_demo_sample',note:NOTES[id]||'Scalar maps to a structured demo value.'};
  }
  getState(){
    const entry=this._entries().find(row=>row.parameterId===this._active.parameterId)||this._active;
    const id=this._active.parameterId,supported=SUPPORTED.includes(id),metadata=META[id];
    const primitiveKinds={'geometry.corner_radius':'rect','geometry.vertices':'polygon','geometry.mesh_detail':'sphere'};
    const connections=this._entries().map(row=>{
      const requiredShape=primitiveKinds[row.parameterId],supported=SUPPORTED.includes(row.parameterId);
      const hiddenByText=this._config.showText&&['geometry.extent','geometry.stroke_width',...Object.keys(primitiveKinds)].includes(row.parameterId);
      const applied=supported&&!hiddenByText&&(!requiredShape||requiredShape===this._config.shape);
      return {parameterId:row.parameterId,normalized:row.normalized,supported,applied,actualValue:copy(this._resolved?.get(row.parameterId)??null),unit:META[row.parameterId].unit,demoRange:this._demoRange(row.parameterId),modelNote:NOTES[row.parameterId]||(!supported?'Выходы света и тактильности требуют отдельного адаптера; здесь они только в каталоге.':'Canvas 2D demo backend; unit/range are not a physical calibration.')};
    });
    const shapeSelectors=connections.filter(row=>['geometry.corner_radius','geometry.vertices','geometry.mesh_detail'].includes(row.parameterId));
    const parameterValues=Object.fromEntries(connections.map(row=>[row.parameterId,{normalized:row.normalized,value:copy(row.actualValue),actualValue:copy(row.actualValue),unit:row.unit,demoRange:copy(row.demoRange),supported:row.supported,applied:row.applied,modelNote:row.modelNote}]));
    const audioGraphActive=Boolean(this._audioWanted&&this._effectiveAudio()&&this._audio?.context.state==='running');
    const audioOutputEnabled=Boolean(audioGraphActive&&this._config.soundGain>0&&this._audio.ceiling.gain.value>0);
    return {
      parameterId:id,normalized:entry.normalized,value:copy(this._resolved?.get(id)??null),actualValue:copy(this._resolved?.get(id)??null),
      unit:metadata.unit,valueType:metadata.type,catalogRange:copy(metadata.catalogRange),demoRange:this._demoRange(id),valueRole:'control_setpoint',
      supported,applied:connections.find(row=>row.parameterId===id)?.applied||false,mode:supported?'demonstrated':'catalog-only',modelNote:NOTES[id]||(supported?'Canvas 2D demo backend.':'Выходы света и тактильности требуют отдельного адаптера; здесь они только в каталоге.'),
      playing:this._playing,effectivePlaying:this._effectivePlaying(),reducedMotion:this._reducedMotion,hidden:this._hidden,destroyed:this._destroyed,
      audioEnabled:this._audioWanted,audioAvailable:Boolean(globalThis.AudioContext||globalThis.webkitAudioContext),audioState:this._audio?.context.state||'off',audioGraphActive,audioOutputEnabled,audioAudible:audioOutputEnabled,audioError:this._audioError,
      audioModel:'Locally synthesized oscillator / generated looping buffer; master ceiling 0.055. audioAudible is a legacy internal-gate estimate: device volume/audibility is unobserved. No microphone or downloaded media.',
      viewport:{width:this._width,height:this._height,dpr:this._dpr},connections,parameters:parameterValues,
      connectionValues:Object.fromEntries(connections.map(row=>[row.parameterId,copy(row.actualValue)])),
      mixing:{mode:this._batchMode?'authoritative-batch':'active-slot',duplicateParameter:'last setting wins',primitiveSelection:'last primitive-specific setting wins',emptyBatch:'baseline only'},
      preview:{backend:'Canvas2D software projection; optional WebAudio',shape:this._config?.shape,particleCount:this._particles.length,particleLimit:MAX_PARTICLES,motionPosition:copy(this._motionPosition),motionVelocity:copy(this._velocity),effectiveLifetimeVariance:this._config?.variance},
      limitations:[
        'Скалярный preview использует явно заданные траектории для векторов и выборки для массивов/строк; это не полноценный редактор всех компонентов.',
        'Выходы света и тактильности требуют отдельного адаптера; здесь они только в каталоге.',
        ...(shapeSelectors.length>1?['Несколько primitive-specific параметров: последняя настройка выбирает rect/polygon/sphere; несовместимые формы не смешиваются.']:[]),
        ...(this._config.showText&&connections.some(row=>row.supported&&!row.applied)?['Текстовый режим заменяет примитив формы; скрытые свойства геометрии имеют applied:false.']:[]),
        ...(this._reducedMotion?['prefers-reduced-motion: анимация приостановлена; звук доступен после ручного включения.']:[])
      ]
    };
  }
  _emit(){if(!this._destroyed&&this._onState){try{this._onState(this.getState());}catch(error){globalThis.console?.error?.('ExpressionEngine onState callback failed',error);}}}
  destroy(){
    if(this._destroyed)return;this._destroyed=true;this._playing=false;this._audioWanted=false;
    if(this._raf!==null)cancelAnimationFrame(this._raf);this._raf=null;
    if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this._onVisibility);
    if(typeof window!=='undefined')window.removeEventListener('resize',this._onResize);
    if(this._motionQuery?.removeEventListener)this._motionQuery.removeEventListener('change',this._onReducedMotion);
    else this._motionQuery?.removeListener?.(this._onReducedMotion);
    this._observer?.disconnect();
    for(const node of this._audio?.nodes||[]){try{node.stop?.();}catch{}try{node.disconnect();}catch{}}
    if(this._audio){try{void this._audio.context.close().catch(()=>{});}catch{}}
    this._particles=[];this._trail=[];this._onState=null;
  }
}
