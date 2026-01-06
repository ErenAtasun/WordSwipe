# 🎮 Kelime Bulmaca Oyunu - Nasıl Yapılır?

## 📚 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Proje Yapısı](#proje-yapısı)
3. [Adım Adım Uygulama](#adım-adım-uygulama)
4. [Kod Açıklamaları](#kod-açıklamaları)
5. [Test Etme](#test-etme)

---

## 🎯 Genel Bakış

Bu oyun, oyuncuların tepsideki harfleri sürükleyerek grid üzerinde kelimeler oluşturduğu bir bulmaca oyunudur. Oyun, tüm kelimeler tamamlandığında otomatik olarak biter.

### Temel Özellikler:
- ✅ Drag & Drop harf yerleştirme
- ✅ Dinamik level sistemi
- ✅ Otomatik kelime doğrulama
- ✅ Görsel geri bildirimler
- ✅ OOP mimarisi

---

## 📁 Proje Yapısı

```
src/
├── index.js              # Uygulama giriş noktası
├── game.js               # Ana oyun kontrolcüsü
├── assets.js             # Asset yönetimi
├── manifest.json         # Asset manifest
└── classes/
    ├── Level.js          # Level veri yönetimi
    ├── Grid.js           # Oyun tahtası
    ├── LetterTile.js     # Harf kareleri
    ├── LetterTray.js     # Harf tepsisı
    └── WordValidator.js  # Kelime doğrulama
```

---

## 🔨 Adım Adım Uygulama

### 1. OOP Yapısını Oluşturma

#### Level.js - Level Veri Yönetimi
**Ne yapar?**
- Level verilerini parse eder
- Kelime durumlarını takip eder
- Pozisyon bazlı sorgular yapar

**Önemli Metodlar:**
```javascript
parseLevelData()        // Veriyi parse eder
completeWord(word)      // Kelimeyi tamamlandı işaretler
isAllWordsCompleted()   // Tüm kelimeler tamamlandı mı?
getWordAtPosition(x,y)  // Pozisyondaki kelimeyi bulur
```

#### Grid.js - Oyun Tahtası
**Ne yapar?**
- Grid görselini oluşturur
- Harf yerleştirmelerini yönetir
- Koordinat dönüşümleri yapar

**Önemli Metodlar:**
```javascript
createGrid()            // Grid görselini oluşturur
worldToGrid(x,y)       // Dünya → Grid koordinatı
gridToWorld(x,y)       // Grid → Dünya koordinatı
placeLetter(x,y,letter) // Harf yerleştirir
```

#### LetterTile.js - Harf Kareleri
**Ne yapar?**
- Sürüklenebilir harf karelerini yönetir
- Drag & drop işlevselliği sağlar
- Animasyonlar yönetir

**Önemli Metodlar:**
```javascript
onDragStart()          // Sürükleme başladı
onDragMove()           // Sürükleme devam ediyor
onDragEnd()            // Sürükleme bitti
placeAt(x,y)           // Harfi yerleştirir
returnToTray()         // Tray'e geri döner
```

#### WordValidator.js - Kelime Doğrulama
**Ne yapar?**
- Grid'deki kelimeleri kontrol eder
- Doğru/yanlış yerleştirmeleri tespit eder

**Önemli Metodlar:**
```javascript
checkWord(wordData)           // Kelimeyi kontrol eder
checkAllWords()               // Tüm kelimeleri kontrol eder
checkAffectedWords(x,y)       // Etkilenen kelimeleri bulur
```

### 2. Level Veri Formatı

#### lvlLetters Formatı
```
"G,O,D,L"
```
- Virgülle ayrılmış harfler
- Tepside gösterilecek harfler

#### lvlWords Formatı
```
"0,0,GOLD,H|0,0,GOD,V|2,0,DOG,H|0,2,LOG,V"
```
- Format: `x,y,KELIME,YÖN`
- `x, y`: Grid koordinatları (0'dan başlar)
- `KELIME`: Oluşturulacak kelime
- `YÖN`: `H` (yatay) veya `V` (dikey)
- Kelimeler `|` ile ayrılır

**Örnek Açıklama:**
```
"0,0,GOLD,H" → (0,0) pozisyonundan başlayarak yatay "GOLD"
"0,0,GOD,V"  → (0,0) pozisyonundan başlayarak dikey "GOD"
```

### 3. Oyun Akışı

#### Başlangıç
1. Level verisi parse edilir
2. Grid oluşturulur (kelime pozisyonlarına göre)
3. Harf tepsisı oluşturulur
4. Validator hazırlanır

#### Harf Yerleştirme
1. Oyuncu harfi sürükler
2. Harf grid üzerine bırakılır
3. Kontroller yapılır:
   - Grid sınırları içinde mi?
   - Bu pozisyonda kelime var mı?
   - Harf doğru mu?
4. Başarılıysa yerleştirilir, değilse tray'e döner

#### Kelime Kontrolü
1. Harf yerleştirildikten sonra etkilenen kelimeler bulunur
2. Her kelime kontrol edilir
3. Tamamlanan kelimeler işaretlenir
4. Tüm kelimeler tamamlandıysa oyun biter

---

## 💻 Kod Açıklamaları

### Game.js - Ana Kontrolcü

```javascript
constructor() {
  // Level verileri
  this.lvlLetters = "G,O,D,L";
  this.lvlWords = "0,0,GOLD,H|0,0,GOD,V|2,0,DOG,H|0,2,LOG,V";
  
  // Sistemler
  this.level = null;      // Level yöneticisi
  this.grid = null;       // Oyun tahtası
  this.tray = null;       // Harf tepsisı
  this.validator = null;  // Kelime doğrulayıcı
}
```

### Harf Yerleştirme Mantığı

```javascript
handleTilePlacement(tile) {
  // 1. Grid koordinatına çevir
  const gridPos = this.grid.worldToGrid(tile.x, tile.y);
  
  // 2. Sınır kontrolü
  if (gridPos.x < 0 || gridPos.y < 0) {
    tile.returnToTray();
    return;
  }
  
  // 3. Pozisyonda kelime var mı?
  const expectedLetter = this.level.getLetterAtPosition(gridPos.x, gridPos.y);
  if (!expectedLetter) {
    tile.returnToTray();
    return;
  }
  
  // 4. Harf doğru mu?
  if (tile.letter !== expectedLetter) {
    tile.shake(); // Yanlış yerleştirme geri bildirimi
    tile.returnToTray();
    return;
  }
  
  // 5. Yerleştir
  tile.placeAt(worldPos.x, worldPos.y);
  this.grid.placeLetter(gridPos.x, gridPos.y, tile.letter);
  
  // 6. Kelimeleri kontrol et
  this.checkAffectedWords(gridPos.x, gridPos.y);
}
```

### Kelime Doğrulama Mantığı

```javascript
checkWord(wordData) {
  const { x, y, word, orientation } = wordData;
  const letters = [];
  
  // Kelimedeki tüm harfleri topla
  for (let i = 0; i < word.length; i++) {
    let cellX, cellY;
    if (orientation === 'H') {
      cellX = x + i;
      cellY = y;
    } else {
      cellX = x;
      cellY = y + i;
    }
    
    const letter = this.grid.getLetter(cellX, cellY);
    if (!letter) return { valid: false };
    
    letters.push(letter);
  }
  
  // Kelimeyi kontrol et
  const formedWord = letters.join('');
  return { valid: formedWord === word };
}
```

---

## 🧪 Test Etme

### 1. Projeyi Çalıştırma
```bash
npm install
npm start
```

### 2. Test Senaryoları

#### Senaryo 1: Doğru Yerleştirme
- Harfi doğru pozisyona sürükle
- Harf yerleşmeli ve yeşil olmalı
- Kelime tamamlandığında vurgulanmalı

#### Senaryo 2: Yanlış Yerleştirme
- Harfi yanlış pozisyona sürükle
- Harf sallanmalı ve tray'e dönmeli

#### Senaryo 3: Grid Dışı
- Harfi grid dışına bırak
- Harf tray'e dönmeli

#### Senaryo 4: Oyun Bitişi
- Tüm 4 kelimeyi tamamla
- Oyun bitiş ekranı görünmeli

---

## 🎨 Görsel İyileştirmeler

### Animasyonlar
- **Yerleştirme**: Back.out easing ile smooth geçiş
- **Vurgulama**: Scale animasyonu ile kelime vurgulama
- **Sallama**: Yanlış yerleştirme için shake animasyonu

### Renkler
- **Harf Kareleri**: Mavi (#4a90e2) → Yeşil (#5cb85c)
- **Grid Hücreleri**: Koyu mavi (#1a1a2e) arka plan
- **Vurgulama**: Yeşil (#5cb85c) highlight

---

## 🔧 Özelleştirme

### Level Değiştirme
`game.js` dosyasında:
```javascript
this.lvlLetters = "Y,E,N,I";
this.lvlWords = "0,0,YENI,H|0,0,YEN,V|1,0,ENI,H";
```

### Grid Boyutu
`Grid.js` constructor'ında:
```javascript
constructor(level, cellSize = 60) {
  // cellSize değerini değiştirerek hücre boyutunu ayarla
}
```

### Animasyon Hızı
`LetterTile.js` içinde:
```javascript
gsap.to(this, {
  duration: 0.3,  // Bu değeri değiştir
  ease: "back.out(1.7)"
});
```

---

## 📝 Önemli Notlar

1. **Koordinat Sistemi**: Grid koordinatları (0,0) sol üstten başlar
2. **Kelime Yönleri**: `H` = Horizontal (yatay), `V` = Vertical (dikey)
3. **Harf Tekrarı**: Aynı harf birden fazla kullanılabilir
4. **Otomatik Bitiş**: Tüm kelimeler tamamlandığında oyun otomatik biter

---

## 🚀 Sonraki Adımlar (Opsiyonel)

1. **Tutorial**: İlk oyun için rehber ekle
2. **Particle Efektleri**: Kelime tamamlandığında efektler
3. **Ses Efektleri**: Yerleştirme ve tamamlama sesleri
4. **Seviye Sistemi**: Birden fazla level
5. **Skor Sistemi**: Puanlama mekanizması

---

## ❓ Sık Sorulan Sorular

**S: Yeni level nasıl eklerim?**
C: `game.js` dosyasındaki `lvlLetters` ve `lvlWords` değerlerini değiştirin.

**S: Grid boyutunu nasıl ayarlarım?**
C: `Grid.js` constructor'ındaki `cellSize` parametresini değiştirin.

**S: Harf renklerini nasıl değiştiririm?**
C: `LetterTile.js` dosyasındaki `createVisual()` metodundaki renk kodlarını değiştirin.

**S: Animasyonları nasıl hızlandırırım?**
C: GSAP animasyonlarındaki `duration` değerlerini azaltın.

---

## 📚 Kaynaklar

- [PixiJS Dokümantasyonu](https://pixijs.com/)
- [GSAP Dokümantasyonu](https://greensock.com/docs/)
- [OOP Prensipleri](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object-oriented_JS)

---

**Başarılar! 🎉**

