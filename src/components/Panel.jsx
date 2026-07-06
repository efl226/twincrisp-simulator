import panelSvg from '../assets/twincrisp-panel.svg'

// Fixed 1131.02 x 126.51 — the panel's real dimensions per the Figma source.
// Static art for now; interactive overlays land once this is confirmed accurate.
export default function Panel({ S, C, send }) {
  return (
    <div className="panelwrap">
      <div className="panel">
        <img className="panel-bg" src={panelSvg} alt="TwinCrisp control panel" draggable={false} />
      </div>
    </div>
  )
}
