'use strict';

// ============================================================
// SHOP SYSTEM
// ============================================================
class Shop {
  constructor(gameState) {
    this.gs = gameState;
    this.items = [];
    this.rerollCost = 2;
    this.itemsPerShop = 5;
    this.selectedItem = null;
    this.hoveredItem = null;
    this.sellMode = false;
  }

  generateShop(round, guaranteedRare = false, guaranteedEpic = false) {
    this.items = [];
    this.rerollCost = 2;

    const equippedIds = this.gs.backpack.equippedItems.map(i => i.id);
    const count = WAVE_CONFIGS[round - 1]?.shopItems || 5;

    for (let i = 0; i < count; i++) {
      const item = getWeightedRandomItem(
        this.items.map(x => x.id),
        round
      );
      if (item) this.items.push(item);
    }

    // Guarantee rare/epic for boss rounds
    if (guaranteedRare && !this.items.some(i => i.rarity === 'rare' || i.rarity === 'epic')) {
      const rares = getItemsByRarity('rare');
      if (rares.length > 0) {
        this.items[0] = JSON.parse(JSON.stringify(rares[Math.floor(Math.random() * rares.length)]));
      }
    }
    if (guaranteedEpic) {
      const epics = getItemsByRarity('epic');
      if (epics.length > 0) {
        this.items[0] = JSON.parse(JSON.stringify(epics[Math.floor(Math.random() * epics.length)]));
      }
    }
  }

  reroll(player) {
    const cost = this.gs.player.freeRerolls > 0 ? 0 : this.rerollCost;
    if (this.gs.player.freeRerolls > 0) {
      this.gs.player.freeRerolls--;
    } else if (this.gs.gold < cost) return false;
    else this.gs.gold -= cost;

    this.rerollCost = Math.min(this.rerollCost + 1, 8);
    this.generateShop(this.gs.currentRound);
    return true;
  }

  buyItem(item) {
    if (this.gs.gold < item.cost) return { success: false, reason: 'Nicht genug Gold!' };
    if (!this.gs.backpack.autoPlace(item)) {
      return { success: false, reason: 'Kein Platz im Rucksack!' };
    }
    this.gs.gold -= item.cost;
    this.items = this.items.filter(i => i !== item);

    // Apply onEquip
    if (item.onEquip) item.onEquip(this.gs.player, this.gs);
    this.gs.recomputePlayerStats();
    return { success: true };
  }

  sellItem(item, player) {
    const sellPrice = Math.max(1, Math.floor(item.cost * 0.5));
    this.gs.backpack.removeItem(item);
    this.gs.gold += sellPrice;
    this.gs.recomputePlayerStats();
    return sellPrice;
  }
}
