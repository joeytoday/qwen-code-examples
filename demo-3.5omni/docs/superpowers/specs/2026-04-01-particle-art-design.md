# Interactive Particle Art Piece - Design Spec

## Overview

A meditative, interactive particle system built with React and Framer Motion. Particles flow organically across a full-screen canvas, responding to mouse movement and click interactions. The piece creates a calming, mesmerizing visual experience reminiscent of digital ink swirling in water.

## Architecture

### Tech Stack
- **Framework:** React 18+ (Vite for build tooling)
- **Animation:** Framer Motion for UI transitions
- **Rendering:** HTML5 Canvas API for particle rendering
- **Styling:** Tailwind CSS for layout and UI elements
- **Language:** TypeScript

### Component Structure

```
App
├── ParticleCanvas (main rendering surface)
│   └── useParticleEngine (custom hook)
│       ├── Particle class (entity)
│       ├── ParticleSystem (manager)
│       └── MouseTracker (input handler)
└── UIControl (optional overlay)
    ├── Color palette selector
    └── Trail length slider
```

## Core Components

### 1. `ParticleCanvas.tsx`

The main canvas component that serves as the rendering surface.

**Responsibilities:**
- Create and manage `<canvas>` element with full viewport dimensions
- Set up animation loop via `requestAnimationFrame`
- Handle mouse move and click events
- Delegate particle logic to `useParticleEngine` hook

**Props:**
- None (manages its own state via hook)

**Key behaviors:**
- Canvas resizes with window (`resize` event listener)
- Mouse position tracked in real-time
- Click emits burst of 50+ particles

---

### 2. `useParticleEngine.ts`

Custom React hook managing all particle system state and physics.

**State managed:**
- Array of active particles
- Mouse position `{ x: number, y: number }`
- Configuration (colors, trail length, particle count)

**Methods exposed:**
- `addBurst(x, y)` — Spawn radial burst at coordinates
- `setMousePos(x, y)` — Update mouse position for attraction
- `configure(options)` — Adjust visual settings

**Physics implementation:**
- Velocity-based movement with friction (0.95–0.98)
- Mouse attraction force (easing toward cursor)
- Particle lifespan decay (fade out over 2–3 seconds)
- Boundary wrapping or bounce (configurable)

---

### 3. `Particle.ts`

Class representing an individual particle entity.

**Properties:**
- `position: { x: number, y: number }`
- `velocity: { x: number, y: number }`
- `acceleration: { x: number, y: number }`
- `size: number` (with pulse variation)
- `color: string` (from gradient palette)
- `lifespan: number` (0–1, controls opacity)
- `maxLifespan: number` (total lifetime in frames)

**Methods:**
- `applyForce(force)` — Add acceleration vector
- `update()` — Integrate velocity, decay lifespan
- `draw(ctx)` — Render to canvas context
- `isDead()` — Check if lifespan expired

---

## Visual Design

### Color Palette

| Role | Color | Usage |
|------|-------|-------|
| Background | `#1a1a2e` | Deep charcoal canvas background |
| Primary | `#00d4ff` | Cyan particles |
| Secondary | `#ff00aa` | Magenta particles |
| Tertiary | `#9d4edd` | Purple particles |
| Glow | `rgba(255, 255, 255, 0.3)` | Particle glow effect |

### Particle Appearance

- **Shape:** Circle with radial gradient fill
- **Glow:** Outer shadow blur for luminous effect
- **Size range:** 2–8px (varies by particle age)
- **Trail effect:** Achieved via semi-transparent background clear (`rgba(26, 26, 46, 0.1)`)

### Interaction Behavior

| Input | Effect |
|-------|--------|
| Mouse move | Particles within 200px are attracted to cursor with easing |
| Click | Emit 50+ particles in radial burst pattern |
| Idle | Particles drift slowly with Perlin noise-like motion |

---

## Animation Details

### Physics Constants

```typescript
const PHYSICS = {
  friction: 0.96,           // Velocity damping per frame
  mouseAttraction: 0.05,    // Force strength toward cursor
  burstForce: 8,            // Initial velocity for click bursts
  gravity: 0,               // No gravity (horizontal canvas)
  maxSpeed: 12,             // Cap particle velocity
};
```

### Lifecycle

1. **Spawn:** Particle created with initial velocity (burst direction or random)
2. **Active:** Moves under influence of forces, mouse attraction, friction
3. **Aging:** Lifespan decreases each frame, size pulses slightly
4. **Fade:** Opacity drops as lifespan approaches zero
5. **Death:** Removed from array when lifespan <= 0

### Frame Rate

- Target: 60fps via `requestAnimationFrame`
- Delta time normalization for smooth motion on varying refresh rates

---

## Data Flow

```
User interacts (mouse/click)
    ↓
ParticleCanvas captures event
    ↓
useParticleEngine updates state
    ↓
ParticleSystem updates all particles
    ↓
ParticleCanvas redraws to canvas
    ↓
Visual feedback appears
```

---

## Error Handling

- **Canvas not supported:** Display fallback message
- **High particle count:** Auto-throttle to maintain 60fps
- **Window resize:** Debounce resize events, reinitialize canvas

---

## Testing Strategy

### Manual Testing
- Verify smooth 60fps animation on target devices
- Test mouse interaction responsiveness
- Test click burst emission
- Verify particle cleanup (no memory leaks)

### Performance Checks
- Monitor frame rate with 500+ concurrent particles
- Check memory usage over extended sessions
- Verify canvas resize behavior

---

## Future Enhancements (Out of Scope)

- Sound reactivity (microphone input)
- Multiple particle types (different behaviors)
- Save/export particle patterns
- Mobile touch support
- Color theme picker UI

---

## Files to Create

```
demo-3.5omni/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── ParticleCanvas.tsx
│   │   └── UIControl.tsx (optional)
│   └── hooks/
│       └── useParticleEngine.ts
└── docs/
    └── superpowers/specs/
        └── 2026-04-01-particle-art-design.md (this file)
```

---

## Success Criteria

- Smooth 60fps animation with 300+ particles
- Responsive mouse following behavior
- Satisfying click burst effect
- Visually pleasing color gradients and trails
- Clean, maintainable code structure
