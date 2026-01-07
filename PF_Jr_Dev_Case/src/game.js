import gsap from "gsap";
import { Container, Sprite, Graphics, Text, Rectangle } from "pixi.js";
import { GAME_HEIGHT, GAME_WIDTH } from ".";
import Level from "./classes/Level";
import Grid from "./classes/Grid";
import LetterTray from "./classes/LetterTray";
import WordValidator from "./classes/WordValidator";
import Tutorial from "./classes/Tutorial";
import SoundManager from "./classes/SoundManager";
import { LEVELS, getLevelById, getTotalLevels } from "./levels";

/**
 * Game Class - Main game controller
 */
export default class Game extends Container {
  constructor() {
    super();

    // Level management
    this.currentLevelId = 1;
    this.totalLevels = getTotalLevels();

    this.level = null;
    this.levelData = null;
    this.grid = null;
    this.tray = null;
    this.validator = null;

    this.init();
  }

  async init() {
    // Background
    this.createBackground();

    // Create UI (before level loads)
    this.createUI();

    // Load first level
    this.loadLevel(this.currentLevelId);
  }

  /**
   * Load level
   */
  loadLevel(levelId) {
    // Clear current level elements
    this.clearLevel();

    // Get level data
    this.levelData = getLevelById(levelId);
    if (!this.levelData) {
      console.error(`Level ${levelId} not found!`);
      return;
    }

    // Create level
    this.level = new Level(this.levelData.letters, this.levelData.words);

    // Create grid
    this.grid = new Grid(this.level);
    this.addChild(this.grid);

    // Update hint banner position based on grid size
    this.updateHintPosition();

    // Create validator
    this.validator = new WordValidator(this.level, this.grid);

    // Create tray
    this.tray = new LetterTray(this.level.letters);
    this.addChild(this.tray);

    // Bind word complete callback (Swipe mechanic)
    this.tray.setOnWordCompleteCallback(this.handleWordComplete.bind(this));

    // Find first target word
    this.currentTargetWord = null;
    this.enteredLetters = [];
    this.enteredTiles = [];
    this.enteredCells = []; // Track which cells are filled
    this.findNextTarget();

    // Update UI
    this.updateUI();

    // Show tutorial on Level 1
    if (levelId === 1) {
      this.startTutorial();
    }
  }

  /**
   * Clear current level
   */
  clearLevel() {
    // Clear tutorial
    this.stopTutorial();

    if (this.grid) {
      this.removeChild(this.grid);
      this.grid.destroy({ children: true });
      this.grid = null;
    }

    if (this.tray) {
      this.removeChild(this.tray);
      this.tray.destroy({ children: true });
      this.tray = null;
    }

    this.level = null;
    this.validator = null;
  }

  /**
   * Start tutorial (for Level 1)
   */
  startTutorial() {
    // Start with a slight delay
    gsap.delayedCall(0.8, () => {
      if (!this.tray) return;

      this.tutorial = new Tutorial(this.tray);
      this.addChild(this.tutorial);
      this.tutorial.startGoldTutorial();
    });
  }

  /**
   * Stop tutorial
   */
  stopTutorial() {
    if (this.tutorial) {
      this.removeChild(this.tutorial);
      this.tutorial.destroy();
      this.tutorial = null;
    }
  }

  /**
   * Create background
   */
  createBackground() {
    // Use background sprite if available
    try {
      const bg = Sprite.from("background");
      bg.width = GAME_WIDTH;
      bg.height = GAME_HEIGHT;
      this.addChildAt(bg, 0);
    } catch (e) {
      // Create gradient if sprite not available
      const bg = new Graphics();
      bg.beginFill(0x1e1e37);
      bg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      bg.endFill();
      this.addChildAt(bg, 0);
    }
  }

  /**
   * Find and set next target word
   */
  findNextTarget() {
    // Find first incomplete word
    const nextWord = this.level.words.find(w => !w.completed);

    if (nextWord) {
      this.setTargetWord(nextWord);
    } else {
      // All complete
      this.onGameComplete();
    }
  }

  setTargetWord(wordData) {
    this.currentTargetWord = wordData;
    this.enteredLetters = []; // Letters entered for this word
    this.enteredTiles = []; // Tiles used for this word
    this.enteredCells = []; // Cells filled for this word

    this.grid.highlightWordTarget(wordData);
    console.log("New target:", wordData.word);

    // Update hint banner
    if (this.hintText) {
      this.hintText.text = `Connect the letters ${wordData.word}`;
    }

    // Update tutorial for this word (Level 1)
    if (this.tutorial && this.currentLevelId === 1) {
      this.tutorial.startForWord(wordData.word);
    }
  }

  /**
   * When word is completed (Swipe gesture)
   */
  handleWordComplete(word, tiles) {
    console.log("Word completed:", word);

    // Temporarily stop tutorial (player made a move)
    if (this.tutorial) {
      this.tutorial.stopAnimation();
    }

    // Is this word one of the level words?
    const matchedWord = this.level.words.find(w =>
      w.word === word && !w.completed
    );

    if (matchedWord) {
      // CORRECT WORD!
      console.log("Correct word found:", matchedWord.word);

      // Play sound effects
      SoundManager.play('correct');
      SoundManager.play('wordComplete');

      // Place on grid
      this.revealWordOnGrid(matchedWord);

      // Complete the word
      this.completeWord(matchedWord);

      // Move to next word (tutorial will restart in setTargetWord)
      import("gsap").then(gsap => {
        gsap.default.delayedCall(0.5, () => this.findNextTarget());
      });

    } else {
      // WRONG WORD
      console.log("Wrong word:", word);

      // Play wrong sound effect
      SoundManager.play('wrong');

      this.tray.onError();

      // Restart tutorial after wrong word (Level 1)
      if (this.tutorial && this.currentLevelId === 1 && this.currentTargetWord) {
        import("gsap").then(gsap => {
          gsap.default.delayedCall(0.5, () => {
            if (this.tutorial && this.currentTargetWord) {
              this.tutorial.startForWord(this.currentTargetWord.word);
            }
          });
        });
      }
    }


    // Reset tray
    this.tray.resetAll();
  }

  /**
   * When temporary letter on grid is clicked (delete back)
   */
  handleTempLetterClick(cellX, cellY, letter) {
    console.log("Temporary letter clicked:", letter, "at", cellX, cellY);

    // Find this cell in enteredCells
    const cellIndex = this.enteredCells.findIndex(c => c.x === cellX && c.y === cellY);
    if (cellIndex === -1) {
      console.error("Cell not found!");
      return;
    }

    // Remove letter from grid
    this.grid.removeTemporaryLetter(cellX, cellY);

    // Bring back the related tile
    const tile = this.enteredTiles[cellIndex];
    if (tile) {
      tile.setUsed(false);
    }

    // Remove from arrays
    this.enteredLetters.splice(cellIndex, 1);
    this.enteredTiles.splice(cellIndex, 1);
    this.enteredCells.splice(cellIndex, 1);

    console.log("Letter removed. Remaining:", this.enteredLetters);
  }

  /**
   * Find first empty index on target word
   */
  getNextEmptyIndex(wordData) {
    const { x, y, word, orientation } = wordData;

    // Simply find first empty cell (neither permanent nor temporary letter)
    for (let i = 0; i < word.length; i++) {
      let cellX, cellY;
      if (orientation === 'H') {
        cellX = x + i;
        cellY = y;
      } else {
        cellX = x;
        cellY = y + i;
      }

      // 1. Check permanent letter
      if (this.grid.hasLetter(cellX, cellY)) {
        continue;
      }

      // 2. Check temporary letter (Visual)
      const cell = this.grid.cells[cellY] && this.grid.cells[cellY][cellX];
      if (cell) {
        const existingText = cell.getChildByName("letterText");
        if (existingText) {
          // There's already a letter here
          continue;
        }
      }

      // If we got here, cell is empty
      return i;
    }

    return -1;
  }

  /**
   * Is word completely filled? (Permanent + Temporary)
   */
  isWordFilled(wordData) {
    const { x, y, word, orientation } = wordData;
    let filledCount = 0;

    for (let i = 0; i < word.length; i++) {
      let cx, cy;
      if (orientation === 'H') { cx = x + i; cy = y; }
      else { cx = x; cy = y + i; }

      if (this.grid.hasLetter(cx, cy)) {
        filledCount++;
      }
    }

    return (filledCount + this.enteredLetters.length) === word.length;
  }

  /**
   * Check target word
   */
  checkCurrentTarget() {
    // Build word: Permanent letters + Entered letters (in gap order)
    let constructedWord = "";
    const { x, y, word, orientation } = this.currentTargetWord;

    let entryIndex = 0;
    for (let i = 0; i < word.length; i++) {
      let cx, cy;
      if (orientation === 'H') { cx = x + i; cy = y; }
      else { cx = x; cy = y + i; }

      const permanentLetter = this.grid.getLetter(cx, cy);
      if (permanentLetter) {
        constructedWord += permanentLetter;
      } else {
        if (entryIndex < this.enteredLetters.length) {
          constructedWord += this.enteredLetters[entryIndex];
          entryIndex++;
        }
      }
    }

    console.log("Checking word:", constructedWord);

    if (constructedWord === word) {
      // CORRECT!
      console.log("Correct!");

      // 1. Mark as permanent on grid
      this.completeWord(this.currentTargetWord);
      this.revealWordOnGrid(this.currentTargetWord); // Make permanent

      // 2. Return tiles (User can use them again)
      this.enteredLetters = [];
      const tilesToReset = [...this.enteredTiles];
      this.enteredTiles = [];
      this.enteredCells = [];

      // Return with slight delay
      gsap.delayedCall(0.5, () => {
        tilesToReset.forEach(t => t.setUsed(false));
      });

      // 3. Move to next word
      gsap.delayedCall(0.5, () => this.findNextTarget());

    } else {
      // WRONG!
      console.log("Wrong!");

      // Fly letters back
      this.animateReturnLetters(this.currentTargetWord);

      // Error effect (Tray shakes)
      this.tray.onError();
    }
  }

  /**
   * On wrong word, fly letters from grid back to tray
   */
  animateReturnLetters(wordData) {
    const { x, y, word, orientation } = wordData;

    // Find temporary letters on grid and start animation
    // enteredTiles array holds entered letters in order
    // enteredLetters array holds the letters
    // We need to find their positions on the grid

    // Entered letters were placed in word gaps in order
    // Scan word again to find which grid cell matches which tile

    let entryIndex = 0;
    for (let i = 0; i < word.length; i++) {
      let cx, cy;
      if (orientation === 'H') { cx = x + i; cy = y; }
      else { cx = x; cy = y + i; }

      // Skip if permanent letter
      if (this.grid.hasLetter(cx, cy)) continue;

      // This cell should contain temporary letter
      if (entryIndex < this.enteredTiles.length) {
        const tile = this.enteredTiles[entryIndex];
        // Grid cell world position
        const startPos = this.grid.gridToWorld(cx, cy); // Cell center

        // Create flying letter (Temporary)
        const flyingLetter = new Text(tile.letter, {
          fontFamily: 'Arial',
          fontSize: 32,
          fill: 0xF1C40F, // Yellow
          fontWeight: 'bold',
          align: 'center'
        });
        flyingLetter.anchor.set(0.5);
        flyingLetter.x = startPos.x;
        flyingLetter.y = startPos.y;
        this.addChild(flyingLetter);

        // Delete text from grid immediately
        this.grid.removeTemporaryLetter(cx, cy);

        // Animation
        gsap.to(flyingLetter, {
          x: tile.x + this.tray.x, // Tray container position might differ
          y: tile.y + this.tray.y,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => {
            this.removeChild(flyingLetter);
            flyingLetter.destroy();
            // Make tile visible
            tile.setUsed(false);
          }
        });

        entryIndex++;
      }
    }

    // Cleanup
    this.enteredLetters = [];
    this.enteredTiles = [];
    this.enteredCells = [];
  }

  clearTemporaryLetters(wordData) {
    const { x, y, word, orientation } = wordData;
    for (let i = 0; i < word.length; i++) {
      let cx, cy;
      if (orientation === 'H') { cx = x + i; cy = y; }
      else { cx = x; cy = y + i; }

      // Only delete if not permanent
      if (!this.grid.hasLetter(cx, cy)) {
        this.grid.removeLetter(cx, cy);
      }
    }
  }

  /**
   * Check every time word changes
   */
  handleWordCheck(word, previewTiles) {
    // This method is no longer used with the new targeted grid logic.
    // It was part of the old "Tap-to-Fill" system.
  }

  /**
   * Reveal word on grid
   */
  revealWordOnGrid(wordData) {
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

      const letter = word[i];
      // Place letter on grid
      this.grid.placeLetter(cellX, cellY, letter);
      this.grid.showLetter(cellX, cellY, letter);
    }
  }

  /**
   * Check all words
   */
  checkAllWords() {
    if (this.level.isAllWordsCompleted()) {
      this.onGameComplete();
    }
  }

  /**
   * Complete word
   */
  completeWord(wordData) {
    if (this.level.completeWord(wordData.word)) {
      // Update UI
      this.updateUI();

      // checkAllWords removed because findNextTarget() loop already checks completion
      // This call was causing onGameComplete to run twice
    }
  }

  /**
   * Word complete animation (highlight on grid)
   */
  showWordComplete(wordData) {
    this.highlightWordInGrid(wordData);
  }

  /**
   * Highlight word in grid
   */
  highlightWordInGrid(wordData) {
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

      const cell = this.grid.cells[cellY] && this.grid.cells[cellY][cellX];
      if (cell) {
        // Use greenPane asset
        try {
          const highlight = Sprite.from("greenPane");
          highlight.width = this.grid.cellSize;
          highlight.height = this.grid.cellSize;
          highlight.alpha = 0;
          cell.addChild(highlight);

          gsap.to(highlight, {
            alpha: 0.8,
            duration: 0.3,
            delay: i * 0.1
          });
        } catch (e) {
          // Use Graphics if asset not available
          const highlight = new Graphics();
          highlight.beginFill(0x5cb85c, 0.5);
          highlight.drawRoundedRect(2, 2, this.grid.cellSize - 4, this.grid.cellSize - 4, 5);
          highlight.endFill();
          highlight.alpha = 0;
          cell.addChild(highlight);

          gsap.to(highlight, {
            alpha: 1,
            duration: 0.3,
            delay: i * 0.1
          });
        }
      }
    }
  }

  /**
   * Game complete
   */
  onGameComplete() {
    // Level complete sound
    SoundManager.play('levelComplete');

    // Game complete screen
    // With slight delay
    gsap.delayedCall(1, () => {
      this.showGameCompleteScreen();
    });
  }

  /**
   * Go to next level
   */
  nextLevel() {
    if (this.currentLevelId < this.totalLevels) {
      this.currentLevelId++;
      this.loadLevel(this.currentLevelId);
    } else {
      // All levels complete
      this.showAllLevelsComplete();
    }
  }

  /**
   * Game complete screen
   */
  showGameCompleteScreen() {
    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.9);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    overlay.interactive = true;
    this.addChild(overlay);
    overlay.name = "completeOverlay";

    // Success message background
    const successBg = new Graphics();
    successBg.beginFill(0x2a4a2a, 0.95);
    successBg.lineStyle(4, 0x5cb85c);
    successBg.drawRoundedRect(0, 0, GAME_WIDTH - 80, 250, 20);
    successBg.endFill();
    successBg.x = 40;
    successBg.y = GAME_HEIGHT / 2 - 125;
    overlay.addChild(successBg);

    // Success icon (tick)
    try {
      const tick = Sprite.from("tick");
      tick.width = 80;
      tick.height = 80;
      tick.anchor.set(0.5);
      tick.x = GAME_WIDTH / 2;
      tick.y = GAME_HEIGHT / 2 - 60;
      tick.alpha = 0;
      overlay.addChild(tick);

      gsap.to(tick, {
        alpha: 1,
        scale: 1.2,
        duration: 0.5,
        ease: "back.out(1.7)"
      });
    } catch (e) {
      // Continue if tick asset not available
    }

    const completeText = new Text("Level Complete!", {
      fontFamily: 'Arial',
      fontSize: 28,
      fill: 0xffffff,
      fontWeight: 'bold',
      align: 'center'
    });
    completeText.anchor.set(0.5);
    completeText.x = GAME_WIDTH / 2;
    completeText.y = GAME_HEIGHT / 2 + 20;
    completeText.alpha = 0;
    overlay.addChild(completeText);

    // Next level button
    const hasNextLevel = this.currentLevelId < this.totalLevels;
    const buttonText = hasNextLevel ? "Next Level" : "All Levels Complete!";

    // Larger button for better touch/click experience
    const buttonWidth = 280;
    const buttonHeight = 70;
    const hitPadding = 20; // Extra hit area padding

    const nextButton = new Graphics();
    nextButton.beginFill(0x4a90e2);
    nextButton.lineStyle(3, 0x6bb3ff);
    nextButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 15);
    nextButton.endFill();
    nextButton.x = GAME_WIDTH / 2 - buttonWidth / 2;
    nextButton.y = GAME_HEIGHT / 2 + 60;
    nextButton.interactive = true;
    nextButton.buttonMode = true;
    nextButton.cursor = 'pointer';
    // Extend hit area for easier clicking
    nextButton.hitArea = new Rectangle(
      -hitPadding,
      -hitPadding,
      buttonWidth + hitPadding * 2,
      buttonHeight + hitPadding * 2
    );
    overlay.addChild(nextButton);

    const buttonLabel = new Text(buttonText, {
      fontFamily: 'Arial',
      fontSize: 22,
      fill: 0xffffff,
      fontWeight: 'bold',
      align: 'center'
    });
    buttonLabel.anchor.set(0.5);
    buttonLabel.x = GAME_WIDTH / 2;
    buttonLabel.y = GAME_HEIGHT / 2 + 95;
    buttonLabel.alpha = 0;
    overlay.addChild(buttonLabel);

    // Button hover effect
    nextButton.on('pointerover', () => {
      gsap.to(nextButton, { alpha: 0.8, duration: 0.2 });
    });
    nextButton.on('pointerout', () => {
      gsap.to(nextButton, { alpha: 1, duration: 0.2 });
    });

    // Button click
    if (hasNextLevel) {
      nextButton.on('pointerdown', () => {
        this.removeChild(overlay);
        overlay.destroy({ children: true });
        this.nextLevel();
      });
    }

    // Animation
    gsap.to(completeText, {
      alpha: 1,
      duration: 0.5,
      delay: 0.3,
      ease: "power2.out"
    });

    gsap.to(buttonLabel, {
      alpha: 1,
      duration: 0.5,
      delay: 0.5,
      ease: "power2.out"
    });
  }

  /**
   * All levels complete screen
   */
  showAllLevelsComplete() {
    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.95);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    overlay.interactive = true;
    this.addChild(overlay);

    const successBg = new Graphics();
    successBg.beginFill(0x4a2a4a, 0.95);
    successBg.lineStyle(4, 0xff6b9d);
    successBg.drawRoundedRect(0, 0, GAME_WIDTH - 80, 300, 20);
    successBg.endFill();
    successBg.x = 40;
    successBg.y = GAME_HEIGHT / 2 - 150;
    overlay.addChild(successBg);

    const title = new Text("CONGRATULATIONS!", {
      fontFamily: 'Arial',
      fontSize: 36,
      fill: 0xffffff,
      fontWeight: 'bold',
      align: 'center'
    });
    title.anchor.set(0.5);
    title.x = GAME_WIDTH / 2;
    title.y = GAME_HEIGHT / 2 - 80;
    overlay.addChild(title);

    const message = new Text("You Completed All Levels!", {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center'
    });
    message.anchor.set(0.5);
    message.x = GAME_WIDTH / 2;
    message.y = GAME_HEIGHT / 2 - 20;
    overlay.addChild(message);

    // Larger button for better touch/click experience
    const restartBtnWidth = 280;
    const restartBtnHeight = 70;
    const restartHitPadding = 20;

    const restartButton = new Graphics();
    restartButton.beginFill(0x4a90e2);
    restartButton.lineStyle(3, 0x6bb3ff);
    restartButton.drawRoundedRect(0, 0, restartBtnWidth, restartBtnHeight, 15);
    restartButton.endFill();
    restartButton.x = GAME_WIDTH / 2 - restartBtnWidth / 2;
    restartButton.y = GAME_HEIGHT / 2 + 40;
    restartButton.interactive = true;
    restartButton.buttonMode = true;
    restartButton.cursor = 'pointer';
    restartButton.hitArea = new Rectangle(
      -restartHitPadding,
      -restartHitPadding,
      restartBtnWidth + restartHitPadding * 2,
      restartBtnHeight + restartHitPadding * 2
    );
    overlay.addChild(restartButton);

    const restartLabel = new Text("Play Again", {
      fontFamily: 'Arial',
      fontSize: 22,
      fill: 0xffffff,
      fontWeight: 'bold',
      align: 'center'
    });
    restartLabel.anchor.set(0.5);
    restartLabel.x = GAME_WIDTH / 2;
    restartLabel.y = GAME_HEIGHT / 2 + 75;
    overlay.addChild(restartLabel);

    restartButton.on('pointerdown', () => {
      this.currentLevelId = 1;
      this.removeChild(overlay);
      overlay.destroy({ children: true });
      this.loadLevel(this.currentLevelId);
    });
  }

  /**
   * Create UI
   */
  createUI() {
    // Level number hidden (not in reference design)
    this.levelText = new Text("", {
      fontFamily: 'Arial',
      fontSize: 1,
      fill: 0xffffff
    });
    this.levelText.alpha = 0;
    this.addChild(this.levelText);

    // Word counter hidden
    this.wordCounter = new Text("", {
      fontFamily: 'Arial',
      fontSize: 1,
      fill: 0xffffff
    });
    this.wordCounter.alpha = 0;
    this.addChild(this.wordCounter);

    // Hint Banner (Green rounded banner - below grid)
    this.hintBanner = new Graphics();
    this.hintBanner.beginFill(0x4CAF50); // Green
    this.hintBanner.drawRoundedRect(0, 0, 280, 36, 18);
    this.hintBanner.endFill();
    this.hintBanner.x = (GAME_WIDTH - 280) / 2;
    this.hintBanner.y = 280; // Default, will be updated in updateHintPosition
    this.addChild(this.hintBanner);

    this.hintText = new Text("Connect the letters", {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
      fontWeight: 'bold',
      align: 'center'
    });
    this.hintText.anchor.set(0.5);
    this.hintText.x = GAME_WIDTH / 2;
    this.hintText.y = 298;
    this.addChild(this.hintText);

    // PLAY NOW! Button (at bottom)
    this.createPlayNowButton();
  }

  /**
   * Create PLAY NOW button
   */
  createPlayNowButton() {
    const buttonWidth = 200;
    const buttonHeight = 50;

    // Outer glow effect
    const glowOuter = new Graphics();
    glowOuter.beginFill(0x00ff88, 0.3);
    glowOuter.drawRoundedRect(-8, -8, buttonWidth + 16, buttonHeight + 16, 33);
    glowOuter.endFill();
    glowOuter.x = (GAME_WIDTH - buttonWidth) / 2;
    glowOuter.y = GAME_HEIGHT - 55;
    this.addChild(glowOuter);
    this.glowOuter = glowOuter;

    // Inner glow effect
    const glowInner = new Graphics();
    glowInner.beginFill(0x00ff88, 0.5);
    glowInner.drawRoundedRect(-4, -4, buttonWidth + 8, buttonHeight + 8, 29);
    glowInner.endFill();
    glowInner.x = (GAME_WIDTH - buttonWidth) / 2;
    glowInner.y = GAME_HEIGHT - 55;
    this.addChild(glowInner);
    this.glowInner = glowInner;

    // Button background (bright green gradient effect)
    const playButton = new Graphics();
    playButton.beginFill(0x00cc66); // Bright green
    playButton.lineStyle(3, 0x00ff88); // Light green border
    playButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 25);
    playButton.endFill();
    playButton.x = (GAME_WIDTH - buttonWidth) / 2;
    playButton.y = GAME_HEIGHT - 55;
    playButton.interactive = true;
    playButton.buttonMode = true;
    playButton.cursor = 'pointer';
    this.addChild(playButton);
    this.playButton = playButton;

    // Button text
    const playText = new Text("PLAY NOW!", {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xffffff,
      fontWeight: 'bold',
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x006633,
      dropShadowDistance: 2
    });
    playText.anchor.set(0.5);
    playText.x = GAME_WIDTH / 2;
    playText.y = GAME_HEIGHT - 30;
    this.addChild(playText);

    // Glow animation
    this.startPlayButtonGlow();

    // Hover effect
    playButton.on('pointerover', () => {
      playButton.alpha = 0.9;
    });
    playButton.on('pointerout', () => {
      playButton.alpha = 1;
    });

    // Click (e.g. install redirect)
    playButton.on('pointerdown', () => {
      console.log("PLAY NOW clicked!");
      // Store redirect or other action can be done here
    });
  }

  /**
   * PLAY NOW button glow animation
   */
  startPlayButtonGlow() {
    // Continuous pulse animation
    gsap.to(this.glowOuter, {
      alpha: 0.1,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(this.glowInner, {
      alpha: 0.2,
      duration: 0.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.2
    });

    // Button scale pulse - set pivot
    const buttonWidth = 200;
    const buttonHeight = 50;
    this.playButton.pivot.set(buttonWidth / 2, buttonHeight / 2);
    this.playButton.x = GAME_WIDTH / 2;
    this.playButton.y = GAME_HEIGHT - 30;

    gsap.to(this.playButton.scale, {
      x: 1.03,
      y: 1.03,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }

  /**
   * Update UI
   */
  updateUI() {
    if (this.level) {
      const completedCount = this.level.completedWords.size;
      const totalCount = this.level.words.length;
      this.wordCounter.text = `${completedCount} / ${totalCount}`;
    }

    if (this.levelText && this.levelData) {
      this.levelText.text = this.levelData.name;
    }
  }

  /**
   * Update hint banner position based on grid size
   */
  updateHintPosition() {
    if (!this.grid || !this.hintBanner || !this.hintText) return;

    // Calculate grid bottom position
    const gridBottom = this.grid.y + this.grid.gridHeight * (this.grid.cellSize + this.grid.cellGap);

    // Position hint banner 15px below grid
    const bannerY = gridBottom + 15;
    this.hintBanner.y = bannerY;
    this.hintText.y = bannerY + 18; // Center text in banner
  }
}
