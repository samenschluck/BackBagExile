'use strict';

// ============================================================
// BATTLE SYSTEM
// ============================================================
class BattleSystem {
  constructor(gameState) {
    this.gs = gameState;
  }

  // Apply status effect to entity
  applyStatusEffect(target, type, opts = {}) {
    if (!target.statusEffects) target.statusEffects = {};
    const existing = target.statusEffects[type];

    switch (type) {
      case 'burn':
        if (!existing || existing.duration < opts.duration) {
          target.statusEffects.burn = { damage: opts.damage || 5, duration: opts.duration || 3, timer: 0, tickRate: 0.5 };
        }
        // Toxic fire: burn spreads poison
        if (this.gs.player.synergyBonuses?.burnSpreadsPoison) {
          this.applyStatusEffect(target, 'poison', { damage: 6, duration: 3 });
        }
        break;
      case 'poison':
        const stacks = (existing?.stacks || 0) + 1;
        const maxStacks = this.gs.player.synergyBonuses?.maxPoisonStacks || 3;
        target.statusEffects.poison = {
          damage: (opts.damage || 6) * Math.min(stacks, maxStacks),
          duration: opts.duration || 4,
          timer: 0, tickRate: 1.0,
          stacks: Math.min(stacks, maxStacks)
        };
        break;
      case 'slow':
        if (!target.immunities?.includes('slow') && !this.gs.player.synergyBonuses?.immuneToSlow) {
          if (!existing || existing.amount < opts.amount) {
            target.statusEffects.slow = { amount: opts.amount || 0.4, duration: opts.duration || 2 };
          }
        }
        // Holy frost: heal on freeze
        if (type === 'slow' && this.gs.player.synergyBonuses?.freezeHeal) {
          this.gs.player.hp = Math.min(this.gs.player.maxHP, this.gs.player.hp + this.gs.player.synergyBonuses.freezeHeal);
        }
        break;
      case 'freeze':
        if (!target.immunities?.includes('freeze')) {
          target.statusEffects.freeze = { duration: opts.duration || 1.5 };
          // Frozen thunder: frozen enemies explode when hit by lightning
          if (this.gs.player.synergyBonuses?.frozenExplodeDamage) {
            target._willExplodeOnLightning = true;
          }
        }
        break;
      case 'stun':
        target.statusEffects.stun = { duration: opts.duration || 1.0 };
        break;
    }
  }

  updateStatusEffects(entity, dt) {
    if (!entity.statusEffects) return;

    for (const [type, effect] of Object.entries(entity.statusEffects)) {
      effect.duration -= dt;

      if (type === 'burn') {
        effect.timer += dt;
        if (effect.timer >= effect.tickRate) {
          effect.timer = 0;
          let dmg = effect.damage;
          // Dark flame: lifesteal from burn
          if (this.gs.player.synergyBonuses?.burnLifeSteal) {
            this.gs.player.hp = Math.min(this.gs.player.maxHP, this.gs.player.hp + dmg * this.gs.player.synergyBonuses.burnLifeSteal);
          }
          // Plasma burn: chain damage
          if (this.gs.player.synergyBonuses?.burnChainDamage) {
            this.gs.chainLightning(entity, 1, 100, this.gs.player.synergyBonuses.burnChainDamage);
          }
          this.damageEntity(entity, dmg, ELEMENTS.FIRE);
          this.gs.particles.emit(entity.x, entity.y - 5, ['#FF4500', '#FFD700'], 2);
        }
      }

      if (type === 'poison') {
        effect.timer += dt;
        if (effect.timer >= effect.tickRate) {
          effect.timer = 0;
          let dmg = effect.damage;
          // Cryotoxin: slowed enemies take more poison
          if (entity.statusEffects.slow && this.gs.player.synergyBonuses?.slowedPoisonBonus) {
            dmg *= (1 + this.gs.player.synergyBonuses.slowedPoisonBonus);
          }
          // Sacred toxin: poison heals player
          if (this.gs.player.synergyBonuses?.poisonHeals) {
            this.gs.player.hp = Math.min(this.gs.player.maxHP, this.gs.player.hp + dmg * this.gs.player.synergyBonuses.poisonHeals);
          }
          this.damageEntity(entity, dmg, ELEMENTS.POISON);
          this.gs.particles.emit(entity.x, entity.y - 5, '#39FF14', 2);
        }
      }

      if (effect.duration <= 0) {
        delete entity.statusEffects[type];
      }
    }
  }

  damageEntity(entity, dmg, element) {
    entity.hp -= dmg;
  }

  // Main damage function for enemies
  damageEnemy(enemy, rawDamage, element, player, item) {
    if (enemy.dead) return;

    // Dodge check (enemies don't dodge, but ghosts might...)
    let dmg = rawDamage;

    // Defense reduction
    const sb = player.synergyBonuses || {};
    if (!sb.ignoreDefense) {
      dmg = Math.max(1, dmg - (enemy.defense || 0));
    }

    // Critical hit
    const critChance = (player.stats?.critChance || 0.05) + (player.levelCritBonus || 0);
    const critMult = (player.stats?.critMultiplier || 2.0);
    let isCrit = false;
    if (Math.random() < critChance) {
      dmg *= critMult;
      isCrit = true;
    }

    // Assassin first hit
    if (sb.assassinFirstHit && !sb.firstHitDone) {
      dmg *= sb.assassinCritMult || 3;
      sb.firstHitDone = true;
      isCrit = true;
    }

    // Holy bonus vs undead
    if (enemy.isUndead) {
      if (element === ELEMENTS.HOLY) {
        dmg *= (sb.holyBonusUndead || 1);
      }
      if (sb.undeadFireBonus && element === ELEMENTS.FIRE) {
        dmg *= sb.undeadFireBonus;
      }
    }

    // Void damage bonus
    if (element === ELEMENTS.VOID) {
      dmg *= (1 + (sb.voidDamageBonus || 0));
    }

    dmg = Math.floor(dmg);
    enemy.hp -= dmg;

    // Lightning stun
    if (element === ELEMENTS.LIGHTNING && sb.lightningStunChance && Math.random() < sb.lightningStunChance) {
      this.applyStatusEffect(enemy, 'stun', { duration: 0.8 });
      player.hp = Math.min(player.maxHP, player.hp + (sb.lightningStunHeal || 0));
    }

    // Frozen thunder: frozen enemies explode on lightning hit
    if (element === ELEMENTS.LIGHTNING && enemy._willExplodeOnLightning && enemy.statusEffects?.freeze) {
      this.gs.createExplosion(enemy.x, enemy.y, 100, sb.frozenExplodeDamage || 40, ELEMENTS.LIGHTNING, player);
      this.gs.chainLightning(enemy, sb.frozenExplodeChain || 2, 130, (sb.frozenExplodeDamage || 40) * 0.5);
      enemy._willExplodeOnLightning = false;
    }

    // Lifesteal
    const lifeSteal = (player.stats?.globalLifeSteal || 0) + (player.levelLifeStealBonus || 0) + (sb.globalLifeSteal || 0) + (sb.berserkerLifeSteal || 0);
    if (lifeSteal > 0) {
      const heal = rawDamage * lifeSteal;
      player.hp = Math.min(player.maxHP, player.hp + heal);
    }

    // Floating damage number
    const color = isCrit ? '#FFD700' : (ELEMENT_COLORS[element] || '#FFF');
    this.gs.particles.addFloatingText(
      enemy.x + (Math.random() - 0.5) * 20,
      enemy.y - enemy.size - 10,
      isCrit ? `${dmg}!` : `${dmg}`,
      color,
      { bold: isCrit, size: isCrit ? 18 : 14 }
    );

    // Status effects from weapon
    if (item?.onHit) {
      item.onHit(enemy, player, this.gs);
    }

    // Check death
    if (enemy.hp <= 0 && !enemy.dead) {
      this.killEnemy(enemy, player);
    }
  }

  killEnemy(enemy, player) {
    enemy.dead = true;
    enemy.deathTime = 0;

    // XP
    const xpMult = 1 + (player.stats?.xpBonus || 0);
    this.gs.gainXP(Math.floor((enemy.xp || 5) * xpMult));

    // Gold
    const goldDrop = (enemy.gold || 1) + (player.stats?.goldPerKill || 0);
    this.gs.gold += goldDrop;
    this.gs.particles.addFloatingText(enemy.x, enemy.y - 30, `+${goldDrop}G`, '#FFD700');

    // Kill effects
    const sb = player.synergyBonuses || {};

    // Kill heal
    const killHeal = (player.stats?.killHeal || 0) + (sb.killHeal || 0);
    if (killHeal > 0) {
      player.hp = Math.min(player.maxHP, player.hp + killHeal);
    }

    // Holy ring
    if (player.killHealItems) {
      player.hp = Math.min(player.maxHP, player.hp + player.killHealItems);
    }

    // Kill explosions
    const expRadius = (player.stats?.killExplosionRadius || 0) + (player.levelExplosionRadius || 0);
    const expDamage = (player.stats?.killExplosionDamage || 0) + (player.levelExplosionDamage || 0);
    if (expRadius > 0) {
      this.gs.createExplosion(enemy.x, enemy.y, expRadius, expDamage, ELEMENTS.FIRE, player);
    }

    // Void kill explosion
    if (sb.voidKillExplosion) {
      this.gs.createExplosion(enemy.x, enemy.y, sb.voidKillRadius || 100, sb.voidKillExplosionDamage || 25, ELEMENTS.VOID, player);
    }

    // Death miasma
    if (sb.killPoisonAura) {
      for (const e of this.gs.enemies) {
        if (e.dead) continue;
        const dist = Math.hypot(e.x - enemy.x, e.y - enemy.y);
        if (dist < (sb.killPoisonRadius || 100)) {
          this.applyStatusEffect(e, 'poison', { damage: sb.killPoisonDamage || 10, duration: 4 });
        }
      }
    }

    // onKill item effects
    for (const item of player.backpack?.equippedItems || []) {
      if (item.onKill) item.onKill(enemy, player, this.gs);
    }

    // Enemy death effect
    if (enemy.onDeath) enemy.onDeath(enemy, this.gs);

    this.gs.particles.emitExplosion(enemy.x, enemy.y, enemy.element || ELEMENTS.PHYSICAL, enemy.size * 2);
  }

  // Update enemy AI
  updateEnemy(enemy, player, dt, arenaW, arenaH) {
    if (enemy.dead) return;
    if (enemy.hp <= 0) { this.killEnemy(enemy, player); return; }

    // Status effect updates
    this.updateStatusEffects(enemy, dt);

    // Stun / freeze check
    if (enemy.statusEffects?.freeze || enemy.statusEffects?.stun) {
      return;
    }

    const slowFactor = enemy.statusEffects?.slow ? (1 - enemy.statusEffects.slow.amount) : 1;
    const speed = (enemy.moveSpeed || 60) * slowFactor;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    switch (enemy.behavior) {
      case 'chase':
      default:
        if (dist > 1) {
          enemy.x += (dx / dist) * speed * dt;
          enemy.y += (dy / dist) * speed * dt;
        }
        break;

      case 'erratic':
        enemy._erraticTimer = (enemy._erraticTimer || 0) + dt;
        if (enemy._erraticTimer > 0.5) {
          enemy._erraticTimer = 0;
          enemy._erraticAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5;
        }
        enemy.x += Math.cos(enemy._erraticAngle || 0) * speed * dt;
        enemy.y += Math.sin(enemy._erraticAngle || 0) * speed * dt;
        break;

      case 'dodge':
        if (dist < 200 && Math.random() < 0.01) {
          const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
          enemy.x += Math.cos(perpAngle) * speed * 2 * dt;
          enemy.y += Math.sin(perpAngle) * speed * 2 * dt;
        } else if (dist > 1) {
          enemy.x += (dx / dist) * speed * dt;
          enemy.y += (dy / dist) * speed * dt;
        }
        break;

      case 'ranged_orbit':
      case 'ranged_chase': {
        const orbitDist = 250;
        if (dist > orbitDist + 20) {
          enemy.x += (dx / dist) * speed * dt;
          enemy.y += (dy / dist) * speed * dt;
        } else if (dist < orbitDist - 20) {
          enemy.x -= (dx / dist) * speed * dt;
          enemy.y -= (dy / dist) * speed * dt;
        } else {
          const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
          enemy.x += Math.cos(perpAngle) * speed * 0.7 * dt;
          enemy.y += Math.sin(perpAngle) * speed * 0.7 * dt;
        }
        // Ranged attack
        enemy._attackTimer = (enemy._attackTimer || 0) + dt;
        if (enemy._attackTimer >= (1 / (enemy.attackSpeed || 0.8))) {
          enemy._attackTimer = 0;
          if (enemy.projectile) {
            const angle = Math.atan2(dy, dx);
            this.gs.enemyProjectiles.push({
              x: enemy.x, y: enemy.y,
              vx: Math.cos(angle) * (enemy.projectile.speed || 220),
              vy: Math.sin(angle) * (enemy.projectile.speed || 220),
              damage: enemy.projectile.damage || 12,
              element: enemy.projectile.element,
              size: 8, life: 2.0,
              color: ELEMENT_COLORS[enemy.projectile.element] || '#FF0000'
            });
          }
        }
        break;
      }

      case 'teleport_chase':
        enemy._teleportTimer = (enemy._teleportTimer || 0) + dt;
        if (enemy._teleportTimer > 2.5) {
          enemy._teleportTimer = 0;
          // Teleport to near player
          const angle = Math.random() * Math.PI * 2;
          const r = 80 + Math.random() * 80;
          enemy.x = player.x + Math.cos(angle) * r;
          enemy.y = player.y + Math.sin(angle) * r;
          this.gs.particles.emitExplosion(enemy.x, enemy.y, ELEMENTS.SHADOW, 40);
        } else if (dist > 50) {
          enemy.x += (dx / dist) * speed * 0.5 * dt;
          enemy.y += (dy / dist) * speed * 0.5 * dt;
        }
        break;

      case 'phasing':
        // Ghosts move straight toward player ignoring walls
        if (dist > 1) {
          enemy.x += (dx / dist) * speed * dt;
          enemy.y += (dy / dist) * speed * dt;
        }
        break;
    }

    // Clamp to arena
    enemy.x = Math.max(enemy.size, Math.min(arenaW - enemy.size, enemy.x));
    enemy.y = Math.max(enemy.size, Math.min(arenaH - enemy.size, enemy.y));

    // Contact damage
    if (dist < player.size + enemy.size) {
      enemy._contactTimer = (enemy._contactTimer || 0) + dt;
      if (enemy._contactTimer >= 0.5) {
        enemy._contactTimer = 0;
        this.damagePlayer(player, enemy.damage || 10);
        // Spiked armor reflect
        const reflect = player.stats?.damageReflect || 0;
        if (reflect > 0) {
          this.damageEnemy(enemy, Math.floor(enemy.damage * reflect), ELEMENTS.PHYSICAL, player, null);
        }
      }
    } else {
      enemy._contactTimer = 0;
    }
  }

  damagePlayer(player, rawDamage) {
    // Dodge check
    if (Math.random() < (player.stats?.dodgeChance || 0)) {
      this.gs.particles.addFloatingText(player.x, player.y - 20, 'MISS', '#9B59B6');
      return;
    }

    // Death absorb check
    if (player.deathAbsorb > 0) {
      const finalHP = player.hp - Math.max(1, rawDamage - (player.stats?.defense || 0));
      if (finalHP <= 0) {
        player.deathAbsorb--;
        player.hp = Math.floor(player.maxHP * 0.3);
        this.gs.particles.addFloatingText(player.x, player.y - 30, 'SCHUTZENGEL!', '#FFE082', { bold: true, size: 20 });
        this.gs.particles.emitExplosion(player.x, player.y, ELEMENTS.HOLY, 80);
        return;
      }
    }

    const dmg = Math.max(1, rawDamage - (player.stats?.defense || 0));
    player.hp -= dmg;
    player.hurtTime = 0.2;

    this.gs.particles.addFloatingText(player.x, player.y - 20, `-${dmg}`, '#E74C3C');

    if (player.hp <= 0) {
      // Check revive
      if (player.reviveCount > 0) {
        player.reviveCount--;
        player.hp = Math.floor(player.maxHP * (player.stats?.reviveHP || 0.5));
        this.gs.particles.addFloatingText(player.x, player.y - 40, 'WIEDERBELEBUNG!', '#FFE082', { bold: true, size: 22 });
        this.gs.particles.emitExplosion(player.x, player.y, ELEMENTS.HOLY, 120);
      } else {
        player.hp = 0;
        this.gs.changeState('GAME_OVER');
      }
    }
  }
}
