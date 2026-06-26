'use strict';

// ============================================================
// WAVE CONFIGURATIONS - 15 rounds + boss rounds
// ============================================================

const WAVE_CONFIGS = [
  // Round 1
  {
    round: 1, duration: 45,
    groups: [
      { enemy: 'slime', count: 8, spawnRate: 2.5 },
      { enemy: 'bat', count: 5, spawnRate: 3 }
    ],
    goldReward: 5, xpReward: 20,
    shopItems: 4
  },
  // Round 2
  {
    round: 2, duration: 50,
    groups: [
      { enemy: 'slime', count: 10, spawnRate: 2.0 },
      { enemy: 'skeleton', count: 6, spawnRate: 3 },
      { enemy: 'bat', count: 8, spawnRate: 2.5 }
    ],
    goldReward: 6, xpReward: 30,
    shopItems: 4
  },
  // Round 3
  {
    round: 3, duration: 55,
    groups: [
      { enemy: 'zombie', count: 6, spawnRate: 3.5 },
      { enemy: 'skeleton', count: 10, spawnRate: 2.0 },
      { enemy: 'goblin', count: 5, spawnRate: 2.5 }
    ],
    goldReward: 7, xpReward: 40,
    shopItems: 4
  },
  // Round 4
  {
    round: 4, duration: 55,
    groups: [
      { enemy: 'ghost', count: 6, spawnRate: 2.5 },
      { enemy: 'zombie', count: 8, spawnRate: 3.0 },
      { enemy: 'goblin', count: 8, spawnRate: 2.0 }
    ],
    goldReward: 8, xpReward: 50,
    shopItems: 5
  },
  // Round 5 - BOSS
  {
    round: 5, duration: 90, isBoss: true,
    boss: 'dragon_boss',
    groups: [
      { enemy: 'fire_imp', count: 12, spawnRate: 4.0, delay: 5 }
    ],
    goldReward: 20, xpReward: 100,
    shopItems: 5, guaranteedRare: true
  },
  // Round 6
  {
    round: 6, duration: 60,
    groups: [
      { enemy: 'orc', count: 5, spawnRate: 4.0 },
      { enemy: 'spider', count: 8, spawnRate: 2.5 },
      { enemy: 'witch', count: 3, spawnRate: 6.0 }
    ],
    goldReward: 9, xpReward: 60,
    shopItems: 5
  },
  // Round 7
  {
    round: 7, duration: 65,
    groups: [
      { enemy: 'knight', count: 4, spawnRate: 5.0 },
      { enemy: 'ice_golem_small', count: 3, spawnRate: 6.0 },
      { enemy: 'shadow_wraith', count: 6, spawnRate: 3.0 }
    ],
    goldReward: 10, xpReward: 70,
    shopItems: 5
  },
  // Round 8
  {
    round: 8, duration: 65,
    groups: [
      { enemy: 'thunder_elemental', count: 5, spawnRate: 4.0 },
      { enemy: 'poison_slug', count: 6, spawnRate: 3.5 },
      { enemy: 'blood_cultist', count: 4, spawnRate: 4.5 }
    ],
    goldReward: 11, xpReward: 80,
    shopItems: 5
  },
  // Round 9
  {
    round: 9, duration: 70,
    groups: [
      { enemy: 'void_walker', count: 4, spawnRate: 5.0 },
      { enemy: 'knight', count: 6, spawnRate: 4.0 },
      { enemy: 'witch', count: 5, spawnRate: 3.5 }
    ],
    goldReward: 12, xpReward: 90,
    shopItems: 5
  },
  // Round 10 - BOSS
  {
    round: 10, duration: 120, isBoss: true,
    boss: 'ice_queen',
    groups: [
      { enemy: 'ice_golem_small', count: 8, spawnRate: 5.0, delay: 8 },
      { enemy: 'ghost', count: 10, spawnRate: 3.0, delay: 10 }
    ],
    goldReward: 25, xpReward: 150,
    shopItems: 6, guaranteedEpic: true
  },
  // Round 11
  {
    round: 11, duration: 75,
    groups: [
      { enemy: 'void_walker', count: 6, spawnRate: 4.0 },
      { enemy: 'shadow_wraith', count: 8, spawnRate: 3.0 },
      { enemy: 'blood_cultist', count: 6, spawnRate: 3.5 }
    ],
    goldReward: 13, xpReward: 100,
    shopItems: 6
  },
  // Round 12
  {
    round: 12, duration: 75,
    groups: [
      { enemy: 'knight', count: 8, spawnRate: 3.5 },
      { enemy: 'thunder_elemental', count: 7, spawnRate: 3.5 },
      { enemy: 'poison_slug', count: 8, spawnRate: 3.0 }
    ],
    goldReward: 14, xpReward: 110,
    shopItems: 6
  },
  // Round 13
  {
    round: 13, duration: 80,
    elite: true, // enemies have 50% more HP
    groups: [
      { enemy: 'orc', count: 8, spawnRate: 3.5 },
      { enemy: 'void_walker', count: 6, spawnRate: 4.0 },
      { enemy: 'witch', count: 6, spawnRate: 3.5 }
    ],
    goldReward: 15, xpReward: 120,
    shopItems: 6
  },
  // Round 14
  {
    round: 14, duration: 80,
    elite: true,
    groups: [
      { enemy: 'blood_cultist', count: 8, spawnRate: 3.0 },
      { enemy: 'shadow_wraith', count: 10, spawnRate: 2.8 },
      { enemy: 'void_walker', count: 8, spawnRate: 3.5 }
    ],
    goldReward: 16, xpReward: 130,
    shopItems: 6
  },
  // Round 15 - FINAL BOSS
  {
    round: 15, duration: 180, isBoss: true, isFinal: true,
    boss: 'void_overlord',
    groups: [
      { enemy: 'void_walker', count: 15, spawnRate: 6.0, delay: 15 },
      { enemy: 'shadow_wraith', count: 10, spawnRate: 5.0, delay: 20 },
      { enemy: 'blood_cultist', count: 8, spawnRate: 7.0, delay: 25 }
    ],
    goldReward: 50, xpReward: 300,
    shopItems: 0
  }
];

// Level up upgrade options
const UPGRADE_POOL = [
  { id: 'hp_up', name: '+25 Max HP', desc: 'Erhöht maximale HP um 25.', icon: '❤️',
    apply: (p) => { p.maxHP += 25; p.hp = Math.min(p.hp + 25, p.maxHP); } },
  { id: 'hp_full', name: 'Vollheilung', desc: 'Stellt alle HP wieder her.', icon: '💊',
    apply: (p) => { p.hp = p.maxHP; } },
  { id: 'damage_up', name: '+15% Schaden', desc: 'Alle Waffenschaden +15%.', icon: '⚔️',
    apply: (p) => { p.levelDamageBonus = (p.levelDamageBonus || 0) + 0.15; } },
  { id: 'speed_up', name: '+10% Ang.geschw.', desc: 'Alle Waffen feuern 10% schneller.', icon: '⚡',
    apply: (p) => { p.levelSpeedBonus = (p.levelSpeedBonus || 0) + 0.10; } },
  { id: 'move_up', name: '+15% Bewegung', desc: 'Bewegungsgeschwindigkeit +15%.', icon: '👟',
    apply: (p) => { p.levelMoveBonus = (p.levelMoveBonus || 0) + 0.15; } },
  { id: 'armor_up', name: '+8 Rüstung', desc: 'Erhöht Rüstung um 8.', icon: '🛡️',
    apply: (p) => { p.levelDefenseBonus = (p.levelDefenseBonus || 0) + 8; } },
  { id: 'regen_up', name: '+2 HP/Sek', desc: 'Passive Heilung +2 HP/Sek.', icon: '💚',
    apply: (p) => { p.levelRegenBonus = (p.levelRegenBonus || 0) + 2; } },
  { id: 'crit_up', name: '+15% Krit-Chance', desc: 'Kritische Trefferchance +15%.', icon: '💥',
    apply: (p) => { p.levelCritBonus = (p.levelCritBonus || 0) + 0.15; } },
  { id: 'lifesteal_up', name: '+10% Lebensraub', desc: 'Globaler Lebensraub +10%.', icon: '🩸',
    apply: (p) => { p.levelLifeStealBonus = (p.levelLifeStealBonus || 0) + 0.10; } },
  { id: 'gold_up', name: '+8 Gold', desc: 'Sofort 8 Gold erhalten.', icon: '💰',
    apply: (p, gs) => { if (gs) gs.gold += 8; } },
  { id: 'orbit_up', name: '+20% Orbital-Reichweite', desc: 'Orbit-Waffen kreisen weiter und schneller.', icon: '🌀',
    apply: (p) => { p.levelOrbitBonus = (p.levelOrbitBonus || 0) + 0.20; } },
  { id: 'pierce_up', name: '+1 Durchdringung', desc: 'Alle Projektile durchdringen 1 extra Feind.', icon: '🎯',
    apply: (p) => { p.levelPierceBonus = (p.levelPierceBonus || 0) + 1; } },
  { id: 'explosion_up', name: 'Explosions-Spur', desc: 'Kills erzeugen kleine Explosion.', icon: '💣',
    apply: (p) => { p.killExplosionRadius = (p.killExplosionRadius || 0) + 50; p.killExplosionDamage = (p.killExplosionDamage || 0) + 10; } },
  { id: 'reroll_shop', name: 'Extra-Reroll', desc: '+2 kostenlose Rerolls für nächsten Shop.', icon: '🔄',
    apply: (p) => { p.freeRerolls = (p.freeRerolls || 0) + 2; } },
];

function getRandomUpgrades(count = 3) {
  const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
