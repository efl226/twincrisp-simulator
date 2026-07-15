import { useRef } from 'react'
import { CATEGORIES, DONENESS, RACK_LEVEL, RACK_LEVEL_PAIR, OPTION_DATA, TOAST_SLICE_BANDS, midCookAllowed, currentOption, isToast, fmtTime } from '../machine.js'
import { ProbeButtonSvg, FunctionButtonSvg, PresetButtonSvg, RackLevelSvg } from './ButtonSvgs.jsx'

import panelTexture from '../assets/panel/panel-texture.png'
import smartProbeImg from '../assets/panel/smart-probe.svg'
import powerIcon from '../assets/panel/power-icon.svg'
import tempIcon from '../assets/panel/temp-icon.svg'
import timeIcon from '../assets/panel/time-icon.svg'
import startStopIcon from '../assets/panel/startstop-icon.svg'
import functionPresetPill from '../assets/panel/function-preset-pill.svg'
import dialImg from '../assets/panel/dial.svg'
import dualLevelIcon from '../assets/panel/dual-level-icon.svg'
import lightIcon from '../assets/panel/light-icon.svg'

// All coordinates below are px, absolute within the panel's fixed
// 1131.02 x 126.51 canvas — pulled directly from the current Figma layout
// (FIGMA VERSION > UI CONTENTS tree). Re-derive from Figma metadata if the
// layout moves again rather than eyeballing.
const box = (left, top, width, height) => ({ position: 'absolute', left, top, width, height })

const ORANGE = '#F26522'
const GRAY_IND = '#9E9D9E'

const POWER_ICON_BOX = [41.56, 42.56, 42.52, 42.52]
const POWER_CAPTION = [50.32, 89.82, 25, 11]

const PROBE_BUTTON = [106.3, 47, 78.41, 34.02]
const PROBE_WORDS = [
  { word: 'Beef', b: [101, 27, 19, 11] },
  { word: 'Poultry', b: [128, 27, 29, 11] },
  { word: 'Fish', b: [165, 27, 17, 11] },
  { word: 'Pork', b: [101, 90, 19, 11] },
  { word: 'Lamb', b: [126, 90, 29, 11] },
  { word: 'Manual', b: [161, 90, 29, 11] },
]

const FUNCTION_PRESET_PILL = [195.87, 46.81, 163.91, 34.02]
const FUNCTION_BUTTON = [220.97, 58.68, 33.89, 14.06]
const PRESET_BUTTON = [302.97, 58.69, 30.08, 14.05]

const FUNCTION_WORDS = [
  { word: 'Air Fry', b: [190.32, 13.82, 43, 11] },
  { word: 'Bagel', b: [234.32, 13.82, 43, 11] },
  { word: 'Toast', b: [278.32, 13.82, 43, 11] },
  { word: 'Bake', b: [322.32, 13.82, 43, 11] },
  { word: 'Broil', b: [190.32, 102.82, 43, 11] },
  { word: 'Slow Cook', b: [234.32, 102.82, 43, 11] },
  { word: 'Warm', b: [278.32, 102.82, 43, 11] },
  { word: 'Dehydrate', b: [322.32, 102.82, 43, 11] },
]
const PRESET_WORDS = [
  { word: 'Pizza', b: [190.32, 26.82, 43, 11] },
  { word: 'Fries', b: [234.32, 26.82, 43, 11] },
  { word: 'Veggies', b: [278.32, 26.82, 43, 11] },
  { word: 'Snacks', b: [322.32, 26.82, 43, 11] },
  { word: 'Nuggets', b: [190.32, 89.82, 43, 11] },
  { word: 'Wings', b: [234.32, 89.82, 43, 11] },
  { word: 'Cookies', b: [278.32, 89.82, 43, 11] },
]

const RACK_LEVEL_DUAL_LABEL = [385.32, 26, 33, 11]
const RACK_LEVEL_LED = [385.32, 38.19, 33, 51.26]
const RACK_LEVEL_CAPTION = [385.32, 95.32, 33, 22]

const DUAL_LEVEL_ICON = [441.59, 50.09, 31.18, 31.18]
const DUAL_LEVEL_CAPTION = [438.68, 95.68, 37, 22]

const TEMP_ICON_BOX = [495.42, 44.42, 42.52, 42.52]
const TEMP_LABEL_STATIC = [495.68, 30, 42, 11]
const TEMP_CAPTION = [503.54, 95.18, 26.28, 22.5]

// Doneness ladder sits directly above the 3-digit display, tight gap —
// was floating up near the panel top with a big dead gap before either
// the digits or the temp icon.
const DONENESS_WORDS = [
  { word: 'Rare', b: [552, 13, 19, 11] },
  { word: 'Med-Rare', b: [576, 13, 39, 11] },
  { word: 'Med', b: [620, 13, 18, 11] },
  { word: 'Med-Well', b: [552, 24, 37, 11] },
  { word: 'Well', b: [594, 24, 17, 11] },
]
// Widened for the 34px digit font (was sized for the old 26px font, which
// is why the digits were overflowing into the doneness row above and the
// Time icon to the right), and DISPLAY4 pulled left off the Time icon.
const DISPLAY3 = [548, 43, 96, 35]
const DISPLAY4 = [665, 43, 105, 35]
// Combined span of DISPLAY3+DISPLAY4 — used for the brief "HI" greeting on power-on.
const GREETING_BOX = [548, 43, 222, 35]
const CAPTION_SLICES = [557.68, 82.68, 24, 11]
const CAPTION_TARGET_TEMP = [586.68, 82.68, 49, 11]
const CAPTION_CURRENT_TEMP = [691.68, 82.68, 54, 11]
const CAPTION_SHADE = [750.68, 82.68, 26, 11]

const TIME_ICON_BOX = [800.74, 42.24, 42.52, 42.52]
const TIME_CAPTION = [808.86, 91, 26.28, 22.5]

// "Frame 26" (Dial/Light/Start-Stop) reports its own position without the
// +41,+1 offset every other frame gets from its UI CONTENTS parent, even
// though visually it lines up as if it had one too — pixel-measured
// against the reference render to confirm. Applied by hand below.
const DIAL_BOX = [872, 13.09, 108, 108]
const SMART_PROBE_BOX = [54.08, 10.59, 124.24, 18.37]

const LIGHT_ICON = [997.42, 47.6, 31.8, 31.8]
const LIGHT_CAPTION = [994.82, 93, 37, 11]
const START_STOP_BOX = [1045.56, 42.24, 42.52, 42.52]
const START_STOP_CAPTION = [1043.82, 93, 46, 11]

function OptionWord({ word, b, active, shown, color, on }) {
  return (
    <span
      className="tc-opt-word"
      style={{ ...box(...b), color, opacity: on && shown ? (active ? 1 : 0.5) : 0 }}
    >
      {word}
    </span>
  )
}

export default function Panel({ S, C, send }) {
  const wheelAccum = useRef(0)

  const handleWheel = (e) => {
    if ((S !== 'idle' && S !== 'running') || !C.focus) return
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
  const running = S === 'running'
  const canPress = idle || running
  const opt = currentOption(C)
  const toast = isToast(C)
  const probeMode = C.mode === 'probe'
  const rackLevel = opt ? RACK_LEVEL[opt] : null
  const dualPairLevel = C.dualLevel && rackLevel ? RACK_LEVEL_PAIR[rackLevel] : null
  const activeRackLevels = [rackLevel, dualPairLevel].filter(Boolean)

  // Orange indicator is Probe-only; Function/Presets flash white.
  const indicatorColor = (cat) => (on && C.mode === cat) ? (cat === 'probe' ? ORANGE : '#fff') : GRAY_IND
  const indicatorBlink = (cat) => on && C.mode === cat && C.focus === 'mode'

  let value1Label = 'Temp'
  if (C.mode === 'probe') value1Label = 'Doneness'
  else if (toast) value1Label = 'Slices'

  // Before the option is confirmed, preview the phony default for whatever's
  // currently highlighted (matches how doneness/rack-level already behave)
  // instead of showing a stale/blank value until confirm.
  let disp3 = ''
  if (C.mode === 'probe') disp3 = String(DONENESS[C.doneness].temp)
  else if (toast) disp3 = TOAST_SLICE_BANDS[C.slices]
  else if (C.mode) disp3 = String(C.modeConfirmed ? C.temp : (OPTION_DATA[opt]?.temp ?? C.temp))
  else if (C.manual) disp3 = String(C.temp)

  let disp4 = ''
  if (C.mode === 'probe') disp4 = String(Math.round(C.currentTemp))
  else if (toast) disp4 = String(C.shade)
  else if (C.mode) disp4 = fmtTime(C.modeConfirmed ? C.time : (OPTION_DATA[opt]?.time ?? C.time))
  else if (C.manual) disp4 = fmtTime(C.time)

  const blinkField = (field) => on && C.focus === field ? ' tc-blink' : ''
  // While Running, Temp/Time (or Slices) may be locked per the option's
  // spec — dim the icon so it visually reads as unavailable right now.
  const midCookOK = (field) => midCookAllowed(S, C, field)

  return (
    <div className="panelwrap">
      <div className="panel" onWheel={handleWheel}>
        {/* ---- static chrome background ---- */}
        <div className="panel-shell">
          <img className="panel-texture" src={panelTexture} alt="" draggable={false} />
        </div>

        <img className="tc-static" style={box(...SMART_PROBE_BOX)} src={smartProbeImg} alt="" draggable={false} />
        {/* "Dual" only shows once Dual Level is actually toggled on */}
        <span className="tc-glow tc-word" style={{ ...box(...RACK_LEVEL_DUAL_LABEL), opacity: on && C.dualLevel ? 1 : 0 }}>Dual</span>
        <div style={box(...RACK_LEVEL_LED)}>
          <RackLevelSvg activeLevels={activeRackLevels} on={on} />
        </div>
        <span className="tc-caption" style={box(...RACK_LEVEL_CAPTION)}>Rack<br />Level</span>
        <img className="tc-static tc-hit" style={box(...DUAL_LEVEL_ICON)} src={dualLevelIcon} alt="" draggable={false}
          onClick={() => idle && C.mode && send('DUAL_LEVEL_TOGGLE')} />
        <span className="tc-caption" style={box(...DUAL_LEVEL_CAPTION)}>Dual<br />Level</span>
        <img className="tc-static tc-hit" style={{ ...box(...DIAL_BOX), borderRadius: '50%' }} src={dialImg} alt="" draggable={false} onClick={() => canPress && C.focus && send('DIAL_CLICK')} />

        {/* ---- power ---- */}
        <img className="tc-static tc-hit" style={box(...POWER_ICON_BOX)} src={powerIcon} alt="" draggable={false} onClick={() => send('POWER')} />
        <span className="tc-caption" style={box(...POWER_CAPTION)}>Power</span>

        {/* ---- probe ---- */}
        {PROBE_WORDS.map(({ word, b }, i) => (
          <OptionWord key={word} word={word} b={b} on={on} color={ORANGE}
            shown={probeMode} active={C.optionIndex === i} />
        ))}
        <div className="tc-hit" style={box(...PROBE_BUTTON)} onClick={() => idle && send('PRESS_CATEGORY', 'probe')}>
          <ProbeButtonSvg indicatorColor={indicatorColor('probe')} blink={indicatorBlink('probe')} />
        </div>

        {/* ---- function / presets ---- */}
        {FUNCTION_WORDS.map(({ word, b }, i) => (
          <OptionWord key={word} word={word} b={b} on={on} color="#fff"
            shown={C.mode === 'function'} active={C.optionIndex === i} />
        ))}
        {PRESET_WORDS.map(({ word, b }, i) => (
          <OptionWord key={word} word={word} b={b} on={on} color="#fff"
            shown={C.mode === 'preset'} active={C.optionIndex === i} />
        ))}
        <img className="tc-static" style={box(...FUNCTION_PRESET_PILL)} src={functionPresetPill} alt="" draggable={false} />
        <div className="tc-hit" style={box(...FUNCTION_BUTTON)} onClick={() => idle && send('PRESS_CATEGORY', 'function')}>
          <FunctionButtonSvg indicatorColor={indicatorColor('function')} blink={indicatorBlink('function')} />
        </div>
        <div className="tc-hit" style={box(...PRESET_BUTTON)} onClick={() => idle && send('PRESS_CATEGORY', 'preset')}>
          <PresetButtonSvg indicatorColor={indicatorColor('preset')} blink={indicatorBlink('preset')} />
        </div>

        {/* ---- temp / slices / doneness ---- */}
        <span className="tc-caption" style={box(...TEMP_LABEL_STATIC)}>Doneness</span>
        <img className={'tc-static tc-hit' + (running && !midCookOK('value1') ? ' tc-disabled' : '')} style={box(...TEMP_ICON_BOX)} src={tempIcon} alt="" draggable={false}
          onClick={() => canPress && midCookOK('value1') && send('PRESS_VALUE1')} />
        <div className="tc-caption tc-caption-2l" style={box(...TEMP_CAPTION)}><span>Temp</span><i /><span>Slices</span></div>

        {/* ---- time / shade ---- */}
        <img className={'tc-static tc-hit' + (running && !midCookOK('value2') ? ' tc-disabled' : '')} style={box(...TIME_ICON_BOX)} src={timeIcon} alt="" draggable={false}
          onClick={() => canPress && C.mode !== 'probe' && midCookOK('value2') && send('PRESS_VALUE2')} />
        <div className="tc-caption tc-caption-2l" style={box(...TIME_CAPTION)}><span>Time</span><i /><span>Shade</span></div>

        {/* ---- start / stop ---- */}
        <img className="tc-static tc-hit" style={box(...START_STOP_BOX)} src={startStopIcon} alt="" draggable={false}
          onClick={() => send(S === 'running' ? 'STOP' : 'START')} />
        <span className="tc-caption" style={box(...START_STOP_CAPTION)}>Start - Stop</span>

        {/* ---- light ---- */}
        <img className="tc-static tc-hit" style={box(...LIGHT_ICON)} src={lightIcon} alt="" draggable={false} onClick={() => send('LIGHT_TOGGLE')} />
        <span className="tc-caption" style={box(...LIGHT_CAPTION)}>Light</span>

        {/* ---- doneness readout (backlit, probe only) ---- */}
        {/* while cooking, only the chosen level stays lit — the rest fully disappear instead of just dimming */}
        {DONENESS_WORDS.map(({ word, b }, i) => (
          <span key={word} className="tc-glow tc-word" style={{ ...box(...b), opacity: on && probeMode ? (C.doneness === i ? 1 : (S === 'running' ? 0 : 0.5)) : 0 }}>{word}</span>
        ))}
        <span className="tc-glow tc-white-caption" style={{ ...box(...CAPTION_SLICES), opacity: on && toast ? 1 : 0 }}>Slices</span>
        <span className="tc-glow tc-white-caption" style={{ ...box(...CAPTION_TARGET_TEMP), opacity: on && probeMode ? 1 : 0 }}>Target Temp</span>
        <span className="tc-glow tc-white-caption" style={{ ...box(...CAPTION_CURRENT_TEMP), opacity: on && probeMode ? 1 : 0 }}>Current Temp</span>
        <span className="tc-glow tc-white-caption" style={{ ...box(...CAPTION_SHADE), opacity: on && toast ? 1 : 0 }}>Shade</span>

        {/* ---- digit displays (backlit) ---- */}
        {S === 'greeting' && (
          <div className="tc-glow tc-disp" style={box(...GREETING_BOX)}>HI</div>
        )}
        <div className={'tc-glow tc-disp' + blinkField('value1')} style={{ ...box(...DISPLAY3), opacity: on && (C.mode || C.manual) ? 1 : 0 }}>{disp3}</div>
        <div className={'tc-glow tc-disp' + (C.mode !== 'probe' ? blinkField('value2') : '')} style={{ ...box(...DISPLAY4), opacity: on && (C.mode || C.manual) ? 1 : 0 }}>{disp4}</div>
      </div>

      {/* ---- live readout — trustworthy summary while the on-panel wiring settles.
           Always rendered (content just goes blank when off) so the layout
           below it doesn't jump when the machine powers on/off. ---- */}
      <div className="tc-readout">
        {on && (C.mode
          ? `${CATEGORIES[C.mode].label.toUpperCase()} → ${opt}${C.focus === 'mode' ? ' (selecting…)' : ''}`
          : (C.manual ? 'Manual Temp / Time' : 'Choose Probe / Function / Presets, or set Temp / Time manually'))}
        {on && ((C.mode && C.modeConfirmed) || C.manual) && `  ·  ${value1Label}${C.focus === 'value1' ? ' (adjusting…)' : ''}`}
        {on && ((C.mode && C.mode !== 'probe' && C.modeConfirmed) || C.manual) && `  ·  Time/Shade${C.focus === 'value2' ? ' (adjusting…)' : ''}`}
        {!on && ' '}
      </div>
    </div>
  )
}
