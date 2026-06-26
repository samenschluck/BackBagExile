'use strict';

// ============================================================
// BACKPACK SYSTEM - Grid-based inventory management
// ============================================================
const BACKPACK_COLS = 5;
const BACKPACK_ROWS = 8;

class Backpack {
  constructor() {
    this.grid = Array.from({ length: BACKPACK_ROWS }, () => Array(BACKPACK_COLS).fill(null));
    this.equippedItems = []; // items placed in grid
    this.dragItem = null;
    this.dragOffX = 0;
    this.dragOffY = 0;
    this.dragX = 0;
    this.dragY = 0;
    this.cellSize = 0; // set by renderer
    this.gridOriginX = 0;
    this.gridOriginY = 0;
  }

  // Get grid cell from pixel position
  pixelToCell(px, py) {
    const col = Math.floor((px - this.gridOriginX) / this.cellSize);
    const row = Math.floor((py - this.gridOriginY) / this.cellSize);
    return { col, row };
  }

  // Check if shape fits at given position
  canPlace(item, row, col, excludeItem = null) {
    const shape = this.getRotatedShape(item);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const gr = row + r;
        const gc = col + c;
        if (gr < 0 || gr >= BACKPACK_ROWS || gc < 0 || gc >= BACKPACK_COLS) return false;
        const occupant = this.grid[gr][gc];
        if (occupant && occupant !== excludeItem) return false;
      }
    }
    return true;
  }

  // Place item in grid
  placeItem(item, row, col) {
    const shape = this.getRotatedShape(item);
    item.gridPos = { row, col };
    item.equipped = true;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          this.grid[row + r][col + c] = item;
        }
      }
    }

    if (!this.equippedItems.includes(item)) {
      this.equippedItems.push(item);
    }
  }

  // Remove item from grid
  removeItem(item) {
    if (!item.gridPos) return;
    const shape = this.getRotatedShape(item);
    const { row, col } = item.gridPos;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          if (this.grid[row + r] && this.grid[row + r][col + c] === item) {
            this.grid[row + r][col + c] = null;
          }
        }
      }
    }
    item.gridPos = null;
    item.equipped = false;
    this.equippedItems = this.equippedItems.filter(i => i !== item);
  }

  rotateItem(item) {
    item.rotation = ((item.rotation || 0) + 1) % 4;
  }

  getRotatedShape(item) {
    let shape = item.shape || [[1]];
    const rot = item.rotation || 0;
    for (let i = 0; i < rot; i++) {
      shape = this.rotate90(shape);
    }
    return shape;
  }

  rotate90(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const newShape = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newShape[c][rows - 1 - r] = shape[r][c];
      }
    }
    return newShape;
  }

  getItemCells(item) {
    if (!item.gridPos) return [];
    const shape = this.getRotatedShape(item);
    const cells = [];
    const { row, col } = item.gridPos;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) cells.push({ row: row + r, col: col + c });
      }
    }
    return cells;
  }

  // Get adjacency bonuses for all items
  computeAdjacencyBonuses() {
    const bonuses = {};
    for (const item of this.equippedItems) {
      if (!item.adjacencyBonus || !item.gridPos) continue;
      const cells = this.getItemCells(item);

      for (const cell of cells) {
        const neighbors = this.getNeighborCells(cell.row, cell.col);
        for (const nb of neighbors) {
          const neighbor = this.grid[nb.row]?.[nb.col];
          if (!neighbor || neighbor === item) continue;

          for (const [tag, bonus] of Object.entries(item.adjacencyBonus)) {
            if (this.itemMatchesTag(neighbor, tag)) {
              if (!bonuses[neighbor.id]) bonuses[neighbor.id] = {};
              for (const [stat, val] of Object.entries(bonus)) {
                bonuses[neighbor.id][stat] = (bonuses[neighbor.id][stat] || 0) + val;
              }
            }
          }
        }
      }
    }
    return bonuses;
  }

  getNeighborCells(row, col) {
    return [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 }
    ].filter(c => c.row >= 0 && c.row < BACKPACK_ROWS && c.col >= 0 && c.col < BACKPACK_COLS);
  }

  itemMatchesTag(item, tag) {
    if (item.tags && item.tags.includes(tag)) return true;
    if (item.element === tag) return true;
    if (item.category && item.category.includes(tag)) return true;
    return false;
  }

  // Get adjacency highlight colors for UI
  getAdjacencyHighlights() {
    const highlights = {}; // key: "row,col", value: color
    for (const item of this.equippedItems) {
      if (!item.adjacencyBonus || !item.gridPos) continue;
      const cells = this.getItemCells(item);
      for (const cell of cells) {
        const neighbors = this.getNeighborCells(cell.row, cell.col);
        for (const nb of neighbors) {
          const neighbor = this.grid[nb.row]?.[nb.col];
          if (!neighbor || neighbor === item) continue;
          for (const tag of Object.keys(item.adjacencyBonus)) {
            if (this.itemMatchesTag(neighbor, tag)) {
              highlights[`${nb.row},${nb.col}`] = '#FFD700';
            }
          }
        }
      }
    }
    return highlights;
  }

  // Compute all player stats from equipped items
  computeStats() {
    const base = {
      maxHP: 100,
      defense: 0,
      moveSpeed: 120,
      hpRegen: 0,
      dodgeChance: 0,
      globalLifeSteal: 0,
      damageReflect: 0,
      pickupRadius: 60,
      critChance: 0.05,
      critMultiplier: 2.0,
      goldPerKill: 0,
      xpBonus: 0,
      globalDamageBonus: 0,
      globalAttackSpeed: 0,
      extraPiercing: 0,
      deathAbsorb: 0,
      killHeal: 0,
      fireAuraDamage: 0, fireAuraRadius: 0,
      iceAuraSlow: 0, iceAuraRadius: 0,
      killExplosionRadius: 0, killExplosionDamage: 0
    };

    const adjacencyBonuses = this.computeAdjacencyBonuses();

    for (const item of this.equippedItems) {
      const adj = adjacencyBonuses[item.id] || {};
      for (const [stat, val] of Object.entries(item.stats || {})) {
        if (stat in base) {
          base[stat] += val + (adj[stat] || 0);
        }
      }
      // Gems: adjacent bonuses are already handled
    }

    // Clamp
    base.dodgeChance = Math.min(base.dodgeChance, 0.75);
    base.critChance = Math.min(base.critChance, 0.95);
    base.moveSpeed = Math.max(50, base.moveSpeed);

    return base;
  }

  // Remove all items (for new game)
  clear() {
    this.grid = Array.from({ length: BACKPACK_ROWS }, () => Array(BACKPACK_COLS).fill(null));
    this.equippedItems = [];
  }

  // Auto-place an item in the first available spot
  autoPlace(item) {
    for (let row = 0; row < BACKPACK_ROWS; row++) {
      for (let col = 0; col < BACKPACK_COLS; col++) {
        if (this.canPlace(item, row, col)) {
          this.placeItem(item, row, col);
          return true;
        }
      }
    }
    return false;
  }
}
