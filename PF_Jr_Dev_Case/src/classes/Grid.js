import { Container, Graphics, Text, Sprite } from "pixi.js";
import gsap from "gsap";
import { GAME_WIDTH } from "..";

/**
 * Grid Class - Oyun tahtasını temsil eder
 */
export default class Grid extends Container {
  constructor(level, cellSize = 50) {
    super();

    this.level = level;
    this.cellSize = cellSize;
    this.cellGap = 4; // Hücreler arası boşluk
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.cells = []; // 2D array: cells[y][x]
    this.placedLetters = {}; // {`${x},${y}`: letter}

    this.calculateGridSize();
    this.createGrid();
  }

  /**
   * Grid boyutunu hesapla
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

    // Grid'i ekranın üst orta kısmına al (referans tasarım)
    const totalWidth = this.gridWidth * (this.cellSize + this.cellGap);
    this.x = (GAME_WIDTH - totalWidth) / 2;
    this.y = 80;
  }

  /**
   * Grid görselini oluştur
   */
  createGrid() {
    // Arka plan yok - transparan olacak
    // Hücreler direkt eklenecek

    // Hücreleri oluştur
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
   * Tek bir hücre oluştur
   */
  createCell(x, y) {
    const cell = new Container();
    cell.x = x * (this.cellSize + this.cellGap);
    cell.y = y * (this.cellSize + this.cellGap);

    // Bu hücrede bir kelime var mı kontrol et
    const word = this.level.getWordAtPosition(x, y);

    if (word) {
      // Kelime hücresi - Krem/Beyaz arka plan (referans tasarım)
      const bg = new Graphics();
      bg.beginFill(0xFFFBF0); // Açık krem
      bg.lineStyle(1, 0xE0D5C5);
      bg.drawRoundedRect(0, 0, this.cellSize, this.cellSize, 6);
      bg.endFill();
      cell.addChild(bg);
      cell.bgGraphics = bg;
    }
    // Kelime olmayan hücreler için arka plan ekleme (transparan kalacak)

    cell.cellX = x;
    cell.cellY = y;
    cell.isEmpty = true;

    return cell;
  }

  /**
   * Grid üzerindeki bir pozisyonu dünya koordinatlarına çevir
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
   * Grid koordinatlarını dünya koordinatlarına çevir
   */
  gridToWorld(gridX, gridY) {
    const cellTotal = this.cellSize + this.cellGap;
    return {
      x: this.x + gridX * cellTotal + this.cellSize / 2,
      y: this.y + gridY * cellTotal + this.cellSize / 2
    };
  }

  /**
   * Bir harfi grid'e yerleştir
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
   * Bir pozisyondaki harfi kaldır
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
   * Bir pozisyonda harf var mı?
   */
  hasLetter(x, y) {
    const key = `${x},${y}`;
    return key in this.placedLetters;
  }

  /**
   * Bir pozisyondaki harfi al
   */
  getLetter(x, y) {
    const key = `${x},${y}`;
    return this.placedLetters[key] || null;
  }

  /**
   * Bir harfi visual olarak göster (Grid üzerinde)
   * isTemp: Geçici harf (henüz onaylanmamış)
   */
  showLetter(x, y, letter, isTemp = false) {
    console.log("showLetter çağrıldı:", letter, "->", x, y, "Grid boyutu:", this.gridWidth, "x", this.gridHeight);
    const cell = this.cells[y] && this.cells[y][x];
    if (!cell) {
      console.error("Cell bulunamadı:", x, y, "cells[y]:", this.cells[y]);
      return;
    }
    console.log("Cell bulundu, harf ekleniyor...");

    // Eski temp text varsa sil
    const existingText = cell.getChildByName("letterText");
    if (existingText) {
      cell.removeChild(existingText);
    }

    const text = new Text(letter, {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xffffff, // Beyaz yazı (turuncu arka plan üzerinde)
      fontWeight: 'bold',
      align: 'center'
    });
    text.anchor.set(0.5);
    text.x = this.cellSize / 2;
    text.y = this.cellSize / 2;
    text.name = "letterText";

    // Geçici harfler tıklanabilir olsun
    if (isTemp) {
      text.interactive = true;
      text.buttonMode = true;
      text.cursor = 'pointer';
      text.on('pointerdown', (e) => {
        e.stopPropagation();
        // Callback varsa tetikle
        if (this.onTempLetterClickCallback) {
          this.onTempLetterClickCallback(x, y, letter);
        }
      });
    }

    cell.addChild(text);

    // Animasyon (Reveal)
    text.scale.set(0);
    gsap.to(text.scale, { x: 1, y: 1, duration: 0.3, ease: "back.out(1.7)" });

    // Arka planı turuncu yap (referans tasarım)
    if (cell.bgGraphics) {
      cell.bgGraphics.clear();
      cell.bgGraphics.beginFill(0xF39C12); // Turuncu
      cell.bgGraphics.lineStyle(2, 0xE67E22);
      cell.bgGraphics.drawRoundedRect(2, 2, this.cellSize - 4, this.cellSize - 4, 8);
      cell.bgGraphics.endFill();
    }
  }

  /**
   * Geçici harf tıklama callback'i ayarla
   */
  setOnTempLetterClickCallback(cb) {
    this.onTempLetterClickCallback = cb;
  }

  /**
   * Geçici harfi kaldır (visual olarak)
   */
  removeTemporaryLetter(x, y) {
    const cell = this.cells[y][x];
    if (!cell) return;
    const text = cell.getChildByName("letterText");
    if (text) {
      cell.removeChild(text);
    }
    // Arka planı krem rengine geri döndür
    if (cell.bgGraphics) {
      cell.bgGraphics.clear();
      cell.bgGraphics.beginFill(0xFFF8E7);
      cell.bgGraphics.lineStyle(2, 0xE8DCC8);
      cell.bgGraphics.drawRoundedRect(2, 2, this.cellSize - 4, this.cellSize - 4, 8);
      cell.bgGraphics.endFill();
    }
  }

  /**
   * Kelimeyi vurgula (Aktif hedef)
   */
  highlightWordTarget(wordData) {
    // Önce tüm grid highlightlarını temizle
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
      // Hafif highlight - zaten krem renkte
    }
  }

  clearHighlights() {
    // Yeni tasarımda highlight yok, krem renk default
  }

  /**
   * Grid'i temizle
   */
  clear() {
    this.placedLetters = {};
    this.cells.forEach(row => {
      row.forEach(cell => {
        cell.isEmpty = true;
        // Textleri temizle (sonradan eklenen child'lar)
        // bgSprite ve background hariç
        if (cell.children.length > 2) {
          // Bu biraz riskli, container yapısını tam bilmek lazım.
          // createCell metoduna bakarsak: bg veya bgSprite ekleniyor.
          // Sonra biz text ekliyoruz.
          // En iyisi cell.removeChildren() yapıp createCell mantığını tekrar çağırmak veya sadece textleri silmek.
          // Basitçe:
          cell.removeChildren();
          // Arka planı geri yükle
          if (cell.bgSprite) {
            cell.bgSprite.tint = 0xFFFFFF;
            cell.addChild(cell.bgSprite);
          } else {
            // Graphics çizimi... createCell'den kopyalamak yerine,
            // Hücreleri tamamen yeniden oluşturmak daha temiz olabilir Game.js loadLevel'da.
            // Ancak clear() metodu varsa düzgün çalışmalı.
            // Şimdilik sadece text/extra childları temizleyelim.
            // İlk child hep BG.
            const bg = cell.children[0];
            cell.removeChildren();
            cell.addChild(bg);
          }
        }
      });
    });
  }
}

