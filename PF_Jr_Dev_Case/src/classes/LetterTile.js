import { Container, Graphics, Text, Sprite } from "pixi.js";
import gsap from "gsap";

/**
 * LetterTile Class - Seçilebilir harf karesi (Line Connect için)
 */
export default class LetterTile extends Container {
  constructor(letter, size = 60) {
    super();

    this.letter = letter;
    this.size = size;
    this.isSelected = false;
    this.isUsed = false;
    this.center = { x: size / 2, y: size / 2 }; // Local center

    // Etkileşim için
    this.interactive = true;
    this.buttonMode = true; // El imleci

    this.createVisual();
  }

  /**
   * Kullanıldı durumunu ayarla
   */
  setUsed(used) {
    this.isUsed = used;
    this.interactive = !used;
    this.buttonMode = !used;

    gsap.to(this, {
      alpha: used ? 0 : 1, // Tamamen gizle veya silik yap
      duration: 0.2
    });
  }

  /**
   * Görsel oluştur
   */
  createVisual() {
    this.removeChildren();

    // Arka plan yok (transparan) - Referans görselde harf yalnız görünüyor
    // Sadece harf metni göster
    this.text = new Text(this.letter, {
      fontFamily: 'Arial',
      fontSize: 42,
      fill: 0xF39C12, // Turuncu renk
      fontWeight: 'bold',
      align: 'center'
    });
    this.text.anchor.set(0.5);
    this.text.x = 0; // Merkeze (anchor 0.5 ile)
    this.text.y = 0;
    this.addChild(this.text);
  }

  /**
   * Seçilme durumu (Vurgu)
   */
  select() {
    if (this.isSelected) return;
    this.isSelected = true;

    // Büyüt ve renk değiştir
    gsap.to(this.scale, { x: 1.3, y: 1.3, duration: 0.1 });
    this.text.style.fill = 0xFFFFFF; // Beyaz
  }

  /**
   * Seçimi kaldır
   */
  deselect() {
    if (!this.isSelected) return;
    this.isSelected = false;

    gsap.to(this.scale, { x: 1, y: 1, duration: 0.1 });
    this.text.style.fill = 0xF39C12; // Turuncu geri
  }

  /**
   * Doğru kelime bulunduğunda animasyon
   */
  animateSuccess() {
    gsap.to(this, {
      angle: 360,
      duration: 0.5,
      ease: "back.out(1.7)"
    });
  }

  /**
   * Yanlış kelime (sallanma)
   */
  animateError() {
    gsap.to(this, {
      x: this.x + 5,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.x = this.originalX || this.x; // Geri dön
      }
    });
  }
}


