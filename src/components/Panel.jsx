import { useRef } from 'react'
import { CATEGORIES, DONENESS, currentOption, isToast, fmtTime } from '../machine.js'
import { ProbeButtonSvg, FunctionButtonSvg, PresetButtonSvg } from './ButtonSvgs.jsx'

import panelTexture from '../assets/panel/panel-texture.png'
import smartProbeImg from '../assets/panel/smart-probe.png'
import powerIcon from '../assets/panel/power-icon.svg'
import tempIcon from '../assets/panel/temp-icon.svg'
import timeIcon from '../assets/panel/time-icon.svg'
import startStopIcon from '../assets/panel/startstop-icon.svg'
import functionPresetPill from '../assets/panel/function-preset-pill.svg'
import dialImg from '../assets/panel/dial.png'
import rackLevelImg from '../assets/panel/rack-level.png'
import dualLevelImg from '../assets/panel/dual-level.png'
import lightImg from '../assets/panel/light.png'

// All coordinates below are px, absolute within the panel's fixed
// 1131.02 x 126.51 canvas — pulled directly from the cleaned-up Figma file
// (frames: PROBE, FUNCTION PRESET, TEMP SECTION, CENTER FRAME, TIME SECTION,
// etc., all already local to that canvas).
const box = (left, top, width, height) => ({ position: 'absolute', left, top, width, height })

const ORANGE = '#F26522'
const GRAY_IND = '#9E9D9E'

const PROBE_HIT = [103, 28, 82, 74]
const PROBE_BUTTON = [104.79, 47.49, 78.41, 34.02]
const PROBE_WORDS = [
  { word: 'Beef', b: [103, 28, 19, 11] },
  { word: 'Poultry', b: [130, 28, 29, 11] },
  { word: 'Fish', b: [167, 28, 17, 11] },
  { word: 'Pork', b: [115.5, 90, 19, 11] },
  { word: 'Lamb', b: [149.5, 91, 23, 11] },
]

const FUNCTION_PRESET_HIT_TOP = [194, 15, 175, 24]
const FUNCTION_PRESET_HIT_BOTTOM = [194, 91, 175, 24]
const FUNCTION_HIT = [199.545, 47.99, 81.95, 34.02]
const PRESET_HIT = [281.5, 47.99, 81.95, 34.02]
const FUNCTION_PRESET_PILL = [199.545, 47.99, 163.91, 34.02]
const FUNCTION_BUTTON = [224.645, 59.86, 33.89, 14.06]
const PRESET_BUTTON = [306.645, 59.87, 30.08, 14.05]

const FUNCTION_WORDS = [
  { word: 'Air Fry', b: [194, 15, 43, 11] },
  { word: 'Bagel', b: [238, 15, 43, 11] },
  { word: 'Toast', b: [282, 15, 43, 11] },
  { word: 'Bake', b: [326, 15, 43, 11] },
  { word: 'Broil', b: [194, 104, 43, 11] },
  { word: 'Slow Cook', b: [238, 104, 43, 11] },
  { word: 'Warm', b: [282, 104, 43, 11] },
  { word: 'Dehydrate', b: [326, 104, 43, 11] },
]
const PRESET_WORDS = [
  { word: 'Pizza', b: [194, 28, 43, 11] },
  { word: 'Fries', b: [238, 28, 43, 11] },
  { word: 'Veggies', b: [282, 28, 43, 11] },
  { word: 'Snacks', b: [326, 28, 43, 11] },
  { word: 'Nuggets', b: [194, 91, 43, 11] },
  { word: 'Wings', b: [238, 91, 43, 11] },
  { word: 'Cookies', b: [282, 91, 43, 11] },
]

const TEMP_ICON_BOX = [385.74, 42.49, 42.52, 42.52]
const TEMP_LABEL_STATIC = [386, 28, 42, 7]
const TEMP_CAPTION = [393.86, 92.5, 26.28, 22.5]

const TIME_ICON_BOX = [703.74, 42, 42.52, 42.52]
const TIME_CAPTION = [711.86, 92.5, 26.28, 22.5]

const DONENESS_PILL = [451, 25.53, 45.19, 11.07]
const DONENESS_WORD = {
  medium: [499.86, 26, 32, 11],
  rare: [532.86, 26, 19, 11],
  well: [552.86, 26, 17, 11],
}
const DUAL_LEVEL_TEXT = [637.86, 26, 41, 11]
const DISPLAY3 = [452, 42, 90, 33]
const DISPLAY4 = [568, 42, 125, 33]
const CAPTION_SLICES = [451, 89, 24, 11]
const CAPTION_TARGET_TEMP = [480, 89, 49, 11]
const CAPTION_CURRENT_TEMP = [595, 89, 54, 11]
const CAPTION_SHADE = [654, 89, 26, 11]

const POWER_ICON_BOX = [41.32, 41.63, 42.52, 42.52]
const POWER_CAPTION = [50.08, 91.08, 25, 11]
const START_STOP_BOX = [1045.74, 42, 42.52, 42.52]
const START_STOP_CAPTION = [1044, 94, 46, 11]

const DIAL_BOX = [869.82, 13.32, 100.82, 100.82]
const SMART_PROBE_BOX = [54.08, 10.59, 124.24, 18.37]
const RACK_LEVEL_BOX = [764, 35, 33, 80]
const DUAL_LEVEL_BOX = [816, 48, 37, 67]
const LIGHT_BOX = [990, 47, 37, 58]

function OptionWord({ word, b, active, color, on }) {
  return (
    <span
      className="tc-opt-word"
      style={{ ...box(...b), color, opacity: on ? (active ? 1 : 0.5) : 0 }}
    >
      {word}
    </span>
  )
}

export default function Panel({ S, C, send }) {
  const wheelAccum = useRef(0)

  const handleWheel = (e) => {
    if (S !== 'idle' || !C.focus) return
    e.preventDefault()
    wheelAccum.current += e.deltaY
    const threshold = 40
    while (Math.abs(wheelAccum.current) >= threshold) {
      send('DIAL', wheelAccum.current > 0 ? 1 : -1)
      wheelAccum.current += wheelAccum.current > 0 ? -threshold : threshold
    }
  }

  const on = S !== 'off'
  const idle = S === 'idle'
  const opt = currentOption(C)
  const toast = isToast(C)

  const indicatorColor = (cat) => (on && C.mode === cat) ? ORANGE : GRAY_IND
  const indicatorBlink = (cat) => on && C.mode === cat && C.focus === 'mode'

  let value1Label = 'Temp'
  if (C.mode === 'probe') value1Label = 'Doneness'
  else if (toast) value1Label = 'Slices'

  let disp3 = ''
  if (C.mode === 'probe') disp3 = String(DONENESS[C.doneness].temp)
  else if (toast) disp3 = String(C.slices)
  else if (C.mode) disp3 = String(C.temp)

  let disp4 = ''
  if (C.mode === 'probe') disp4 = String(Math.round(C.currentTemp))
  else if (toast) disp4 = String(C.shade)
  else if (C.mode) disp4 = fmtTime(C.time)

  const dw = C.mode === 'probe' ? DONENESS[C.doneness].words : { medium: false, rare: false, well: false }
  const blinkField = (field) => on && C.focus === field ? ' tc-blink' : ''

  return (
    <div className="panelwrap">
      <div className="panel" onWheel={handleWheel}>
        {/* ---- static chrome background ---- */}
        <div className="panel-shell">
          <img className="panel-texture" src={panelTexture} alt="" draggable={false} />
        </div>

        <img className="tc-static" style={box(...SMART_PROBE_BOX)} src={smartProbeImg} alt="" draggable={false} />
        <img className="tc-static" style={{ ...box(...RACK_LEVEL_BOX), opacity: on ? 1 : 0 }} src={rackLevelImg} alt="" draggable={false} />
        <img className="tc-static" style={box(...DUAL_LEVEL_BOX)} src={dualLevelImg} alt="" draggable={false} />
        <img className="tc-static tc-hit" style={box(...LIGHT_BOX)} src={lightImg} alt="" draggable={false} onClick={() => send('LIGHT_TOGGLE')} />
        <img className="tc-static tc-hit" style={{ ...box(...DIAL_BOX), borderRadius: '50%' }} src={dialImg} alt="" draggable={false} onClick={() => idle && C.focus && send('DIAL_CLICK')} />

        {/* ---- power ---- */}
        <img className="tc-static tc-hit" style={box(...POWER_ICON_BOX)} src={powerIcon} alt="" draggable={false} onClick={() => send('POWER')} />
        <span className="tc-caption" style={box(...POWER_CAPTION)}>Power</span>

        {/* ---- probe ---- */}
        <div className="tc-hit" style={box(...PROBE_HIT)} onClick={() => idle && send('PRESS_CATEGORY', 'probe')} />
        {PROBE_WORDS.map(({ word, b }, i) => (
          <OptionWord key={word} word={word} b={b} on={on} color={ORANGE}
            active={C.mode === 'probe' && C.optionIndex === i} />
        ))}
        <div style={box(...PROBE_BUTTON)}>
          <ProbeButtonSvg indicatorColor={indicatorColor('probe')} blink={indicatorBlink('probe')} />
        </div>

        {/* ---- function / presets ---- */}
        <div className="tc-hit" style={box(...FUNCTION_PRESET_HIT_TOP)} />
        <div className="tc-hit" style={box(...FUNCTION_HIT)} onClick={() => idle && send('PRESS_CATEGORY', 'function')} />
        <div className="tc-hit" style={box(...PRESET_HIT)} onClick={() => idle && send('PRESS_CATEGORY', 'preset')} />
        {FUNCTION_WORDS.map(({ word, b }, i) => (
          <OptionWord key={word} word={word} b={b} on={on} color="#fff"
            active={C.mode === 'function' && C.optionIndex === i} />
        ))}
        {PRESET_WORDS.map(({ word, b }, i) => (
          <OptionWord key={word} word={word} b={b} on={on} color="#fff"
            active={C.mode === 'preset' && C.optionIndex === i} />
        ))}
        <img className="tc-static" style={box(...FUNCTION_PRESET_PILL)} src={functionPresetPill} alt="" draggable={false} />
        <div style={box(...FUNCTION_BUTTON)}>
          <FunctionButtonSvg indicatorColor={indicatorColor('function')} blink={indicatorBlink('function')} />
        </div>
        <div style={box(...PRESET_BUTTON)}>
          <PresetButtonSvg indicatorColor={indicatorColor('preset')} blink={indicatorBlink('preset')} />
        </div>

        {/* ---- temp / slices / doneness ---- */}
        <span className="tc-caption" style={box(...TEMP_LABEL_STATIC)}>Doneness</span>
        <img className="tc-static tc-hit" style={box(...TEMP_ICON_BOX)} src={tempIcon} alt="" draggable={false}
          onClick={() => idle && C.mode && send('PRESS_VALUE1')} />
        <div className="tc-caption tc-caption-2l" style={box(...TEMP_CAPTION)}><span>Temp</span><i /><span>Slices</span></div>

        {/* ---- time / shade ---- */}
        <img className={'tc-static tc-hit' + (C.mode === 'probe' ? ' tc-disabled' : '')} style={box(...TIME_ICON_BOX)} src={timeIcon} alt="" draggable={false}
          onClick={() => idle && C.mode && C.mode !== 'probe' && send('PRESS_VALUE2')} />
        <div className="tc-caption tc-caption-2l" style={box(...TIME_CAPTION)}><span>Time</span><i /><span>Shade</span></div>

        {/* ---- start / stop ---- */}
        <img className="tc-static tc-hit" style={box(...START_STOP_BOX)} src={startStopIcon} alt="" draggable={false}
          onClick={() => send(S === 'running' ? 'STOP' : 'START')} />
        <span className="tc-caption" style={box(...START_STOP_CAPTION)}>Start - Stop</span>

        {/* ---- doneness readout + display captions (backlit) ---- */}
        <div className="tc-glow" style={{ ...box(...DONENESS_PILL), opacity: on ? 1 : 0 }}>
          <span className="tc-doneness-pill">Doneness</span>
        </div>
        <span className="tc-glow tc-word" style={{ ...box(...DONENESS_WORD.medium), opacity: on ? (dw.medium ? 1 : 0.5) : 0 }}>Medium</span>
        <span className="tc-glow tc-word" style={{ ...box(...DONENESS_WORD.rare), opacity: on ? (dw.rare ? 1 : 0.5) : 0 }}>Rare</span>
        <span className="tc-glow tc-word" style={{ ...box(...DONENESS_WORD.well), opacity: on ? (dw.well ? 1 : 0.5) : 0 }}>Well</span>
        <span className="tc-glow tc-orange-caption" style={{ ...box(...DUAL_LEVEL_TEXT), opacity: on ? 1 : 0 }}>Dual Level</span>

        <span className="tc-glow tc-white-caption" style={{ ...box(...CAPTION_SLICES), opacity: on ? 1 : 0 }}>Slices</span>
        <span className="tc-glow tc-white-caption" style={{ ...box(...CAPTION_TARGET_TEMP), opacity: on ? 1 : 0 }}>Target Temp</span>
        <span className="tc-glow tc-white-caption" style={{ ...box(...CAPTION_CURRENT_TEMP), opacity: on ? 1 : 0 }}>Current Temp</span>
        <span className="tc-glow tc-white-caption" style={{ ...box(...CAPTION_SHADE), opacity: on ? 1 : 0 }}>Shade</span>

        {/* ---- digit displays (backlit) ---- */}
        <div className={'tc-glow tc-disp' + blinkField('value1')} style={{ ...box(...DISPLAY3), opacity: on && C.mode ? 1 : 0 }}>{disp3}</div>
        <div className={'tc-glow tc-disp' + (C.mode !== 'probe' ? blinkField('value2') : '')} style={{ ...box(...DISPLAY4), opacity: on && C.mode ? 1 : 0 }}>{disp4}</div>
      </div>

      {/* ---- live readout — trustworthy summary while the on-panel wiring settles ---- */}
      {on && (
        <div className="tc-readout">
          {C.mode ? `${CATEGORIES[C.mode].label.toUpperCase()} → ${opt}${C.focus === 'mode' ? ' (selecting…)' : ''}` : 'Choose Probe / Function / Presets'}
          {C.mode && C.modeConfirmed && `  ·  ${value1Label}${C.focus === 'value1' ? ' (adjusting…)' : ''}`}
          {C.mode && C.mode !== 'probe' && C.modeConfirmed && `  ·  Time/Shade${C.focus === 'value2' ? ' (adjusting…)' : ''}`}
        </div>
      )}
    </div>
  )
}
