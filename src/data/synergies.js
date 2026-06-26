'use strict';

// ============================================================
// SYNERGY DEFINITIONS - 35+ synergies
// Each synergy checks conditions and applies bonuses
// ============================================================

const SYNERGY_DEFS = [

  // ========================
  // ELEMENTAL COMBINATIONS
  // ========================
  {
    id: 'steam_engine',
    name: 'Dampfmaschine',
    description: 'Feuer + Eis = Dampfexplosionen alle 8 Sek.',
    icon: '💨', color: '#AAEEFF',
    requires: { elements: ['fire', 'ice'], minCount: 1 },
    effect: (player, gs) => {
      player.synergyTimers = player.synergyTimers || {};
      player.synergyTimers.steam = (player.synergyTimers.steam || 0) + gs.dt;
      if (player.synergyTimers.steam >= 8) {
        player.synergyTimers.steam = 0;
        gs.createExplosion(player.x, player.y, 150, 30, ELEMENTS.ICE, player);
        gs.addFloatingText(player.x, player.y - 40, 'DAMPF!', '#AAEEFF');
      }
    }
  },
  {
    id: 'plasma_burn',
    name: 'Plasmaverbrennung',
    description: 'Feuer + Blitz: Verbrennung verkettet Schaden.',
    icon: '⚡🔥', color: '#FF8C00',
    requires: { elements: ['fire', 'lightning'], minCount: 1 },
    statBonus: { burnChainDamage: 8 }
  },
  {
    id: 'toxic_fire',
    name: 'Giftfeuer',
    description: 'Feuer + Gift: Verbrannte Feinde verbreiten Gift.',
    icon: '🔥☠️', color: '#AAFF00',
    requires: { elements: ['fire', 'poison'], minCount: 1 },
    statBonus: { burnSpreadsPoison: true }
  },
  {
    id: 'holy_flame',
    name: 'Heilige Flamme',
    description: 'Feuer + Heilig: 3x Schaden an Untoten. Heilung bei Feuerquills.',
    icon: '🔥✨', color: '#FFD700',
    requires: { elements: ['fire', 'holy'], minCount: 1 },
    statBonus: { undeadFireBonus: 3.0, fireHealOnKill: 5 }
  },
  {
    id: 'dark_flame',
    name: 'Dunkelfeuer',
    description: 'Feuer + Schatten: Lebensraub bei Verbrennung.',
    icon: '🔥🌑', color: '#8B0000',
    requires: { elements: ['fire', 'shadow'], minCount: 1 },
    statBonus: { burnLifeSteal: 0.3 }
  },
  {
    id: 'frozen_thunder',
    name: 'Gefrierblitz',
    description: 'Eis + Blitz: Gefrorene Feinde explodieren mit Blitzschaden.',
    icon: '❄️⚡', color: '#00BFFF',
    requires: { elements: ['ice', 'lightning'], minCount: 1 },
    statBonus: { frozenExplodeDamage: 40, frozenExplodeChain: 2 }
  },
  {
    id: 'cryotoxin',
    name: 'Kryotoxin',
    description: 'Eis + Gift: Verlangsamte Feinde erleiden +50% Giftschaden.',
    icon: '❄️☠️', color: '#00FF7F',
    requires: { elements: ['ice', 'poison'], minCount: 1 },
    statBonus: { slowedPoisonBonus: 0.5 }
  },
  {
    id: 'holy_frost',
    name: 'Heiliger Frost',
    description: 'Eis + Heilig: Heilt 5 HP wenn ein Feind eingefroren wird.',
    icon: '❄️✨', color: '#B0E0E6',
    requires: { elements: ['ice', 'holy'], minCount: 1 },
    statBonus: { freezeHeal: 5 }
  },
  {
    id: 'venom_storm',
    name: 'Giftsturm',
    description: 'Blitz + Gift: Kettenblitze verbreiten Gift.',
    icon: '⚡☠️', color: '#7FFF00',
    requires: { elements: ['lightning', 'poison'], minCount: 1 },
    statBonus: { chainAppliesPoison: true, chainPoisonDamage: 8 }
  },
  {
    id: 'divine_thunder',
    name: 'Göttlicher Donner',
    description: 'Blitz + Heilig: Betäubt Feinde + heilt den Spieler.',
    icon: '⚡✨', color: '#F0E68C',
    requires: { elements: ['lightning', 'holy'], minCount: 1 },
    statBonus: { lightningStunChance: 0.4, lightningStunHeal: 8 }
  },
  {
    id: 'death_miasma',
    name: 'Todesmiasma',
    description: 'Gift + Schatten: Kills erzeugen Giftaura um Feind.',
    icon: '☠️🌑', color: '#556B2F',
    requires: { elements: ['poison', 'shadow'], minCount: 1 },
    statBonus: { killPoisonAura: true, killPoisonRadius: 100, killPoisonDamage: 10 }
  },
  {
    id: 'sacred_toxin',
    name: 'Heiliges Gift',
    description: 'Gift + Heilig: Giftschaden heilt Spieler (50%).',
    icon: '☠️✨', color: '#90EE90',
    requires: { elements: ['poison', 'holy'], minCount: 1 },
    statBonus: { poisonHeals: 0.5 }
  },
  {
    id: 'void_energy',
    name: 'Leerenergie',
    description: 'Schatten + Heilig = Leereschaden: +40% aller Schaden, ignoriert Defense.',
    icon: '🌑✨', color: '#DDA0DD',
    requires: { elements: ['shadow', 'holy'], minCount: 1 },
    statBonus: { voidDamageBonus: 0.4, ignoreDefense: true }
  },

  // ========================
  // WEAPON COUNT SYNERGIES
  // ========================
  {
    id: 'arsenal',
    name: 'Arsenal',
    description: '3+ Waffen: +20% Waffenschaden.',
    icon: '⚔️⚔️⚔️', color: '#C0C0C0',
    requires: { minWeapons: 3 },
    statBonus: { globalDamageBonus: 0.20 }
  },
  {
    id: 'walking_armory',
    name: 'Wandelndes Arsenal',
    description: '5+ Waffen: +40% Angriffsgeschwindigkeit.',
    icon: '💀⚔️', color: '#8B8682',
    requires: { minWeapons: 5 },
    statBonus: { globalAttackSpeed: 0.40 }
  },
  {
    id: 'inferno',
    name: 'Inferno',
    description: '2 Feuerwaffen: +35% Feuerschaden. Verbrennung beginnt sofort.',
    icon: '🔥🔥', color: '#FF4500',
    requires: { elements: ['fire'], minCount: 2, weaponsOnly: true },
    statBonus: { fireBonus: 0.35, instantBurn: true }
  },
  {
    id: 'blizzard',
    name: 'Blizzard',
    description: '2 Eiswaffen: +35% Eisschaden. Sofortige Verlangsamung.',
    icon: '❄️❄️', color: '#00CFFF',
    requires: { elements: ['ice'], minCount: 2, weaponsOnly: true },
    statBonus: { iceBonus: 0.35, instantSlow: true }
  },
  {
    id: 'thunderstorm',
    name: 'Gewitter',
    description: '2 Blitzwaffen: +35% Blitzschaden. +2 Kettenblitze.',
    icon: '⚡⚡', color: '#FFD700',
    requires: { elements: ['lightning'], minCount: 2, weaponsOnly: true },
    statBonus: { lightningBonus: 0.35, globalChainCount: 2 }
  },
  {
    id: 'pandemic',
    name: 'Pandemie',
    description: '2 Giftwaffen: Giftschaden stapelt bis 6x.',
    icon: '☠️☠️', color: '#39FF14',
    requires: { elements: ['poison'], minCount: 2, weaponsOnly: true },
    statBonus: { poisonBonus: 0.35, maxPoisonStacks: 6 }
  },

  // ========================
  // CLASS / SET SYNERGIES
  // ========================
  {
    id: 'warrior',
    name: 'Krieger',
    description: 'Schwert + Schild: +30% Rüstung, +25% Nahkampfschaden.',
    icon: '🛡️⚔️', color: '#8B8682',
    requires: { tags: ['sword'], allTags: ['armor'] },
    statBonus: { defense: 10, meleeDamageBonus: 0.25 }
  },
  {
    id: 'archer',
    name: 'Bogenschütze',
    description: 'Bogen + 2 Pfeile: +40% Projektilgeschwindigkeit und -schaden.',
    icon: '🏹🏹', color: '#228B22',
    requires: { tags: ['bow'], minBowCount: 1, minArrowCount: 2 },
    statBonus: { projectileSpeedBonus: 0.4, rangedDamageBonus: 0.25 }
  },
  {
    id: 'archmage',
    name: 'Erzmagier',
    description: '2+ Zauberstäbe: +50% Magieschaden. Projektile zielen automatisch.',
    icon: '🧙‍♂️✨', color: '#7B68EE',
    requires: { minWands: 2 },
    statBonus: { magicDamageBonus: 0.50, allHoming: true }
  },
  {
    id: 'ninja',
    name: 'Ninja',
    description: '3 Shurikens: Orbital-Geschwindigkeit +80%. Dash-Cooldown -50%.',
    icon: '🌀⭐', color: '#2F4F4F',
    requires: { itemIds: ['shuriken'], minCount: 3 },
    statBonus: { orbitSpeedBonus: 0.80, dashCooldownReduction: 0.5 }
  },
  {
    id: 'assassin',
    name: 'Assassine',
    description: '3 Schattengegenstände: Erster Treffer pro Runde = garantierter Krit x3.',
    icon: '🗡️🌑', color: '#191970',
    requires: { elements: ['shadow'], minCount: 3 },
    statBonus: { assassinFirstHit: true, assassinCritMult: 3.0 }
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: '3 Heilig-Gegenstände: Heilung verdoppelt. Untote nehmen x4 Schaden.',
    icon: '✨🛡️', color: '#FFD700',
    requires: { elements: ['holy'], minCount: 3 },
    statBonus: { healingMultiplier: 2.0, holyBonusUndead: 4.0 }
  },
  {
    id: 'vampire',
    name: 'Vampir',
    description: '3 Blutgegenstände: +50% globaler Lebensraub. Kills heilen 15 HP.',
    icon: '🧛💉', color: '#8B0000',
    requires: { elements: ['blood'], minCount: 3 },
    statBonus: { globalLifeSteal: 0.50, killHeal: 15 }
  },
  {
    id: 'jeweler',
    name: 'Juwelier',
    description: '3+ Ringe: Alle Ringeffekte verdoppelt.',
    icon: '💍💍💍', color: '#FFD700',
    requires: { tags: ['ring'], minCount: 3 },
    statBonus: { ringEffectMultiplier: 2.0 }
  },
  {
    id: 'collector',
    name: 'Sammler',
    description: '3+ Relikte: Relikt-Effekte häufiger (Intervall -30%).',
    icon: '🏺🏺🏺', color: '#DAA520',
    requires: { tags: ['relic'], minCount: 3 },
    statBonus: { relicIntervalReduction: 0.30 }
  },
  {
    id: 'full_set_knight',
    name: 'Ritter-Set',
    description: 'Rüstung + Stiefel + Amulett: +60% max HP, Immunität gegen Slow.',
    icon: '🛡️👢📿', color: '#CD853F',
    requires: { itemIds: ['speed_boots', 'xp_amulet'], tags: ['armor'] },
    statBonus: { maxHPBonus: 0.60, immuneToSlow: true }
  },
  {
    id: 'glass_cannon',
    name: 'Glas-Kanone',
    description: 'Max HP unter 80: +100% Schaden!',
    icon: '💥🪟', color: '#FF6347',
    requires: { maxHPBelow: 80 },
    statBonus: { globalDamageBonus: 1.0 }
  },
  {
    id: 'berserker_rage',
    name: 'Berserker-Wut',
    description: 'Berserker-Totem + Blutpanzer: Unter 30% HP → x3 Schaden + 50% Lebensraub.',
    icon: '😡🩸', color: '#DC143C',
    requires: { itemIds: ['berserker_totem', 'blood_armor'] },
    statBonus: { berserkerDamageBonus: 3.0, berserkerLifeSteal: 0.50 }
  },
  {
    id: 'ricochet_god',
    name: 'Ricochet-Gott',
    description: 'Bumerang + Durchdringung-Amulett: Unendliche Abpraller.',
    icon: '🔄♾️', color: '#FF8C00',
    requires: { itemIds: ['boomerang', 'pierce_amulet'] },
    statBonus: { unlimitedBounce: true, boomerangDamageBonus: 0.5 }
  },
  {
    id: 'death_by_1000',
    name: 'Tausend Schnitte',
    description: '3+ Dolche/Klingen + Geschwindigkeits-Amulett: Angriffsgeschwindigkeit x3.',
    icon: '🗡️🗡️🗡️', color: '#C0C0C0',
    requires: { tags: ['dagger'], minCount: 3, itemIds: ['speed_amulet'] },
    statBonus: { globalAttackSpeed: 2.0 }
  },
  {
    id: 'void_mastery',
    name: 'Leere-Meisterschaft',
    description: '2+ Leeregegenstände: Alle Kills erzeugen Leere-Explosionen.',
    icon: '🌀🌑', color: '#4B0082',
    requires: { elements: ['void'], minCount: 2 },
    statBonus: { voidKillExplosion: true, voidKillExplosionDamage: 25, voidKillRadius: 110 }
  },
  {
    id: 'chaos_mastery',
    name: 'Chaos-Meisterschaft',
    description: '2+ Chaos-Gegenstände: Zufällig ein Bonus-Element pro Schuss.',
    icon: '🌈💫', color: '#FF00FF',
    requires: { elements: ['chaos'], minCount: 2 },
    statBonus: { chaosExtraElement: true, chaosDamageBonus: 0.30 }
  },
];

// ============================================================
// SYNERGY CALCULATOR
// ============================================================
function calculateSynergies(equippedItems) {
  const active = [];

  // Gather stats from equipped items
  const elementCounts = {};
  const tagCounts = {};
  const itemIdSet = new Set(equippedItems.map(i => i.id));
  let weaponCount = 0;
  let wandCount = 0;
  let bowCount = 0;

  equippedItems.forEach(item => {
    if (item.element) {
      elementCounts[item.element] = (elementCounts[item.element] || 0) + 1;
    }
    (item.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    if (item.category && item.category.startsWith('weapon')) weaponCount++;
    if (item.tags && item.tags.includes('wand')) wandCount++;
    if (item.tags && item.tags.includes('bow')) bowCount++;
  });

  // Get total max HP for glass cannon check
  const totalMaxHP = equippedItems.reduce((s, i) => s + (i.stats?.maxHP || 0), 100);

  for (const syn of SYNERGY_DEFS) {
    const req = syn.requires;
    let qualifies = true;

    // Check element requirements
    if (req.elements) {
      for (const el of req.elements) {
        if (!elementCounts[el] || elementCounts[el] < (req.minCount || 1)) {
          qualifies = false;
          break;
        }
      }
    }

    // Check weapon-only element requirement
    if (req.weaponsOnly && req.elements) {
      const weaponElements = equippedItems
        .filter(i => i.category && i.category.startsWith('weapon'))
        .map(i => i.element);
      for (const el of req.elements) {
        const count = weaponElements.filter(e => e === el).length;
        if (count < (req.minCount || 1)) { qualifies = false; break; }
      }
    }

    // Check tag requirements
    if (req.tags) {
      if (!req.allTags) {
        if ((tagCounts[req.tags] || 0) < (req.minCount || 1)) qualifies = false;
      } else {
        // Need at least one of each
        if ((tagCounts[req.tags] || 0) < 1) qualifies = false;
        for (const t of req.allTags) {
          if ((tagCounts[t] || 0) < 1) { qualifies = false; break; }
        }
      }
    }

    // Check specific item ids
    if (req.itemIds) {
      for (const id of req.itemIds) {
        if (!itemIdSet.has(id)) { qualifies = false; break; }
      }
    }

    // Check weapon counts
    if (req.minWeapons && weaponCount < req.minWeapons) qualifies = false;
    if (req.minWands && wandCount < req.minWands) qualifies = false;
    if (req.minBowCount && bowCount < req.minBowCount) qualifies = false;
    if (req.minArrowCount) {
      const arrowCount = (tagCounts['arrow'] || 0);
      if (arrowCount < req.minArrowCount) qualifies = false;
    }

    // Glass cannon check
    if (req.maxHPBelow && totalMaxHP >= req.maxHPBelow) qualifies = false;

    if (qualifies) active.push(syn);
  }

  return active;
}

// Merge all synergy stat bonuses into player stats
function applySynergyStats(player, activeSynergies) {
  // Reset synergy bonuses
  player.synergyBonuses = {
    globalDamageBonus: 0,
    globalAttackSpeed: 0,
    globalLifeSteal: 0,
    fireBonus: 0, iceBonus: 0, lightningBonus: 0, poisonBonus: 0,
    meleeDamageBonus: 0, rangedDamageBonus: 0, magicDamageBonus: 0,
    defense: 0, maxHPBonus: 0,
    chainPoisonDamage: 0,
    freezeHeal: 0, killHeal: 0, healingMultiplier: 1,
    orbitSpeedBonus: 0, projectileSpeedBonus: 0,
    ringEffectMultiplier: 1, relicIntervalReduction: 0,
    voidKillExplosion: false, voidKillExplosionDamage: 0, voidKillRadius: 0,
    burnSpreadsPoison: false, chainAppliesPoison: false,
    frozenExplodeDamage: 0, frozenExplodeChain: 0,
    immuneToSlow: false, allHoming: false, unlimitedBounce: false,
    assassinFirstHit: false, assassinCritMult: 1, firstHitDone: false,
    berserkerDamageBonus: 1, berserkerLifeSteal: 0,
    poisonHeals: 0, burnLifeSteal: 0,
    lightningStunChance: 0, lightningStunHeal: 0,
    slowedPoisonBonus: 0, burnChainDamage: 0,
    ignoreDefense: false, chaosExtraElement: false
  };

  for (const syn of activeSynergies) {
    if (!syn.statBonus) continue;
    for (const [key, val] of Object.entries(syn.statBonus)) {
      if (typeof val === 'number') {
        player.synergyBonuses[key] = (player.synergyBonuses[key] || 0) + val;
      } else {
        player.synergyBonuses[key] = val;
      }
    }
  }
}
