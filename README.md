# Interactive Particle Art

A meditative, interactive particle system built with React, Framer Motion, and HTML5 Canvas.

## Features

- 🎨 Organic particle flow with mouse attraction
- 💥 Click to emit particle bursts
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

Edit `src/lib/Particle.ts` to customize:
- `COLORS`: Particle color palette
- `FRICTION`: Velocity damping
- `MAX_SPEED`: Maximum particle velocity

## License

MIT
