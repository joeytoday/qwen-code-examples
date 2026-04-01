# Interactive Particle Art Piece Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a meditative, interactive particle system with React, Framer Motion, and HTML5 Canvas that responds to mouse movement and click interactions.

**Architecture:** Single-page React application with a full-screen canvas element. Particle physics managed by a custom `useParticleEngine` hook. Particles flow organically, attracted to cursor position, and emit bursts on click. Animation loop runs at 60fps via `requestAnimationFrame`.

**Tech Stack:** React 18+, TypeScript, Vite, Tailwind CSS, Framer Motion, HTML5 Canvas API

---

## File Structure

| File | Responsibility |
|------|----------------|
| `index.html` | Entry HTML with canvas container |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Vite build configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS configuration |
| `src/index.css` | Global styles and Tailwind imports |
| `src/main.tsx` | React entry point |
| `src/App.tsx` | Main app component |
| `src/components/ParticleCanvas.tsx` | Canvas rendering component |
| `src/hooks/useParticleEngine.ts` | Particle physics and state management |
| `src/lib/Particle.ts` | Particle class definition |

---

### Task 1: Project Scaffold and Configuration

**Files:**
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/package.json`
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/tsconfig.json`
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/vite.config.ts`
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/tailwind.config.js`
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/postcss.config.js`
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/index.html`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "particle-art",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^11.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 5: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1a1a2e',
        primary: '#00d4ff',
        secondary: '#ff00aa',
        tertiary: '#9d4edd',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Interactive Particle Art</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`

Expected: All dependencies installed successfully

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html
git commit -m "chore: scaffold project with Vite, React, TypeScript, Tailwind"
```

---

### Task 2: Global Styles and Entry Point

**Files:**
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/src/index.css`
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/src/main.tsx`
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/src/App.tsx`

- [ ] **Step 1: Create index.css with Tailwind imports**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#root {
  width: 100%;
  height: 100%;
}

body {
  background-color: #1a1a2e;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
```

- [ ] **Step 2: Create main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Create App.tsx**

```typescript
import { motion } from 'framer-motion';
import ParticleCanvas from './components/ParticleCanvas';

function App() {
  return (
    <motion.div
      className="w-full h-full bg-background relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <ParticleCanvas />
      <motion.div
        className="absolute top-6 left-6 text-white/60 text-sm pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Move your mouse • Click to burst
      </motion.div>
    </motion.div>
  );
}

export default App;
```

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/main.tsx src/App.tsx
git commit -m "feat: add global styles and React entry point"
```

---

### Task 3: Particle Class Library

**Files:**
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/src/lib/Particle.ts`

- [ ] **Step 1: Create Particle.ts**

```typescript
export interface Vector2D {
  x: number;
  y: number;
}

export interface ParticleConfig {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  size?: number;
  color?: string;
  lifespan?: number;
}

export class Particle {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  size: number;
  color: string;
  lifespan: number;
  maxLifespan: number;
  baseSize: number;

  private static readonly COLORS = ['#00d4ff', '#ff00aa', '#9d4edd', '#00ff88', '#ff6b6b'];
  private static readonly FRICTION = 0.96;
  private static readonly MAX_SPEED = 12;

  constructor(config: ParticleConfig) {
    this.position = { x: config.x, y: config.y };
    this.velocity = { x: config.vx || 0, y: config.vy || 0 };
    this.acceleration = { x: 0, y: 0 };
    this.baseSize = config.size || Math.random() * 4 + 2;
    this.size = this.baseSize;
    this.color = config.color || Particle.COLORS[Math.floor(Math.random() * Particle.COLORS.length)];
    this.maxLifespan = config.lifespan || 180;
    this.lifespan = this.maxLifespan;
  }

  applyForce(force: Vector2D): void {
    this.acceleration.x += force.x;
    this.acceleration.y += force.y;
  }

  update(): void {
    // Apply velocity
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;

    // Apply friction
    this.velocity.x *= Particle.FRICTION;
    this.velocity.y *= Particle.FRICTION;

    // Cap speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > Particle.MAX_SPEED) {
      this.velocity.x = (this.velocity.x / speed) * Particle.MAX_SPEED;
      this.velocity.y = (this.velocity.y / speed) * Particle.MAX_SPEED;
    }

    // Update position
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Reset acceleration
    this.acceleration = { x: 0, y: 0 };

    // Decay lifespan
    this.lifespan -= 1;

    // Pulse size based on lifespan
    const lifeRatio = this.lifespan / this.maxLifespan;
    this.size = this.baseSize * (0.8 + 0.4 * Math.sin(lifeRatio * Math.PI));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.lifespan / this.maxLifespan;
    
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    
    // Create glow effect
    const gradient = ctx.createRadialGradient(
      this.position.x,
      this.position.y,
      0,
      this.position.x,
      this.position.y,
      this.size * 3
    );
    gradient.addColorStop(0, this.hexToRgba(this.color, alpha));
    gradient.addColorStop(0.4, this.hexToRgba(this.color, alpha * 0.5));
    gradient.addColorStop(1, this.hexToRgba(this.color, 0));
    
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  isDead(): boolean {
    return this.lifespan <= 0;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/Particle.ts
git commit -m "feat: add Particle class with physics and rendering"
```

---

### Task 4: Particle Engine Hook

**Files:**
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/src/hooks/useParticleEngine.ts`

- [ ] **Step 1: Create useParticleEngine.ts**

```typescript
import { useRef, useCallback } from 'react';
import { Particle } from '../lib/Particle';
import type { Vector2D } from '../lib/Particle';

interface UseParticleEngineReturn {
  particles: Particle[];
  canvasRef: React.RefObject<HTMLCanvasElement>;
  addBurst: (x: number, y: number) => void;
  setMousePos: (x: number, y: number) => void;
}

const CONFIG = {
  friction: 0.96,
  mouseAttraction: 0.05,
  burstForce: 8,
  burstCount: 50,
  gravity: 0,
  maxSpeed: 12,
  mouseRadius: 200,
  trailAlpha: 0.1,
};

export function useParticleEngine(): UseParticleEngineReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<Vector2D>({ x: -1000, y: -1000 });
  const animationFrameRef = useRef<number>();

  const addBurst = useCallback((x: number, y: number) => {
    for (let i = 0; i < CONFIG.burstCount; i++) {
      const angle = (Math.PI * 2 * i) / CONFIG.burstCount + Math.random() * 0.5;
      const force = CONFIG.burstForce * (0.8 + Math.random() * 0.4);
      
      const particle = new Particle({
        x,
        y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        size: Math.random() * 4 + 3,
        lifespan: 120 + Math.random() * 60,
      });
      
      particlesRef.current.push(particle);
    }
  }, []);

  const setMousePos = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const updateParticles = useCallback(() => {
    const particles = particlesRef.current;
    const mouse = mouseRef.current;

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      // Mouse attraction
      const dx = mouse.x - particle.position.x;
      const dy = mouse.y - particle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < CONFIG.mouseRadius && distance > 10) {
        const force = CONFIG.mouseAttraction * (1 - distance / CONFIG.mouseRadius);
        particle.applyForce({
          x: (dx / distance) * force,
          y: (dy / distance) * force,
        });
      }

      // Random drift
      particle.applyForce({
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
      });

      particle.update();

      // Remove dead particles
      if (particle.isDead()) {
        particles.splice(i, 1);
      }
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with trail effect
    ctx.fillStyle = `rgba(26, 26, 46, ${CONFIG.trailAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all particles
    particlesRef.current.forEach((particle) => {
      particle.draw(ctx);
    });
  }, []);

  const animate = useCallback(() => {
    updateParticles();
    draw();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [updateParticles, draw]);

  // Start animation loop
  useRefEffect(() => {
    animate();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // Handle canvas resize
  useRefEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Fill background initially
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    particles: particlesRef.current,
    canvasRef,
    addBurst,
    setMousePos,
  };
}

// Helper hook for cleanup
function useRefEffect(effect: () => void | (() => void), deps: unknown[]) {
  const savedEffect = useRef(effect);
  savedEffect.current = effect;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useRef(() => {
    const cleanup = savedEffect.current();
    return () => cleanup?.();
  }, deps);
}
```

Wait, the above has an issue with custom hooks. Let me fix it:

- [ ] **Step 1 (corrected): Rewrite useParticleEngine.ts properly**

```typescript
import { useRef, useCallback, useEffect } from 'react';
import { Particle } from '../lib/Particle';
import type { Vector2D } from '../lib/Particle';

interface UseParticleEngineReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  addBurst: (x: number, y: number) => void;
  setMousePos: (x: number, y: number) => void;
}

const CONFIG = {
  friction: 0.96,
  mouseAttraction: 0.05,
  burstForce: 8,
  burstCount: 50,
  maxSpeed: 12,
  mouseRadius: 200,
  trailAlpha: 0.1,
};

export function useParticleEngine(): UseParticleEngineReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<Vector2D>({ x: -1000, y: -1000 });
  const animationFrameRef = useRef<number>();

  const addBurst = useCallback((x: number, y: number) => {
    for (let i = 0; i < CONFIG.burstCount; i++) {
      const angle = (Math.PI * 2 * i) / CONFIG.burstCount + Math.random() * 0.5;
      const force = CONFIG.burstForce * (0.8 + Math.random() * 0.4);
      
      const particle = new Particle({
        x,
        y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        size: Math.random() * 4 + 3,
        lifespan: 120 + Math.random() * 60,
      });
      
      particlesRef.current.push(particle);
    }
  }, []);

  const setMousePos = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const updateParticles = useCallback(() => {
    const particles = particlesRef.current;
    const mouse = mouseRef.current;

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      // Mouse attraction
      const dx = mouse.x - particle.position.x;
      const dy = mouse.y - particle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < CONFIG.mouseRadius && distance > 10) {
        const force = CONFIG.mouseAttraction * (1 - distance / CONFIG.mouseRadius);
        particle.applyForce({
          x: (dx / distance) * force,
          y: (dy / distance) * force,
        });
      }

      // Random drift
      particle.applyForce({
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
      });

      particle.update();

      // Remove dead particles
      if (particle.isDead()) {
        particles.splice(i, 1);
      }
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with trail effect
    ctx.fillStyle = `rgba(26, 26, 46, ${CONFIG.trailAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all particles
    particlesRef.current.forEach((particle) => {
      particle.draw(ctx);
    });
  }, []);

  const animate = useCallback(() => {
    updateParticles();
    draw();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [updateParticles, draw]);

  // Start animation loop and cleanup
  useEffect(() => {
    animate();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Fill background initially
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    canvasRef,
    addBurst,
    setMousePos,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useParticleEngine.ts
git commit -m "feat: add useParticleEngine hook with physics and animation loop"
```

---

### Task 5: ParticleCanvas Component

**Files:**
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/src/components/ParticleCanvas.tsx`

- [ ] **Step 1: Create ParticleCanvas.tsx**

```typescript
import { useEffect } from 'react';
import { useParticleEngine } from '../hooks/useParticleEngine';

export default function ParticleCanvas() {
  const { canvasRef, addBurst, setMousePos } = useParticleEngine();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos(e.clientX, e.clientY);
    };

    const handleClick = (e: MouseEvent) => {
      addBurst(e.clientX, e.clientY);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [addBurst, setMousePos, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-crosshair"
      style={{ touchAction: 'none' }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ParticleCanvas.tsx
git commit -m "feat: add ParticleCanvas component with mouse interaction"
```

---

### Task 6: Development Server and Testing

**Files:**
- No new files

- [ ] **Step 1: Start development server**

Run: `npm run dev`

Expected: Vite dev server starts on http://localhost:5173

- [ ] **Step 2: Manual testing checklist**

Open browser to http://localhost:5173 and verify:

1. Canvas fills entire viewport
2. Background is deep charcoal (#1a1a2e)
3. Moving mouse creates subtle particle attraction
4. Clicking emits burst of ~50 particles
5. Particles have cyan/magenta/purple colors with glow
6. Particles fade out smoothly over 2-3 seconds
7. Trails are visible behind moving particles
8. Animation runs smoothly at 60fps
9. Window resize works correctly

- [ ] **Step 3: Performance check**

Open browser DevTools → Performance tab, record for 10 seconds while interacting. Verify:
- Frame rate stays above 55fps
- No memory leaks (heap size stable)
- No forced synchronous layouts

- [ ] **Step 4: Commit any fixes**

```bash
git add .
git commit -m "fix: address any issues found during manual testing"
```

---

### Task 7: Build and Deploy Preparation

**Files:**
- Create: `/Users/joeytoday/github-repo/qwen-code-examples/demo-3.5omni/README.md`

- [ ] **Step 1: Create README.md**

```markdown
# Interactive Particle Art

A meditative, interactive particle system built with React, Framer Motion, and HTML5 Canvas.

## Features

- 🎨 Organic particle flow with mouse attraction
-  Click to emit particle bursts
- ✨ Glowing particles with motion trails
-  Smooth 60fps animation

## Tech Stack

- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- HTML5 Canvas

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Interaction

- **Move mouse**: Particles are attracted to your cursor
- **Click**: Emit a burst of particles

## Customization

Edit `src/hooks/useParticleEngine.ts` to adjust:
- `burstCount`: Number of particles per burst
- `mouseAttraction`: Strength of mouse pull
- `trailAlpha`: Trail length (lower = longer trails)
- Colors in `src/lib/Particle.ts`

## License

MIT
```

- [ ] **Step 2: Build production bundle**

Run: `npm run build`

Expected: `dist/` folder created with optimized bundle

- [ ] **Step 3: Commit**

```bash
git add README.md dist/
git commit -m "docs: add README and production build"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** All components from spec implemented (ParticleCanvas, useParticleEngine, Particle class)
- [ ] **Placeholder scan:** No TBD/TODO/fill-in patterns present
- [ ] **Type consistency:** Particle, Vector2D types consistent across all files
- [ ] **File paths:** All paths are absolute and correct
- [ ] **Commands verified:** All npm commands are standard and correct

---

Plan complete and saved to `docs/superpowers/plans/2026-04-01-particle-art-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
