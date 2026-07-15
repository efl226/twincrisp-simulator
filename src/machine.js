// ===================== TWINCRISP STATE MACHINE =====================
// Pure, framework-agnostic transition logic — same shape as the AFC-6
// simulator: transition(state, context, event, arg) -> { S, C, msg }.

export const CATEGORIES = {
  probe:    { label: 'Probe',    options: ['Beef', 'Poultry', 'Fish', 'Pork', 'Lamb', 'Manual'] },
  function: { label: 'Function', options: ['Air Fry', 'Bagel', 'Toast', 'Bake', 'Broil', 'Slow Cook', 'Warm', 'Dehydrate'] },
  preset:   { label: 'Presets',  options: ['Pizza', 'Fries', 'Veggies', 'Snacks', 'Nuggets', 'Wings', 'Cookies'] },
}

// Doneness is printed on the panel as five distinct labels (own text each,
// not composited from shared words like the earlier layout). Probe doesn't
// appear in the real function-data spec at all — these targets, and the
// Beef/Poultry/etc rack suggestions below, remain placeholder/dummy values.
export const DONENESS = [
  { name: 'Rare', temp: 125 },
  { name: 'Med-Rare', temp: 135 },
  { name: 'Med', temp: 145 },
  { name: 'Med-Well', temp: 150 },
  { name: 'Well', temp: 160 },
]
export const DEFAULT_DONENESS = 1 // Med-Rare

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export const fmtTime = (s) => {
  s = Math.max(0, Math.round(s))
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
}

// ---- Tiered step helpers ----
// The real spec ramps the dial's step size as the value climbs — fine
// control near the low end, coarser once you're deep into a long cook — a
// single flat step can't represent that, so each option lists its own
// ladder of { upTo, step } tiers, walked in order to find which applies.
const TIER_TIME_STD = [{ upTo: 30 * 60, step: 60 }, { upTo: Infinity, step: 5 * 60 }]
const TIER_TIME_LONG = [{ upTo: 30 * 60, step: 60 }, { upTo: 2 * 3600, step: 5 * 60 }, { upTo: Infinity, step: 30 * 60 }]
const flatTier = (step) => [{ upTo: Infinity, step }]
const TIER_TEMP_LOW = [{ upTo: 150, step: 5 }, { upTo: 200, step: 10 }, { upTo: Infinity, step: 25 }]

function tieredStep(value, dir, tiers, lo, hi) {
  let step = tiers[tiers.length - 1].step
  for (const t of tiers) { if (value < t.upTo) { step = t.step; break } }
  return clamp(value + dir * step, lo, hi)
}

// ---- Per-option Temp/Time data ----
// Sourced from "TwinCrisp Prototype Function Data (Single/Double layer) —
// 20260602" wherever a matching function/preset exists in that sheet.
// Defaults/ranges/steps are identical between the single- and double-layer
// variants (only internal heater-zone wiring differs, which the UI never
// shows), so one table covers both SKUs.
//
// `dummy: true` marks options the spec sheet has no data for at all —
// invented, reasonable-guess values standing in until real numbers exist:
//   - Bagel (Function) — no entry in the spec sheet
//   - Cookies (Preset) — no entry in the spec sheet
//
// `sourcedAs` flags an assumption: the spec has no "Slow Cook" row, but its
// "Low" row (long duration, low temp, 80-300°F, up to 12hr) is a strong
// conceptual match — used here, but flag if that mapping is wrong.
//
// Two spec rows were NOT used because nothing in the prototype's option
// list matches them yet: "Roast" (375°F/45min, 200-450°F, 1min-2hr) and a
// second yellow-highlighted "Low" variant. Let me know if either should be
// added as a new option.
export const OPTION_DATA = {
  // ---- Functions ----
  'Air Fry':   { temp: 400, time: 1200, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  'Bagel':     { temp: 350, time: 300, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true, dummy: true },
  'Bake':      { temp: 350, time: 780, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 7200, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  'Broil':     { temp: 450, time: 300, tempMin: 450, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 7200, timeTiers: TIER_TIME_STD, midCookTemp: false, midCookTime: true },
  'Slow Cook': { temp: 200, time: 7200, tempMin: 80, tempMax: 300, tempTiers: TIER_TEMP_LOW, timeMin: 60, timeMax: 43200, timeTiers: TIER_TIME_LONG, midCookTemp: true, midCookTime: true, sourcedAs: 'Low' },
  'Warm':      { temp: 150, time: 1800, tempMin: 150, tempMax: 300, tempTiers: flatTier(25), timeMin: 60, timeMax: 7200, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  'Dehydrate': { temp: 130, time: 7200, tempMin: 100, tempMax: 200, tempTiers: flatTier(5), timeMin: 60, timeMax: 259200, timeTiers: TIER_TIME_LONG, midCookTemp: true, midCookTime: true },

  // ---- Presets ----
  Pizza:   { temp: 400, time: 600, tempMin: 350, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 7200, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Fries:   { temp: 450, time: 1500, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Veggies: { temp: 400, time: 600, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Snacks:  { temp: 400, time: 360, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Nuggets: { temp: 400, time: 600, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Wings:   { temp: 400, time: 1800, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Cookies: { temp: 325, time: 600, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true, dummy: true },
}

// Toast doesn't use Temp/Time at all — real spec: fixed 450°F, Shade 1-7
// (default 4, NOT adjustable mid-cook), and Slices grouped into bands
// rather than a plain count (1-2 / 3-4 / 5-6 / 7-9, default the top band,
// IS adjustable mid-cook). `slices` in context stores a band INDEX.
export const TOAST_TEMP = 450
export const TOAST_SLICE_BANDS = ['1-2', '3-4', '5-6', '7-9']
const TOAST_SLICE_BAND_VALUE = [1.5, 3.5, 5.5, 8] // representative count per band, for the demo countdown
export const DEFAULT_TOAST_SLICE_BAND = 3 // '7-9'
export const SHADE_MIN = 1, SHADE_MAX = 7, DEFAULT_SHADE = 4

export const PROBE_RISE_PER_TICK = 3   // demo-speed °/s toward target
export const PROBE_START_TEMP = 70
export const TOAST_SEC_PER_UNIT = 5    // demo-speed: toastRemaining = slice-band value * shade * this

// No category selected — the spec sheet has no "manual" row, so this range
// is a dummy stand-in (same shape as a generic Function entry).
export const DEFAULT_MANUAL_TEMP = 350
export const DEFAULT_MANUAL_TIME = 900 // 15:00
export const MANUAL_SPEC = { tempMin: 150, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 99 * 60 + 59, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true }

// Suggested rack position (1 = top, 4 = bottom) per option — placeholder
// guesses (not covered by the function-data spec), to be replaced with real
// guidance. Shown live on the Rack Level indicator as soon as an option is
// highlighted, same as temp/time defaults.
export const RACK_LEVEL = {
  // probe
  Beef: 2, Poultry: 2, Fish: 1, Pork: 2, Lamb: 2, Manual: 2,
  // function
  'Air Fry': 2, Bagel: 3, Toast: 4, Bake: 2, Broil: 4, 'Slow Cook': 1, Warm: 1, Dehydrate: 3,
  // presets
  Pizza: 2, Fries: 3, Veggies: 3, Snacks: 3, Nuggets: 3, Wings: 2, Cookies: 2,
}

// Dual Level cooks on two racks at once — it lights the suggested level
// plus its pair (top/bottom split: 1<->3, 2<->4).
export const RACK_LEVEL_PAIR = { 1: 3, 2: 4, 3: 1, 4: 2 }

export const initCtx = {
  mode: null,            // 'probe' | 'function' | 'preset' | null
  optionIndex: 0,
  modeConfirmed: false,
  focus: null,           // 'mode' | 'value1' | 'value2' | null
  manual: false,         // true = editing Temp/Time directly, no category selected
  doneness: DEFAULT_DONENESS,
  temp: 0,
  time: 0,
  slices: DEFAULT_TOAST_SLICE_BAND,
  shade: DEFAULT_SHADE,
  currentTemp: PROBE_START_TEMP,
  toastRemaining: 0,
  light: false,
  dualLevel: false,
}

export const currentOption = (C) => C.mode ? CATEGORIES[C.mode].options[C.optionIndex] : null
export const isToast = (C) => C.mode === 'function' && currentOption(C) === 'Toast'

export const PRETTY = { off: 'OFF', greeting: 'IDLE', idle: 'IDLE', running: 'RUNNING' }
export const GREETING_MS = 2000

// The spec (or dummy stand-in) governing the currently-armed Temp/Time
// field — an OPTION_DATA entry for a confirmed category, or MANUAL_SPEC
// when no category is selected. null for Probe/Toast, which don't use it.
function specFor(C) {
  if (C.mode) return OPTION_DATA[currentOption(C)]
  if (C.manual) return MANUAL_SPEC
  return null
}

// Whether `field` ('value1' = Temp/Slices, 'value2' = Time/Shade) can be
// armed for adjustment right now — always true while Idle (setup, not
// mid-cook); while Running, gated per-option to match the spec's
// "Adjustable during cooking" columns (e.g. Broil's temp is fixed even
// mid-cook; Toast's shade never changes once slices are set, only Slices does).
export function midCookAllowed(S, C, field) {
  if (S !== 'running') return true
  if (C.mode === 'probe') return false
  if (isToast(C)) return field === 'value1'
  const spec = specFor(C)
  if (!spec) return false
  return field === 'value1' ? spec.midCookTemp : spec.midCookTime
}

// Applies one dial tick, regardless of Idle vs Running — arming (via
// PRESS_VALUE1/2) is where mid-cook eligibility gets checked, so once a
// field is armed the adjustment itself behaves identically either way.
function applyDial(C, dir) {
  C = { ...C }
  if (C.focus === 'mode' && C.mode) {
    const n = CATEGORIES[C.mode].options.length
    C.optionIndex = (C.optionIndex + dir + n) % n
  } else if (C.focus === 'value1') {
    if (C.mode === 'probe') C.doneness = clamp(C.doneness + dir, 0, DONENESS.length - 1)
    else if (isToast(C)) C.slices = clamp(C.slices + dir, 0, TOAST_SLICE_BANDS.length - 1)
    else {
      const spec = specFor(C)
      if (spec) C.temp = tieredStep(C.temp, dir, spec.tempTiers, spec.tempMin, spec.tempMax)
    }
  } else if (C.focus === 'value2') {
    if (C.mode === 'probe') { /* no time for probe */ }
    else if (isToast(C)) C.shade = clamp(C.shade + dir, SHADE_MIN, SHADE_MAX)
    else {
      const spec = specFor(C)
      if (spec) C.time = tieredStep(C.time, dir, spec.timeTiers, spec.timeMin, spec.timeMax)
    }
  }
  return C
}

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
        const spec = OPTION_DATA[opt]
        if (spec) { C.temp = spec.temp; C.time = spec.time }
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
      if (ev === 'POWER') { C = { ...initCtx }; S = 'greeting' }
      break

    // Brief "HI" splash on power-on, timed out by App.jsx via GREETING_DONE.
    case 'greeting':
      if (ev === 'POWER') { C = { ...initCtx }; S = 'off' }
      else if (ev === 'GREETING_DONE') { S = 'idle' }
      break

    case 'idle':
      if (ev === 'POWER') { C = { ...initCtx }; S = 'off' }

      else if (ev === 'PRESS_CATEGORY') {
        const cat = arg
        if (C.mode !== cat) {
          C = { ...initCtx, mode: cat, optionIndex: 0, modeConfirmed: false, focus: 'mode', light: C.light }
        } else {
          // Same category pressed again — step to the next option, same as
          // scrolling the dial. Lets you cycle Beef -> Poultry -> Fish...
          // by repeatedly pressing Probe, no dial needed.
          const n = CATEGORIES[cat].options.length
          C.optionIndex = (C.optionIndex + 1) % n
          C.modeConfirmed = false
          C.focus = 'mode'
        }
      }

      else if (ev === 'DIAL') { C = applyDial(C, arg) }

      else if (ev === 'DIAL_CLICK') {
        if (C.focus) C = confirmThenArm(C, null)
      }

      else if (ev === 'PRESS_VALUE1') {
        if (C.focus === 'value1') C.focus = null
        else if (C.mode) C = confirmThenArm(C, 'value1')
        else {
          // No category selected — arm manual Temp/Time entry directly.
          if (!C.manual) { C.manual = true; C.temp = DEFAULT_MANUAL_TEMP; C.time = DEFAULT_MANUAL_TIME }
          C.focus = 'value1'
        }
      }

      else if (ev === 'PRESS_VALUE2') {
        if (C.mode === 'probe') { /* no time value for probe */ }
        else if (C.focus === 'value2') C.focus = null
        else if (C.mode) C = confirmThenArm(C, 'value2')
        else {
          if (!C.manual) { C.manual = true; C.temp = DEFAULT_MANUAL_TEMP; C.time = DEFAULT_MANUAL_TIME }
          C.focus = 'value2'
        }
      }

      else if (ev === 'DUAL_LEVEL_TOGGLE') {
        if (C.mode) C.dualLevel = !C.dualLevel
      }

      else if (ev === 'START') {
        const ready = C.manual || (C.mode && C.modeConfirmed)
        if (!ready) { msg = 'Select an option first' }
        else {
          C.focus = null
          if (C.mode === 'probe') C.currentTemp = PROBE_START_TEMP
          else if (isToast(C)) C.toastRemaining = TOAST_SLICE_BAND_VALUE[C.slices] * C.shade * TOAST_SEC_PER_UNIT
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

      else if (ev === 'DIAL') { C = applyDial(C, arg) }

      else if (ev === 'DIAL_CLICK') {
        if (C.focus) C.focus = null
      }

      else if (ev === 'PRESS_VALUE1') {
        if (midCookAllowed(S, C, 'value1')) C.focus = C.focus === 'value1' ? null : 'value1'
      }

      else if (ev === 'PRESS_VALUE2') {
        if (midCookAllowed(S, C, 'value2')) C.focus = C.focus === 'value2' ? null : 'value2'
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
