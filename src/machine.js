// ===================== TWINCRISP STATE MACHINE =====================
// Pure, framework-agnostic transition logic — same shape as the AFC-6
// simulator: transition(state, context, event, arg) -> { S, C, msg }.

export const CATEGORIES = {
  probe:    { label: 'Probe',    options: ['Beef', 'Poultry', 'Fish', 'Pork', 'Lamb', 'Manual'] },
  function: { label: 'Function', options: ['Air Fry', 'Bagel', 'Toast', 'Bake', 'Broil', 'Slow Cook', 'Warm', 'Dehydrate'] },
  preset:   { label: 'Presets',  options: ['Pizza', 'Fries', 'Veggies', 'Snacks', 'Nuggets', 'Wings', 'Cookies'] },
}

// Doneness is printed on the panel as five distinct labels (own text each,
// not composited from shared words like the earlier layout).
export const DONENESS = [
  { name: 'Rare', temp: 125 },
  { name: 'Med-Rare', temp: 135 },
  { name: 'Med', temp: 145 },
  { name: 'Med-Well', temp: 150 },
  { name: 'Well', temp: 160 },
]
export const DEFAULT_DONENESS = 1 // Med-Rare

// Placeholder defaults — sensible guesses, to be replaced with real specs.
export const DEFAULT_TEMP = {
  'Air Fry': 400, Bagel: 350, Bake: 350, Broil: 450,
  'Slow Cook': 200, Warm: 165, Dehydrate: 135,
  Pizza: 425, Fries: 400, Veggies: 375, Snacks: 400,
  Nuggets: 400, Wings: 400, Cookies: 325,
}
export const DEFAULT_TIME = { // seconds, MM:SS
  'Air Fry': 900, Bagel: 300, Bake: 1800, Broil: 600,
  'Slow Cook': 3600, Warm: 1800, Dehydrate: 3600,
  Pizza: 720, Fries: 900, Veggies: 1200, Snacks: 900,
  Nuggets: 720, Wings: 1500, Cookies: 720,
}

export const TEMP_STEP = 5, TEMP_MIN = 150, TEMP_MAX = 450
export const TIME_STEP = 30, TIME_MIN = 30, TIME_MAX = 99 * 60 + 59
export const SLICES_MIN = 1, SLICES_MAX = 4, DEFAULT_SLICES = 2
export const SHADE_MIN = 1, SHADE_MAX = 7, DEFAULT_SHADE = 4
export const PROBE_RISE_PER_TICK = 3   // demo-speed °/s toward target
export const PROBE_START_TEMP = 70
export const TOAST_SEC_PER_UNIT = 5    // demo-speed: toastRemaining = slices * shade * this

export const initCtx = {
  mode: null,            // 'probe' | 'function' | 'preset' | null
  optionIndex: 0,
  modeConfirmed: false,
  focus: null,           // 'mode' | 'value1' | 'value2' | null
  doneness: DEFAULT_DONENESS,
  temp: 0,
  time: 0,
  slices: DEFAULT_SLICES,
  shade: DEFAULT_SHADE,
  currentTemp: PROBE_START_TEMP,
  toastRemaining: 0,
  light: false,
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export const fmtTime = (s) => {
  s = Math.max(0, Math.round(s))
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
}

export const currentOption = (C) => C.mode ? CATEGORIES[C.mode].options[C.optionIndex] : null
export const isToast = (C) => C.mode === 'function' && currentOption(C) === 'Toast'

export const PRETTY = { off: 'OFF', idle: 'IDLE', running: 'RUNNING' }

// Confirms whatever is currently armed, then arms `next` (or leaves it
// unarmed if next is null). Shared by both value buttons and dial-click.
function confirmThenArm(C, next) {
  C = { ...C }
  if (C.focus === 'mode') {
    C.modeConfirmed = true
    const opt = currentOption(C)
    if (C.mode !== 'probe') {
      if (isToast(C)) {
        // slices/shade keep whatever they already held (defaults from initCtx)
      } else {
        C.temp = DEFAULT_TEMP[opt] ?? C.temp
        C.time = DEFAULT_TIME[opt] ?? C.time
      }
    }
  }
  C.focus = next
  return C
}

export function transition(S, C0, ev, arg) {
  let C = { ...C0 }, msg = ''

  // ---- global ----
  if (ev === 'LIGHT_TOGGLE') { C.light = !C.light; return { S, C, msg } }

  switch (S) {
    case 'off':
      if (ev === 'POWER') { C = { ...initCtx }; S = 'idle' }
      break

    case 'idle':
      if (ev === 'POWER') { C = { ...initCtx }; S = 'off' }

      else if (ev === 'PRESS_CATEGORY') {
        const cat = arg
        if (C.mode !== cat) {
          C = { ...initCtx, mode: cat, optionIndex: 0, modeConfirmed: false, focus: 'mode', light: C.light }
        } else {
          C.modeConfirmed = false
          C.focus = 'mode'
        }
      }

      else if (ev === 'DIAL') {
        const dir = arg
        if (C.focus === 'mode' && C.mode) {
          const n = CATEGORIES[C.mode].options.length
          C.optionIndex = (C.optionIndex + dir + n) % n
        } else if (C.focus === 'value1') {
          if (C.mode === 'probe') C.doneness = clamp(C.doneness + dir, 0, DONENESS.length - 1)
          else if (isToast(C)) C.slices = clamp(C.slices + dir, SLICES_MIN, SLICES_MAX)
          else C.temp = clamp(C.temp + dir * TEMP_STEP, TEMP_MIN, TEMP_MAX)
        } else if (C.focus === 'value2') {
          if (C.mode === 'probe') { /* no time for probe */ }
          else if (isToast(C)) C.shade = clamp(C.shade + dir, SHADE_MIN, SHADE_MAX)
          else C.time = clamp(C.time + dir * TIME_STEP, TIME_MIN, TIME_MAX)
        }
      }

      else if (ev === 'DIAL_CLICK') {
        if (C.focus) C = confirmThenArm(C, null)
      }

      else if (ev === 'PRESS_VALUE1') {
        if (C.mode) {
          if (C.focus === 'value1') C.focus = null
          else C = confirmThenArm(C, 'value1')
        }
      }

      else if (ev === 'PRESS_VALUE2') {
        if (C.mode && C.mode !== 'probe') {
          if (C.focus === 'value2') C.focus = null
          else C = confirmThenArm(C, 'value2')
        }
      }

      else if (ev === 'START') {
        if (!C.mode || !C.modeConfirmed) { msg = 'Select an option first' }
        else {
          C.focus = null
          if (C.mode === 'probe') C.currentTemp = PROBE_START_TEMP
          else if (isToast(C)) C.toastRemaining = C.slices * C.shade * TOAST_SEC_PER_UNIT
          S = 'running'
        }
      }

      else if (ev === 'STOP') {
        C = { ...initCtx, light: C.light }
      }
      break

    case 'running':
      if (ev === 'TICK') {
        if (C.mode === 'probe') {
          const target = DONENESS[C.doneness].temp
          C.currentTemp = Math.min(target, C.currentTemp + PROBE_RISE_PER_TICK)
          if (C.currentTemp >= target) { C = { ...initCtx, light: C.light }; S = 'idle' }
        } else if (isToast(C)) {
          C.toastRemaining -= 1
          if (C.toastRemaining <= 0) { C = { ...initCtx, light: C.light }; S = 'idle' }
        } else {
          C.time -= 1
          if (C.time <= 0) { C = { ...initCtx, light: C.light }; S = 'idle' }
        }
      }
      else if (ev === 'STOP')  { C = { ...initCtx, light: C.light }; S = 'idle' }
      else if (ev === 'POWER') { C = { ...initCtx }; S = 'off' }
      break

    default: break
  }
  return { S, C, msg }
}

export const init = { S: 'off', C: initCtx, log: [], msg: '', acts: 0 }

export function reducer(st, a) {
  if (a.type === 'CLEARMSG') return st.msg ? { ...st, msg: '' } : st
  if (a.type !== 'SEND') return st
  const prev = st.S
  const r = transition(st.S, st.C, a.ev, a.arg)
  const log = a.ev === 'TICK' ? st.log : [...st.log, { ev: a.ev, from: prev, to: r.S }].slice(-60)
  return {
    S: r.S, C: r.C, log,
    msg: r.msg !== undefined ? r.msg : st.msg,
    acts: st.acts + 1,
  }
}
