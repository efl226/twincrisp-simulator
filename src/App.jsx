import { useReducer, useEffect, useRef } from 'react'
import { reducer, init, PRETTY, GREETING_MS } from './machine.js'
import Panel from './components/Panel.jsx'
import figmaReference from './assets/reference/figma-reference.png'

export default function App() {
  const [st, dispatch] = useReducer(reducer, init)
  const send = (ev, arg) => dispatch({ type: 'SEND', ev, arg })

  const sendRef = useRef(send)
  sendRef.current = send

  useEffect(() => {
    if (st.S !== 'running') return
    const id = setInterval(() => sendRef.current('TICK'), 1000)
    return () => clearInterval(id)
  }, [st.S])

  useEffect(() => {
    if (!st.msg) return
    const id = setTimeout(() => dispatch({ type: 'CLEARMSG' }), 1800)
    return () => clearTimeout(id)
  }, [st.msg])

  useEffect(() => {
    if (st.S !== 'greeting') return
    const id = setTimeout(() => sendRef.current('GREETING_DONE'), GREETING_MS)
    return () => clearTimeout(id)
  }, [st.S])

  return (
    <div className="pp">
      <div className="pp-center">
        <div className="brand">
          <h1>TwinCrisp<b>.</b></h1>
          <span className="tag">console</span>
        </div>
        <Panel S={st.S} C={st.C} send={send} />
        <div className="pp-status">
          STATUS&nbsp;&nbsp;<span style={{ color: st.msg ? 'var(--org-deep)' : 'var(--ink)', fontWeight: 700 }}>{(st.msg || PRETTY[st.S] || st.S).toUpperCase()}</span>
        </div>
        <div>
            <span className="tag">Scroll on Mouse Pad or use Up and Down Arrow Keys to use the Dial</span>
        </div>
      </div>
    </div>
  )
}
