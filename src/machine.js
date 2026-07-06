// ===================== TWINCRISP STATE MACHINE =====================
// Pure, framework-agnostic transition logic — same shape as the AFC-6
// simulator: transition(state, context, event, arg) -> { S, C, msg }.
// States/context below are a placeholder skeleton to wire up the shell;
// replace with TwinCrisp's real states, presets, and probe/doneness logic.

export const initCtx = {
  fn: null,
};

export const PRETTY = {
  off: 'OFF',
  idle: 'IDLE',
};

export function transition(S, C0, ev, arg) {
  let C = { ...C0 }, msg = '';

  switch (S) {
    case 'off':
      if (ev === 'POWER') S = 'idle';
      break;

    case 'idle':
      if (ev === 'POWER_OFF') S = 'off';
      break;

    default:
      break;
  }
  return { S, C, msg };
}

export const init = { S: 'off', C: initCtx, log: [], msg: '', acts: 0 };

export function reducer(st, a) {
  if (a.type === 'CLEARMSG') return st.msg ? { ...st, msg: '' } : st;
  if (a.type !== 'SEND') return st;
  const prev = st.S;
  const r = transition(st.S, st.C, a.ev, a.arg);
  const log = a.ev === 'TICK' ? st.log : [...st.log, { ev: a.ev, from: prev, to: r.S }].slice(-60);
  return {
    S: r.S, C: r.C, log,
    msg: r.msg !== undefined ? r.msg : st.msg,
    acts: st.acts + 1,
  };
}
