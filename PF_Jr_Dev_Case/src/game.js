import gsap from "gsap";
import { Container, Sprite, Graphics, Text } from "pixi.js";
import { GAME_HEIGHT, GAME_WIDTH } from ".";
import Level from "./classes/Level";
import Grid from "./classes/Grid";
import LetterTray from "./classes/LetterTray";
import WordValidator from "./classes/WordValidator";
import Tutorial from "./classes/Tutorial";
import SoundManager from "./classes/SoundManager";
import { LEVELS, getLevelById, getTotalLevels } from "./levels";

/**
 * Game Class - Ana oyun kontrolcüsü
 */
export default class Game extends Container {
  constructor() {
    super();

    // Level yönetimi
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
    // Arka plan
    this.createBackground();

    // UI oluştur (level yüklenmeden önce)
    this.createUI();

    // İlk level'i yükle
    this.loadLevel(this.currentLevelId);
  }

  /**
   * Level yükle
   */
  loadLevel(levelId) {
    // Mevcut level elemanlarını temizle
    this.clearLevel();

    // Level verisini al
    this.levelData = getLevelById(levelId);
    if (!this.levelData) {
      console.error(`Level ${levelId} bulunamadı!`);
      return;
    }

    // Level oluştur
    this.level = new Level(this.levelData.letters, this.levelData.words);

    // Grid oluştur
    this.grid = new Grid(this.level);
    this.addChild(this.grid);

    // Validator oluştur
    this.validator = new WordValidator(this.level, this.grid);

    // Tray oluştur
    this.tray = new LetterTray(this.level.letters);
    this.addChild(this.tray);

    // Word complete callback'ini bağla (Swipe mechanic)
    this.tray.setOnWordCompleteCallback(this.handleWordComplete.bind(this));

    // İlk hedef kelimeyi bul
    this.currentTargetWord = null;
    this.enteredLetters = [];
    this.enteredTiles = [];
    this.enteredCells = []; // Hangi hücrelere yerleştirildiğini takip et
    this.findNextTarget();

    // UI güncelle
    this.updateUI();

    // Level 1'de tutorial göster
    if (levelId === 1) {
      this.startTutorial();
    }
  }

  /**
   * Mevcut level'i temizle
   */
  clearLevel() {
    // Tutorial'ı temizle
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
   * Tutorial başlat (Level 1 için)
   */
  startTutorial() {
    // Biraz gecikme ile başlat
    gsap.delayedCall(0.8, () => {
      if (!this.tray) return;

      this.tutorial = new Tutorial(this.tray);
      this.addChild(this.tutorial);
      this.tutorial.startGoldTutorial();
    });
  }

  /**
   * Tutorial'ı durdur
   */
  stopTutorial() {
    if (this.tutorial) {
      this.removeChild(this.tutorial);
      this.tutorial.destroy();
      this.tutorial = null;
    }
  }

  /**
   * Arka plan oluştur
   */
  createBackground() {
    // Arka plan sprite'ı varsa kullan
    try {
      const bg = Sprite.from("background");
      bg.width = GAME_WIDTH;
      bg.height = GAME_HEIGHT;
      this.addChildAt(bg, 0);
    } catch (e) {
      // Sprite yoksa gradient oluştur
      const bg = new Graphics();
      bg.beginFill(0x1e1e37);
      bg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      bg.endFill();
      this.addChildAt(bg, 0);
    }
  }

  /**
   * Sıradaki hedef kelimeyi bul ve ayarla
   */
  findNextTarget() {
    // Henüz tamamlanmamış ilk kelimeyi bul
    const nextWord = this.level.words.find(w => !w.completed);

    if (nextWord) {
      this.setTargetWord(nextWord);
    } else {
      // Hepsi bitti
      this.onGameComplete();
    }
  }

  setTargetWord(wordData) {
    this.currentTargetWord = wordData;
    this.enteredLetters = []; // Bu kelime için girilen harfler
    this.enteredTiles = []; // Bu kelime için kullanılan tile'lar
    this.enteredCells = []; // Bu kelime için yerleştirilen hücreler

    this.grid.highlightWordTarget(wordData);
    console.log("Yeni hedef:", wordData.word);

    // Hint banner güncelle
    if (this.hintText) {
      this.hintText.text = `Connect the letters ${wordData.word}`;
    }

    // Tutorial'ı bu kelime için güncelle (Level 1'de)
    if (this.tutorial && this.currentLevelId === 1) {
      this.tutorial.startForWord(wordData.word);
    }
  }

  /**
   * Kelime tamamlandığında (Swipe gesture)
   */
  handleWordComplete(word, tiles) {
    console.log("Kelime tamamlandı:", word);

    // Tutorial'ı geçici olarak durdur (oyuncu hareket yaptı)
    if (this.tutorial) {
      this.tutorial.stopAnimation();
    }

    // Bu kelime level'deki kelimelerden biri mi?
    const matchedWord = this.level.words.find(w =>
      w.word === word && !w.completed
    );

    if (matchedWord) {
      // DOĞRU KELIME!
      console.log("Doğru kelime bulundu:", matchedWord.word);

      // Ses efektleri çal
      SoundManager.play('correct');
      SoundManager.play('wordComplete');

      // Grid'e yerleştir
      this.revealWordOnGrid(matchedWord);

      // Kelimeyi tamamla
      this.completeWord(matchedWord);

      // Sıradaki kelimeye geç (tutorial setTargetWord'de yeniden başlatılacak)
      import("gsap").then(gsap => {
        gsap.default.delayedCall(0.5, () => this.findNextTarget());
      });

    } else {
      // YANLIŞ KELIME
      console.log("Yanlış kelime:", word);

      // Yanlış ses efekti
      SoundManager.play('wrong');

      this.tray.onError();

      // Yanlış kelimeden sonra tutorial'ı tekrar başlat (Level 1'de)
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


    // Tray'i resetle
    this.tray.resetAll();
  }

  /**
   * Grid üzerindeki geçici harfe tıklandığında (geri silme)
   */
  handleTempLetterClick(cellX, cellY, letter) {
    console.log("Geçici harf tıklandı:", letter, "at", cellX, cellY);

    // Bu hücreyi enteredCells'de bul
    const cellIndex = this.enteredCells.findIndex(c => c.x === cellX && c.y === cellY);
    if (cellIndex === -1) {
      console.error("Hücre bulunamadı!");
      return;
    }

    // Grid'den harfi kaldır
    this.grid.removeTemporaryLetter(cellX, cellY);

    // İlgili tile'ı geri getir
    const tile = this.enteredTiles[cellIndex];
    if (tile) {
      tile.setUsed(false);
    }

    // Dizilerden kaldır
    this.enteredLetters.splice(cellIndex, 1);
    this.enteredTiles.splice(cellIndex, 1);
    this.enteredCells.splice(cellIndex, 1);

    console.log("Harf kaldırıldı. Kalan:", this.enteredLetters);
  }

  /**
   * Hedef kelime üzerindeki ilk boş index'i bul
   */
  getNextEmptyIndex(wordData) {
    const { x, y, word, orientation } = wordData;

    // Basitçe ilk boş (ne kalıcı ne geçici harf olan) hücreyi bul
    for (let i = 0; i < word.length; i++) {
      let cellX, cellY;
      if (orientation === 'H') {
        cellX = x + i;
        cellY = y;
      } else {
        cellX = x;
        cellY = y + i;
      }

      // 1. Kalıcı harf kontrolü
      if (this.grid.hasLetter(cellX, cellY)) {
        continue;
      }

      // 2. Geçici harf kontrolü (Visual)
      const cell = this.grid.cells[cellY] && this.grid.cells[cellY][cellX];
      if (cell) {
        const existingText = cell.getChildByName("letterText");
        if (existingText) {
          // Burada zaten bir harf var
          continue;
        }
      }

      // Eğer buraya geldiysek, hücre boştur.
      return i;
    }

    return -1;
  }

  /**
   * Kelime tamamen doldu mu? (Kalıcı + Geçici)
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
   * Hedef kelimeyi kontrol et
   */
  checkCurrentTarget() {
    // Kelimeyi oluştur: Kalıcı harfler + Girilen harfler (boşluk sırasına göre)
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

    console.log("Kontrol edilen kelime:", constructedWord);

    if (constructedWord === word) {
      // DOĞRU!
      console.log("Doğru!");

      // 1. Grid'e kalıcı olarak işle
      this.completeWord(this.currentTargetWord);
      this.revealWordOnGrid(this.currentTargetWord); // Kalıcı yap

      // 2. Tile'ları geri getir (Kullanıcı tekrar kullanabilsin)
      this.enteredLetters = [];
      const tilesToReset = [...this.enteredTiles];
      this.enteredTiles = [];
      this.enteredCells = [];

      // Biraz gecikmeli gelsin
      gsap.delayedCall(0.5, () => {
        tilesToReset.forEach(t => t.setUsed(false));
      });

      // 3. Sıradaki kelimeye geç
      gsap.delayedCall(0.5, () => this.findNextTarget());

    } else {
      // YANLIŞ!
      console.log("Yanlış!");

      // Harfleri geri uçur
      this.animateReturnLetters(this.currentTargetWord);

      // Hata efekti (Tepsi sallanır)
      this.tray.onError();
    }
  }

  /**
   * Yanlış kelime durumunda harfleri grid'den tepsiye uçur
   */
  animateReturnLetters(wordData) {
    const { x, y, word, orientation } = wordData;

    // Grid üzerindeki geçici harfleri bul ve animasyon başlat
    // enteredTiles dizisi sırasıyla girilen harfleri tutuyor.
    // enteredLetters dizisi harfleri tutuyor.
    // Ancak grid üzerindeki konumlarını bulmamız lazım.

    // Girilen harfler kelimenin boşluklarına sırayla yerleşti.
    // Kelimeyi tekrar tarayıp hangi grid hücresinin hangi tile ile eşleştiğini bulalım.

    let entryIndex = 0;
    for (let i = 0; i < word.length; i++) {
      let cx, cy;
      if (orientation === 'H') { cx = x + i; cy = y; }
      else { cx = x; cy = y + i; }

      // Eğer kalıcı harf varsa atla
      if (this.grid.hasLetter(cx, cy)) continue;

      // Bu hücre geçici harf içeriyor olmalı
      if (entryIndex < this.enteredTiles.length) {
        const tile = this.enteredTiles[entryIndex];
        // Grid hücresinin dünya pozisyonu
        const startPos = this.grid.gridToWorld(cx, cy); // Cells center

        // Hedef pozisyon (Tray'deki tile pozisyonu)
        // Tile'ın container içindeki pozisyonu -> Dünya pozisyonuna çevir
        // Tray container'ı 0,0'da ise tile.x/y direkt dünya pozisyonudur (Game'e eklendiği için).
        // Ama Game container'ı da stage içinde.
        // Tile global pos hesaplamaya gerek yok, çünkü ikisi de Game container içinde.
        // Grid.x/y + cellPos -> start
        // Tray tile -> end

        // Uçan harf oluştur (Geçici)
        const flyingLetter = new Text(tile.letter, {
          fontFamily: 'Arial',
          fontSize: 32,
          fill: 0xF1C40F, // Sarı
          fontWeight: 'bold',
          align: 'center'
        });
        flyingLetter.anchor.set(0.5);
        flyingLetter.x = startPos.x;
        flyingLetter.y = startPos.y;
        this.addChild(flyingLetter);

        // Grid'deki yazıyı hemen sil
        this.grid.removeTemporaryLetter(cx, cy);

        // Animasyon
        gsap.to(flyingLetter, {
          x: tile.x + this.tray.x, // Tray container position might differ
          y: tile.y + this.tray.y,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => {
            this.removeChild(flyingLetter);
            flyingLetter.destroy();
            // Tile'ı görünür yap
            tile.setUsed(false);
          }
        });

        entryIndex++;
      }
    }

    // Temizlik
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

      // Sadece eğer kalıcı değilse sil
      if (!this.grid.hasLetter(cx, cy)) {
        this.grid.removeLetter(cx, cy);
      }
    }
  }

  /**
   * Kelime her değiştiğinde kontrol et
   */
  handleWordCheck(word, previewTiles) {
    // This method is no longer used with the new targeted grid logic.
    // It was part of the old "Tap-to-Fill" system.
  }

  /**
   * Grid üzerinde kelimeyi aç
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
      // Grid'e harfi koy
      this.grid.placeLetter(cellX, cellY, letter);
      this.grid.showLetter(cellX, cellY, letter);
    }
  }

  /**
   * Tüm kelimeleri kontrol et
   */
  checkAllWords() {
    if (this.level.isAllWordsCompleted()) {
      this.onGameComplete();
    }
  }

  /**
   * Kelimeyi tamamla
   */
  completeWord(wordData) {
    if (this.level.completeWord(wordData.word)) {
      // UI güncelle
      this.updateUI();

      // checkAllWords kaldırıldı çünkü findNextTarget() döngüsü zaten bitişi kontrol ediyor.
      // Bu çağrı onGameComplete'in iki kez çalışmasına sebep oluyordu.
    }
  }

  /**
   * Kelime tamamlandı animasyonu (Grid üzerinde highlight)
   */
  showWordComplete(wordData) {
    this.highlightWordInGrid(wordData);
  }

  /**
   * Grid'de kelimeyi vurgula
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
        // greenPane asset kullan
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
          // Asset yoksa Graphics kullan
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
   * Oyun tamamlandı
   */
  onGameComplete() {
    // Level tamamlama sesi
    SoundManager.play('levelComplete');

    // Oyun bitiş ekranı
    // Biraz gecikmeli
    gsap.delayedCall(1, () => {
      this.showGameCompleteScreen();
    });
  }

  /**
   * Sonraki level'e geç
   */
  nextLevel() {
    if (this.currentLevelId < this.totalLevels) {
      this.currentLevelId++;
      this.loadLevel(this.currentLevelId);
    } else {
      // Tüm leveller tamamlandı
      this.showAllLevelsComplete();
    }
  }

  /**
   * Oyun bitiş ekranı
   */
  showGameCompleteScreen() {
    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.9);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    overlay.interactive = true;
    this.addChild(overlay);
    overlay.name = "completeOverlay";

    // Başarı mesajı arka planı
    const successBg = new Graphics();
    successBg.beginFill(0x2a4a2a, 0.95);
    successBg.lineStyle(4, 0x5cb85c);
    successBg.drawRoundedRect(0, 0, GAME_WIDTH - 80, 250, 20);
    successBg.endFill();
    successBg.x = 40;
    successBg.y = GAME_HEIGHT / 2 - 125;
    overlay.addChild(successBg);

    // Başarı ikonu (tick)
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
      // Tick asset yoksa devam et
    }

    const completeText = new Text("Level Tamamlandı!", {
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

    // Sonraki level butonu
    const hasNextLevel = this.currentLevelId < this.totalLevels;
    const buttonText = hasNextLevel ? "Sonraki Level" : "Tüm Leveller Tamamlandı!";

    const nextButton = new Graphics();
    nextButton.beginFill(0x4a90e2);
    nextButton.lineStyle(3, 0x6bb3ff);
    nextButton.drawRoundedRect(0, 0, 200, 50, 10);
    nextButton.endFill();
    nextButton.x = GAME_WIDTH / 2 - 100;
    nextButton.y = GAME_HEIGHT / 2 + 70;
    nextButton.interactive = true;
    nextButton.buttonMode = true;
    nextButton.cursor = 'pointer';
    overlay.addChild(nextButton);

    const buttonLabel = new Text(buttonText, {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff,
      fontWeight: 'bold',
      align: 'center'
    });
    buttonLabel.anchor.set(0.5);
    buttonLabel.x = GAME_WIDTH / 2;
    buttonLabel.y = GAME_HEIGHT / 2 + 95;
    buttonLabel.alpha = 0;
    overlay.addChild(buttonLabel);

    // Buton hover efekti
    nextButton.on('pointerover', () => {
      gsap.to(nextButton, { alpha: 0.8, duration: 0.2 });
    });
    nextButton.on('pointerout', () => {
      gsap.to(nextButton, { alpha: 1, duration: 0.2 });
    });

    // Buton tıklama
    if (hasNextLevel) {
      nextButton.on('pointerdown', () => {
        this.removeChild(overlay);
        overlay.destroy({ children: true });
        this.nextLevel();
      });
    }

    // Animasyon
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
   * Tüm leveller tamamlandı ekranı
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

    const title = new Text("TEBRİKLER!", {
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

    const message = new Text("Tüm Levelleri Tamamladınız!", {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center'
    });
    message.anchor.set(0.5);
    message.x = GAME_WIDTH / 2;
    message.y = GAME_HEIGHT / 2 - 20;
    overlay.addChild(message);

    const restartButton = new Graphics();
    restartButton.beginFill(0x4a90e2);
    restartButton.lineStyle(3, 0x6bb3ff);
    restartButton.drawRoundedRect(0, 0, 200, 50, 10);
    restartButton.endFill();
    restartButton.x = GAME_WIDTH / 2 - 100;
    restartButton.y = GAME_HEIGHT / 2 + 50;
    restartButton.interactive = true;
    restartButton.buttonMode = true;
    restartButton.cursor = 'pointer';
    overlay.addChild(restartButton);

    const restartLabel = new Text("Baştan Başla", {
      fontFamily: 'Arial',
      fontSize: 18,
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
   * UI oluştur
   */
  createUI() {
    // Level numarası gizli (referans tasarımda yok)
    this.levelText = new Text("", {
      fontFamily: 'Arial',
      fontSize: 1,
      fill: 0xffffff
    });
    this.levelText.alpha = 0;
    this.addChild(this.levelText);

    // Kelime sayacı gizli
    this.wordCounter = new Text("", {
      fontFamily: 'Arial',
      fontSize: 1,
      fill: 0xffffff
    });
    this.wordCounter.alpha = 0;
    this.addChild(this.wordCounter);

    // Hint Banner (Yeşil yuvarlak bant - Grid altında)
    this.hintBanner = new Graphics();
    this.hintBanner.beginFill(0x4CAF50); // Yeşil
    this.hintBanner.drawRoundedRect(0, 0, 280, 36, 18);
    this.hintBanner.endFill();
    this.hintBanner.x = (GAME_WIDTH - 280) / 2;
    this.hintBanner.y = 280; // Grid altı
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

    // PLAY NOW! Butonu (en altta)
    this.createPlayNowButton();
  }

  /**
   * PLAY NOW butonu oluştur
   */
  createPlayNowButton() {
    const buttonWidth = 200;
    const buttonHeight = 50;

    // Glow efekti için dış çerçeve
    const glowOuter = new Graphics();
    glowOuter.beginFill(0x00ff88, 0.3);
    glowOuter.drawRoundedRect(-8, -8, buttonWidth + 16, buttonHeight + 16, 33);
    glowOuter.endFill();
    glowOuter.x = (GAME_WIDTH - buttonWidth) / 2;
    glowOuter.y = GAME_HEIGHT - 55;
    this.addChild(glowOuter);
    this.glowOuter = glowOuter;

    // Glow efekti için iç çerçeve
    const glowInner = new Graphics();
    glowInner.beginFill(0x00ff88, 0.5);
    glowInner.drawRoundedRect(-4, -4, buttonWidth + 8, buttonHeight + 8, 29);
    glowInner.endFill();
    glowInner.x = (GAME_WIDTH - buttonWidth) / 2;
    glowInner.y = GAME_HEIGHT - 55;
    this.addChild(glowInner);
    this.glowInner = glowInner;

    // Buton arka planı (parlak yeşil gradient efekti)
    const playButton = new Graphics();
    playButton.beginFill(0x00cc66); // Parlak yeşil
    playButton.lineStyle(3, 0x00ff88); // Açık yeşil border
    playButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 25);
    playButton.endFill();
    playButton.x = (GAME_WIDTH - buttonWidth) / 2;
    playButton.y = GAME_HEIGHT - 55;
    playButton.interactive = true;
    playButton.buttonMode = true;
    playButton.cursor = 'pointer';
    this.addChild(playButton);
    this.playButton = playButton;

    // Buton metni
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

    // Parlaklık (Glow) animasyonu
    this.startPlayButtonGlow();

    // Hover efekti
    playButton.on('pointerover', () => {
      playButton.alpha = 0.9;
    });
    playButton.on('pointerout', () => {
      playButton.alpha = 1;
    });

    // Tıklama (örn. install yönlendirme)
    playButton.on('pointerdown', () => {
      console.log("PLAY NOW clicked!");
      // Burada store yönlendirme veya başka işlem yapılabilir
    });
  }

  /**
   * PLAY NOW butonu parlaklık animasyonu
   */
  startPlayButtonGlow() {
    // Sürekli pulse animasyonu
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

    // Buton scale pulse - pivot ayarla
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
   * UI güncelle
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
}
