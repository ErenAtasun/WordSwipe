# Kelime Bulmaca Oyunu - Detaylı Uygulama Rehberi

## 📋 Genel Bakış

Bu proje, PixiJS kullanarak geliştirilmiş bir kelime bulmaca oyunudur. Oyuncular, tepsideki harfleri sürükleyerek grid üzerinde geçerli kelimeler oluşturur.

## 🏗️ Mimari Yapı (OOP)

### 1. **Level.js** - Level Yönetimi
- **Sorumluluk**: Level verilerini parse eder ve yönetir
- **Özellikler**:
  - `lvlLetters`: "G,O,D,L" formatında harfleri parse eder
  - `lvlWords`: "x,y,KELIME,YÖN" formatında kelimeleri parse eder
  - Kelime tamamlama durumunu takip eder
  - Pozisyon bazlı kelime sorgulama

### 2. **Grid.js** - Oyun Tahtası
- **Sorumluluk**: Grid görselini oluşturur ve harf yerleştirmelerini yönetir
- **Özellikler**:
  - Dinamik grid boyutu hesaplama
  - Hücre bazlı görsel sistem
  - Koordinat dönüşümleri (world ↔ grid)
  - Harf yerleştirme/kaldırma

### 3. **LetterTile.js** - Harf Kareleri
- **Sorumluluk**: Sürüklenebilir harf karelerini yönetir
- **Özellikler**:
  - Drag & drop işlevselliği
  - Yerleştirme animasyonları
  - Görsel geri bildirimler (highlight, shake)
  - Durum yönetimi (placed/unplaced)

### 4. **LetterTray.js** - Harf Tepsisı
- **Sorumluluk**: Alt kısımdaki harf tepsisini yönetir
- **Özellikler**:
  - Harf karelerini düzenler
  - Kullanılabilir harf takibi
  - Harf geri alma işlevi

### 5. **WordValidator.js** - Kelime Doğrulama
- **Sorumluluk**: Kelime doğrulama ve kontrol işlemleri
- **Özellikler**:
  - Grid'deki kelimeleri kontrol eder
  - Pozisyon bazlı kelime kontrolü
  - Etkilenen kelimeleri tespit eder

### 6. **Game.js** - Ana Kontrolcü
- **Sorumluluk**: Tüm sistemleri birleştirir ve oyun akışını yönetir
- **Özellikler**:
  - Sistem entegrasyonu
  - Oyun durumu yönetimi
  - UI güncellemeleri
  - Oyun bitiş kontrolü

## 🔄 Oyun Akışı

1. **Başlangıç**:
   - Level verisi parse edilir
   - Grid oluşturulur
   - Harf tepsisı oluşturulur

2. **Harf Sürükleme**:
   - Oyuncu bir harfi sürükler
   - Harf grid üzerine bırakılır

3. **Yerleştirme Kontrolü**:
   - Grid sınırları kontrol edilir
   - Pozisyonda kelime var mı kontrol edilir
   - Harf doğru mu kontrol edilir

4. **Kelime Kontrolü**:
   - Etkilenen kelimeler tespit edilir
   - Kelimeler doğrulanır
   - Tamamlanan kelimeler işaretlenir

5. **Oyun Bitişi**:
   - Tüm kelimeler tamamlandığında oyun biter
   - Bitiş ekranı gösterilir

## 📝 Level Veri Formatı

### lvlLetters
```
"G,O,D,L"
```
- Virgülle ayrılmış harfler
- Tepside gösterilecek harfler

### lvlWords
```
"0,0,GOLD,H|0,0,GOD,V|2,0,DOG,H|0,2,LOG,V"
```
- Format: `x,y,KELIME,YÖN`
- `x, y`: Grid koordinatları (0'dan başlar)
- `KELIME`: Oluşturulacak kelime
- `YÖN`: `H` (yatay) veya `V` (dikey)
- Kelimeler `|` ile ayrılır

## 🎨 Görsel Özellikler

- **Grid Hücreleri**: Yuvarlatılmış köşeli, şeffaf arka plan
- **Harf Kareleri**: Mavi arka plan, yerleştirildiğinde yeşil
- **Animasyonlar**: GSAP ile smooth geçişler
- **Geri Bildirimler**: Doğru/yanlış yerleştirme için görsel ipuçları

## 🚀 Kullanım

### Level Verisini Değiştirme

`game.js` dosyasında:
```javascript
this.lvlLetters = "G,O,D,L";
this.lvlWords = "0,0,GOLD,H|0,0,GOD,V|2,0,DOG,H|0,2,LOG,V";
```

### Yeni Level Ekleme

Level verilerini dinamik olarak değiştirebilirsiniz:
```javascript
this.level = new Level("A,B,C,D", "0,0,ABCD,H|0,0,ABC,V");
```

## 🔧 Geliştirme Notları

### Performans
- Grid boyutu dinamik hesaplanır
- Sadece gerekli hücreler oluşturulur
- Animasyonlar optimize edilmiştir

### Genişletilebilirlik
- Yeni level verileri kolayca eklenebilir
- Görsel stiller merkezi olarak yönetilir
- Oyun mekanikleri modüler yapıdadır

### Kod Kalitesi
- OOP prensipleri uygulanmıştır
- Her sınıf tek bir sorumluluğa sahiptir
- Kod okunabilir ve bakımı kolaydır

## 📦 Bağımlılıklar

- **PixiJS**: Görsel rendering
- **GSAP**: Animasyonlar
- **Webpack**: Build sistemi

## 🎯 Sonraki Adımlar (Opsiyonel İyileştirmeler)

1. **Tutorial Sistemi**: İlk oyun için rehber
2. **Particle Efektleri**: Kelime tamamlandığında efektler
3. **Ses Efektleri**: Yerleştirme ve tamamlama sesleri
4. **Seviye Sistemi**: Birden fazla level
5. **Skor Sistemi**: Puanlama mekanizması
6. **Hareket Limiti**: Belirli sayıda hamle sınırı

