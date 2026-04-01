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
