import { Container, Graphics, Sprite } from "pixi.js";
import LetterTile from "./LetterTile";
import { GAME_WIDTH, GAME_HEIGHT } from "..";

/**
 * LetterTray Class - Dairesel harf tepsisi (Swipe/Drag Connect)
 */
export default class LetterTray extends Container {
  constructor(letters, tileSize = 60) {
    super();

    this.letters = letters;
    this.tileSize = tileSize;
    this.tiles = [];
    this.radius = 80; // Biraz küçült
    this.centerX = GAME_WIDTH / 2;
    this.centerY = GAME_HEIGHT - 260; // Daha yukarı al

    // Swipe/Drag state
    this.isDragging = false;
    this.selectedTiles = [];
    this.connectionLine = null;

    this.createTray();
    this.setupDragEvents();
  }

  /**
   * Dairesel tray oluştur
   */
  createTray() {
    // Yarı saydam bej/beyaz daire arka plan
    const bgCircle = new Graphics();
    bgCircle.beginFill(0xFFF8E7, 0.7);
    bgCircle.drawCircle(0, 0, this.radius + 60);
    bgCircle.endFill();
    bgCircle.x = this.centerX;
    bgCircle.y = this.centerY;
    this.addChild(bgCircle);

    // Bağlantı çizgisi için Graphics (harflerden önce ekle)
    this.connectionLine = new Graphics();
    this.addChild(this.connectionLine);

    // Shuffle butonu
    this.createShuffleButton();

    // Harfleri dairesel olarak yerleştir
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
   * Shuffle butonu oluştur
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
   * Drag eventlerini ayarla
   */
  setupDragEvents() {
    // Stage üzerinde pointer eventleri
    this.interactive = true;
    this.hitArea = { contains: () => true }; // Tüm alanı yakala

    this.on('pointerdown', this.onDragStart.bind(this));
    this.on('pointermove', this.onDragMove.bind(this));
    this.on('pointerup', this.onDragEnd.bind(this));
    this.on('pointerupoutside', this.onDragEnd.bind(this));
  }

  /**
   * Drag başlangıcı
   */
  onDragStart(event) {
    const pos = event.data.global;
    const tile = this.getTileAtPosition(pos.x, pos.y);

    if (tile && !tile.isUsed) {
      this.isDragging = true;
      this.selectedTiles = [tile];
      tile.select();
      this.updateConnectionLine();
      console.log("Drag başladı:", tile.letter);
    }
  }

  /**
   * Drag devam ediyor
   */
  onDragMove(event) {
    if (!this.isDragging) return;

    const pos = event.data.global;
    const tile = this.getTileAtPosition(pos.x, pos.y);

    if (tile && !tile.isUsed && !this.selectedTiles.includes(tile)) {
      // Yeni harf seçildi
      this.selectedTiles.push(tile);
      tile.select();
      console.log("Harf eklendi:", tile.letter, "Kelime:", this.getCurrentWord());
    }

    // Çizgiyi güncelle (parmak pozisyonu dahil)
    this.updateConnectionLine(pos);
  }

  /**
   * Drag bitti
   */
  onDragEnd(event) {
    if (!this.isDragging) return;

    this.isDragging = false;
    const word = this.getCurrentWord();
    console.log("Drag bitti. Kelime:", word);

    // Seçilen harfleri işle
    if (word.length > 0 && this.onWordCompleteCallback) {
      this.onWordCompleteCallback(word, this.selectedTiles);
    }

    // Seçimleri temizle
    this.clearSelection();
  }

  /**
   * Pozisyondaki tile'ı bul
   */
  getTileAtPosition(x, y) {
    const hitRadius = 35; // Tıklama toleransı

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
   * Şu anki kelimeyi al
   */
  getCurrentWord() {
    return this.selectedTiles.map(t => t.letter).join('');
  }

  /**
   * Bağlantı çizgisini güncelle
   */
  updateConnectionLine(currentPos = null) {
    this.connectionLine.clear();

    if (this.selectedTiles.length === 0) return;

    this.connectionLine.lineStyle(6, 0xF39C12, 0.8); // Turuncu çizgi

    // İlk harften başla
    const first = this.selectedTiles[0];
    this.connectionLine.moveTo(first.x, first.y);

    // Her seçili harfe çizgi çek
    for (let i = 1; i < this.selectedTiles.length; i++) {
      const tile = this.selectedTiles[i];
      this.connectionLine.lineTo(tile.x, tile.y);
    }

    // Eğer sürükleme devam ediyorsa, parmak pozisyonuna da çiz
    if (currentPos && this.isDragging) {
      this.connectionLine.lineTo(currentPos.x, currentPos.y);
    }
  }

  /**
   * Seçimleri temizle
   */
  clearSelection() {
    this.selectedTiles.forEach(tile => tile.deselect());
    this.selectedTiles = [];
    this.connectionLine.clear();
  }

  /**
   * Kelime tamamlandı callback'i
   */
  setOnWordCompleteCallback(cb) {
    this.onWordCompleteCallback = cb;
  }

  /**
   * Eski callback uyumluluğu için (artık kullanılmıyor)
   */
  setOnLetterClickCallback(cb) {
    // Bu artık kullanılmıyor, yerine setOnWordCompleteCallback kullanılacak
  }

  /**
   * Tüm harfleri resetle
   */
  resetAll() {
    this.tiles.forEach(t => t.setUsed(false));
    this.clearSelection();
  }

  /**
   * Belirli harfleri used olarak işaretle
   */
  markTilesAsUsed(tiles) {
    tiles.forEach(t => t.setUsed(true));
  }

  /**
   * Hata animasyonu
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
   * Harfleri karıştır
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
