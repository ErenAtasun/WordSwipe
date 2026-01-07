import { Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";
import LetterTile from "./LetterTile";
import { GAME_WIDTH, GAME_HEIGHT } from "..";

/**
 * LetterTray Class - Circular letter tray (Swipe/Drag Connect)
 */
export default class LetterTray extends Container {
  constructor(letters, tileSize = 60) {
    super();

    this.letters = letters;
    this.tileSize = tileSize;
    this.tiles = [];
    this.radius = 80; // Make it a bit smaller
    this.centerX = GAME_WIDTH / 2;
    this.centerY = GAME_HEIGHT - 260; // Move up a bit

    // Swipe/Drag state
    this.isDragging = false;
    this.selectedTiles = [];
    this.connectionLine = null;

    // Word preview elements
    this.wordPreviewContainer = null;
    this.wordPreviewLetters = [];

    this.createTray();
    this.setupDragEvents();
  }

  /**
   * Create circular tray
   */
  createTray() {
    // Word preview container (above the tray)
    this.createWordPreview();

    // Semi-transparent beige/white circle background
    const bgCircle = new Graphics();
    bgCircle.beginFill(0xFFF8E7, 0.7);
    bgCircle.drawCircle(0, 0, this.radius + 60);
    bgCircle.endFill();
    bgCircle.x = this.centerX;
    bgCircle.y = this.centerY;
    this.addChild(bgCircle);

    // Graphics for connection line (add before letters)
    this.connectionLine = new Graphics();
    this.addChild(this.connectionLine);

    // Shuffle button
    this.createShuffleButton();

    // Place letters in circle
    const letterCount = this.letters.length;
    const angleStep = (Math.PI * 2) / letterCount;
    const startAngle = -Math.PI / 2;

    this.letters.forEach((letter, index) => {
      const angle = startAngle + index * angleStep;
      const tile = new LetterTile(letter, this.tileSize);

      tile.x = this.centerX + Math.cos(angle) * this.radius;
      tile.y = this.centerY + Math.sin(angle) * this.radius;
      tile.originalPosition = { x: tile.x, y: tile.y };
      tile.originalAngle = angle;

      tile.interactive = true;
      tile.buttonMode = true;
      tile.cursor = 'pointer';

      this.addChild(tile);
      this.tiles.push(tile);
    });
  }

  /**
   * Create word preview display above the tray
   */
  createWordPreview() {
    this.wordPreviewContainer = new Container();
    this.wordPreviewContainer.x = this.centerX;
    // Position it between letter tray and hint banner (above the circular tray background)
    this.wordPreviewContainer.y = this.centerY - this.radius - 85;
    this.addChild(this.wordPreviewContainer);

    // Background rounded rectangle (initially hidden)
    this.wordPreviewBg = new Graphics();
    this.wordPreviewContainer.addChild(this.wordPreviewBg);
  }

  /**
   * Update word preview display
   */
  updateWordPreview() {
    // Clear previous letters
    this.wordPreviewLetters.forEach(letter => {
      this.wordPreviewContainer.removeChild(letter);
      letter.destroy();
    });
    this.wordPreviewLetters = [];
    this.wordPreviewBg.clear();

    if (this.selectedTiles.length === 0) return;

    const word = this.getCurrentWord();
    const letterSpacing = 40;
    const totalWidth = word.length * letterSpacing;
    const startX = -totalWidth / 2 + letterSpacing / 2;

    // Draw background
    const bgPadding = 15;
    const bgHeight = 50;
    this.wordPreviewBg.beginFill(0x2D5016, 0.9);
    this.wordPreviewBg.drawRoundedRect(
      -totalWidth / 2 - bgPadding,
      -bgHeight / 2,
      totalWidth + bgPadding * 2,
      bgHeight,
      12
    );
    this.wordPreviewBg.endFill();

    // Create letter style
    const letterStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 2,
      dropShadowDistance: 1
    });

    // Add each letter
    word.split('').forEach((char, index) => {
      const letterText = new Text(char, letterStyle);
      letterText.anchor.set(0.5);
      letterText.x = startX + index * letterSpacing;
      letterText.y = 0;

      // Pop-in animation
      letterText.scale.set(0);
      import("gsap").then((gsap) => {
        gsap.default.to(letterText.scale, {
          x: 1,
          y: 1,
          duration: 0.15,
          ease: "back.out(2)"
        });
      });

      this.wordPreviewContainer.addChild(letterText);
      this.wordPreviewLetters.push(letterText);
    });
  }

  /**
   * Create shuffle button
   */
  createShuffleButton() {
    try {
      const shuffleBtn = Sprite.from("shuffle");
      shuffleBtn.width = 50;
      shuffleBtn.height = 50;
      shuffleBtn.anchor.set(0.5);
      shuffleBtn.x = this.centerX;
      shuffleBtn.y = this.centerY;
      shuffleBtn.interactive = true;
      shuffleBtn.buttonMode = true;
      shuffleBtn.cursor = 'pointer';

      shuffleBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        this.shuffle();
      });

      shuffleBtn.on('pointerover', () => {
        shuffleBtn.alpha = 0.7;
      });
      shuffleBtn.on('pointerout', () => {
        shuffleBtn.alpha = 1;
      });

      this.addChild(shuffleBtn);
      this.shuffleBtn = shuffleBtn;
    } catch (e) {
      console.error("Shuffle asset error:", e);
    }
  }

  /**
   * Setup drag events
   */
  setupDragEvents() {
    // Pointer events on stage
    this.interactive = true;
    this.hitArea = { contains: () => true }; // Capture entire area

    this.on('pointerdown', this.onDragStart.bind(this));
    this.on('pointermove', this.onDragMove.bind(this));
    this.on('pointerup', this.onDragEnd.bind(this));
    this.on('pointerupoutside', this.onDragEnd.bind(this));
  }

  /**
   * Drag start
   */
  onDragStart(event) {
    const pos = event.data.global;
    const tile = this.getTileAtPosition(pos.x, pos.y);

    if (tile && !tile.isUsed) {
      this.isDragging = true;
      this.selectedTiles = [tile];
      tile.select();
      this.updateConnectionLine();
      this.updateWordPreview();
      console.log("Drag started:", tile.letter);
    }
  }

  /**
   * Drag in progress
   */
  onDragMove(event) {
    if (!this.isDragging) return;

    const pos = event.data.global;
    const tile = this.getTileAtPosition(pos.x, pos.y);

    if (tile && !tile.isUsed && !this.selectedTiles.includes(tile)) {
      // New letter selected
      this.selectedTiles.push(tile);
      tile.select();
      this.updateWordPreview();
      console.log("Letter added:", tile.letter, "Word:", this.getCurrentWord());
    }

    // Update line (including finger position)
    this.updateConnectionLine(pos);
  }

  /**
   * Drag ended
   */
  onDragEnd(event) {
    if (!this.isDragging) return;

    this.isDragging = false;
    const word = this.getCurrentWord();
    console.log("Drag ended. Word:", word);

    // Process selected letters
    if (word.length > 0 && this.onWordCompleteCallback) {
      this.onWordCompleteCallback(word, this.selectedTiles);
    }

    // Clear selection
    this.clearSelection();
  }

  /**
   * Find tile at position
   */
  getTileAtPosition(x, y) {
    const hitRadius = 35; // Click tolerance

    for (const tile of this.tiles) {
      const dx = x - tile.x;
      const dy = y - tile.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < hitRadius) {
        return tile;
      }
    }
    return null;
  }

  /**
   * Get current word
   */
  getCurrentWord() {
    return this.selectedTiles.map(t => t.letter).join('');
  }

  /**
   * Update connection line
   */
  updateConnectionLine(currentPos = null) {
    this.connectionLine.clear();

    if (this.selectedTiles.length === 0) return;

    this.connectionLine.lineStyle(6, 0xF39C12, 0.8); // Orange line

    // Start from first letter
    const first = this.selectedTiles[0];
    this.connectionLine.moveTo(first.x, first.y);

    // Draw line to each selected letter
    for (let i = 1; i < this.selectedTiles.length; i++) {
      const tile = this.selectedTiles[i];
      this.connectionLine.lineTo(tile.x, tile.y);
    }

    // If dragging continues, draw to finger position too
    if (currentPos && this.isDragging) {
      this.connectionLine.lineTo(currentPos.x, currentPos.y);
    }
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedTiles.forEach(tile => tile.deselect());
    this.selectedTiles = [];
    this.connectionLine.clear();
    this.updateWordPreview();
  }

  /**
   * Word complete callback
   */
  setOnWordCompleteCallback(cb) {
    this.onWordCompleteCallback = cb;
  }

  /**
   * Old callback compatibility (no longer used)
   */
  setOnLetterClickCallback(cb) {
    // This is no longer used, use setOnWordCompleteCallback instead
  }

  /**
   * Reset all letters
   */
  resetAll() {
    this.tiles.forEach(t => t.setUsed(false));
    this.clearSelection();
  }

  /**
   * Mark specific tiles as used
   */
  markTilesAsUsed(tiles) {
    tiles.forEach(t => t.setUsed(true));
  }

  /**
   * Error animation
   */
  onError() {
    import("gsap").then((gsap) => {
      this.tiles.forEach((tile, i) => {
        gsap.default.to(tile, {
          x: tile.x + 8,
          duration: 0.08,
          yoyo: true,
          repeat: 4,
          delay: i * 0.02,
          onComplete: () => {
            tile.x = tile.originalPosition.x;
          }
        });
      });
    });
  }

  /**
   * Shuffle letters
   */
  shuffle() {
    import("gsap").then((gsap) => {
      const availableTiles = this.tiles.filter(t => !t.isUsed);
      if (availableTiles.length <= 1) return;

      const angles = availableTiles.map(t => t.originalAngle);
      for (let i = angles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [angles[i], angles[j]] = [angles[j], angles[i]];
      }

      availableTiles.forEach((tile, i) => {
        const newX = this.centerX + Math.cos(angles[i]) * this.radius;
        const newY = this.centerY + Math.sin(angles[i]) * this.radius;

        tile.originalPosition = { x: newX, y: newY };
        tile.originalAngle = angles[i];

        gsap.default.to(tile, {
          x: newX,
          y: newY,
          duration: 0.4,
          ease: "back.out(1.2)"
        });
      });
    });
  }
}
