'use strict';

// ============================================================
// MAIN GAME - Orchestrates all systems
// ============================================================

const GAME_STATES = {
  MENU: 'MENU',
  SHOP: 'SHOP',
  BATTLE: 'BATTLE',
  LEVEL_UP: 'LEVEL_UP',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
  BOSS_WARNING: 'BOSS_WARNING'
};

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.state = GAME_STATES.MENU;
    this.t = 0;
    this.dt = 0;
    this.lastTime = 0;

    // Characters
    this.characters = [
      {
        id: 'warrior', name: 'Krieger', icon: '⚔️', color: '#E74C3C',
        description: 'Starker Nahkämpfer. Beginnt mit Rustigem Schwert.',
        startHP: 4, startSpeed: 3, startDamage: 4,
        startItems: ['rusty_sword', 'leather_armor'],
        startGold: 8,
        stats: { maxHP: 140, moveSpeed: 105 }
      },
      {
        id: 'ranger', name: 'Waldläufer', icon: '🏹', color: '#27AE60',
        description: 'Schneller Fernkämpfer. Beginnt mit Bogen.',
        startHP: 3, startSpeed: 5, startDamage: 3,
        startItems: ['basic_bow', 'speed_boots'],
        startGold: 8,
        stats: { maxHP: 100, moveSpeed: 145 }
      },
      {
        id: 'mage', name: 'Magier', icon: '🧙', color: '#9B59B6',
        description: 'Mächtiger Zauberer. Beginnt mit Zauberstab.',
        startHP: 3, startSpeed: 3, startDamage: 5,
        startItems: ['magic_wand', 'xp_amulet'],
        startGold: 10,
        stats: { maxHP: 90, moveSpeed: 110 }
      }
    ];
    this.selectedCharIndex = 0;

    // Game systems
    this.backpack = new Backpack();
    this.particles = new ParticleSystem();
    this.battleSystem = new BattleSystem(this);
    this.weaponSystem = new WeaponSystem(this);
    this.shop = new Shop(this);
    this.renderer = new Renderer(this.canvas, this);

    // Game state
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.poisonTrails = [];
    this.gold = 0;
    this.currentRound = 1;
    this.roundTimer = 0;
    this.playerLevel = 1;
    this.xp = 0;
    this.xpToLevel = 30;
    this.activeSynergies = [];
    this.levelUpChoices = [];
    this.levelUpHovered = -1;
    this.totalKills = 0;

    // Wave spawning
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.bossSpawned = false;

    // Time watch timer
    this.timeFreezeTimer = 0;
    this.timeFreeze = false;
    this.timeFreezeDuration = 0;

    // Chaos buffs
    this.chaosBuffs = [];

    // Input
    this.input = {
      touch: null, joystick: null,
      joystickX: 0, joystickY: 0,
      pointerX: 0, pointerY: 0,
      dashPressed: false
    };

    this.setupInput();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  // ============================================================
  // GAME LOOP
  // ============================================================
  loop(timestamp) {
    this.dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.t += this.dt;

    this.update();
    this.draw();

    requestAnimationFrame((ts) => this.loop(ts));
  }

  update() {
    if (this.state === GAME_STATES.BATTLE) {
      this.updateBattle();
    }
    this.particles.update(this.dt);
  }

  draw() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.W, this.H);

    switch (this.state) {
      case GAME_STATES.MENU:
        this.renderer.drawMenu(this.W, this.H, this.t);
        break;
      case GAME_STATES.SHOP:
        this.renderer.drawShop(this.W, this.H, this.t);
        break;
      case GAME_STATES.BATTLE:
        this.renderer.drawBattle(this.W, this.H, this.t);
        break;
      case GAME_STATES.LEVEL_UP:
        this.renderer.drawLevelUp(this.W, this.H, this.t);
        break;
      case GAME_STATES.GAME_OVER:
        this.renderer.drawGameOver(this.W, this.H, this.t);
        break;
      case GAME_STATES.VICTORY:
        this.renderer.drawVictory(this.W, this.H, this.t);
        break;
      case GAME_STATES.BOSS_WARNING:
        this.renderer.drawBattle(this.W, this.H, this.t);
        this.renderer.drawBossWarning(this.W, this.H, this.t);
        break;
    }
  }

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  changeState(newState) {
    this.state = newState;

    if (newState === GAME_STATES.SHOP) {
      this.shop.generateShop(
        this.currentRound,
        WAVE_CONFIGS[this.currentRound - 1]?.guaranteedRare,
        WAVE_CONFIGS[this.currentRound - 1]?.guaranteedEpic
      );
      // Apply onRound effects
      for (const item of this.backpack.equippedItems) {
        if (item.onRound) item.onRound(this.player, this);
      }
      this.recomputePlayerStats();
    }

    if (newState === GAME_STATES.BATTLE) {
      this.startBattleRound();
    }
  }

  // ============================================================
  // GAME INITIALIZATION
  // ============================================================
  startGame(charIndex) {
    const char = this.characters[charIndex];
    this.backpack.clear();
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.poisonTrails = [];
    this.currentRound = 1;
    this.playerLevel = 1;
    this.xp = 0;
    this.xpToLevel = 30;
    this.totalKills = 0;
    this.gold = char.startGold;

    // Create player
    this.player = {
      x: this.W / 2, y: this.H / 2,
      size: 20,
      icon: char.icon,
      color: char.color,
      hp: char.stats.maxHP,
      maxHP: char.stats.maxHP,
      moveSpeed: char.stats.moveSpeed,
      hurtTime: 0,
      dashCooldown: 0,
      dashVx: 0, dashVy: 0,
      dashTimer: 0,
      reviveCount: 0,
      deathAbsorb: 0,
      freeRerolls: 0,
      levelDamageBonus: 0,
      levelSpeedBonus: 0,
      levelMoveBonus: 0,
      levelDefenseBonus: 0,
      levelRegenBonus: 0,
      levelCritBonus: 0,
      levelLifeStealBonus: 0,
      levelOrbitBonus: 0,
      levelPierceBonus: 0,
      levelExplosionRadius: 0,
      levelExplosionDamage: 0,
      backpack: this.backpack,
      stats: {},
      synergyBonuses: {}
    };

    // Give starting items
    for (const itemId of char.startItems) {
      const itemDef = ITEMS_BY_ID[itemId];
      if (itemDef) {
        const itemCopy = JSON.parse(JSON.stringify(itemDef));
        this.backpack.autoPlace(itemCopy);
      }
    }

    this.recomputePlayerStats();
    this.player.hp = this.player.maxHP;

    this.changeState(GAME_STATES.SHOP);
  }

  recomputePlayerStats() {
    const stats = this.backpack.computeStats();
    this.player.stats = stats;
    this.player.maxHP = stats.maxHP;
    this.player.hp = Math.min(this.player.hp, this.player.maxHP);

    // Compute synergies
    this.activeSynergies = calculateSynergies(this.backpack.equippedItems);
    applySynergyStats(this.player, this.activeSynergies);

    // Apply blood pact penalty
    const bloodPact = this.backpack.equippedItems.find(i => i.id === 'blood_pact');
    if (bloodPact) {
      this.player.maxHP = Math.floor(this.player.maxHP * (1 - 0.25));
      this.player.hp = Math.min(this.player.hp, this.player.maxHP);
    }
  }

  // ============================================================
  // BATTLE PHASE
  // ============================================================
  startBattleRound() {
    const config = WAVE_CONFIGS[this.currentRound - 1];
    if (!config) return;

    this.player.x = this.W / 2;
    this.player.y = this.H / 2;
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.poisonTrails = [];
    this.roundTimer = config.duration;
    this.bossSpawned = false;

    // Reset assassin first hit
    if (this.player.synergyBonuses) {
      this.player.synergyBonuses.firstHitDone = false;
    }

    // Time watch setup
    const timeWatch = this.backpack.equippedItems.find(i => i.id === 'time_watch');
    this.timeFreezeTimer = 0;
    this.timeFreeze = false;
    this.timeFreezeDuration = 0;

    // Build spawn queue
    this.spawnQueue = [];
    this.spawnTimer = 0;
    for (const group of config.groups) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          type: group.enemy,
          time: (group.delay || 0) + i * (1 / group.spawnRate),
          elite: config.elite || false
        });
      }
    }
    this.spawnQueue.sort((a, b) => a.time - b.time);

    // Boss warning
    if (config.isBoss) {
      this.bossConfig = config;
      this.bossWarningTimer = 2;
      this.state = GAME_STATES.BOSS_WARNING;
      setTimeout(() => {
        if (this.state === GAME_STATES.BOSS_WARNING) {
          this.state = GAME_STATES.BATTLE;
          this.spawnBoss(config.boss);
        }
      }, 2500);
    }
  }

  spawnBoss(bossId) {
    const def = ENEMY_DEFS[bossId];
    if (!def || this.bossSpawned) return;
    this.bossSpawned = true;

    const enemy = this.createEnemy(bossId, this.W * 0.5, this.H * 0.15);
    this.enemies.push(enemy);
  }

  spawnEnemy(typeId, x, y) {
    const enemy = this.createEnemy(typeId, x, y);
    this.enemies.push(enemy);
  }

  createEnemy(typeId, x, y) {
    const def = ENEMY_DEFS[typeId] || ENEMY_DEFS.slime;
    return {
      id: Math.random(),
      type: typeId,
      x: x ?? (Math.random() < 0.5 ? -30 : this.W + 30),
      y: y ?? this.H * 0.1 + Math.random() * this.H * 0.8,
      hp: def.maxHP,
      maxHP: def.maxHP,
      moveSpeed: def.moveSpeed,
      damage: def.damage,
      defense: def.defense || 0,
      size: def.size,
      color: def.color,
      xp: def.xp,
      gold: def.gold,
      behavior: def.behavior,
      element: def.element || null,
      isUndead: def.isUndead || false,
      isBoss: def.isBoss || false,
      isFinalBoss: def.isFinalBoss || false,
      name: def.name,
      projectile: def.projectile || null,
      attackSpeed: def.attackSpeed || 0.8,
      onDeath: def.onDeath || null,
      onHit: def.onHit || null,
      leaveTrail: def.leaveTrail || null,
      statusEffects: {},
      dead: false,
      _contactTimer: 0,
      _attackTimer: 0,
      _erraticTimer: 0,
      _teleportTimer: 0,
      phasing: def.phasing || false,
      immunities: def.immunities || []
    };
  }

  spawnEnemyFromEdge() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: x = Math.random() * this.W; y = -30; break;
      case 1: x = this.W + 30; y = Math.random() * this.H; break;
      case 2: x = Math.random() * this.W; y = this.H + 30; break;
      case 3: x = -30; y = Math.random() * this.H; break;
    }
    return { x, y };
  }

  updateBattle() {
    const dt = this.dt;
    if (!this.player || this.state !== GAME_STATES.BATTLE) return;

    // Time freeze (Time Watch)
    if (this.timeFreeze) {
      this.timeFreezeDuration -= dt;
      if (this.timeFreezeDuration <= 0) this.timeFreeze = false;
    }

    // Time watch trigger
    const timeWatch = this.backpack.equippedItems.find(i => i.id === 'time_watch');
    if (timeWatch) {
      this.timeFreezeTimer += dt;
      const interval = timeWatch.stats.timeFreezeInterval || 20;
      if (this.timeFreezeTimer >= interval) {
        this.timeFreezeTimer = 0;
        this.timeFreeze = true;
        this.timeFreezeDuration = timeWatch.stats.timeFreezeDuration || 3;
        this.particles.addFloatingText(this.W/2, this.H/2 - 40, '⏱️ ZEITSTOP!', '#00CFFF', { bold: true, size: 24 });
      }
    }

    // Round timer
    this.roundTimer -= dt;
    if (this.roundTimer <= 0 && this.enemies.filter(e => !e.dead).length === 0) {
      this.endRound();
      return;
    }

    // HP regen
    const regen = (this.player.stats?.hpRegen || 0) + (this.player.levelRegenBonus || 0);
    if (regen > 0) {
      this.player.hp = Math.min(this.player.maxHP, this.player.hp + regen * dt);
    }

    // Hurt timer
    if (this.player.hurtTime > 0) this.player.hurtTime -= dt;

    // Synergy effects
    for (const syn of this.activeSynergies) {
      if (syn.effect) syn.effect(this.player, this);
    }

    // Fire aura
    const fAura = this.player.stats?.fireAuraDamage;
    if (fAura > 0) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (dist < (this.player.stats?.fireAuraRadius || 80)) {
          this.battleSystem.damageEnemy(e, fAura * dt, ELEMENTS.FIRE, this.player, null);
          this.battleSystem.applyStatusEffect(e, 'burn', { damage: 4, duration: 2 });
          this.particles.emit(e.x, e.y, ['#FF4500', '#FFD700'], 1, { minDecay: 3 });
        }
      }
    }

    // Ice aura
    const iAura = this.player.stats?.iceAuraSlow;
    if (iAura > 0) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (dist < (this.player.stats?.iceAuraRadius || 100)) {
          this.battleSystem.applyStatusEffect(e, 'slow', { amount: iAura, duration: 0.5 });
        }
      }
    }

    // Player movement
    if (!this.timeFreeze) {
      this.updatePlayerMovement(dt);
    }

    // Spawn enemies
    if (!this.timeFreeze) {
      this.updateSpawning(dt);
    }

    // Update enemies
    if (!this.timeFreeze) {
      for (const enemy of this.enemies) {
        if (enemy.dead) {
          enemy.deathTime = (enemy.deathTime || 0) + dt;
          continue;
        }
        this.battleSystem.updateEnemy(enemy, this.player, dt, this.W, this.H);

        // Poison trail
        if (enemy.leaveTrail) {
          if (!enemy._trailTimer) enemy._trailTimer = 0;
          enemy._trailTimer += dt;
          if (enemy._trailTimer > 0.5) {
            enemy._trailTimer = 0;
            this.poisonTrails.push({
              x: enemy.x, y: enemy.y, radius: 20,
              damage: enemy.leaveTrail.damage,
              duration: enemy.leaveTrail.duration,
              opacity: 1,
              element: enemy.leaveTrail.element
            });
          }
        }
      }
    }

    // Clean up dead enemies
    this.enemies = this.enemies.filter(e => !e.dead || e.deathTime < 0.3);

    // Update poison trails
    for (let i = this.poisonTrails.length - 1; i >= 0; i--) {
      const trail = this.poisonTrails[i];
      trail.duration -= dt;
      trail.opacity = trail.duration / 2;
      if (trail.duration <= 0) {
        this.poisonTrails.splice(i, 1);
        continue;
      }
      const dist = Math.hypot(this.player.x - trail.x, this.player.y - trail.y);
      if (dist < trail.radius + this.player.size) {
        trail._dmgTimer = (trail._dmgTimer || 0) + dt;
        if (trail._dmgTimer > 0.5) {
          trail._dmgTimer = 0;
          this.battleSystem.damagePlayer(this.player, trail.damage);
        }
      }
    }

    // Weapon system
    const weapons = this.backpack.equippedItems.filter(i => i.category && i.category.startsWith('weapon'));
    this.weaponSystem.update(dt, this.player, weapons, this.enemies);

    // Update player projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      this.weaponSystem.updateProjectile(proj, dt, this.enemies, this.W, this.H);

      if (proj.life <= 0 || proj.x < -50 || proj.x > this.W + 50 || proj.y < -50 || proj.y > this.H + 50) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Collision with enemies
      for (const enemy of this.enemies) {
        if (enemy.dead || proj.hitEnemies.has(enemy.id)) continue;
        const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
        if (dist < enemy.size + proj.size) {
          proj.hitEnemies.add(enemy.id);
          this.battleSystem.damageEnemy(enemy, proj.damage, proj.element, this.player, proj.item);
          if (proj.item?.onHit) proj.item.onHit(enemy, this.player, this);
          if (proj.onHitCallback) proj.onHitCallback(proj.x, proj.y);

          this.particles.emit(proj.x, proj.y, proj.color, 5);

          if (proj.piercing <= 0 && !proj.returning) {
            proj.life = 0;
          } else {
            proj.piercing--;
          }
        }
      }
    }

    // Update enemy projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const proj = this.enemyProjectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      if (proj.life <= 0 || proj.x < -50 || proj.x > this.W + 50 || proj.y < -50 || proj.y > this.H + 50) {
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      const dist = Math.hypot(proj.x - this.player.x, proj.y - this.player.y);
      if (dist < this.player.size + (proj.size || 6)) {
        this.battleSystem.damagePlayer(this.player, proj.damage);
        this.particles.emit(proj.x, proj.y, proj.color || '#F00', 4);
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // Bomb belt: explosion on dash
    if (this.player._dashExploded && this.backpack.equippedItems.find(i => i.id === 'bomb_belt')) {
      this.player._dashExploded = false;
      this.createExplosion(this.player._dashFromX, this.player._dashFromY, 80, 25, ELEMENTS.FIRE, this.player);
    }

    // Check round end (timer + all spawns dead)
    if (this.roundTimer <= 0 && this.enemies.filter(e => !e.dead).length === 0) {
      this.endRound();
    }
  }

  updatePlayerMovement(dt) {
    const p = this.player;
    let jx = this.input.joystickX;
    let jy = this.input.joystickY;
    const speed = (p.stats?.moveSpeed || p.moveSpeed || 120) * (1 + (p.levelMoveBonus || 0));

    // Dash
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.x += p.dashVx * dt;
      p.y += p.dashVy * dt;
    } else if (this.input.dashPressed && p.dashCooldown <= 0 && (jx !== 0 || jy !== 0)) {
      p._dashFromX = p.x;
      p._dashFromY = p.y;
      p._dashExploded = true;
      p.dashVx = jx * 500;
      p.dashVy = jy * 500;
      p.dashTimer = 0.15;
      p.dashCooldown = 1.5;
      this.particles.emit(p.x, p.y, '#FFD700', 10, { minSpeed: 100, maxSpeed: 250 });
      if (this.backpack.equippedItems.find(i => i.id === 'bomb_belt')) {
        this.createExplosion(p.x, p.y, 80, 25, ELEMENTS.FIRE, p);
      }
      this.input.dashPressed = false;
    } else {
      p.x += jx * speed * dt;
      p.y += jy * speed * dt;
    }

    if (p.dashCooldown > 0) p.dashCooldown -= dt;

    // Clamp to arena
    p.x = Math.max(p.size, Math.min(this.W - p.size, p.x));
    p.y = Math.max(p.size, Math.min(this.H - p.size, p.y));
  }

  updateSpawning(dt) {
    this.spawnTimer += dt;
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= this.spawnTimer) {
      const spawnDef = this.spawnQueue.shift();
      const { x, y } = this.spawnEnemyFromEdge();
      const enemy = this.createEnemy(spawnDef.type, x, y);
      if (spawnDef.elite) {
        enemy.hp *= 1.5;
        enemy.maxHP *= 1.5;
        enemy.damage *= 1.3;
        enemy.size += 4;
      }
      this.enemies.push(enemy);
    }
  }

  endRound() {
    const config = WAVE_CONFIGS[this.currentRound - 1];
    if (!config) return;

    // Gold reward
    this.gold += config.goldReward;

    if (config.isFinal) {
      this.changeState(GAME_STATES.VICTORY);
      return;
    }

    this.currentRound++;
    if (this.currentRound > 15) {
      this.changeState(GAME_STATES.VICTORY);
      return;
    }

    this.changeState(GAME_STATES.SHOP);
  }

  gainXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToLevel) {
      this.xp -= this.xpToLevel;
      this.playerLevel++;
      this.xpToLevel = Math.floor(this.xpToLevel * 1.3 + 10);
      this.levelUpChoices = getRandomUpgrades(3);
      this.levelUpHovered = -1;
      // Pause battle, show level up
      this._prevState = this.state;
      this.state = GAME_STATES.LEVEL_UP;
    }
  }

  applyLevelUpChoice(index) {
    const upg = this.levelUpChoices[index];
    if (!upg) return;
    upg.apply(this.player, this);
    this.recomputePlayerStats();
    this.state = GAME_STATES.BATTLE;
    this.particles.addFloatingText(this.player.x, this.player.y - 50, upg.name, '#FFD700', { bold: true, size: 18 });
  }

  // ============================================================
  // UTILITY METHODS (called by weapons / synergies / items)
  // ============================================================
  applyStatusEffect(target, type, opts) {
    this.battleSystem.applyStatusEffect(target, type, opts);
  }

  damageEnemy(enemy, damage, element, player, item) {
    this.battleSystem.damageEnemy(enemy, damage, element, player || this.player, item);
  }

  chainLightning(startEnemy, count, range, damage) {
    let current = startEnemy;
    const hit = new Set([current.id]);

    for (let i = 0; i < count; i++) {
      let nearest = null, minDist = range + 1;
      for (const e of this.enemies) {
        if (e.dead || hit.has(e.id)) continue;
        const d = Math.hypot(e.x - current.x, e.y - current.y);
        if (d < minDist) { minDist = d; nearest = e; }
      }
      if (!nearest) break;
      hit.add(nearest.id);

      // Chain lightning visual
      this.particles.emit(
        (current.x + nearest.x) / 2,
        (current.y + nearest.y) / 2,
        ELEMENT_COLORS[ELEMENTS.LIGHTNING], 4
      );

      // Chain applies poison synergy
      if (this.player.synergyBonuses?.chainAppliesPoison) {
        this.applyStatusEffect(nearest, 'poison', { damage: this.player.synergyBonuses.chainPoisonDamage || 8, duration: 4 });
      }

      this.damageEnemy(nearest, damage, ELEMENTS.LIGHTNING, this.player, null);
      current = nearest;
    }
  }

  createExplosion(x, y, radius, damage, element, player) {
    this.particles.emitExplosion(x, y, element, radius);
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist < radius) {
        const falloff = 1 - dist / radius;
        this.damageEnemy(e, Math.floor(damage * (0.5 + falloff * 0.5)), element, player || this.player, null);
        if (element === ELEMENTS.FIRE) this.applyStatusEffect(e, 'burn', { damage: 5, duration: 2 });
        if (element === ELEMENTS.ICE) this.applyStatusEffect(e, 'slow', { amount: 0.5, duration: 2 });
        if (element === ELEMENTS.POISON) this.applyStatusEffect(e, 'poison', { damage: 6, duration: 3 });
      }
    }
  }

  addFloatingText(x, y, text, color, opts) {
    this.particles.addFloatingText(x, y, text, color, opts);
  }

  addParticles(x, y, color, count) {
    this.particles.emit(x, y, color, count);
  }

  applyChaosBuffs(player, count) {
    const possibleBuffs = [
      () => { player.hp = Math.min(player.maxHP, player.hp + 20); this.addFloatingText(player.x, player.y - 30, '+20 HP', '#E74C3C'); },
      () => { player.levelDamageBonus = (player.levelDamageBonus || 0) + 0.1; this.addFloatingText(player.x, player.y - 30, '+10% DMG', '#FFD700'); },
      () => { player.levelSpeedBonus = (player.levelSpeedBonus || 0) + 0.1; this.addFloatingText(player.x, player.y - 30, '+10% ATK SPD', '#3498DB'); },
      () => { this.gold += 5; this.addFloatingText(player.x, player.y - 30, '+5G', '#FFD700'); },
      () => { player.levelMoveBonus = (player.levelMoveBonus || 0) + 0.15; this.addFloatingText(player.x, player.y - 30, '+15% SPEED', '#27AE60'); },
      () => { player.hp = Math.max(1, player.hp - 15); this.addFloatingText(player.x, player.y - 30, '-15 HP', '#E74C3C'); },
      () => { player.levelDamageBonus = (player.levelDamageBonus || 0) - 0.05; this.addFloatingText(player.x, player.y - 30, '-5% DMG', '#E74C3C'); },
    ];
    for (let i = 0; i < count; i++) {
      const buff = possibleBuffs[Math.floor(Math.random() * possibleBuffs.length)];
      buff();
    }
  }

  // ============================================================
  // INPUT
  // ============================================================
  setupInput() {
    const canvas = this.canvas;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickActive = false;
    this.joystickTouchId = null;

    // Touch controls
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        this.handlePointerDown(touch.clientX, touch.clientY, touch.identifier, e);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        this.handlePointerMove(touch.clientX, touch.clientY, touch.identifier);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        this.handlePointerUp(touch.clientX, touch.clientY, touch.identifier, e);
      }
    }, { passive: false });

    // Mouse controls (for desktop testing)
    canvas.addEventListener('mousedown', (e) => {
      this.handlePointerDown(e.clientX, e.clientY, 'mouse', e);
    });
    canvas.addEventListener('mousemove', (e) => {
      this.handlePointerMove(e.clientX, e.clientY, 'mouse');
    });
    canvas.addEventListener('mouseup', (e) => {
      this.handlePointerUp(e.clientX, e.clientY, 'mouse', e);
    });

    // Keyboard for desktop testing
    const keys = {};
    window.addEventListener('keydown', (e) => {
      keys[e.code] = true;
      if (e.code === 'Space') { this.input.dashPressed = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => {
      keys[e.code] = false;
    });

    // Keyboard movement
    setInterval(() => {
      if (this.state !== GAME_STATES.BATTLE) return;
      let jx = 0, jy = 0;
      if (keys['ArrowLeft'] || keys['KeyA']) jx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) jx += 1;
      if (keys['ArrowUp'] || keys['KeyW']) jy -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) jy += 1;
      const len = Math.hypot(jx, jy);
      if (len > 0) { jx /= len; jy /= len; }
      if (!this.joystickActive) {
        this.input.joystickX = jx;
        this.input.joystickY = jy;
      }
    }, 16);
  }

  handlePointerDown(px, py, id, event) {
    if (this.state === GAME_STATES.MENU) {
      this.handleMenuTap(px, py);
    } else if (this.state === GAME_STATES.SHOP) {
      this.handleShopPointerDown(px, py);
    } else if (this.state === GAME_STATES.BATTLE) {
      this.handleBattlePointerDown(px, py, id);
    } else if (this.state === GAME_STATES.LEVEL_UP) {
      this.handleLevelUpTap(px, py);
    } else if (this.state === GAME_STATES.GAME_OVER || this.state === GAME_STATES.VICTORY) {
      this.handleRestartTap(px, py);
    }
  }

  handlePointerMove(px, py, id) {
    if (this.state === GAME_STATES.BATTLE) {
      if (id === this.joystickTouchId && this.joystickActive) {
        const dx = px - this.joystickCenter.x;
        const dy = py - this.joystickCenter.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 60;
        if (dist > 0) {
          this.input.joystickX = dx / Math.max(dist, maxDist);
          this.input.joystickY = dy / Math.max(dist, maxDist);
        }
      }
    } else if (this.state === GAME_STATES.SHOP) {
      this.handleShopPointerMove(px, py);
    } else if (this.state === GAME_STATES.LEVEL_UP) {
      this.handleLevelUpMove(px, py);
    }
  }

  handlePointerUp(px, py, id, event) {
    if (this.state === GAME_STATES.SHOP) {
      this.handleShopPointerUp(px, py);
    }
    if (id === this.joystickTouchId) {
      this.joystickActive = false;
      this.joystickTouchId = null;
      this.input.joystickX = 0;
      this.input.joystickY = 0;
    }
  }

  handleMenuTap(px, py) {
    const w = this.W, h = this.H;
    const cardW = Math.min(170, (w - 60) / 3);
    const cardH = cardW * 1.5;
    const startX = w/2 - (cardW * 1.5 + 20);
    const cardY = h * 0.35;

    // Character select
    for (let i = 0; i < this.characters.length; i++) {
      const cx = startX + i * (cardW + 20);
      if (px >= cx && px <= cx + cardW && py >= cardY && py <= cardY + cardH) {
        this.selectedCharIndex = i;
        return;
      }
    }

    // Start button
    const btnY = h * 0.82;
    if (px >= w/2 - 110 && px <= w/2 + 110 && py >= btnY - 27 && py <= btnY + 27) {
      this.startGame(this.selectedCharIndex);
    }
  }

  handleBattlePointerDown(px, py, id) {
    // Right side = dash
    if (px > this.W * 0.7) {
      this.input.dashPressed = true;
      return;
    }
    // Left side = joystick
    this.joystickCenter = { x: px, y: py };
    this.joystickActive = true;
    this.joystickTouchId = id;
    this.input.joystickX = 0;
    this.input.joystickY = 0;
  }

  handleLevelUpTap(px, py) {
    const w = this.W, h = this.H;
    const cardW = Math.min(200, (w - 60) / 3);
    const cardH = cardW * 1.4;
    const startX = w/2 - (cardW * 1.5 + 20);
    const cardY = h * 0.28;

    for (let i = 0; i < this.levelUpChoices.length; i++) {
      const cx = startX + i * (cardW + 20);
      if (px >= cx && px <= cx + cardW && py >= cardY && py <= cardY + cardH) {
        this.applyLevelUpChoice(i);
        return;
      }
    }
  }

  handleLevelUpMove(px, py) {
    const w = this.W, h = this.H;
    const cardW = Math.min(200, (w - 60) / 3);
    const cardH = cardW * 1.4;
    const startX = w/2 - (cardW * 1.5 + 20);
    const cardY = h * 0.28;
    this.levelUpHovered = -1;
    for (let i = 0; i < this.levelUpChoices.length; i++) {
      const cx = startX + i * (cardW + 20);
      if (px >= cx && px <= cx + cardW && py >= cardY && py <= cardY + cardH) {
        this.levelUpHovered = i;
        break;
      }
    }
  }

  handleRestartTap(px, py) {
    const w = this.W, h = this.H;
    const btnY = h * 0.7;
    if (px >= w/2 - 100 && px <= w/2 + 100 && py >= btnY - 25 && py <= btnY + 25) {
      this.state = GAME_STATES.MENU;
    }
  }

  // Shop interaction
  handleShopPointerDown(px, py) {
    const bp = this.backpack;
    const gs = this;

    // Check if clicking on equipped item (to start drag)
    for (const item of bp.equippedItems) {
      const cells = bp.getItemCells(item);
      for (const cell of cells) {
        const cellX = bp.gridOriginX + cell.col * bp.cellSize;
        const cellY = bp.gridOriginY + cell.row * bp.cellSize;
        if (px >= cellX && px <= cellX + bp.cellSize && py >= cellY && py <= cellY + bp.cellSize) {
          // Start dragging
          bp.dragItem = item;
          bp.removeItem(item);
          bp.dragX = px;
          bp.dragY = py;
          this._shopDragging = true;
          return;
        }
      }
    }

    // Check shop items
    const shopX = bp.gridOriginX + bp.cellSize * BACKPACK_COLS + 15;
    const shopW = this.W - shopX - 10;
    const itemH = Math.min(80, (this.H - bp.gridOriginY - 50 - 90) / Math.max(this.shop.items.length, 1));
    const shopItemY0 = bp.gridOriginY - 40 + 34;

    for (let i = 0; i < this.shop.items.length; i++) {
      const item = this.shop.items[i];
      const iy = shopItemY0 + i * (itemH + 4);
      if (px >= shopX + 4 && px <= shopX + shopW - 4 && py >= iy && py <= iy + itemH - 2) {
        if (this.shop.sellMode) {
          // Can't sell shop items
        } else {
          const result = this.shop.buyItem(item);
          if (!result.success) {
            this.particles.addFloatingText(px, py - 20, result.reason, '#E74C3C');
          }
        }
        return;
      }
    }

    // Reroll button
    const btnY0 = bp.gridOriginY - 40 + this.H - bp.gridOriginY + 30 - 50;
    const midX = shopX + shopW / 2;
    if (px >= midX - 100 && px <= midX - 10 && py >= btnY0 - 18 && py <= btnY0 + 18) {
      this.shop.reroll(this.player);
      return;
    }

    // Sell mode button
    if (px >= midX + 10 && px <= midX + 100 && py >= btnY0 - 18 && py <= btnY0 + 18) {
      this.shop.sellMode = !this.shop.sellMode;
      return;
    }

    // Sell equipped item (if sell mode)
    if (this.shop.sellMode) {
      for (const item of [...bp.equippedItems]) {
        const cells = bp.getItemCells(item);
        for (const cell of cells) {
          const cellX = bp.gridOriginX + cell.col * bp.cellSize;
          const cellY = bp.gridOriginY + cell.row * bp.cellSize;
          if (px >= cellX && px <= cellX + bp.cellSize && py >= cellY && py <= cellY + bp.cellSize) {
            const price = this.shop.sellItem(item, this.player);
            this.particles.addFloatingText(cellX + bp.cellSize/2, cellY, `+${price}G`, '#FFD700');
            this.shop.sellMode = false;
            return;
          }
        }
      }
    }

    // Proceed to battle button (if no items being dragged)
    const gridW = bp.cellSize * BACKPACK_COLS;
    const gridH = bp.cellSize * BACKPACK_ROWS;
    const battleBtnY = bp.gridOriginY + gridH + 45;
    if (px >= bp.gridOriginX && px <= bp.gridOriginX + gridW && py >= battleBtnY - 20 && py <= battleBtnY + 20) {
      this.changeState(GAME_STATES.BATTLE);
    }
  }

  handleShopPointerMove(px, py) {
    const bp = this.backpack;

    if (bp.dragItem) {
      bp.dragX = px;
      bp.dragY = py;
    }

    // Hover shop items
    const shopX = bp.gridOriginX + bp.cellSize * BACKPACK_COLS + 15;
    const shopW = this.W - shopX - 10;
    const itemH = Math.min(80, (this.H - bp.gridOriginY - 50 - 90) / Math.max(this.shop.items.length, 1));
    const shopItemY0 = bp.gridOriginY - 40 + 34;
    this.shop.hoveredItem = null;

    for (let i = 0; i < this.shop.items.length; i++) {
      const item = this.shop.items[i];
      const iy = shopItemY0 + i * (itemH + 4);
      if (px >= shopX + 4 && px <= shopX + shopW - 4 && py >= iy && py <= iy + itemH - 2) {
        this.shop.hoveredItem = item;
        break;
      }
    }
  }

  handleShopPointerUp(px, py) {
    const bp = this.backpack;
    if (!bp.dragItem) return;

    const { col, row } = bp.pixelToCell(px, py);
    if (bp.canPlace(bp.dragItem, row, col)) {
      bp.placeItem(bp.dragItem, row, col);
    } else {
      // Return to original position or auto-place
      if (!bp.autoPlace(bp.dragItem)) {
        // Drop it (remove from game) - not ideal, let's just try to place anywhere
      }
    }

    bp.dragItem = null;
    this._shopDragging = false;
    this.recomputePlayerStats();
  }
}

// ============================================================
// START GAME
// ============================================================
window.addEventListener('load', () => {
  window.game = new Game();
});
