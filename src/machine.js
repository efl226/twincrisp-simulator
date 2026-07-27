// ===================== TWINCRISP STATE MACHINE =====================
// Pure, framework-agnostic transition logic — same shape as the AFC-6
// simulator: transition(state, context, event, arg) -> { S, C, msg }.

// Order here must match FUNCTION_WORDS/PRESET_WORDS in Panel.jsx exactly —
// optionIndex highlighting lines a word up with its position by array index.
export const CATEGORIES = {
  probe:    { label: 'Probe',    options: ['Beef', 'Poultry', 'Fish', 'Pork', 'Lamb', 'Manual'] },
  function: { label: 'Function', options: ['Air Fry', 'Bake', 'Roast', 'Pizza', 'Broil', 'Slow Cook', 'Warm', 'Dehydrate'] },
  preset:   { label: 'Presets',  options: ['Toast', 'Bagel', 'Fries', 'Wings', 'Snacks', 'Nuggets', 'Cookies', 'Veggies'] },
}

// Doneness is printed on the panel as five fixed named slots (Rare through
// Well) — but not every meat offers every level, and each meat maps a level
// to its own real safe-cook temp. `doneness` in context is always an INDEX
// into DONENESS_NAMES (0-4); which indices are valid depends on the meat
// (see PROBE_DONENESS). Real values — Beef/Lamb share a ladder, Fish and
// Pork each have their own (both skip Rare).
export const DONENESS_NAMES = ['Rare', 'Med-Rare', 'Med', 'Med-Well', 'Well']
export const PROBE_DONENESS = {
  Beef: { Rare: 120, 'Med-Rare': 130, Med: 140, 'Med-Well': 145, Well: 155 },
  Lamb: { Rare: 120, 'Med-Rare': 130, Med: 140, 'Med-Well': 145, Well: 155 },
  Fish: { 'Med-Rare': 120, Med: 130, 'Med-Well': 140, Well: 150 },
  Pork: { 'Med-Rare': 130, Med: 140, 'Med-Well': 150, Well: 160 },
}
export const DEFAULT_DONENESS = 1 // Med-Rare — valid for every meat above

function validDonenessIndices(meat) {
  const table = PROBE_DONENESS[meat]
  if (!table) return []
  return DONENESS_NAMES.map((_, i) => i).filter(i => table[DONENESS_NAMES[i]] != null)
}

// Snaps `doneness` back into range whenever the highlighted meat changes —
// e.g. cycling from Beef (Rare valid) to Fish (Rare not offered) shouldn't
// leave an invalid level silently selected.
function clampDonenessToMeat(C) {
  if (!probeHasDoneness(C)) return C
  const valid = validDonenessIndices(currentOption(C))
  if (valid.includes(C.doneness)) return C
  return { ...C, doneness: valid.includes(DEFAULT_DONENESS) ? DEFAULT_DONENESS : valid[0] }
}

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

// Poultry and Manual (the probe sub-option, not the no-category manual
// entry mode below) don't get a Rare-to-Well doneness ladder — just one
// settable target temperature, same shape as a plain Temp field.
export const PROBE_SINGLE_TEMP_OPTIONS = ['Poultry', 'Manual']
export const PROBE_TARGET_DATA = {
  // Chicken/Turkey: one prescribed safe temp (165°F), not a range — fixed,
  // same trick as Broil's temp (tempMin === tempMax makes the dial a no-op).
  Poultry: { temp: 165, tempMin: 165, tempMax: 165, tempTiers: flatTier(5) },
  // Manual has no food-type table to pull from — dummy free-set range.
  Manual: { temp: 130, tempMin: 100, tempMax: 210, tempTiers: flatTier(5) },
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
// A second yellow-highlighted "Low" variant in the spec still isn't used —
// nothing in the prototype's option list matches it.
export const OPTION_DATA = {
  // ---- Functions ----
  'Air Fry':   { temp: 400, time: 1200, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  'Bake':      { temp: 350, time: 780, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 7200, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Roast:       { temp: 375, time: 2700, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 7200, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Pizza:       { temp: 400, time: 600, tempMin: 350, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 7200, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  'Broil':     { temp: 450, time: 300, tempMin: 450, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 7200, timeTiers: TIER_TIME_STD, midCookTemp: false, midCookTime: true },
  'Slow Cook': { temp: 200, time: 7200, tempMin: 80, tempMax: 300, tempTiers: TIER_TEMP_LOW, timeMin: 60, timeMax: 43200, timeTiers: TIER_TIME_LONG, midCookTemp: true, midCookTime: true, sourcedAs: 'Low' },
  'Warm':      { temp: 150, time: 1800, tempMin: 150, tempMax: 300, tempTiers: flatTier(25), timeMin: 60, timeMax: 7200, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  'Dehydrate': { temp: 130, time: 7200, tempMin: 100, tempMax: 200, tempTiers: flatTier(5), timeMin: 60, timeMax: 259200, timeTiers: TIER_TIME_LONG, midCookTemp: true, midCookTime: true },

  // ---- Presets ---- (Toast excluded — special-cased below, no Temp/Time)
  Bagel:   { temp: 350, time: 300, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true, dummy: true },
  Fries:   { temp: 450, time: 1500, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Wings:   { temp: 400, time: 1800, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Snacks:  { temp: 400, time: 360, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Nuggets: { temp: 400, time: 600, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
  Cookies: { temp: 325, time: 600, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true, dummy: true },
  Veggies: { temp: 400, time: 600, tempMin: 200, tempMax: 450, tempTiers: flatTier(25), timeMin: 60, timeMax: 3600, timeTiers: TIER_TIME_STD, midCookTemp: true, midCookTime: true },
}

// Toast doesn't use Temp/Time at all — real spec: fixed 450°F, Shade 1-7
// (default 4, NOT adjustable mid-cook). Slices is a plain 1-9 count (IS
// adjustable mid-cook) — the spec's grouped bands (1-2/3-4/5-6/7-9) were
// tried first but simplified back to a direct number per feedback.
export const TOAST_TEMP = 450
export const SLICES_MIN = 1, SLICES_MAX = 9, DEFAULT_SLICES = 8
export const SHADE_MIN = 1, SHADE_MAX = 7, DEFAULT_SHADE = 4

export const PROBE_RISE_PER_TICK = 3   // demo-speed °/s toward target
export const PROBE_START_TEMP = 70
export const TOAST_SEC_PER_UNIT = 5    // demo-speed: toastRemaining = slices * shade * this

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
  'Air Fry': 2, Bake: 2, Roast: 2, Pizza: 2, Broil: 4, 'Slow Cook': 1, Warm: 1, Dehydrate: 3,
  // presets
  Toast: 4, Bagel: 3, Fries: 3, Wings: 2, Snacks: 3, Nuggets: 3, Cookies: 2, Veggies: 3,
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
  slices: DEFAULT_SLICES,
  shade: DEFAULT_SHADE,
  currentTemp: PROBE_START_TEMP,
  toastRemaining: 0,
  light: false,
  dualLevel: false,
}

export const currentOption = (C) => C.mode ? CATEGORIES[C.mode].options[C.optionIndex] : null
export const isToast = (C) => C.mode === 'preset' && currentOption(C) === 'Toast'
// Beef/Fish/Pork/Lamb get the Rare-to-Well ladder; Poultry and Manual don't.
export const probeHasDoneness = (C) => C.mode === 'probe' && !PROBE_SINGLE_TEMP_OPTIONS.includes(currentOption(C))

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
    C = clampDonenessToMeat(C)
  } else if (C.focus === 'value1') {
    if (C.mode === 'probe') {
      if (probeHasDoneness(C)) {
        const valid = validDonenessIndices(currentOption(C))
        const pos = valid.indexOf(C.doneness)
        const n = valid.length
        C.doneness = valid[((pos < 0 ? 0 : pos) + dir + n) % n]
      } else {
        const pd = PROBE_TARGET_DATA[currentOption(C)]
        if (pd) C.temp = tieredStep(C.temp, dir, pd.tempTiers, pd.tempMin, pd.tempMax)
      }
    }
    else if (isToast(C)) C.slices = clamp(C.slices + dir, SLICES_MIN, SLICES_MAX)
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
// unarmed if next is null). Shared by both value buttons and Start.
function confirmThenArm(C, next) {
  C = { ...C }
  if (C.focus === 'mode') {
    C.modeConfirmed = true
    const opt = currentOption(C)
    if (C.mode === 'probe') {
      const pd = PROBE_TARGET_DATA[opt]
      if (pd) C.temp = pd.temp // Poultry/Manual: single target temp, no doneness ladder
    } else if (isToast(C)) {
      // slices/shade keep whatever they already held (defaults from initCtx)
    } else {
      const spec = OPTION_DATA[opt]
      if (spec) { C.temp = spec.temp; C.time = spec.time }
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
      else if (ev === 'GREETING_DONE') {
        // Function/Air Fry pre-selected and blinking, ready to confirm or
        // browse elsewhere — Idle never opens on a fully blank screen. Keep
        // C.light as-is in case Light was toggled during the splash.
        C = { ...initCtx, mode: 'function', optionIndex: 0, modeConfirmed: false, focus: 'mode', light: C.light }
        S = 'idle'
      }
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
          C = clampDonenessToMeat(C)
        }
      }

      else if (ev === 'DIAL') { C = applyDial(C, arg) }

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
        // Starting with a highlighted-but-unconfirmed option locks it in on
        // the way, same as switching to Temp/Time — Start is just one more
        // way to confirm, not a separate required step.
        if (C.focus === 'mode') C = confirmThenArm(C, null)
        const ready = C.manual || (C.mode && C.modeConfirmed)
        if (!ready) { msg = 'Select an option first' }
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
          const target = probeHasDoneness(C) ? PROBE_DONENESS[currentOption(C)][DONENESS_NAMES[C.doneness]] : C.temp
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
