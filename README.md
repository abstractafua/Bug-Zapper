# Super Bug Zapper

A browser-based WebGL game where players must eliminate growing bacteria colonies before they overtake a petri dish. Built entirely with raw WebGL and vanilla JavaScript — no game engine, no canvas 2D API.

---

## Gameplay

- A white circular **petri dish** is rendered at the center of the canvas.
- **20 bacteria** spawn along the rim of the dish and begin growing outward once the game starts.
- Move your mouse over a bacterium and **click to zap (poison) it** before it grows too large.
- **You lose** if 2 or more bacteria reach the size threshold before you can eliminate them.
- **You win** if you successfully zap all bacteria before that happens.

---

## How to Run

No installation or build step required. Simply open the HTML file in a browser:

```
SuperBugZapper.html
```

> Requires a browser with WebGL support (Chrome, Firefox, Edge, Safari — all modern versions).

---

## Project Structure

| File | Description |
|---|---|
| `SuperBugZapper.html` | Entry point — sets up the canvas, buttons, and score display |
| `SuperBugZapper.js` | Core game logic: rendering, animation loop, collision detection, scoring |
| `shaders.js` | GLSL vertex and fragment shader source strings |
| `cuon-matrix.js` | Matrix/vector math utilities (from Kouichi Matsuda's WebGL Programming Guide) |
| `cuon-utils.js` | Supplementary WebGL utilities |
| `MV.js` | Additional matrix/vector package used for linear algebra operations |
| `initShaders.js` | Helper to compile and link inline GLSL shaders from the HTML file |
| `initShaders2.js` | Helper to compile and link shaders loaded from separate files |
| `webgl-utils.js` | Standard Google WebGL setup utilities |
| `webgl-debug.js` | WebGL debugging wrapper for development |

---

## Technical Details

### Rendering Pipeline
All visuals are drawn using the **WebGL API** directly:
- The petri dish is approximated as a **triangle-fan circle** using 100 triangular segments.
- Each bacterium is an independently rendered circle using 50 triangular segments.
- Colors are passed as `uniform vec4` values to the GLSL fragment shader, allowing each bacterium to have a distinct color (green, red, blue, pink, or yellow).

### Animation & Growth
- The game loop uses `requestAnimationFrame` for smooth rendering.
- Growth is **time-delta based** — bacteria expand proportionally to elapsed time in seconds, ensuring consistent speed regardless of frame rate.
- Growth rate: `0.015 units/second` per bacterium.
- Size threshold for a "loss point": `0.30` WebGL units.

### Collision Detection
- On each mouse click, the Euclidean distance between the cursor position and each bacterium's center is calculated.
- If the distance is within the bacterium's current radius, it is removed from the list (`splice`), and the player earns a point.
- Mouse coordinates are normalized from pixel space to WebGL clip space `[-1, 1]`.

### Scoring
| Event | Score Update |
|---|---|
| Player zaps a bacterium | `Player gains +1` |
| Bacterium reaches the size threshold | `Game gains +1` |

---

## Built With

- **WebGL 1.0** — GPU-accelerated rendering
- **GLSL** — Vertex and fragment shaders
- **Vanilla JavaScript (ES5)** — Game logic and DOM interaction
- **HTML5 Canvas** — Rendering surface

---

## Preview

See `Visuals/` for screenshots and a recorded game state at timestep = 1.

---

## License

This project was developed as part of coursework at the **University of British Columbia**.
