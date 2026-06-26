'use strict';

// ============================================================
// ENEMY DEFINITIONS - 22 enemy types + 8 bosses
// ============================================================

const ENEMY_DEFS = {
  // --- BASIC ENEMIES ---
  slime: {
    id: 'slime', name: 'Schleim',
    maxHP: 40, moveSpeed: 50, damage: 6, defense: 0,
    size: 18, color: '#2ECC71', xp: 3, gold: 1,
    behavior: 'chase',
    sprite: 'slime'
  },
  bat: {
    id: 'bat', name: 'Fledermaus',
    maxHP: 20, moveSpeed: 110, damage: 5, defense: 0,
    size: 14, color: '#8E44AD', xp: 3, gold: 1,
    behavior: 'erratic',
    sprite: 'bat'
  },
  skeleton: {
    id: 'skeleton', name: 'Skelett',
    maxHP: 55, moveSpeed: 65, damage: 10, defense: 2,
    size: 20, color: '#ECF0F1', xp: 5, gold: 2,
    behavior: 'chase',
    immunities: [],
    sprite: 'skeleton',
    isUndead: true
  },
  zombie: {
    id: 'zombie', name: 'Zombie',
    maxHP: 90, moveSpeed: 35, damage: 15, defense: 3,
    size: 22, color: '#27AE60', xp: 6, gold: 2,
    behavior: 'chase',
    sprite: 'zombie',
    isUndead: true
  },
  ghost: {
    id: 'ghost', name: 'Geist',
    maxHP: 35, moveSpeed: 80, damage: 8, defense: 0,
    size: 18, color: '#BDC3C7', xp: 5, gold: 2,
    behavior: 'phasing',
    sprite: 'ghost',
    isUndead: true,
    phasing: true // ignores walls
  },
  goblin: {
    id: 'goblin', name: 'Goblin',
    maxHP: 45, moveSpeed: 95, damage: 9, defense: 1,
    size: 16, color: '#E74C3C', xp: 5, gold: 2,
    behavior: 'dodge',
    sprite: 'goblin'
  },
  orc: {
    id: 'orc', name: 'Ork',
    maxHP: 130, moveSpeed: 45, damage: 18, defense: 8,
    size: 28, color: '#16A085', xp: 10, gold: 3,
    behavior: 'chase',
    sprite: 'orc'
  },
  spider: {
    id: 'spider', name: 'Spinne',
    maxHP: 35, moveSpeed: 85, damage: 7, defense: 0,
    size: 16, color: '#8E44AD', xp: 4, gold: 1,
    behavior: 'chase',
    sprite: 'spider',
    onDeath: (enemy, gs) => {
      // Spawn 2 mini spiders
      for (let i = 0; i < 2; i++) {
        gs.spawnEnemy('mini_spider', enemy.x + (Math.random()-0.5)*40, enemy.y + (Math.random()-0.5)*40);
      }
    }
  },
  mini_spider: {
    id: 'mini_spider', name: 'Kleinspinne',
    maxHP: 15, moveSpeed: 100, damage: 4, defense: 0,
    size: 10, color: '#6C3483', xp: 1, gold: 0,
    behavior: 'erratic',
    sprite: 'spider'
  },
  witch: {
    id: 'witch', name: 'Hexe',
    maxHP: 60, moveSpeed: 55, damage: 14, defense: 0,
    size: 20, color: '#8E44AD', xp: 8, gold: 3,
    behavior: 'ranged_orbit',
    projectile: { speed: 220, damage: 14, range: 350, element: ELEMENTS.CHAOS },
    attackSpeed: 1.2,
    sprite: 'witch'
  },
  knight: {
    id: 'knight', name: 'Ritter',
    maxHP: 180, moveSpeed: 50, damage: 20, defense: 15,
    size: 26, color: '#7F8C8D', xp: 12, gold: 4,
    behavior: 'chase',
    sprite: 'knight'
  },
  fire_imp: {
    id: 'fire_imp', name: 'Feuerling',
    maxHP: 50, moveSpeed: 90, damage: 12, defense: 0,
    size: 16, color: '#E74C3C', xp: 6, gold: 2,
    behavior: 'erratic',
    element: ELEMENTS.FIRE,
    onDeath: (enemy, gs) => {
      gs.createExplosion(enemy.x, enemy.y, 80, 15, ELEMENTS.FIRE, null);
    },
    sprite: 'fire_imp'
  },
  ice_golem_small: {
    id: 'ice_golem_small', name: 'Eisgolem',
    maxHP: 120, moveSpeed: 35, damage: 16, defense: 10,
    size: 26, color: '#00CFFF', xp: 10, gold: 3,
    behavior: 'chase',
    element: ELEMENTS.ICE,
    sprite: 'ice_golem'
  },
  thunder_elemental: {
    id: 'thunder_elemental', name: 'Blitzelementar',
    maxHP: 70, moveSpeed: 75, damage: 15, defense: 0,
    size: 20, color: '#FFD700', xp: 8, gold: 3,
    behavior: 'ranged_chase',
    element: ELEMENTS.LIGHTNING,
    projectile: { speed: 350, damage: 15, range: 300, element: ELEMENTS.LIGHTNING },
    attackSpeed: 1.0,
    sprite: 'thunder_elemental'
  },
  poison_slug: {
    id: 'poison_slug', name: 'Giftschnecke',
    maxHP: 80, moveSpeed: 30, damage: 8, defense: 2,
    size: 20, color: '#39FF14', xp: 6, gold: 2,
    behavior: 'chase',
    element: ELEMENTS.POISON,
    onHit: (target, gs) => {
      gs.applyStatusEffect(target, 'poison', { damage: 5, duration: 4 });
    },
    leaveTrail: { element: ELEMENTS.POISON, damage: 3, duration: 2 },
    sprite: 'slug'
  },
  shadow_wraith: {
    id: 'shadow_wraith', name: 'Schattengeist',
    maxHP: 55, moveSpeed: 85, damage: 14, defense: 0,
    size: 18, color: '#9B59B6', xp: 8, gold: 3,
    behavior: 'teleport_chase',
    element: ELEMENTS.SHADOW,
    sprite: 'wraith',
    isUndead: true
  },
  blood_cultist: {
    id: 'blood_cultist', name: 'Blutkulistist',
    maxHP: 65, moveSpeed: 60, damage: 12, defense: 2,
    size: 20, color: '#C0392B', xp: 9, gold: 3,
    behavior: 'sacrifice',
    element: ELEMENTS.BLOOD,
    sprite: 'cultist'
  },
  void_walker: {
    id: 'void_walker', name: 'Leerewanderer',
    maxHP: 85, moveSpeed: 65, damage: 18, defense: 5,
    size: 22, color: '#1a0030', xp: 12, gold: 4,
    behavior: 'teleport_chase',
    element: ELEMENTS.VOID,
    sprite: 'void_walker',
    phasing: true
  },

  // --- BOSSES ---
  dragon_boss: {
    id: 'dragon_boss', name: 'DRACHE',
    maxHP: 1200, moveSpeed: 55, damage: 35, defense: 15,
    size: 55, color: '#E74C3C', xp: 100, gold: 20,
    behavior: 'boss_dragon',
    element: ELEMENTS.FIRE,
    isBoss: true,
    phases: [
      { hpThreshold: 1.0, pattern: 'breath' },
      { hpThreshold: 0.6, pattern: 'breath_plus_stomp' },
      { hpThreshold: 0.3, pattern: 'enrage' }
    ],
    sprite: 'dragon'
  },
  ice_queen: {
    id: 'ice_queen', name: 'EISKÖNIGIN',
    maxHP: 1000, moveSpeed: 45, damage: 28, defense: 20,
    size: 48, color: '#00CFFF', xp: 100, gold: 20,
    behavior: 'boss_ice',
    element: ELEMENTS.ICE,
    isBoss: true,
    phases: [
      { hpThreshold: 1.0, pattern: 'blizzard' },
      { hpThreshold: 0.5, pattern: 'summon_golems' },
      { hpThreshold: 0.2, pattern: 'deep_freeze' }
    ],
    sprite: 'ice_queen'
  },
  necromancer_boss: {
    id: 'necromancer_boss', name: 'NEKROMANT',
    maxHP: 900, moveSpeed: 35, damage: 25, defense: 10,
    size: 45, color: '#8E44AD', xp: 100, gold: 20,
    behavior: 'boss_necro',
    element: ELEMENTS.SHADOW,
    isBoss: true,
    isUndead: true,
    phases: [
      { hpThreshold: 1.0, pattern: 'summon' },
      { hpThreshold: 0.6, pattern: 'death_nova' },
      { hpThreshold: 0.3, pattern: 'lich_form' }
    ],
    sprite: 'necromancer'
  },
  chaos_titan: {
    id: 'chaos_titan', name: 'CHAOS-TITAN',
    maxHP: 1500, moveSpeed: 40, damage: 40, defense: 12,
    size: 60, color: '#FF00FF', xp: 150, gold: 30,
    behavior: 'boss_chaos',
    element: ELEMENTS.CHAOS,
    isBoss: true,
    phases: [
      { hpThreshold: 1.0, pattern: 'random_blasts' },
      { hpThreshold: 0.7, pattern: 'element_storm' },
      { hpThreshold: 0.4, pattern: 'chaos_form' },
      { hpThreshold: 0.15, pattern: 'last_stand' }
    ],
    sprite: 'chaos_titan'
  },
  void_overlord: {
    id: 'void_overlord', name: 'LEERE-HERRSCHER',
    maxHP: 2000, moveSpeed: 50, damage: 45, defense: 20,
    size: 65, color: '#1a0030', xp: 200, gold: 40,
    behavior: 'boss_void',
    element: ELEMENTS.VOID,
    isBoss: true,
    isFinalBoss: true,
    phases: [
      { hpThreshold: 1.0, pattern: 'void_pull' },
      { hpThreshold: 0.75, pattern: 'void_portals' },
      { hpThreshold: 0.5, pattern: 'reality_shatter' },
      { hpThreshold: 0.25, pattern: 'true_form' }
    ],
    sprite: 'void_overlord'
  }
};

// Wave enemy pools by difficulty
const ENEMY_POOLS = {
  early: ['slime', 'bat', 'skeleton', 'zombie'],
  mid: ['slime', 'bat', 'skeleton', 'zombie', 'ghost', 'goblin', 'orc', 'spider', 'witch', 'fire_imp'],
  hard: ['orc', 'spider', 'witch', 'knight', 'fire_imp', 'ice_golem_small', 'thunder_elemental', 'poison_slug', 'shadow_wraith'],
  late: ['knight', 'ice_golem_small', 'thunder_elemental', 'shadow_wraith', 'blood_cultist', 'void_walker'],
};
