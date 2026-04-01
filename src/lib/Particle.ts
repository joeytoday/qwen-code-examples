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
