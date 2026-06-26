'use strict';

// ============================================================
// RENDERER - Canvas drawing for all game states
// ============================================================
class Renderer {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gs = gameState;
    this.bgStars = this.generateStars(150);
  }

  generateStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(),
      size: Math.random() * 2 + 0.5,
      brightness: Math.random()
    }));
  }

  // ========================
  // BACKGROUND
  // ========================
  drawBackground(w, h) {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h)*0.7);
    grad.addColorStop(0, '#0d0d1a');
    grad.addColorStop(1, '#050508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (const star of this.bgStars) {
      ctx.globalAlpha = 0.3 + star.brightness * 0.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ========================
  // MAIN MENU
  // ========================
  drawMenu(w, h, t) {
    this.drawBackground(w, h);
    const ctx = this.ctx;

    // Title
    ctx.save();
    ctx.textAlign = 'center';
    const pulse = Math.sin(t * 2) * 0.03 + 1;
    ctx.font = `bold ${Math.floor(52 * pulse)}px 'Courier New'`;
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#9B59B6';
    ctx.fillStyle = '#DDA0DD';
    ctx.fillText('BackBag Exile', w/2, h * 0.18);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFD700';
    ctx.font = `${Math.floor(22 * pulse)}px 'Courier New'`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Backpack Battler × Arena Auto-Shooter', w/2, h * 0.27);
    ctx.shadowBlur = 0;

    // Character cards
    const chars = this.gs.characters;
    const cardW = Math.min(170, (w - 60) / 3);
    const cardH = cardW * 1.5;
    const startX = w/2 - (cardW * 1.5 + 20);
    const cardY = h * 0.35;

    for (let i = 0; i < chars.length; i++) {
      const cx = startX + i * (cardW + 20);
      const selected = this.gs.selectedCharIndex === i;
      this.drawCharCard(ctx, cx, cardY, cardW, cardH, chars[i], selected, t);
    }

    // Start button
    this.drawButton(ctx, w/2, h * 0.82, 220, 55, 'SPIELEN', '#9B59B6', '#fff', t);
    // Info
    ctx.font = '14px Courier New';
    ctx.fillStyle = '#888';
    ctx.fillText('Tippe auf einen Charakter, dann auf Spielen', w/2, h * 0.91);
    ctx.restore();
  }

  drawCharCard(ctx, x, y, w, h, char, selected, t) {
    ctx.save();
    ctx.strokeStyle = selected ? '#FFD700' : '#444';
    ctx.lineWidth = selected ? 3 : 1;
    if (selected) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#FFD700';
    }
    ctx.fillStyle = selected ? 'rgba(155,89,182,0.25)' : 'rgba(20,20,40,0.8)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Character sprite placeholder
    ctx.fillStyle = char.color;
    ctx.beginPath();
    ctx.arc(x + w/2, y + h * 0.32, w * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.font = `${w * 0.25}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(char.icon, x + w/2, y + h * 0.35);

    ctx.font = `bold ${Math.min(16, w * 0.12)}px 'Courier New'`;
    ctx.fillStyle = '#fff';
    ctx.fillText(char.name, x + w/2, y + h * 0.53);

    ctx.font = `${Math.min(11, w * 0.082)}px 'Courier New'`;
    ctx.fillStyle = '#aaa';
    const lines = this.wrapText(char.description, w - 12);
    lines.forEach((line, i) => {
      ctx.fillText(line, x + w/2, y + h * 0.63 + i * 14);
    });

    // Stats
    ctx.textAlign = 'left';
    const stats = [
      { label: 'HP', val: char.startHP, color: '#E74C3C' },
      { label: 'SPD', val: char.startSpeed, color: '#3498DB' },
      { label: 'ATK', val: char.startDamage, color: '#E74C3C' }
    ];
    stats.forEach((s, i) => {
      ctx.font = `${Math.min(11, w * 0.082)}px 'Courier New'`;
      ctx.fillStyle = s.color;
      ctx.fillText(`${s.label}: ${'█'.repeat(s.val)}`, x + 8, y + h * 0.81 + i * 14);
    });

    ctx.restore();
  }

  drawButton(ctx, cx, cy, bw, bh, text, bgColor, textColor, t, highlighted = false) {
    const pulse = highlighted ? Math.sin(t * 4) * 0.05 + 1 : 1;
    ctx.save();
    ctx.shadowBlur = highlighted ? 25 : 10;
    ctx.shadowColor = bgColor;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(cx - bw/2, cy - bh/2, bw * pulse, bh * pulse, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = `bold 18px 'Courier New'`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  wrapText(text, maxW, charPerLine = 20) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      if ((line + word).length > charPerLine) {
        if (line) lines.push(line.trim());
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  }

  // ========================
  // SHOP SCREEN
  // ========================
  drawShop(w, h, t) {
    this.drawBackground(w, h);
    const ctx = this.ctx;
    const gs = this.gs;

    // Left panel: backpack
    const panelW = Math.min(w * 0.5, 340);
    const cellSize = Math.min((panelW - 20) / BACKPACK_COLS, 50);
    const gridW = cellSize * BACKPACK_COLS;
    const gridH = cellSize * BACKPACK_ROWS;
    const gridX = 10;
    const gridY = 70;

    gs.backpack.cellSize = cellSize;
    gs.backpack.gridOriginX = gridX;
    gs.backpack.gridOriginY = gridY;

    // Header
    ctx.save();
    ctx.fillStyle = '#DDA0DD';
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`🎒 Rucksack  💰${gs.gold}G`, gridX, 30);
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText(`Runde ${gs.currentRound}/15`, gridX, 52);

    // Backpack grid
    this.drawBackpackGrid(ctx, gridX, gridY, cellSize);

    // Right panel: shop
    const shopX = gridX + gridW + 15;
    const shopW = w - shopX - 10;
    this.drawShopPanel(ctx, shopX, gridY - 40, shopW, h - gridY + 30, t);

    // Battle start button (fixed at bottom)
    const battleBtnY = h - 30;
    // Synergies panel (between grid and button)
    const synPanelTop = gridY + gridH + 10;
    const synPanelH = Math.max(0, battleBtnY - 25 - synPanelTop);
    this.drawSynergiesPanel(ctx, gridX, synPanelTop, gridW, synPanelH);

    this.drawButton(ctx, gridX + gridW/2, battleBtnY, gridW - 10, 44, '⚔️ IN KAMPF!', '#5a1a8a', '#FFD700', t, true);

    ctx.restore();
  }

  drawBackpackGrid(ctx, gx, gy, cs) {
    const bp = this.gs.backpack;
    const adjacencyHL = bp.getAdjacencyHighlights();

    // Grid background
    ctx.fillStyle = 'rgba(10,10,25,0.9)';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(gx - 4, gy - 4, cs * BACKPACK_COLS + 8, cs * BACKPACK_ROWS + 8, 6);
    ctx.fill();
    ctx.stroke();

    // Cells
    for (let r = 0; r < BACKPACK_ROWS; r++) {
      for (let c = 0; c < BACKPACK_COLS; c++) {
        const cx = gx + c * cs;
        const cy = gy + r * cs;
        const key = `${r},${c}`;

        ctx.strokeStyle = '#2a2a3a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx, cy, cs, cs);

        if (adjacencyHL[key]) {
          ctx.fillStyle = 'rgba(255,215,0,0.15)';
          ctx.fillRect(cx + 1, cy + 1, cs - 2, cs - 2);
        }
      }
    }

    // Drag preview
    if (bp.dragItem) {
      const { col, row } = bp.pixelToCell(bp.dragX, bp.dragY);
      const canPlace = bp.canPlace(bp.dragItem, row, col, bp.dragItem);
      const shape = bp.getRotatedShape(bp.dragItem);
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const gr = row + r, gc = col + c;
          if (gr >= 0 && gr < BACKPACK_ROWS && gc >= 0 && gc < BACKPACK_COLS) {
            ctx.fillStyle = canPlace ? 'rgba(46,204,113,0.35)' : 'rgba(231,76,60,0.35)';
            ctx.fillRect(gx + gc * cs, gy + gr * cs, cs, cs);
          }
        }
      }
    }

    // Draw equipped items
    for (const item of bp.equippedItems) {
      if (item === bp.dragItem) continue;
      if (!item.gridPos) continue;
      this.drawItemInGrid(ctx, item, bp, gx, gy, cs);
    }

    // Draw dragged item
    if (bp.dragItem) {
      const item = bp.dragItem;
      const shape = bp.getRotatedShape(item);
      const iw = shape[0].length * cs;
      const ih = shape.length * cs;
      ctx.globalAlpha = 0.8;
      this.drawItemBlock(ctx, bp.dragX - iw/2, bp.dragY - ih/2, shape, cs, item);
      ctx.globalAlpha = 1;
    }
  }

  drawItemInGrid(ctx, item, bp, gx, gy, cs) {
    const shape = bp.getRotatedShape(item);
    const { row, col } = item.gridPos;
    this.drawItemBlock(ctx, gx + col * cs, gy + row * cs, shape, cs, item);
  }

  drawItemBlock(ctx, x, y, shape, cs, item) {
    const rarity = RARITIES[item.rarity] || RARITIES.common;
    const elemColor = item.element ? ELEMENT_COLORS[item.element] : '#888';

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const cx = x + c * cs + 1;
        const cy = y + r * cs + 1;
        const sw = cs - 2;
        const sh = cs - 2;

        // Background
        ctx.fillStyle = `rgba(${this.hexToRgb(elemColor)}, 0.2)`;
        ctx.fillRect(cx, cy, sw, sh);

        // Border
        ctx.strokeStyle = rarity.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 6;
        ctx.shadowColor = rarity.glowColor;
        ctx.strokeRect(cx, cy, sw, sh);
        ctx.shadowBlur = 0;
      }
    }

    // Item icon (draw in center of bounding box)
    const rows = shape.length, cols = shape[0].length;
    const centerX = x + cols * cs / 2;
    const centerY = y + rows * cs / 2;
    ctx.font = `${Math.min(cs * 0.5, 24)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.getItemIcon(item), centerX, centerY);
    ctx.textBaseline = 'alphabetic';
  }

  getItemIcon(item) {
    const icons = {
      rusty_sword: '🗡️', fire_sword: '🔥', ice_blade: '❄️', thunder_hammer: '⚡',
      shadow_dagger: '🌑', holy_cross: '✝️', poison_scythe: '☠️', blood_axe: '🩸',
      bone_club: '🦴', void_scalpel: '🔮', basic_bow: '🏹', fire_arrow: '🔥',
      ice_arrow: '❄️', lightning_bolt: '⚡', poison_arrow: '☠️', holy_arrow: '✨',
      shadow_shot: '🌑', multishot_bow: '🏹', sniper_crossbow: '🎯',
      magic_wand: '🪄', flame_wand: '🔥', frost_wand: '❄️', storm_wand: '⛈️',
      chaos_wand: '🌈', poison_tome: '📗', void_orb: '🔮', holy_nova: '✨',
      shuriken: '⭐', fire_orb_orbital: '🔥', boomerang: '🪃', lightning_ring: '⚡',
      shadow_clone: '👥', leather_armor: '🥋', chain_mail: '⛓️', plate_armor: '🛡️',
      fire_cloak: '🔥', ice_cloak: '❄️', shadow_cloak: '🌑', holy_robe: '✨',
      blood_armor: '🩸', spiked_armor: '🦔', void_shroud: '🌀',
      speed_boots: '👟', fire_ring: '🔥', ice_ring: '❄️', thunder_ring: '⚡',
      poison_ring: '☠️', holy_ring: '✨', shadow_ring: '🌑', blood_ring: '🩸',
      lucky_ring: '🍀', gold_ring: '💰', xp_amulet: '🧿', damage_amulet: '⚔️',
      speed_amulet: '⚡', pierce_amulet: '🎯', explosion_amulet: '💣',
      heart_locket: '❤️', vampiric_fang: '🧛', berserker_totem: '😡',
      guardian_angel: '😇', chaos_crystal: '🌈', magnet: '🧲',
      philosopher_stone: '⚗️', time_watch: '⏱️', bomb_belt: '💣', blood_pact: '📜',
      ruby: '💎', sapphire: '💎', topaz: '💎', emerald: '💎', diamond: '💎', void_crystal: '💎'
    };
    return icons[item.id] || '❓';
  }

  hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `${r},${g},${b}`;
  }

  drawShopPanel(ctx, x, y, w, h, t) {
    const gs = this.gs;
    const shop = gs.shop;

    ctx.fillStyle = 'rgba(10,10,25,0.9)';
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    // Header
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('🏪 Shop', x + 8, y + 22);
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText(`Reroll: ${gs.player.freeRerolls > 0 ? 'GRATIS' : shop.rerollCost + 'G'}`, x + w - 90, y + 22);

    // Shop items
    const itemH = Math.min(80, (h - 90) / Math.max(shop.items.length, 1));
    shop.items.forEach((item, i) => {
      const iy = y + 34 + i * (itemH + 4);
      this.drawShopItem(ctx, x + 4, iy, w - 8, itemH - 2, item, gs.gold, t);
    });

    // Buttons
    const btnY = y + h - 50;
    this.drawButton(ctx, x + w/2 - 55, btnY, 90, 36, '🔄 REROLL', '#1a4a7a', '#fff', t);
    this.drawButton(ctx, x + w/2 + 55, btnY, 90, 36, gs.shop.sellMode ? '✅ VERKAUF' : '💰 VERKAUF', gs.shop.sellMode ? '#7a1a1a' : '#2d4a1a', '#fff', t);
  }

  drawShopItem(ctx, x, y, w, h, item, gold, t) {
    const rarity = RARITIES[item.rarity] || RARITIES.common;
    const canAfford = gold >= item.cost;
    const isHovered = this.gs.shop.hoveredItem === item;

    ctx.fillStyle = isHovered ? 'rgba(60,40,80,0.9)' : 'rgba(20,15,35,0.8)';
    ctx.strokeStyle = isHovered ? rarity.color : '#333';
    ctx.lineWidth = isHovered ? 2 : 1;
    if (isHovered) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = rarity.glowColor;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 5);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Icon
    ctx.font = `${h * 0.5}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(this.getItemIcon(item), x + h * 0.5, y + h * 0.65);

    // Name & description
    const tx = x + h + 8;
    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.min(13, h * 0.2)}px 'Courier New'`;
    ctx.fillStyle = rarity.color;
    ctx.fillText(item.name, tx, y + h * 0.28);

    ctx.font = `${Math.min(10, h * 0.16)}px 'Courier New'`;
    ctx.fillStyle = '#aaa';
    const desc = item.description || '';
    ctx.fillText(desc.length > 35 ? desc.slice(0, 35) + '…' : desc, tx, y + h * 0.52);

    // Element badge
    if (item.element) {
      ctx.font = `${Math.min(10, h * 0.15)}px 'Courier New'`;
      ctx.fillStyle = ELEMENT_COLORS[item.element] || '#fff';
      ctx.fillText(item.element.toUpperCase(), tx, y + h * 0.75);
    }

    // Cost
    ctx.textAlign = 'right';
    ctx.font = `bold ${Math.min(14, h * 0.22)}px 'Courier New'`;
    ctx.fillStyle = canAfford ? '#FFD700' : '#7a6a3a';
    ctx.fillText(`${item.cost}G`, x + w - 6, y + h * 0.65);

    // Shape preview (tiny)
    const shapeX = x + w - 50;
    const shapeY = y + 4;
    const sc = 8;
    const shape = item.shape || [[1]];
    for (let r = 0; r < shape.length && r < 4; r++) {
      for (let c = 0; c < (shape[r]?.length || 0) && c < 4; c++) {
        if (shape[r][c]) {
          ctx.fillStyle = rarity.color + '88';
          ctx.fillRect(shapeX + c * sc, shapeY + r * sc, sc - 1, sc - 1);
        }
      }
    }
  }

  drawSynergiesPanel(ctx, x, y, w, h) {
    const synergies = this.gs.activeSynergies;
    if (synergies.length === 0) return;

    ctx.fillStyle = 'rgba(10,10,25,0.85)';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px Courier New';
    ctx.fillStyle = '#DDA0DD';
    ctx.textAlign = 'left';
    ctx.fillText('✨ Synergien:', x + 6, y + 16);

    const lineH = Math.min(18, (h - 20) / Math.max(synergies.length, 1));
    synergies.forEach((syn, i) => {
      ctx.font = `${Math.min(11, lineH * 0.75)}px Courier New`;
      ctx.fillStyle = syn.color;
      ctx.fillText(`${syn.icon} ${syn.name}`, x + 6, y + 24 + i * lineH);
    });
  }

  // ========================
  // BATTLE SCREEN
  // ========================
  drawBattle(w, h, t) {
    const ctx = this.ctx;
    const gs = this.gs;

    // Arena background
    ctx.fillStyle = '#0a0814';
    ctx.fillRect(0, 0, w, h);

    // Grid floor
    ctx.strokeStyle = 'rgba(50,40,80,0.3)';
    ctx.lineWidth = 0.5;
    const gridSize = 60;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Poison trails
    for (const trail of gs.poisonTrails || []) {
      ctx.globalAlpha = trail.opacity * 0.5;
      ctx.fillStyle = '#39FF14';
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Enemy projectiles
    for (const proj of gs.enemyProjectiles) {
      ctx.globalAlpha = 0.9;
      ctx.shadowBlur = 8;
      ctx.shadowColor = proj.color;
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.size || 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Enemy HP bars & sprites
    for (const enemy of gs.enemies) {
      if (enemy.dead) continue;
      this.drawEnemy(ctx, enemy, t);
    }

    // Player projectiles
    for (const proj of gs.projectiles) {
      ctx.globalAlpha = 0.95;
      ctx.shadowBlur = 12;
      ctx.shadowColor = proj.color;
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.size || 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Orbital weapon positions
    for (const item of gs.backpack.equippedItems) {
      if (!item._orbitPositions) continue;
      for (const pos of item._orbitPositions) {
        const color = ELEMENT_COLORS[item.element] || '#fff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getItemIcon(item), pos.x, pos.y);
        ctx.shadowBlur = 0;
        ctx.textBaseline = 'alphabetic';
      }
    }

    // Player
    this.drawPlayer(ctx, gs.player, t);

    // Particles
    gs.particles.draw(ctx);

    // HUD
    this.drawBattleHUD(w, h, t);
  }

  drawPlayer(ctx, player, t) {
    const x = player.x, y = player.y;
    const size = player.size;

    ctx.save();
    if (player.hurtTime > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(t * 30) * 0.5;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + size - 3, size * 0.7, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color || '#9B59B6';
    ctx.fillStyle = player.color || '#9B59B6';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dash indicator
    if (player.dashCooldown <= 0) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Icon
    ctx.font = `${size * 1.2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.icon || '🧙', x, y);
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = 1;
    ctx.restore();

    // HP bar
    this.drawHPBar(ctx, x - size, y - size - 12, size * 2, 5, player.hp, player.maxHP, '#E74C3C');
  }

  drawEnemy(ctx, enemy, t) {
    const x = enemy.x, y = enemy.y;
    const size = enemy.size;
    const def = ENEMY_DEFS[enemy.type] || {};

    ctx.save();

    // Frozen tint
    if (enemy.statusEffects?.freeze) {
      ctx.fillStyle = 'rgba(0,207,255,0.4)';
      ctx.beginPath();
      ctx.arc(x, y, size + 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Burn aura
    if (enemy.statusEffects?.burn) {
      const pulse = Math.sin(t * 8) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(255,69,0,${pulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Poison aura
    if (enemy.statusEffects?.poison) {
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#39FF14';
    }

    // Body
    ctx.shadowBlur = enemy.isBoss ? 25 : 6;
    ctx.shadowColor = enemy.color;
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Boss crown
    if (enemy.isBoss) {
      ctx.fillStyle = '#FFD700';
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('👑', x, y - size);
    }

    // Icon (emoji for now)
    const icons = {
      slime: '🟢', bat: '🦇', skeleton: '💀', zombie: '🧟', ghost: '👻',
      goblin: '👺', orc: '👹', spider: '🕷️', mini_spider: '🕷',
      witch: '🧙‍♀️', knight: '⚔️', fire_imp: '👿', ice_golem_small: '🗿',
      thunder_elemental: '⚡', poison_slug: '🐌', shadow_wraith: '😈',
      blood_cultist: '🩸', void_walker: '🌀',
      dragon_boss: '🐉', ice_queen: '❄️', necromancer_boss: '💀',
      chaos_titan: '🌈', void_overlord: '🌑'
    };
    ctx.font = `${Math.min(size * 1.0, 28)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icons[enemy.type] || '👾', x, y);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();

    // HP bar
    const barW = size * 2 + 10;
    this.drawHPBar(ctx, x - barW/2, y - size - 12, barW, 4, enemy.hp, enemy.maxHP, enemy.isBoss ? '#E74C3C' : '#27AE60');
  }

  drawHPBar(ctx, x, y, w, h, hp, maxHP, color) {
    const pct = Math.max(0, hp / maxHP);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * pct, h);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);
  }

  drawBattleHUD(w, h, t) {
    const ctx = this.ctx;
    const gs = this.gs;
    const player = gs.player;

    // Top bar
    ctx.fillStyle = 'rgba(5,5,15,0.85)';
    ctx.fillRect(0, 0, w, 60);

    // HP bar (big)
    const hpBarW = w * 0.35;
    const hpBarX = 10;
    const hpPct = Math.max(0, player.hp / player.maxHP);
    ctx.fillStyle = '#111';
    ctx.fillRect(hpBarX, 8, hpBarW, 18);
    const hpColor = hpPct > 0.5 ? '#27AE60' : hpPct > 0.25 ? '#E67E22' : '#E74C3C';
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBarX, 8, hpBarW * hpPct, 18);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpBarX, 8, hpBarW, 18);
    ctx.font = 'bold 11px Courier New';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`❤️ ${Math.ceil(player.hp)}/${player.maxHP}`, hpBarX + 3, 22);

    // XP bar
    const xpBarW = w * 0.35;
    const xpPct = gs.xp / gs.xpToLevel;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(hpBarX, 30, xpBarW, 8);
    ctx.fillStyle = '#9B59B6';
    ctx.fillRect(hpBarX, 30, xpBarW * xpPct, 8);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(hpBarX, 30, xpBarW, 8);
    ctx.font = '10px Courier New';
    ctx.fillStyle = '#DDA0DD';
    ctx.fillText(`Lv.${gs.playerLevel}  ${gs.xp}/${gs.xpToLevel} EP`, hpBarX + 3, 43);

    // Timer (center)
    const timeLeft = Math.max(0, gs.roundTimer);
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px Courier New';
    ctx.shadowBlur = 15;
    ctx.shadowColor = timeLeft < 10 ? '#E74C3C' : '#9B59B6';
    ctx.fillStyle = timeLeft < 10 ? '#E74C3C' : '#fff';
    ctx.fillText(Math.ceil(timeLeft), w/2, 40);
    ctx.shadowBlur = 0;

    // Round & gold (right)
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px Courier New';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`💰 ${gs.gold}G`, w - 10, 20);
    ctx.fillStyle = '#DDA0DD';
    ctx.fillText(`Runde ${gs.currentRound}/15`, w - 10, 40);

    // Boss HP bar (if boss present)
    const boss = gs.enemies.find(e => e.isBoss && !e.dead);
    if (boss) {
      const bossBarW = w * 0.6;
      const bossBarX = w/2 - bossBarW/2;
      const bossPct = Math.max(0, boss.hp / boss.maxHP);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bossBarX - 5, h - 40, bossBarW + 10, 30);
      ctx.fillStyle = '#111';
      ctx.fillRect(bossBarX, h - 35, bossBarW, 18);
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(bossBarX, h - 35, bossBarW * bossPct, 18);
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = 2;
      ctx.strokeRect(bossBarX, h - 35, bossBarW, 18);
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px Courier New';
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#E74C3C';
      ctx.fillText(`💀 ${boss.name}  ${Math.ceil(boss.hp)}/${boss.maxHP}`, w/2, h - 21);
      ctx.shadowBlur = 0;
    }

    // Dash indicator (bottom left)
    const dashPct = 1 - Math.max(0, player.dashCooldown / 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, h - 50, 60, 40);
    ctx.fillStyle = dashPct >= 1 ? '#FFD700' : '#555';
    ctx.fillRect(10, h - 50, 60 * dashPct, 40);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, h - 50, 60, 40);
    ctx.textAlign = 'center';
    ctx.font = '11px Courier New';
    ctx.fillStyle = '#fff';
    ctx.fillText(dashPct >= 1 ? '⚡DASH' : '⌛', 40, h - 26);

    // Active synergies (icons)
    const syns = gs.activeSynergies.slice(0, 6);
    ctx.textAlign = 'center';
    syns.forEach((syn, i) => {
      const sx = w - 40 - i * 30;
      const sy = h - 30;
      ctx.font = '18px serif';
      ctx.fillText(syn.icon, sx, sy);
    });
  }

  // ========================
  // LEVEL UP SCREEN
  // ========================
  drawLevelUp(w, h, t) {
    this.drawBackground(w, h);
    const ctx = this.ctx;
    const gs = this.gs;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Courier New';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#9B59B6';
    ctx.fillStyle = '#DDA0DD';
    ctx.fillText('⬆️ LEVEL UP!', w/2, h * 0.12);
    ctx.font = '18px Courier New';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.fillText(`Level ${gs.playerLevel}`, w/2, h * 0.21);
    ctx.shadowBlur = 0;

    const upgrades = gs.levelUpChoices;
    const cardW = Math.min(200, (w - 60) / 3);
    const cardH = cardW * 1.4;
    const startX = w/2 - (cardW * 1.5 + 20);
    const cardY = h * 0.28;

    upgrades.forEach((upg, i) => {
      const cx = startX + i * (cardW + 20);
      const hovered = gs.levelUpHovered === i;

      ctx.fillStyle = hovered ? 'rgba(80,50,110,0.95)' : 'rgba(20,15,35,0.9)';
      ctx.strokeStyle = hovered ? '#FFD700' : '#9B59B6';
      ctx.lineWidth = hovered ? 3 : 1;
      if (hovered) { ctx.shadowBlur = 20; ctx.shadowColor = '#FFD700'; }
      ctx.beginPath();
      ctx.roundRect(cx, cardY, cardW, cardH, 10);
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = `${cardW * 0.25}px serif`;
      ctx.fillText(upg.icon, cx + cardW/2, cardY + cardH * 0.3);

      ctx.font = `bold ${Math.min(14, cardW * 0.09)}px Courier New`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(upg.name, cx + cardW/2, cardY + cardH * 0.48);

      ctx.font = `${Math.min(11, cardW * 0.07)}px Courier New`;
      ctx.fillStyle = '#ccc';
      const lines = this.wrapText(upg.desc, cardW - 10, 20);
      lines.forEach((line, li) => {
        ctx.fillText(line, cx + cardW/2, cardY + cardH * 0.6 + li * 14);
      });
    });

    ctx.font = '14px Courier New';
    ctx.fillStyle = '#666';
    ctx.fillText('Tippe auf eine Karte zum Auswählen', w/2, h * 0.9);
    ctx.restore();
  }

  // ========================
  // GAME OVER / VICTORY
  // ========================
  drawGameOver(w, h, t) {
    this.drawBackground(w, h);
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px Courier New';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#E74C3C';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText('☠️ GAME OVER ☠️', w/2, h * 0.3);
    ctx.shadowBlur = 0;
    ctx.font = '20px Courier New';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Runde ${this.gs.currentRound} / 15 erreicht`, w/2, h * 0.45);
    ctx.fillText(`${this.gs.totalKills} Gegner besiegt`, w/2, h * 0.54);
    this.drawButton(ctx, w/2, h * 0.7, 200, 50, '🔄 NEU STARTEN', '#7a1a1a', '#fff', t, true);
    ctx.restore();
  }

  drawVictory(w, h, t) {
    this.drawBackground(w, h);
    const ctx = this.ctx;
    const pulse = Math.sin(t * 3) * 0.04 + 1;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(42 * pulse)}px Courier New`;
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#FFD700';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('🏆 SIEG! 🏆', w/2, h * 0.25);
    ctx.shadowBlur = 0;
    ctx.font = '20px Courier New';
    ctx.fillStyle = '#DDA0DD';
    ctx.fillText('Der Leere-Herrscher ist besiegt!', w/2, h * 0.38);
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Runden: 15/15  |  Kills: ${this.gs.totalKills}`, w/2, h * 0.48);
    ctx.fillText(`Level erreicht: ${this.gs.playerLevel}`, w/2, h * 0.56);
    this.drawButton(ctx, w/2, h * 0.72, 200, 50, '🔄 NEU SPIELEN', '#1a5a1a', '#fff', t, true);
    ctx.restore();
  }

  // ========================
  // BOSS WARNING
  // ========================
  drawBossWarning(w, h, t) {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(139,0,0,${Math.sin(t * 6) * 0.15 + 0.25})`;
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px Courier New';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#E74C3C';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText('⚠️ BOSS ERSCHEINT! ⚠️', w/2, h/2);
    ctx.shadowBlur = 0;
  }

  // ========================
  // ITEM TOOLTIP
  // ========================
  drawTooltip(item, x, y, w, h) {
    const ctx = this.ctx;
    const tooltipW = 200;
    const rarity = RARITIES[item.rarity] || RARITIES.common;

    let tx = x + 20;
    if (tx + tooltipW > w) tx = x - tooltipW - 10;
    let ty = y;

    ctx.save();
    ctx.fillStyle = 'rgba(5,5,20,0.97)';
    ctx.strokeStyle = rarity.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = rarity.glowColor;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tooltipW, 130, 8);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Courier New';
    ctx.fillStyle = rarity.color;
    ctx.fillText(item.name, tx + 8, ty + 22);

    ctx.font = '10px Courier New';
    ctx.fillStyle = '#888';
    ctx.fillText(rarity.label + (item.element ? ' · ' + item.element.toUpperCase() : ''), tx + 8, ty + 36);

    ctx.font = '11px Courier New';
    ctx.fillStyle = '#ccc';
    const lines = this.wrapText(item.description || '', 200);
    lines.forEach((l, i) => ctx.fillText(l, tx + 8, ty + 52 + i * 14));

    // Stats
    let sy = ty + 52 + lines.length * 14 + 8;
    for (const [key, val] of Object.entries(item.stats || {})) {
      if (typeof val === 'number' && Math.abs(val) > 0.01) {
        ctx.font = '10px Courier New';
        ctx.fillStyle = val > 0 ? '#2ECC71' : '#E74C3C';
        ctx.fillText(`${key}: ${val > 0 ? '+' : ''}${typeof val === 'number' && val < 1 && val > -1 ? (val * 100).toFixed(0) + '%' : val}`, tx + 8, sy);
        sy += 12;
      }
    }

    ctx.font = 'bold 12px Courier New';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.fillText(`Kosten: ${item.cost}G`, tx + tooltipW - 8, ty + 22);
    ctx.restore();
  }
}
