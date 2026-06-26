'use strict';

// ============================================================
// ITEM DEFINITIONS - 70+ items with shapes, stats, effects
// Shape: 2D array where 1 = occupied cell (row-major, top-left origin)
// ============================================================

const ELEMENTS = {
  FIRE: 'fire', ICE: 'ice', LIGHTNING: 'lightning',
  POISON: 'poison', HOLY: 'holy', SHADOW: 'shadow',
  PHYSICAL: 'physical', CHAOS: 'chaos', BLOOD: 'blood', VOID: 'void'
};

const ELEMENT_COLORS = {
  fire: '#FF4500', ice: '#00CFFF', lightning: '#FFD700',
  poison: '#39FF14', holy: '#FFE082', shadow: '#9B59B6',
  physical: '#BDC3C7', chaos: '#FF00FF', blood: '#C0392B', void: '#1a0030'
};

const RARITIES = {
  common:   { label: 'Gewöhnlich',   color: '#AAAAAA', weight: 55, glowColor: '#666' },
  uncommon: { label: 'Ungewöhnlich', color: '#2ECC71', weight: 28, glowColor: '#1a7a40' },
  rare:     { label: 'Selten',       color: '#3498DB', weight: 13, glowColor: '#1a4a7a' },
  epic:     { label: 'Episch',       color: '#9B59B6', weight: 4,  glowColor: '#5a1a80' }
};

const ITEM_CATEGORIES = {
  WEAPON_MELEE: 'weapon_melee',
  WEAPON_RANGED: 'weapon_ranged',
  WEAPON_MAGIC: 'weapon_magic',
  WEAPON_ORBITAL: 'weapon_orbital',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
  RELIC: 'relic',
  GEM: 'gem',
  CONSUMABLE: 'consumable'
};

// Helper to create item
function makeItem(id, name, shape, category, element, rarity, cost, desc, stats, tags, adjacency, onEquip, onRound, onKill, onHit, onLowHP) {
  return {
    id, name, shape, category, element,
    rarity: rarity || 'common',
    cost: cost || 2,
    description: desc || '',
    stats: stats || {},
    tags: tags || [],
    adjacencyBonus: adjacency || null,
    onEquip: onEquip || null,
    onRound: onRound || null,
    onKill: onKill || null,
    onHit: onHit || null,
    onLowHP: onLowHP || null,
    equipped: false,
    gridPos: null,
    rotation: 0
  };
}

// ============================================================
// WEAPONS - MELEE
// ============================================================
const ITEM_DEFS = [

  // --- MELEE WEAPONS ---
  {
    id: 'rusty_sword', name: 'Rostiges Schwert',
    shape: [[1],[1]], // 1x2
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.PHYSICAL, rarity: 'common', cost: 1,
    description: 'Ein altes Schwert. Dreht sich um den Spieler.',
    stats: { damage: 12, attackSpeed: 1.0, range: 80 },
    tags: ['sword', 'melee'],
    weaponBehavior: 'spin',
    adjacencyBonus: { sword: { damage: 3 }, melee: { attackSpeed: 0.05 } }
  },
  {
    id: 'fire_sword', name: 'Feuerschwert',
    shape: [[1],[1],[1]], // 1x3
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.FIRE, rarity: 'uncommon', cost: 3,
    description: 'Verursacht Verbrennungsschaden über Zeit.',
    stats: { damage: 18, attackSpeed: 1.0, range: 85, burnDamage: 5, burnDuration: 3 },
    tags: ['sword', 'melee', 'fire'],
    weaponBehavior: 'spin',
    onHit: (target, player, gs) => {
      if (Math.random() < 0.6) gs.applyStatusEffect(target, 'burn', { damage: 5, duration: 3 });
    },
    adjacencyBonus: { fire: { damage: 5 }, sword: { attackSpeed: 0.08 } }
  },
  {
    id: 'ice_blade', name: 'Eisklinge',
    shape: [[1],[1],[1]], // 1x3
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.ICE, rarity: 'uncommon', cost: 3,
    description: 'Verlangsamt getroffene Gegner.',
    stats: { damage: 15, attackSpeed: 0.9, range: 85, slowAmount: 0.4, slowDuration: 2 },
    tags: ['sword', 'melee', 'ice'],
    weaponBehavior: 'spin',
    onHit: (target, player, gs) => {
      if (Math.random() < 0.7) gs.applyStatusEffect(target, 'slow', { amount: 0.4, duration: 2 });
    },
    adjacencyBonus: { ice: { slowAmount: 0.1 }, sword: { damage: 3 } }
  },
  {
    id: 'thunder_hammer', name: 'Donnerkeule',
    shape: [[1,1],[1,0]], // L-shape 2x2
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.LIGHTNING, rarity: 'rare', cost: 5,
    description: 'Kettenschaden zu 2 weiteren Gegnern.',
    stats: { damage: 25, attackSpeed: 0.7, range: 90, chainCount: 2, chainRange: 150 },
    tags: ['hammer', 'melee', 'lightning'],
    weaponBehavior: 'spin',
    onHit: (target, player, gs) => {
      gs.chainLightning(target, player.items['thunder_hammer']?.stats.chainCount || 2, 150, 12);
    },
    adjacencyBonus: { lightning: { chainCount: 1 }, hammer: { damage: 8 } }
  },
  {
    id: 'shadow_dagger', name: 'Schattendolch',
    shape: [[1],[1]], // 1x2
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.SHADOW, rarity: 'uncommon', cost: 3,
    description: 'Sehr schnell. Stiehlt Leben.',
    stats: { damage: 8, attackSpeed: 2.5, range: 65, lifeSteal: 0.2 },
    tags: ['dagger', 'melee', 'shadow', 'lifesteal'],
    weaponBehavior: 'spin',
    onHit: (target, player, gs) => {
      const heal = 8 * 0.2;
      player.hp = Math.min(player.maxHP, player.hp + heal);
      gs.addFloatingText(player.x, player.y - 20, `+${Math.floor(heal)}`, '#C0392B');
    },
    adjacencyBonus: { shadow: { lifeSteal: 0.05 }, dagger: { attackSpeed: 0.2 } }
  },
  {
    id: 'holy_cross', name: 'Heiliges Kreuz',
    shape: [[0,1,0],[1,1,1],[0,1,0]], // plus-shape
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.HOLY, rarity: 'rare', cost: 5,
    description: 'Schießt in alle 4 Richtungen. Heilt bei Kills.',
    stats: { damage: 20, attackSpeed: 1.1, range: 100 },
    tags: ['cross', 'melee', 'holy', 'heal'],
    weaponBehavior: 'cross_shot',
    onKill: (enemy, player, gs) => {
      const heal = 8;
      player.hp = Math.min(player.maxHP, player.hp + heal);
      gs.addFloatingText(player.x, player.y - 30, `+${heal} HP`, '#FFE082');
    },
    adjacencyBonus: { holy: { damage: 6, heal: 2 }, cross: { damage: 5 } }
  },
  {
    id: 'poison_scythe', name: 'Giftense',
    shape: [[1,1],[0,1],[0,1]], // 2x3 L
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.POISON, rarity: 'rare', cost: 4,
    description: 'Große Reichweite. Vergiftet alle Feinde im Bereich.',
    stats: { damage: 14, attackSpeed: 0.8, range: 120, poisonDamage: 8, poisonDuration: 4, areaHit: true },
    tags: ['scythe', 'melee', 'poison', 'area'],
    weaponBehavior: 'spin_area',
    onHit: (target, player, gs) => {
      gs.applyStatusEffect(target, 'poison', { damage: 8, duration: 4 });
    },
    adjacencyBonus: { poison: { poisonDamage: 3 }, scythe: { range: 15 } }
  },
  {
    id: 'blood_axe', name: 'Blutaxt',
    shape: [[1,1],[1,1]], // 2x2
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.BLOOD, rarity: 'rare', cost: 5,
    description: 'Hoher Schaden. Massives Lebensraub.',
    stats: { damage: 30, attackSpeed: 0.75, range: 90, lifeSteal: 0.35 },
    tags: ['axe', 'melee', 'blood', 'lifesteal'],
    weaponBehavior: 'spin',
    onHit: (target, player, gs) => {
      const heal = 30 * 0.35;
      player.hp = Math.min(player.maxHP, player.hp + heal);
      gs.addFloatingText(player.x, player.y - 20, `+${Math.floor(heal)}`, '#C0392B');
    },
    adjacencyBonus: { blood: { lifeSteal: 0.08 }, axe: { damage: 10 } }
  },
  {
    id: 'bone_club', name: 'Knochenkeule',
    shape: [[1],[1],[1],[1]], // 1x4
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.PHYSICAL, rarity: 'common', cost: 2,
    description: 'Schleudert Feinde weg (Knockback).',
    stats: { damage: 20, attackSpeed: 0.7, range: 80, knockback: 200 },
    tags: ['club', 'melee', 'physical', 'knockback'],
    weaponBehavior: 'spin',
    adjacencyBonus: { physical: { damage: 4 }, club: { knockback: 50 } }
  },
  {
    id: 'void_scalpel', name: 'Leerenskalpell',
    shape: [[1,0],[1,1],[0,1]], // S-shape
    category: ITEM_CATEGORIES.WEAPON_MELEE,
    element: ELEMENTS.VOID, rarity: 'epic', cost: 8,
    description: 'Jeder Kill explodiert in Leerenergie (AoE).',
    stats: { damage: 22, attackSpeed: 1.4, range: 80, voidExplosionRadius: 120, voidExplosionDamage: 15 },
    tags: ['blade', 'melee', 'void', 'explosion'],
    weaponBehavior: 'spin',
    onKill: (enemy, player, gs) => {
      gs.createExplosion(enemy.x, enemy.y, 120, 15, ELEMENTS.VOID, player);
      gs.addParticles(enemy.x, enemy.y, '#9B59B6', 15);
    },
    adjacencyBonus: { void: { voidExplosionDamage: 5 }, blade: { attackSpeed: 0.15 } }
  },

  // --- RANGED WEAPONS ---
  {
    id: 'basic_bow', name: 'Einfacher Bogen',
    shape: [[1],[1],[1]], // 1x3
    category: ITEM_CATEGORIES.WEAPON_RANGED,
    element: ELEMENTS.PHYSICAL, rarity: 'common', cost: 2,
    description: 'Schießt Pfeile auf den nächsten Feind.',
    stats: { damage: 14, attackSpeed: 1.2, projectileSpeed: 350, range: 400, piercing: 1 },
    tags: ['bow', 'ranged', 'physical', 'arrow'],
    weaponBehavior: 'arrow',
    adjacencyBonus: { bow: { damage: 3 }, ranged: { attackSpeed: 0.1 } }
  },
  {
    id: 'fire_arrow', name: 'Feuerpfeil',
    shape: [[0,1],[1,1],[0,1]], // T-shape
    category: ITEM_CATEGORIES.WEAPON_RANGED,
    element: ELEMENTS.FIRE, rarity: 'uncommon', cost: 3,
    description: 'Pfeile explodieren beim Aufprall.',
    stats: { damage: 16, attackSpeed: 1.0, projectileSpeed: 320, range: 380, explosionRadius: 70 },
    tags: ['bow', 'ranged', 'fire', 'arrow', 'explosion'],
    weaponBehavior: 'arrow_explode',
    adjacencyBonus: { fire: { explosionRadius: 15 }, bow: { attackSpeed: 0.08 } }
  },
  {
    id: 'ice_arrow', name: 'Eispfeil',
    shape: [[0,1],[1,1],[0,1]],
    category: ITEM_CATEGORIES.WEAPON_RANGED,
    element: ELEMENTS.ICE, rarity: 'uncommon', cost: 3,
    description: 'Friert Feinde ein (1 Sek.).',
    stats: { damage: 12, attackSpeed: 0.9, projectileSpeed: 300, range: 380, freezeDuration: 1.5 },
    tags: ['bow', 'ranged', 'ice', 'arrow', 'freeze'],
    weaponBehavior: 'arrow',
    onHit: (target, player, gs) => {
      gs.applyStatusEffect(target, 'freeze', { duration: 1.5 });
    },
    adjacencyBonus: { ice: { freezeDuration: 0.5 }, bow: { damage: 3 } }
  },
  {
    id: 'lightning_bolt', name: 'Blitzstrahl',
    shape: [[1,1],[1,0]], // 2x2 corner
    category: ITEM_CATEGORIES.WEAPON_RANGED,
    element: ELEMENTS.LIGHTNING, rarity: 'uncommon', cost: 4,
    description: 'Kettenblitz trifft 3 Feinde.',
    stats: { damage: 18, attackSpeed: 1.1, projectileSpeed: 500, range: 350, chainCount: 3, chainRange: 140 },
    tags: ['bolt', 'ranged', 'lightning', 'chain'],
    weaponBehavior: 'chain_lightning',
    adjacencyBonus: { lightning: { chainCount: 1 }, bolt: { damage: 5 } }
  },
  {
    id: 'poison_arrow', name: 'Giftpfeil',
    shape: [[0,1],[1,1],[0,1]],
    category: ITEM_CATEGORIES.WEAPON_RANGED,
    element: ELEMENTS.POISON, rarity: 'common', cost: 2,
    description: 'Langanhaltender Giftschaden.',
    stats: { damage: 8, attackSpeed: 1.3, projectileSpeed: 320, range: 400, poisonDamage: 6, poisonDuration: 5 },
    tags: ['bow', 'ranged', 'poison', 'arrow'],
    weaponBehavior: 'arrow',
    onHit: (target, player, gs) => {
      gs.applyStatusEffect(target, 'poison', { damage: 6, duration: 5 });
    },
    adjacencyBonus: { poison: { poisonDuration: 1 }, bow: { attackSpeed: 0.08 } }
  },
  {
    id: 'holy_arrow', name: 'Heilspfeil',
    shape: [[0,1],[1,1],[0,1]],
    category: ITEM_CATEGORIES.WEAPON_RANGED,
    element: ELEMENTS.HOLY, rarity: 'uncommon', cost: 3,
    description: 'Pfeile prallen ab. Doppelschaden an Untoten.',
    stats: { damage: 15, attackSpeed: 1.0, projectileSpeed: 350, range: 400, bounceCount: 2, undeadBonus: 2.0 },
    tags: ['bow', 'ranged', 'holy', 'arrow', 'bounce'],
    weaponBehavior: 'arrow_bounce',
    adjacencyBonus: { holy: { bounceCount: 1 }, bow: { damage: 4 } }
  },
  {
    id: 'shadow_shot', name: 'Schattenschuss',
    shape: [[1,1],[1,0]],
    category: ITEM_CATEGORIES.WEAPON_RANGED,
    element: ELEMENTS.SHADOW, rarity: 'uncommon', cost: 3,
    description: 'Durchdringt alle Feinde. Verursacht Dunkelheit.',
    stats: { damage: 16, attackSpeed: 0.9, projectileSpeed: 400, range: 500, piercing: 99 },
    tags: ['shadow', 'ranged', 'physical'],
    weaponBehavior: 'arrow',
    adjacencyBonus: { shadow: { damage: 5 }, ranged: { attackSpeed: 0.1 } }
  },
  {
    id: 'multishot_bow', name: 'Mehrfachbogen',
    shape: [[1,0,1],[1,1,1]], // 3x2
    category: ITEM_CATEGORIES.WEAPON_RANGED,
    element: ELEMENTS.PHYSICAL, rarity: 'rare', cost: 5,
    description: 'Schießt 3 Pfeile gleichzeitig.',
    stats: { damage: 12, attackSpeed: 1.0, projectileSpeed: 340, range: 380, projectileCount: 3, spreadAngle: 20 },
    tags: ['bow', 'ranged', 'physical', 'multishot'],
    weaponBehavior: 'multishot',
    adjacencyBonus: { bow: { projectileCount: 1 }, ranged: { damage: 3 } }
  },
  {
    id: 'sniper_crossbow', name: 'Scharfschützenarmbrust',
    shape: [[1,1,1],[0,1,0]], // T-form 3x2
    category: ITEM_CATEGORIES.WEAPON_RANGED,
    element: ELEMENTS.PHYSICAL, rarity: 'rare', cost: 5,
    description: 'Enormer Schaden, langsames Feuern. 3x Krit an weit entfernten Feinden.',
    stats: { damage: 55, attackSpeed: 0.4, projectileSpeed: 700, range: 600, critMultiplier: 3.0 },
    tags: ['crossbow', 'ranged', 'physical', 'crit'],
    weaponBehavior: 'arrow',
    adjacencyBonus: { crossbow: { damage: 15 }, ranged: { critMultiplier: 0.5 } }
  },

  // --- MAGIC WEAPONS ---
  {
    id: 'magic_wand', name: 'Zauberstab',
    shape: [[1],[1]], // 1x2
    category: ITEM_CATEGORIES.WEAPON_MAGIC,
    element: ELEMENTS.CHAOS, rarity: 'common', cost: 2,
    description: 'Magische Kugeln die zielen.',
    stats: { damage: 13, attackSpeed: 1.4, projectileSpeed: 320, range: 350, homing: true },
    tags: ['wand', 'magic', 'chaos', 'homing'],
    weaponBehavior: 'homing_bolt',
    adjacencyBonus: { wand: { damage: 3 }, magic: { attackSpeed: 0.1 } }
  },
  {
    id: 'flame_wand', name: 'Flammenstab',
    shape: [[1],[1],[1]],
    category: ITEM_CATEGORIES.WEAPON_MAGIC,
    element: ELEMENTS.FIRE, rarity: 'uncommon', cost: 4,
    description: 'Feuerkegel. Verbrennt alles darin.',
    stats: { damage: 10, attackSpeed: 2.0, range: 160, coneAngle: 40, burnDamage: 4, burnDuration: 3 },
    tags: ['wand', 'magic', 'fire', 'cone', 'burn'],
    weaponBehavior: 'cone_fire',
    onHit: (target, player, gs) => {
      gs.applyStatusEffect(target, 'burn', { damage: 4, duration: 3 });
    },
    adjacencyBonus: { fire: { burnDamage: 2 }, wand: { range: 20 } }
  },
  {
    id: 'frost_wand', name: 'Froststab',
    shape: [[1],[1],[1]],
    category: ITEM_CATEGORIES.WEAPON_MAGIC,
    element: ELEMENTS.ICE, rarity: 'uncommon', cost: 4,
    description: 'Froststrahl verlangsamt massiv.',
    stats: { damage: 8, attackSpeed: 2.5, range: 200, slowAmount: 0.7, slowDuration: 1.0 },
    tags: ['wand', 'magic', 'ice', 'slow'],
    weaponBehavior: 'beam',
    onHit: (target, player, gs) => {
      gs.applyStatusEffect(target, 'slow', { amount: 0.7, duration: 1.0 });
    },
    adjacencyBonus: { ice: { slowAmount: 0.1 }, wand: { attackSpeed: 0.3 } }
  },
  {
    id: 'storm_wand', name: 'Sturmstab',
    shape: [[0,1],[1,1],[0,1]],
    category: ITEM_CATEGORIES.WEAPON_MAGIC,
    element: ELEMENTS.LIGHTNING, rarity: 'rare', cost: 5,
    description: 'Zufällige Blitze treffen viele Gegner.',
    stats: { damage: 20, attackSpeed: 1.8, range: 400, chainCount: 4, chainRange: 160 },
    tags: ['wand', 'magic', 'lightning', 'chain'],
    weaponBehavior: 'storm',
    adjacencyBonus: { lightning: { chainCount: 2 }, wand: { damage: 5 } }
  },
  {
    id: 'chaos_wand', name: 'Chaosstab',
    shape: [[1,1],[1,1]], // 2x2
    category: ITEM_CATEGORIES.WEAPON_MAGIC,
    element: ELEMENTS.CHAOS, rarity: 'rare', cost: 6,
    description: 'Jeder Schuss hat ein zufälliges Element!',
    stats: { damage: 18, attackSpeed: 1.5, projectileSpeed: 350, range: 370, homing: true },
    tags: ['wand', 'magic', 'chaos', 'homing'],
    weaponBehavior: 'chaos_bolt',
    adjacencyBonus: { chaos: { damage: 5 }, wand: { attackSpeed: 0.2 } }
  },
  {
    id: 'poison_tome', name: 'Gifttome',
    shape: [[1,1],[1,0]],
    category: ITEM_CATEGORIES.WEAPON_MAGIC,
    element: ELEMENTS.POISON, rarity: 'uncommon', cost: 3,
    description: 'Giftige Kugeln. Kumulierend stapelbares Gift.',
    stats: { damage: 6, attackSpeed: 1.6, projectileSpeed: 300, range: 320, poisonDamage: 10, poisonDuration: 6, homing: true },
    tags: ['tome', 'magic', 'poison', 'homing'],
    weaponBehavior: 'homing_bolt',
    onHit: (target, player, gs) => {
      gs.applyStatusEffect(target, 'poison', { damage: 10, duration: 6, stacking: true });
    },
    adjacencyBonus: { poison: { poisonDamage: 3 }, tome: { attackSpeed: 0.1 } }
  },
  {
    id: 'void_orb', name: 'Leere-Orb',
    shape: [[0,1,0],[1,1,1],[0,1,0]], // plus
    category: ITEM_CATEGORIES.WEAPON_MAGIC,
    element: ELEMENTS.VOID, rarity: 'epic', cost: 8,
    description: 'Großer Orb der Feinde in sich zieht und zermalmt.',
    stats: { damage: 35, attackSpeed: 0.5, range: 180, pullRadius: 150, pullForce: 200 },
    tags: ['orb', 'magic', 'void', 'pull'],
    weaponBehavior: 'void_orb',
    adjacencyBonus: { void: { pullRadius: 30 }, orb: { damage: 10 } }
  },
  {
    id: 'holy_nova', name: 'Heilige Nova',
    shape: [[1,1,1],[1,1,1]], // 3x2
    category: ITEM_CATEGORIES.WEAPON_MAGIC,
    element: ELEMENTS.HOLY, rarity: 'epic', cost: 8,
    description: 'Pulsiert heilige Energie um den Spieler. Heilt bei jedem Treffer.',
    stats: { damage: 15, attackSpeed: 0.8, range: 200, healOnHit: 3, pulseRadius: 200 },
    tags: ['nova', 'magic', 'holy', 'heal', 'pulse'],
    weaponBehavior: 'pulse_aura',
    onHit: (target, player, gs) => {
      player.hp = Math.min(player.maxHP, player.hp + 3);
    },
    adjacencyBonus: { holy: { healOnHit: 2 }, nova: { range: 25 } }
  },

  // --- ORBITAL WEAPONS ---
  {
    id: 'shuriken', name: 'Shuriken',
    shape: [[1]], // 1x1
    category: ITEM_CATEGORIES.WEAPON_ORBITAL,
    element: ELEMENTS.PHYSICAL, rarity: 'common', cost: 2,
    description: 'Kreist um den Spieler.',
    stats: { damage: 10, orbitRadius: 90, orbitSpeed: 2.0, piercing: 99 },
    tags: ['shuriken', 'orbital', 'physical', 'ninja'],
    weaponBehavior: 'orbit',
    adjacencyBonus: { shuriken: { orbitSpeed: 0.3, damage: 3 }, ninja: { damage: 5 } }
  },
  {
    id: 'fire_orb_orbital', name: 'Feuerball-Orbital',
    shape: [[1,1]], // 2x1
    category: ITEM_CATEGORIES.WEAPON_ORBITAL,
    element: ELEMENTS.FIRE, rarity: 'uncommon', cost: 3,
    description: 'Feuerbälle kreisen und verbrennen.',
    stats: { damage: 14, orbitRadius: 100, orbitSpeed: 1.6, burnDamage: 5, burnDuration: 3 },
    tags: ['orb', 'orbital', 'fire', 'burn'],
    weaponBehavior: 'orbit',
    onHit: (target, player, gs) => {
      gs.applyStatusEffect(target, 'burn', { damage: 5, duration: 3 });
    },
    adjacencyBonus: { fire: { burnDamage: 2 }, orb: { orbitRadius: 10 } }
  },
  {
    id: 'boomerang', name: 'Bumerang',
    shape: [[1,1]], // 2x1
    category: ITEM_CATEGORIES.WEAPON_ORBITAL,
    element: ELEMENTS.PHYSICAL, rarity: 'uncommon', cost: 3,
    description: 'Fliegt zum Feind und kommt zurück. Durchdringt Feinde.',
    stats: { damage: 20, attackSpeed: 0.9, projectileSpeed: 380, range: 400, piercing: 99, returning: true },
    tags: ['boomerang', 'orbital', 'physical', 'returning'],
    weaponBehavior: 'boomerang',
    adjacencyBonus: { boomerang: { damage: 5 }, physical: { attackSpeed: 0.1 } }
  },
  {
    id: 'lightning_ring', name: 'Blitzring-Orbital',
    shape: [[1,1,1]], // 3x1
    category: ITEM_CATEGORIES.WEAPON_ORBITAL,
    element: ELEMENTS.LIGHTNING, rarity: 'rare', cost: 5,
    description: 'Elektrischer Ring kreist und kettet.',
    stats: { damage: 18, orbitRadius: 120, orbitSpeed: 1.8, chainCount: 2, chainRange: 130 },
    tags: ['ring', 'orbital', 'lightning', 'chain'],
    weaponBehavior: 'orbit',
    onHit: (target, player, gs) => {
      gs.chainLightning(target, 2, 130, 12);
    },
    adjacencyBonus: { lightning: { chainCount: 1 }, ring: { orbitRadius: 15 } }
  },
  {
    id: 'shadow_clone', name: 'Schattenklone',
    shape: [[1,0],[0,1],[1,0]], // diagonal
    category: ITEM_CATEGORIES.WEAPON_ORBITAL,
    element: ELEMENTS.SHADOW, rarity: 'epic', cost: 7,
    description: '3 Klone kreisen, jeder erbt alle Synergien.',
    stats: { damage: 18, orbitRadius: 130, orbitSpeed: 1.5, cloneCount: 3 },
    tags: ['clone', 'orbital', 'shadow'],
    weaponBehavior: 'orbit_multi',
    adjacencyBonus: { shadow: { damage: 6 }, clone: { orbitSpeed: 0.3 } }
  },

  // --- ARMOR ---
  {
    id: 'leather_armor', name: 'Lederrüstung',
    shape: [[1,1],[1,1]], // 2x2
    category: ITEM_CATEGORIES.ARMOR,
    element: null, rarity: 'common', cost: 2,
    description: 'Leichte Verteidigung.',
    stats: { defense: 5, maxHP: 15 },
    tags: ['armor', 'light'],
    adjacencyBonus: { armor: { defense: 2 }, shield: { defense: 3 } }
  },
  {
    id: 'chain_mail', name: 'Kettenhemd',
    shape: [[1,1,1],[1,1,1]], // 3x2
    category: ITEM_CATEGORIES.ARMOR,
    element: null, rarity: 'uncommon', cost: 3,
    description: 'Mittlere Verteidigung.',
    stats: { defense: 10, maxHP: 25 },
    tags: ['armor', 'medium'],
    adjacencyBonus: { armor: { defense: 3 }, shield: { defense: 4 } }
  },
  {
    id: 'plate_armor', name: 'Plattenpanzer',
    shape: [[1,1,1],[1,1,1],[1,1,1]], // 3x3
    category: ITEM_CATEGORIES.ARMOR,
    element: null, rarity: 'rare', cost: 6,
    description: 'Schwere Verteidigung. Verlangsamt etwas.',
    stats: { defense: 20, maxHP: 50, moveSpeed: -0.1 },
    tags: ['armor', 'heavy'],
    adjacencyBonus: { armor: { defense: 5 }, physical: { damage: 5 } }
  },
  {
    id: 'fire_cloak', name: 'Feuerumhang',
    shape: [[1,1],[0,1]], // L-form 2x2
    category: ITEM_CATEGORIES.ARMOR,
    element: ELEMENTS.FIRE, rarity: 'uncommon', cost: 3,
    description: 'Feuerschaden-Aura verletzt Nahkampffeinde.',
    stats: { defense: 6, maxHP: 10, fireAuraDamage: 8, fireAuraRadius: 80 },
    tags: ['armor', 'fire', 'aura'],
    adjacencyBonus: { fire: { fireAuraDamage: 3 }, armor: { defense: 2 } }
  },
  {
    id: 'ice_cloak', name: 'Eisumhang',
    shape: [[1,1],[0,1]],
    category: ITEM_CATEGORIES.ARMOR,
    element: ELEMENTS.ICE, rarity: 'uncommon', cost: 3,
    description: 'Verlangsamt Nahkampffeinde durch Kältestrahlung.',
    stats: { defense: 6, maxHP: 10, iceAuraSlow: 0.4, iceAuraRadius: 100 },
    tags: ['armor', 'ice', 'aura'],
    adjacencyBonus: { ice: { iceAuraSlow: 0.1 }, armor: { defense: 2 } }
  },
  {
    id: 'shadow_cloak', name: 'Schattenumhang',
    shape: [[1,0],[1,1]],
    category: ITEM_CATEGORIES.ARMOR,
    element: ELEMENTS.SHADOW, rarity: 'uncommon', cost: 4,
    description: '25% Chance Schaden auszuweichen.',
    stats: { defense: 4, dodgeChance: 0.25 },
    tags: ['armor', 'shadow', 'dodge'],
    adjacencyBonus: { shadow: { dodgeChance: 0.05 }, armor: { defense: 2 } }
  },
  {
    id: 'holy_robe', name: 'Heiliges Gewand',
    shape: [[0,1,0],[1,1,1],[0,1,0]], // plus
    category: ITEM_CATEGORIES.ARMOR,
    element: ELEMENTS.HOLY, rarity: 'rare', cost: 5,
    description: 'Regeneriert 3 HP/Sekunde.',
    stats: { defense: 8, maxHP: 30, hpRegen: 3 },
    tags: ['armor', 'holy', 'regen'],
    adjacencyBonus: { holy: { hpRegen: 1 }, armor: { maxHP: 10 } }
  },
  {
    id: 'blood_armor', name: 'Blutpanzer',
    shape: [[1,1],[1,1]],
    category: ITEM_CATEGORIES.ARMOR,
    element: ELEMENTS.BLOOD, rarity: 'rare', cost: 5,
    description: 'Wandelt Angriff in Lebensraub um (+15% Lifesteal global).',
    stats: { defense: 8, maxHP: 20, globalLifeSteal: 0.15 },
    tags: ['armor', 'blood', 'lifesteal'],
    adjacencyBonus: { blood: { globalLifeSteal: 0.05 }, armor: { defense: 3 } }
  },
  {
    id: 'spiked_armor', name: 'Stachelrüstung',
    shape: [[1,1,1],[1,1,1]],
    category: ITEM_CATEGORIES.ARMOR,
    element: ELEMENTS.PHYSICAL, rarity: 'rare', cost: 5,
    description: 'Reflektiert 30% des erlittenen Schadens zurück.',
    stats: { defense: 12, maxHP: 20, damageReflect: 0.3 },
    tags: ['armor', 'physical', 'reflect'],
    adjacencyBonus: { physical: { damageReflect: 0.05 }, armor: { defense: 3 } }
  },
  {
    id: 'void_shroud', name: 'Leere-Schleier',
    shape: [[1,1,1],[1,0,1],[1,1,1]], // ring shape
    category: ITEM_CATEGORIES.ARMOR,
    element: ELEMENTS.VOID, rarity: 'epic', cost: 9,
    description: 'Absorbiert den ersten tödlichen Treffer pro Runde.',
    stats: { defense: 15, maxHP: 40, deathAbsorb: 1 },
    tags: ['armor', 'void', 'absorb', 'cheat_death'],
    onRound: (player, gs) => {
      player.deathAbsorb = 1;
    },
    adjacencyBonus: { void: { defense: 5 }, armor: { maxHP: 20 } }
  },

  // --- ACCESSORIES ---
  {
    id: 'speed_boots', name: 'Schnellstiefel',
    shape: [[1,1]], // 2x1
    category: ITEM_CATEGORIES.ACCESSORY,
    element: null, rarity: 'common', cost: 2,
    description: '+20% Bewegungsgeschwindigkeit.',
    stats: { moveSpeed: 0.20 },
    tags: ['boots', 'speed'],
    adjacencyBonus: { boots: { moveSpeed: 0.05 }, speed: { attackSpeed: 0.05 } }
  },
  {
    id: 'fire_ring', name: 'Feuerring',
    shape: [[1]], // 1x1
    category: ITEM_CATEGORIES.ACCESSORY,
    element: ELEMENTS.FIRE, rarity: 'common', cost: 2,
    description: '+20% Feuerschaden.',
    stats: { fireBonus: 0.20 },
    tags: ['ring', 'fire'],
    adjacencyBonus: { ring: { fireBonus: 0.05 }, fire: { burnDamage: 2 } }
  },
  {
    id: 'ice_ring', name: 'Eisring',
    shape: [[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: ELEMENTS.ICE, rarity: 'common', cost: 2,
    description: '+20% Eisdauer und -schaden.',
    stats: { iceBonus: 0.20 },
    tags: ['ring', 'ice'],
    adjacencyBonus: { ring: { iceBonus: 0.05 }, ice: { slowDuration: 0.3 } }
  },
  {
    id: 'thunder_ring', name: 'Donnerring',
    shape: [[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: ELEMENTS.LIGHTNING, rarity: 'uncommon', cost: 3,
    description: '+1 Kettentreffer bei Blitzangriffen.',
    stats: { lightningChain: 1 },
    tags: ['ring', 'lightning'],
    adjacencyBonus: { ring: { lightningChain: 1 }, lightning: { chainRange: 20 } }
  },
  {
    id: 'poison_ring', name: 'Giftring',
    shape: [[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: ELEMENTS.POISON, rarity: 'uncommon', cost: 2,
    description: '+25% Giftschaden und -dauer.',
    stats: { poisonBonus: 0.25 },
    tags: ['ring', 'poison'],
    adjacencyBonus: { ring: { poisonBonus: 0.05 }, poison: { poisonDuration: 0.5 } }
  },
  {
    id: 'holy_ring', name: 'Heiliger Ring',
    shape: [[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: ELEMENTS.HOLY, rarity: 'uncommon', cost: 2,
    description: 'Heilt 2 HP nach jedem Kill.',
    stats: { killHeal: 2 },
    tags: ['ring', 'holy'],
    onKill: (enemy, player, gs) => {
      player.hp = Math.min(player.maxHP, player.hp + 2);
      gs.addFloatingText(player.x, player.y - 20, '+2', '#FFE082');
    },
    adjacencyBonus: { ring: { killHeal: 1 }, holy: { healOnHit: 1 } }
  },
  {
    id: 'shadow_ring', name: 'Schattenring',
    shape: [[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: ELEMENTS.SHADOW, rarity: 'uncommon', cost: 3,
    description: '+15% Ausweichen.',
    stats: { dodgeChance: 0.15 },
    tags: ['ring', 'shadow', 'dodge'],
    adjacencyBonus: { ring: { dodgeChance: 0.03 }, shadow: { damage: 3 } }
  },
  {
    id: 'blood_ring', name: 'Blutring',
    shape: [[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: ELEMENTS.BLOOD, rarity: 'uncommon', cost: 3,
    description: '+10% Lebensraub.',
    stats: { globalLifeSteal: 0.10 },
    tags: ['ring', 'blood', 'lifesteal'],
    adjacencyBonus: { ring: { globalLifeSteal: 0.02 }, blood: { damage: 3 } }
  },
  {
    id: 'lucky_ring', name: 'Glücksring',
    shape: [[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: null, rarity: 'rare', cost: 4,
    description: '+20% Kritische Trefferchance.',
    stats: { critChance: 0.20 },
    tags: ['ring', 'luck', 'crit'],
    adjacencyBonus: { ring: { critChance: 0.05 }, luck: { critMultiplier: 0.3 } }
  },
  {
    id: 'gold_ring', name: 'Goldring',
    shape: [[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: null, rarity: 'uncommon', cost: 3,
    description: '+2 Gold pro Kill.',
    stats: { goldPerKill: 2 },
    tags: ['ring', 'gold'],
    onKill: (enemy, player, gs) => {
      gs.gold += 2;
      gs.addFloatingText(enemy.x, enemy.y - 20, '+2G', '#FFD700');
    },
    adjacencyBonus: { ring: { goldPerKill: 1 }, gold: { shopDiscount: 0.05 } }
  },
  {
    id: 'xp_amulet', name: 'EP-Amulett',
    shape: [[1],[1]], // 1x2
    category: ITEM_CATEGORIES.ACCESSORY,
    element: null, rarity: 'uncommon', cost: 3,
    description: '+30% Erfahrungspunkte.',
    stats: { xpBonus: 0.30 },
    tags: ['amulet', 'xp'],
    adjacencyBonus: { amulet: { xpBonus: 0.10 }, luck: { xpBonus: 0.05 } }
  },
  {
    id: 'damage_amulet', name: 'Schadens-Amulett',
    shape: [[1],[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: null, rarity: 'rare', cost: 4,
    description: '+20% gesamter Schaden.',
    stats: { globalDamageBonus: 0.20 },
    tags: ['amulet', 'damage'],
    adjacencyBonus: { amulet: { globalDamageBonus: 0.05 }, weapon: { damage: 5 } }
  },
  {
    id: 'speed_amulet', name: 'Angriffsgeschw.-Amulett',
    shape: [[1],[1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: null, rarity: 'uncommon', cost: 3,
    description: '+25% Angriffsgeschwindigkeit.',
    stats: { globalAttackSpeed: 0.25 },
    tags: ['amulet', 'speed', 'attackspeed'],
    adjacencyBonus: { amulet: { globalAttackSpeed: 0.05 }, weapon: { attackSpeed: 0.08 } }
  },
  {
    id: 'pierce_amulet', name: 'Durchdringung-Amulett',
    shape: [[0,1],[1,1]], // 2x2 corner
    category: ITEM_CATEGORIES.ACCESSORY,
    element: null, rarity: 'rare', cost: 4,
    description: 'Alle Projektile durchdringen 1 extra Feind.',
    stats: { extraPiercing: 1 },
    tags: ['amulet', 'pierce'],
    adjacencyBonus: { amulet: { extraPiercing: 1 }, ranged: { damage: 4 } }
  },
  {
    id: 'explosion_amulet', name: 'Explosions-Amulett',
    shape: [[1,0],[1,1]],
    category: ITEM_CATEGORIES.ACCESSORY,
    element: ELEMENTS.FIRE, rarity: 'epic', cost: 6,
    description: 'Jeder Kill explodiert!',
    stats: { killExplosionRadius: 90, killExplosionDamage: 20 },
    tags: ['amulet', 'fire', 'explosion'],
    onKill: (enemy, player, gs) => {
      gs.createExplosion(enemy.x, enemy.y, 90, 20, ELEMENTS.FIRE, player);
    },
    adjacencyBonus: { fire: { killExplosionDamage: 5 }, amulet: { killExplosionRadius: 20 } }
  },

  // --- RELICS ---
  {
    id: 'heart_locket', name: 'Herzmedaillon',
    shape: [[1,1],[1,1]],
    category: ITEM_CATEGORIES.RELIC,
    element: null, rarity: 'common', cost: 3,
    description: 'Regeneriert 2 HP/Sek. +30 max HP.',
    stats: { hpRegen: 2, maxHP: 30 },
    tags: ['relic', 'heal', 'regen'],
    adjacencyBonus: { relic: { hpRegen: 0.5 }, holy: { hpRegen: 1 } }
  },
  {
    id: 'vampiric_fang', name: 'Vampirreißzahn',
    shape: [[1,0],[1,1],[0,1]], // S-shape
    category: ITEM_CATEGORIES.RELIC,
    element: ELEMENTS.BLOOD, rarity: 'rare', cost: 5,
    description: '+30% globaler Lebensraub.',
    stats: { globalLifeSteal: 0.30 },
    tags: ['relic', 'blood', 'lifesteal'],
    adjacencyBonus: { relic: { globalLifeSteal: 0.05 }, blood: { damage: 5 } }
  },
  {
    id: 'berserker_totem', name: 'Berserker-Totem',
    shape: [[1],[1],[1]],
    category: ITEM_CATEGORIES.RELIC,
    element: ELEMENTS.BLOOD, rarity: 'rare', cost: 4,
    description: 'Unter 30% HP: Verdoppelter Schaden!',
    stats: { lowHPDamageBonus: 1.0, lowHPThreshold: 0.3 },
    tags: ['relic', 'blood', 'berserker'],
    adjacencyBonus: { relic: { lowHPDamageBonus: 0.2 }, blood: { damage: 8 } }
  },
  {
    id: 'guardian_angel', name: 'Schutzengel',
    shape: [[0,1,0],[1,1,1],[0,1,0]],
    category: ITEM_CATEGORIES.RELIC,
    element: ELEMENTS.HOLY, rarity: 'epic', cost: 8,
    description: 'Wiederbelebung mit 50% HP einmal pro Kampf.',
    stats: { reviveCount: 1, reviveHP: 0.5 },
    tags: ['relic', 'holy', 'revive'],
    adjacencyBonus: { relic: { reviveHP: 0.1 }, holy: { hpRegen: 1 } }
  },
  {
    id: 'chaos_crystal', name: 'Chaos-Kristall',
    shape: [[1,0],[1,1],[0,1]],
    category: ITEM_CATEGORIES.RELIC,
    element: ELEMENTS.CHAOS, rarity: 'rare', cost: 5,
    description: 'Jede Runde: 3 zufällige Boni (können positiv oder negativ sein).',
    stats: { chaosBuffCount: 3 },
    tags: ['relic', 'chaos', 'random'],
    onRound: (player, gs) => {
      gs.applyChaosBuffs(player, 3);
    },
    adjacencyBonus: { relic: { chaosBuffCount: 1 }, chaos: { damage: 5 } }
  },
  {
    id: 'magnet', name: 'Supermagnet',
    shape: [[1,1]],
    category: ITEM_CATEGORIES.RELIC,
    element: null, rarity: 'common', cost: 2,
    description: 'Zieht alle Pickups von weit an.',
    stats: { pickupRadius: 200 },
    tags: ['relic', 'magnet', 'pickup'],
    adjacencyBonus: { relic: { pickupRadius: 50 }, gold: { goldBonus: 1 } }
  },
  {
    id: 'philosopher_stone', name: 'Stein der Weisen',
    shape: [[1,1],[1,1]],
    category: ITEM_CATEGORIES.RELIC,
    element: ELEMENTS.CHAOS, rarity: 'epic', cost: 7,
    description: 'Jeder Kill = 1 extra Gold. Gegner droppen mehr.',
    stats: { goldPerKill: 1, goldDropMultiplier: 1.5 },
    tags: ['relic', 'gold', 'chaos'],
    onKill: (enemy, player, gs) => {
      gs.gold += 1;
    },
    adjacencyBonus: { relic: { goldPerKill: 1 }, chaos: { damage: 3 } }
  },
  {
    id: 'time_watch', name: 'Zeitstopuhr',
    shape: [[1,1],[0,1]],
    category: ITEM_CATEGORIES.RELIC,
    element: ELEMENTS.ICE, rarity: 'epic', cost: 7,
    description: 'Alle 20 Sek.: Alles 3 Sek. eingefroren (außer Spieler).',
    stats: { timeFreezeInterval: 20, timeFreezeDuration: 3 },
    tags: ['relic', 'ice', 'time', 'freeze'],
    adjacencyBonus: { relic: { timeFreezeInterval: -3 }, ice: { freezeDuration: 0.5 } }
  },
  {
    id: 'bomb_belt', name: 'Bombengürtel',
    shape: [[1,1,1]],
    category: ITEM_CATEGORIES.RELIC,
    element: ELEMENTS.FIRE, rarity: 'uncommon', cost: 3,
    description: 'Beim Ausweichen: Explosion am alten Standort.',
    stats: { dashExplosionRadius: 80, dashExplosionDamage: 25 },
    tags: ['relic', 'fire', 'dash', 'explosion'],
    adjacencyBonus: { relic: { dashExplosionDamage: 8 }, fire: { burnDamage: 3 } }
  },
  {
    id: 'blood_pact', name: 'Blutpakt',
    shape: [[1,1,1],[1,0,1]], // U-shape
    category: ITEM_CATEGORIES.RELIC,
    element: ELEMENTS.BLOOD, rarity: 'epic', cost: 8,
    description: 'Tausche 25% max HP gegen 50% mehr Schaden. Enormes Lifesteal kompensiert.',
    stats: { maxHPPenalty: 0.25, globalDamageBonus: 0.50, globalLifeSteal: 0.25 },
    tags: ['relic', 'blood', 'damage', 'lifesteal', 'tradeoff'],
    adjacencyBonus: { relic: { globalDamageBonus: 0.08 }, blood: { globalLifeSteal: 0.05 } }
  },

  // --- GEMS ---
  {
    id: 'ruby', name: 'Rubin',
    shape: [[1]],
    category: ITEM_CATEGORIES.GEM,
    element: ELEMENTS.FIRE, rarity: 'uncommon', cost: 2,
    description: '+15% Feuerschaden für alle Nachbarn.',
    stats: { adjacentFireBonus: 0.15 },
    tags: ['gem', 'fire'],
    adjacencyBonus: { fire: { damage: 6 }, weapon: { damage: 3 } }
  },
  {
    id: 'sapphire', name: 'Saphir',
    shape: [[1]],
    category: ITEM_CATEGORIES.GEM,
    element: ELEMENTS.ICE, rarity: 'uncommon', cost: 2,
    description: '+15% Eisschaden. Nachbarn kühlen schneller.',
    stats: { adjacentIceBonus: 0.15 },
    tags: ['gem', 'ice'],
    adjacencyBonus: { ice: { slowDuration: 0.5 }, weapon: { attackSpeed: 0.05 } }
  },
  {
    id: 'topaz', name: 'Topas',
    shape: [[1]],
    category: ITEM_CATEGORIES.GEM,
    element: ELEMENTS.LIGHTNING, rarity: 'uncommon', cost: 2,
    description: '+1 Kettenblitz für Nachbarn.',
    stats: { adjacentChainBonus: 1 },
    tags: ['gem', 'lightning'],
    adjacencyBonus: { lightning: { chainCount: 1 }, weapon: { damage: 4 } }
  },
  {
    id: 'emerald', name: 'Smaragd',
    shape: [[1]],
    category: ITEM_CATEGORIES.GEM,
    element: ELEMENTS.POISON, rarity: 'uncommon', cost: 2,
    description: '+1 Giftdauer für alle Nachbarn.',
    stats: { adjacentPoisonDuration: 1 },
    tags: ['gem', 'poison'],
    adjacencyBonus: { poison: { poisonDamage: 2 }, weapon: { attackSpeed: 0.05 } }
  },
  {
    id: 'diamond', name: 'Diamant',
    shape: [[1]],
    category: ITEM_CATEGORIES.GEM,
    element: null, rarity: 'rare', cost: 4,
    description: '+10% aller Stats für alle Nachbarn.',
    stats: { adjacentAllBonus: 0.10 },
    tags: ['gem', 'universal'],
    adjacencyBonus: { weapon: { damage: 5, attackSpeed: 0.05 }, armor: { defense: 3 } }
  },
  {
    id: 'void_crystal', name: 'Leerekristall',
    shape: [[1]],
    category: ITEM_CATEGORIES.GEM,
    element: ELEMENTS.VOID, rarity: 'epic', cost: 5,
    description: 'Nachbarn erhalten Leereschadens-Explosionen bei Kills.',
    stats: { adjacentVoidExplosion: true },
    tags: ['gem', 'void'],
    adjacencyBonus: { void: { voidExplosionDamage: 8 }, weapon: { damage: 6 } }
  },
];

// Lookup map
const ITEMS_BY_ID = {};
ITEM_DEFS.forEach(item => { ITEMS_BY_ID[item.id] = item; });

// Shop pool by rarity
function getWeightedRandomItem(excludeIds = [], round = 1) {
  const pool = ITEM_DEFS.filter(item => !excludeIds.includes(item.id));
  if (pool.length === 0) return null;

  // Weight by rarity
  const totalWeight = pool.reduce((sum, item) => {
    return sum + RARITIES[item.rarity].weight;
  }, 0);

  let rand = Math.random() * totalWeight;
  for (const item of pool) {
    rand -= RARITIES[item.rarity].weight;
    if (rand <= 0) return JSON.parse(JSON.stringify(item)); // deep copy
  }
  return JSON.parse(JSON.stringify(pool[pool.length - 1]));
}

function getItemsByRarity(rarity) {
  return ITEM_DEFS.filter(i => i.rarity === rarity);
}
