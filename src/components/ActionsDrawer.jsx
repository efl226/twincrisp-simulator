import { useState } from 'react'

// Left sliding drawer — "Possible Actions". Not currently mounted in App.jsx;
// kept here for when we want it back.
export default function ActionsDrawer({ st, AVAIL }) {
  const [open, setOpen] = useState(true)

  return (
    <div className={'drawer left' + (open ? ' open' : '')}>
      <div className="drawer-panel">
        <div className="drawer-head">
          <span className="drawer-title">POSSIBLE ACTIONS</span>
          <button className="drawer-close" onClick={() => setOpen(false)}>
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
      <button className="drawer-tab left" onClick={() => setOpen(true)}>
        <span>ACTIONS</span>
      </button>
    </div>
  )
}
