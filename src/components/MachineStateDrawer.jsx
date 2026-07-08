import { useState } from 'react'
import { PRETTY } from '../machine.js'

// Right sliding drawer — "Machine State". Not currently mounted in App.jsx;
// kept here for when we want it back.
export default function MachineStateDrawer({ st }) {
  const [open, setOpen] = useState(true)

  return (
    <div className={'drawer right' + (open ? ' open' : '')}>
      <button className="drawer-tab right" onClick={() => setOpen(true)}>
        <span>STATE</span>
      </button>
      <div className="drawer-panel">
        <div className="drawer-head">
          <span className="drawer-title">MACHINE STATE</span>
          <button className="drawer-close" onClick={() => setOpen(false)}>
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
  )
}
