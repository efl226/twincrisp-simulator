# TwinCrisp Interactive Prototype

UI flow simulator for the Cuisinart TwinCrisp. React + Vite, no external state
libraries — a pure `transition()` function in `src/machine.js` drives a
`useReducer`, same pattern as the AFC-6 simulator this project's shell was
carried over from.

## Structure

- `src/machine.js` — pure state machine (placeholder skeleton; TwinCrisp's
  real states/presets/probe logic go here)
- `src/components/Panel.jsx` — the panel face (placeholder; real layout comes
  from Figma refs / SVG assets)
- `src/App.jsx` — app shell: center panel + left "Possible Actions" drawer +
  right "Machine State" drawer
- `src/styles.css` — paper/grid aesthetic, fonts, drawer styling
- `src/assets/reference/` — TwinCrisp design mockups for panel development
- `src/assets/Fonts/` — drop Neue Haas Grotesk Display Pro `.ttf` files here
  (see README in that folder)

## Dev

```
npm install
npm run dev
```
