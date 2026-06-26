'use strict';

// ============================================================
// WEAPON SYSTEM - Handles all weapon firing behaviors
// ============================================================
class WeaponSystem {
  constructor(gameState) {
    this.gs = gameState;
    this.orbits = []; // orbital weapon positions
  }

  // Called each frame with equipped weapon items
  update(dt, player, equippedWeapons, enemies) {
    for (const item of equippedWeapons) {
      item._timer = (item._timer || 0) + dt;
      const cooldown = 1.0 / this.getAttackSpeed(item, player);

      switch (item.weaponBehavior) {
        case 'orbit':
        case 'orbit_multi':
          this.updateOrbit(item, player, enemies, dt);
          break;
        case 'boomerang':
          if (item._timer >= cooldown) {
            item._timer = 0;
            this.fireBoomerang(item, player, enemies);
          }
          break;
        case 'pulse_aura':
          if (item._timer >= cooldown) {
            item._timer = 0;
            this.firePulse(item, player, enemies);
          }
          break;
        case 'cone_fire':
          if (item._timer >= cooldown) {
            item._timer = 0;
            this.fireCone(item, player, enemies);
          }
          break;
        case 'beam':
          this.fireBeam(item, player, enemies, dt);
          break;
        case 'void_orb':
          if (item._timer >= cooldown) {
            item._timer = 0;
            this.fireVoidOrb(item, player, enemies);
          }
          break;
        case 'storm':
          if (item._timer >= cooldown) {
            item._timer = 0;
            this.fireStorm(item, player, enemies);
          }
          break;
        case 'spin':
        case 'spin_area':
          if (item._timer >= cooldown) {
            item._timer = 0;
            this.fireSpin(item, player, enemies);
          }
          break;
        case 'cross_shot':
          if (item._timer >= cooldown) {
            item._timer = 0;
            this.fireCrossShot(item, player, enemies);
          }
          break;
        default:
          // ranged / magic
          if (item._timer >= cooldown) {
            item._timer = 0;
            this.fireRanged(item, player, enemies);
          }
          break;
      }
    }
  }

  getAttackSpeed(item, player) {
    let spd = item.stats.attackSpeed || 1.0;
    spd *= (1 + (player.synergyBonuses?.globalAttackSpeed || 0));
    spd *= (1 + (player.levelSpeedBonus || 0));
    return Math.min(spd, 8.0); // cap at 8x
  }

  getDamage(item, player) {
    let dmg = item.stats.damage || 10;
    const sb = player.synergyBonuses || {};
    dmg *= (1 + (player.levelDamageBonus || 0));
    dmg *= (1 + (sb.globalDamageBonus || 0));
    if (item.element === ELEMENTS.FIRE) dmg *= (1 + (sb.fireBonus || 0) + (player.fireRingBonus || 0));
    if (item.element === ELEMENTS.ICE) dmg *= (1 + (sb.iceBonus || 0));
    if (item.element === ELEMENTS.LIGHTNING) dmg *= (1 + (sb.lightningBonus || 0));
    if (item.element === ELEMENTS.POISON) dmg *= (1 + (sb.poisonBonus || 0));
    if (item.category === ITEM_CATEGORIES.WEAPON_MELEE) dmg *= (1 + (sb.meleeDamageBonus || 0));
    if (item.category === ITEM_CATEGORIES.WEAPON_RANGED) dmg *= (1 + (sb.rangedDamageBonus || 0));
    if (item.category === ITEM_CATEGORIES.WEAPON_MAGIC) dmg *= (1 + (sb.magicDamageBonus || 0));

    // Berserker check
    if (player.hp / player.maxHP < 0.3) {
      dmg *= (sb.berserkerDamageBonus || 1);
    }
    return Math.floor(dmg);
  }

  getRange(item, player) {
    return item.stats.range || 300;
  }

  getNearestEnemy(enemies, x, y, range) {
    let nearest = null, minDist = range + 1;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < minDist) { minDist = d; nearest = e; }
    }
    return nearest;
  }

  createProjectile(x, y, vx, vy, item, player, opts = {}) {
    const dmg = opts.damage !== undefined ? opts.damage : this.getDamage(item, player);
    const sb = player.synergyBonuses || {};
    return {
      x, y, vx, vy,
      damage: dmg,
      element: opts.element || item.element,
      piercing: (item.stats.piercing || 0) + (player.levelPierceBonus || 0) + (sb.extraPiercing || 0),
      bounceCount: item.stats.bounceCount || (sb.unlimitedBounce ? 999 : 0),
      returning: item.stats.returning || false,
      homing: (item.stats.homing || sb.allHoming) && !opts.noHoming,
      hitEnemies: new Set(),
      item,
      player,
      size: opts.size || 6,
      color: opts.color || ELEMENT_COLORS[item.element] || '#FFFFFF',
      life: opts.life || 2.0,
      glow: true,
      returnPhase: false
    };
  }

  fireRanged(item, player, enemies) {
    const target = this.getNearestEnemy(enemies, player.x, player.y, this.getRange(item, player));
    if (!target && !item.stats.homing) return;

    const count = item.stats.projectileCount || 1;
    const spread = item.stats.spreadAngle || 0;
    const baseAngle = target ? Math.atan2(target.y - player.y, target.x - player.x) : -Math.PI/2;
    const spd = item.stats.projectileSpeed || 350;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + ((i - (count-1)/2) * spread * Math.PI / 180);
      const proj = this.createProjectile(
        player.x, player.y,
        Math.cos(angle) * spd, Math.sin(angle) * spd,
        item, player
      );
      if (item.weaponBehavior === 'arrow_explode') {
        proj.onHitCallback = (x, y) => {
          this.gs.createExplosion(x, y, item.stats.explosionRadius || 70, this.getDamage(item, player) * 0.7, item.element, player);
        };
      }
      this.gs.projectiles.push(proj);
    }
  }

  fireSpin(item, player, enemies) {
    const range = item.stats.range || 80;
    const dmg = this.getDamage(item, player);
    const hitSet = new Set();

    for (const e of enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < range) {
        if (!hitSet.has(e)) {
          hitSet.add(e);
          this.gs.damageEnemy(e, dmg, item.element, player, item);
          this.gs.particles.emit(e.x, e.y, ELEMENT_COLORS[item.element] || '#FFF', 4);
        }
      }
    }
    // Spin visual
    this.gs.particles.emit(player.x, player.y, ELEMENT_COLORS[item.element] || '#FFF', 3, {
      minSpeed: range * 0.8, maxSpeed: range, minDecay: 2, maxDecay: 1
    });
  }

  fireCrossShot(item, player, enemies) {
    const spd = item.stats.projectileSpeed || 300;
    const angles = [0, Math.PI/2, Math.PI, Math.PI*3/2];
    for (const angle of angles) {
      const proj = this.createProjectile(
        player.x, player.y,
        Math.cos(angle) * spd, Math.sin(angle) * spd,
        item, player, { noHoming: true }
      );
      this.gs.projectiles.push(proj);
    }
  }

  fireCone(item, player, enemies) {
    const target = this.getNearestEnemy(enemies, player.x, player.y, this.getRange(item, player));
    if (!target) return;

    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    const coneHalf = (item.stats.coneAngle || 30) * Math.PI / 180;
    const range = item.stats.range || 150;
    const dmg = this.getDamage(item, player);

    for (const e of enemies) {
      if (e.dead) continue;
      const angle = Math.atan2(e.y - player.y, e.x - player.x);
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      let angleDiff = Math.abs(angle - baseAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      if (angleDiff < coneHalf && dist < range) {
        this.gs.damageEnemy(e, dmg, item.element, player, item);
        if (item.onHit) item.onHit(e, player, this.gs);
      }
    }

    // Visual cone
    for (let a = -coneHalf; a < coneHalf; a += 0.2) {
      const ang = baseAngle + a;
      this.gs.particles.emit(
        player.x + Math.cos(ang) * range * 0.5,
        player.y + Math.sin(ang) * range * 0.5,
        ELEMENT_COLORS[item.element] || '#FF4500', 2, { minSpeed: 10, maxSpeed: 40, minDecay: 3 }
      );
    }
  }

  fireBeam(item, player, enemies, dt) {
    const target = this.getNearestEnemy(enemies, player.x, player.y, this.getRange(item, player));
    if (!target) return;

    item._beamTimer = (item._beamTimer || 0) + dt;
    const tickRate = 0.1;
    if (item._beamTimer < tickRate) return;
    item._beamTimer = 0;

    const dmg = this.getDamage(item, player) * tickRate * (item.stats.attackSpeed || 2);
    this.gs.damageEnemy(target, dmg, item.element, player, item);
    if (item.onHit) item.onHit(target, player, this.gs);

    // Beam particles
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t2 = i / steps;
      this.gs.particles.emit(
        player.x + (target.x - player.x) * t2,
        player.y + (target.y - player.y) * t2,
        ELEMENT_COLORS[item.element] || '#FFF', 1,
        { minSpeed: 5, maxSpeed: 20, minDecay: 4 }
      );
    }
  }

  firePulse(item, player, enemies) {
    const range = item.stats.pulseRadius || 180;
    const dmg = this.getDamage(item, player);

    for (const e of enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < range) {
        this.gs.damageEnemy(e, dmg, item.element, player, item);
        if (item.onHit) item.onHit(e, player, this.gs);
      }
    }
    this.gs.particles.emitExplosion(player.x, player.y, item.element, range);
  }

  fireVoidOrb(item, player, enemies) {
    const pullRadius = item.stats.pullRadius || 150;
    const pullForce = item.stats.pullForce || 200;
    const dmg = this.getDamage(item, player);

    // Pull enemies in
    for (const e of enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < pullRadius && dist > 1) {
        const nx = (player.x - e.x) / dist;
        const ny = (player.y - e.y) / dist;
        e.x += nx * pullForce * 0.1;
        e.y += ny * pullForce * 0.1;

        if (dist < 40) {
          this.gs.damageEnemy(e, dmg, item.element, player, item);
          this.gs.particles.emit(e.x, e.y, ELEMENT_COLORS[ELEMENTS.VOID], 6);
        }
      }
    }
    this.gs.particles.emitExplosion(player.x, player.y, ELEMENTS.VOID, pullRadius * 0.3);
  }

  fireStorm(item, player, enemies) {
    if (enemies.length === 0) return;
    const aliveEnemies = enemies.filter(e => !e.dead);
    if (aliveEnemies.length === 0) return;

    // Pick random enemies
    const targets = [...aliveEnemies].sort(() => Math.random() - 0.5).slice(0, 3);
    const dmg = this.getDamage(item, player);

    for (const t of targets) {
      this.gs.damageEnemy(t, dmg, item.element, player, item);
      this.gs.chainLightning(t, item.stats.chainCount || 4, item.stats.chainRange || 160, dmg * 0.5);
      this.gs.particles.emitExplosion(t.x, t.y, ELEMENTS.LIGHTNING, 50);
    }
  }

  fireBoomerang(item, player, enemies) {
    const target = this.getNearestEnemy(enemies, player.x, player.y, this.getRange(item, player));
    if (!target) return;

    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const spd = item.stats.projectileSpeed || 380;
    const proj = this.createProjectile(
      player.x, player.y,
      Math.cos(angle) * spd, Math.sin(angle) * spd,
      item, player, { noHoming: true }
    );
    proj.returning = true;
    proj.maxRange = Math.hypot(target.x - player.x, target.y - player.y) + 30;
    proj.startX = player.x;
    proj.startY = player.y;
    proj.returnPhase = false;
    this.gs.projectiles.push(proj);
  }

  updateOrbit(item, player, enemies, dt) {
    if (!item._orbitAngle) item._orbitAngle = Math.random() * Math.PI * 2;
    const spd = (item.stats.orbitSpeed || 2.0) * (1 + (player.synergyBonuses?.orbitSpeedBonus || 0)) * (1 + (player.levelOrbitBonus || 0));
    item._orbitAngle += spd * dt;

    const radius = (item.stats.orbitRadius || 90) * (1 + (player.levelOrbitBonus || 0));
    const cloneCount = item.stats.cloneCount || 1;

    for (let c = 0; c < cloneCount; c++) {
      const angle = item._orbitAngle + (c * Math.PI * 2 / cloneCount);
      const ox = player.x + Math.cos(angle) * radius;
      const oy = player.y + Math.sin(angle) * radius;

      const dmg = this.getDamage(item, player);
      for (const e of enemies) {
        if (e.dead) continue;
        const dist = Math.hypot(e.x - ox, e.y - oy);
        if (dist < e.size + 12) {
          this.gs.damageEnemy(e, dmg, item.element, player, item);
          if (item.onHit) item.onHit(e, player, this.gs);
          this.gs.particles.emit(e.x, e.y, ELEMENT_COLORS[item.element] || '#FFF', 3);
        }
      }
      // Store position for rendering
      if (!item._orbitPositions) item._orbitPositions = [];
      item._orbitPositions[c] = { x: ox, y: oy };
    }
  }

  getHomingTarget(proj, enemies) {
    let nearest = null, minDist = 600;
    for (const e of enemies) {
      if (e.dead || proj.hitEnemies.has(e.id)) continue;
      const d = Math.hypot(e.x - proj.x, e.y - proj.y);
      if (d < minDist) { minDist = d; nearest = e; }
    }
    return nearest;
  }

  updateProjectile(proj, dt, enemies, arenaW, arenaH) {
    // Homing
    if (proj.homing) {
      const target = this.getHomingTarget(proj, enemies);
      if (target) {
        const angle = Math.atan2(target.y - proj.y, target.x - proj.x);
        const turnSpeed = 5 * dt;
        const currentAngle = Math.atan2(proj.vy, proj.vx);
        let angleDiff = angle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);
        const speed = Math.hypot(proj.vx, proj.vy);
        proj.vx = Math.cos(newAngle) * speed;
        proj.vy = Math.sin(newAngle) * speed;
      }
    }

    // Returning boomerang
    if (proj.returning) {
      const distFromStart = Math.hypot(proj.x - proj.startX, proj.y - proj.startY);
      if (!proj.returnPhase && distFromStart >= (proj.maxRange || 300)) {
        proj.returnPhase = true;
      }
      if (proj.returnPhase) {
        const angle = Math.atan2(proj.startY - proj.y, proj.startX - proj.x);
        const spd = Math.hypot(proj.vx, proj.vy);
        proj.vx = Math.cos(angle) * spd;
        proj.vy = Math.sin(angle) * spd;
        if (distFromStart < 20) {
          proj.life = 0; // remove
          return;
        }
      }
    }

    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    proj.life -= dt;

    // Bounce off walls
    if (proj.bounceCount > 0) {
      if (proj.x < 0 || proj.x > arenaW) {
        proj.vx *= -1; proj.x = Math.max(0, Math.min(arenaW, proj.x));
        proj.bounceCount--;
        this.gs.particles.emit(proj.x, proj.y, proj.color, 3);
      }
      if (proj.y < 0 || proj.y > arenaH) {
        proj.vy *= -1; proj.y = Math.max(0, Math.min(arenaH, proj.y));
        proj.bounceCount--;
        this.gs.particles.emit(proj.x, proj.y, proj.color, 3);
      }
    }
  }
}
