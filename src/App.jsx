import { useReducer, useState } from 'react'
import { reducer, init, PRETTY } from './machine.js'
import Panel from './components/Panel.jsx'

// Placeholder — replace with TwinCrisp's real per-state action lists.
const AVAIL = {
  off: ['POWER (on)'],
  idle: ['POWER (off)'],
}

export default function App() {
  const [st, dispatch] = useReducer(reducer, init)
  const send = (ev, arg) => dispatch({ type: 'SEND', ev, arg })

  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  return (
    <div className="pp">
      {/* ---- LEFT DRAWER: POSSIBLE ACTIONS ---- */}
      <div className={'drawer left' + (leftOpen ? ' open' : '')}>
        <div className="drawer-panel">
          <div className="drawer-head">
            <span className="drawer-title">POSSIBLE ACTIONS</span>
            <button className="drawer-close" onClick={() => setLeftOpen(false)}>
              <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="drawer-body">
            <p className="dr-desc">Valid actions for the current state. This list updates as the machine transitions.</p>
            <div className="dr-section-label">STATE-SPECIFIC</div>
            <div className="dr-pills">
              {(AVAIL[st.S] || []).map((e, i) => (
                <span key={i} className={'dr-pill' + (e.indexOf('⏱') >= 0 ? ' auto' : '')}>{e}</span>
              ))}
            </div>
            <div className="dr-divider" />
            <div className="dr-section-label">ALWAYS AVAILABLE</div>
            <div className="dr-pills">
              <span className="dr-pill glob">LIGHT</span>
            </div>
          </div>
        </div>
        <button className="drawer-tab left" onClick={() => setLeftOpen(true)}>
          <span>ACTIONS</span>
        </button>
      </div>

      {/* ---- CENTER: PANEL ---- */}
      <div className="pp-center">
        <div className="brand">
          <h1>TwinCrisp<b>.</b></h1>
          <span className="tag">console</span>
        </div>
        <div className="status"><span className="dot" /> simulation active</div>
        <Panel S={st.S} C={st.C} send={send} />
        <div className="pp-status">
          STATUS&nbsp;&nbsp;<span style={{ color: st.msg ? 'var(--org-deep)' : 'var(--ink)', fontWeight: 700 }}>{(st.msg || PRETTY[st.S] || st.S).toUpperCase()}</span>
        </div>
      </div>

      {/* ---- RIGHT DRAWER: MACHINE STATE ---- */}
      <div className={'drawer right' + (rightOpen ? ' open' : '')}>
        <button className="drawer-tab right" onClick={() => setRightOpen(true)}>
          <span>STATE</span>
        </button>
        <div className="drawer-panel">
          <div className="drawer-head">
            <span className="drawer-title">MACHINE STATE</span>
            <button className="drawer-close" onClick={() => setRightOpen(false)}>
              <svg viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="drawer-body">
            <p className="dr-desc">Live readout of every context value in the state machine. Values update in real time as you interact.</p>
            <div className="dr-kv">
              <div className="dr-row">
                <span className="dr-k">STATE</span>
                <span className="dr-v hot">{PRETTY[st.S] || st.S}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
