'use strict';

// ============================================================
// PARTICLE SYSTEM
// ============================================================
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  emit(x, y, color, count = 8, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (opts.minSpeed || 40) + Math.random() * (opts.maxSpeed || 120);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Array.isArray(color) ? color[Math.floor(Math.random() * color.length)] : color,
        size: (opts.minSize || 2) + Math.random() * (opts.maxSize || 4),
        life: 1.0,
        decay: (opts.minDecay || 1.2) + Math.random() * (opts.maxDecay || 0.8),
        gravity: opts.gravity || 0,
        glow: opts.glow || false
      });
    }
  }

  emitExplosion(x, y, element, radius) {
    const colors = {
      fire: ['#FF4500', '#FF8C00', '#FFD700'],
      ice: ['#00CFFF', '#87CEEB', '#FFFFFF'],
      lightning: ['#FFD700', '#FFFFFF', '#87CEEB'],
      poison: ['#39FF14', '#7FFF00', '#ADFF2F'],
      holy: ['#FFE082', '#FFFFFF', '#FFD700'],
      shadow: ['#9B59B6', '#6C3483', '#1a0030'],
      physical: ['#BDC3C7', '#FFFFFF', '#95A5A6'],
      void: ['#4B0082', '#9B59B6', '#1a0030'],
      blood: ['#C0392B', '#E74C3C', '#8B0000'],
      chaos: ['#FF00FF', '#00FFFF', '#FFD700']
    }[element] || ['#FFFFFF'];

    const count = Math.floor(radius / 4);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 60 + Math.random() * (radius * 0.8);
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4,
        life: 1.0,
        decay: 1.5 + Math.random(),
        gravity: 30,
        glow: true
      });
    }
  }

  addFloatingText(x, y, text, color, opts = {}) {
    this.floatingTexts.push({
      x, y,
      text,
      color,
      size: opts.size || 16,
      life: 1.0,
      decay: 0.9 + Math.random() * 0.4,
      vy: -(opts.speed || 50),
      bold: opts.bold || false
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= (1 - dt * 3);
      p.vy *= (1 - dt * 1.5);
      p.life -= p.decay * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.vy *= (1 - dt * 2);
      t.life -= t.decay * dt;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.glow) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    for (const t of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.font = `${t.bold ? 'bold ' : ''}${t.size}px 'Courier New'`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 4;
      ctx.shadowColor = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
