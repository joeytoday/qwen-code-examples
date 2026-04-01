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
