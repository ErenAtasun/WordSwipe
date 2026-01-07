import { Container, Graphics, Text, Sprite } from "pixi.js";
import gsap from "gsap";
import { GAME_WIDTH } from "..";

/**
 * Grid Class - Represents the game board
 */
export default class Grid extends Container {
  constructor(level, cellSize = 50) {
    super();

    this.level = level;
    this.cellSize = cellSize;
    this.cellGap = 4; // Gap between cells
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.cells = []; // 2D array: cells[y][x]
    this.placedLetters = {}; // {`${x},${y}`: letter}

    this.calculateGridSize();
    this.createGrid();
  }

  /**
   * Calculate grid size
   */
  calculateGridSize() {
    let maxX = 0;
    let maxY = 0;

    this.level.words.forEach(word => {
      if (word.orientation === 'H') {
        maxX = Math.max(maxX, word.x + word.word.length);
        maxY = Math.max(maxY, word.y + 1);
      } else {
        maxX = Math.max(maxX, word.x + 1);
        maxY = Math.max(maxY, word.y + word.word.length);
      }
    });

    this.gridWidth = maxX;
    this.gridHeight = maxY;

    // Position grid at top center of screen (reference design)
    const totalWidth = this.gridWidth * (this.cellSize + this.cellGap);
    this.x = (GAME_WIDTH - totalWidth) / 2;
    this.y = 80;
  }

  /**
   * Create grid visual
   */
  createGrid() {
    // No background - will be transparent
    // Cells will be added directly

    // Create cells
    this.cells = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.createCell(x, y);
        this.cells[y][x] = cell;
        this.addChild(cell);
      }
    }
  }

  /**
   * Create a single cell
   */
  createCell(x, y) {
    const cell = new Container();
    cell.x = x * (this.cellSize + this.cellGap);
    cell.y = y * (this.cellSize + this.cellGap);

    // Check if there's a word at this cell
    const word = this.level.getWordAtPosition(x, y);

    if (word) {
      // Word cell - Cream/White background (reference design)
      const bg = new Graphics();
      bg.beginFill(0xFFFBF0); // Light cream
      bg.lineStyle(1, 0xE0D5C5);
      bg.drawRoundedRect(0, 0, this.cellSize, this.cellSize, 6);
      bg.endFill();
      cell.addChild(bg);
      cell.bgGraphics = bg;
    }
    // No background for cells without words (stays transparent)

    cell.cellX = x;
    cell.cellY = y;
    cell.isEmpty = true;

    return cell;
  }

  /**
   * Convert world coordinates to grid position
   */
  worldToGrid(worldX, worldY) {
    const localX = worldX - this.x;
    const localY = worldY - this.y;

    const cellTotal = this.cellSize + this.cellGap;
    const gridX = Math.floor(localX / cellTotal);
    const gridY = Math.floor(localY / cellTotal);

    return { x: gridX, y: gridY };
  }

  /**
   * Convert grid coordinates to world coordinates
   */
  gridToWorld(gridX, gridY) {
    const cellTotal = this.cellSize + this.cellGap;
    return {
      x: this.x + gridX * cellTotal + this.cellSize / 2,
      y: this.y + gridY * cellTotal + this.cellSize / 2
    };
  }

  /**
   * Place a letter on grid
   */
  placeLetter(x, y, letter) {
    const key = `${x},${y}`;
    this.placedLetters[key] = letter;

    const cell = this.cells[y] && this.cells[y][x];
    if (cell) {
      cell.isEmpty = false;
    }
  }

  /**
   * Remove letter at position
   */
  removeLetter(x, y) {
    const key = `${x},${y}`;
    delete this.placedLetters[key];

    const cell = this.cells[y] && this.cells[y][x];
    if (cell) {
      cell.isEmpty = true;
    }
  }

  /**
   * Check if position has a letter
   */
  hasLetter(x, y) {
    const key = `${x},${y}`;
    return key in this.placedLetters;
  }

  /**
   * Get letter at position
   */
  getLetter(x, y) {
    const key = `${x},${y}`;
    return this.placedLetters[key] || null;
  }

  /**
   * Show a letter visually (on grid)
   * isTemp: Temporary letter (not confirmed yet)
   */
  showLetter(x, y, letter, isTemp = false) {
    console.log("showLetter called:", letter, "->", x, y, "Grid size:", this.gridWidth, "x", this.gridHeight);
    const cell = this.cells[y] && this.cells[y][x];
    if (!cell) {
      console.error("Cell not found:", x, y, "cells[y]:", this.cells[y]);
      return;
    }
    console.log("Cell found, adding letter...");

    // Delete existing temp text
    const existingText = cell.getChildByName("letterText");
    if (existingText) {
      cell.removeChild(existingText);
    }

    const text = new Text(letter, {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xffffff, // White text (on orange background)
      fontWeight: 'bold',
      align: 'center'
    });
    text.anchor.set(0.5);
    text.x = this.cellSize / 2;
    text.y = this.cellSize / 2;
    text.name = "letterText";

    // Temp letters should be clickable
    if (isTemp) {
      text.interactive = true;
      text.buttonMode = true;
      text.cursor = 'pointer';
      text.on('pointerdown', (e) => {
        e.stopPropagation();
        // Trigger callback if exists
        if (this.onTempLetterClickCallback) {
          this.onTempLetterClickCallback(x, y, letter);
        }
      });
    }

    cell.addChild(text);

    // Animation (Reveal)
    text.scale.set(0);
    gsap.to(text.scale, { x: 1, y: 1, duration: 0.3, ease: "back.out(1.7)" });

    // Make background orange (reference design)
    if (cell.bgGraphics) {
      cell.bgGraphics.clear();
      cell.bgGraphics.beginFill(0xF39C12); // Orange
      cell.bgGraphics.lineStyle(2, 0xE67E22);
      cell.bgGraphics.drawRoundedRect(2, 2, this.cellSize - 4, this.cellSize - 4, 8);
      cell.bgGraphics.endFill();
    }
  }

  /**
   * Set temp letter click callback
   */
  setOnTempLetterClickCallback(cb) {
    this.onTempLetterClickCallback = cb;
  }

  /**
   * Remove temporary letter (visually)
   */
  removeTemporaryLetter(x, y) {
    const cell = this.cells[y][x];
    if (!cell) return;
    const text = cell.getChildByName("letterText");
    if (text) {
      cell.removeChild(text);
    }
    // Return background to cream color
    if (cell.bgGraphics) {
      cell.bgGraphics.clear();
      cell.bgGraphics.beginFill(0xFFF8E7);
      cell.bgGraphics.lineStyle(2, 0xE8DCC8);
      cell.bgGraphics.drawRoundedRect(2, 2, this.cellSize - 4, this.cellSize - 4, 8);
      cell.bgGraphics.endFill();
    }
  }

  /**
   * Highlight word (active target)
   */
  highlightWordTarget(wordData) {
    // First clear all grid highlights
    this.clearHighlights();

    const { x, y, word, orientation } = wordData;
    for (let i = 0; i < word.length; i++) {
      let cellX, cellY;
      if (orientation === 'H') {
        cellX = x + i;
        cellY = y;
      } else {
        cellX = x;
        cellY = y + i;
      }
      const cell = this.cells[cellY][cellX];
      // Light highlight - already cream color
    }
  }

  clearHighlights() {
    // No highlight in new design, cream color is default
  }

  /**
   * Clear grid
   */
  clear() {
    this.placedLetters = {};
    this.cells.forEach(row => {
      row.forEach(cell => {
        cell.isEmpty = true;
        // Clear texts (later added children)
        // Except bgSprite and background
        if (cell.children.length > 2) {
          // This is a bit risky, need to know container structure exactly
          // Looking at createCell method: bg or bgSprite is added
          // Then we add text
          // Best is to call removeChildren() and re-call createCell logic or just delete texts
          // Simply:
          cell.removeChildren();
          // Restore background
          if (cell.bgSprite) {
            cell.bgSprite.tint = 0xFFFFFF;
            cell.addChild(cell.bgSprite);
          } else {
            // Graphics drawing... instead of copying from createCell,
            // Recreating cells entirely might be cleaner in Game.js loadLevel
            // But if clear() method exists it should work properly
            // For now just clear text/extra children
            // First child is always BG
            const bg = cell.children[0];
            cell.removeChildren();
            cell.addChild(bg);
          }
        }
      });
    });
  }
}
