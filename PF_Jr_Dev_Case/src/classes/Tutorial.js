import { Container, Graphics, Sprite, Text } from "pixi.js";
import gsap from "gsap";

/**
 * Tutorial Class - Aktif kelime için el/ok animasyonu
 * Yeşil instruction text'indeki kelimeyi gösterir
 */
export default class Tutorial extends Container {
    constructor(tray) {
        super();

        this.tray = tray;
        this.handSprite = null;
        this.isPlaying = false;
        this.timeline = null;
        this.pathLine = null;

        // Aktif kelime (dışarıdan set edilecek)
        this.currentWord = null;
    }

    /**
     * Belirli bir kelime için tutorial başlat
     * @param {string} word - Gösterilecek kelime (örn: "GOLD")
     */
    startForWord(word) {
        // Önceki animasyonu temizle
        this.stopAnimation();

        if (!word || word.length === 0) return;

        this.currentWord = word;
        this.isPlaying = true;

        // El sprite'ı yoksa oluştur
        if (!this.handSprite) {
            this.createHand();
        }

        // Çizgi için Graphics yoksa oluştur
        if (!this.pathLine) {
            this.pathLine = new Graphics();
            this.addChildAt(this.pathLine, 0);
        }

        // Bu kelime için animasyonu başlat
        this.playWordAnimation();
    }

    /**
     * Kelime animasyonunu oynat (döngü)
     */
    playWordAnimation() {
        if (!this.isPlaying || !this.currentWord) return;

        const letterOrder = this.currentWord.split('');
        const positions = this.getLetterPositions(letterOrder);

        if (positions.length < letterOrder.length) {
            // Yeterli harf bulunamadı, bekle ve tekrar dene
            gsap.delayedCall(0.5, () => this.playWordAnimation());
            return;
        }

        // Animasyon oluştur
        this.createSwipeAnimation(positions, () => {
            // Animasyon bitti, tekrar başlat
            gsap.delayedCall(0.8, () => this.playWordAnimation());
        });
    }

    /**
     * Animasyonu durdur (timeline'ı temizle)
     */
    stopAnimation() {
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }
        if (this.pathLine) {
            this.pathLine.clear();
        }
        if (this.handSprite) {
            this.handSprite.alpha = 0;
        }
    }

    /**
     * GOLD kelimesi için tutorial başlat (uyumluluk için)
     */
    startGoldTutorial() {
        this.startForWord('GOLD');
    }

    /**
     * El sprite'ı oluştur
     */
    createHand() {
        try {
            this.handSprite = Sprite.from("hand");
            this.handSprite.width = 60;
            this.handSprite.height = 60;
            this.handSprite.anchor.set(0.2, 0.1); // Parmak ucu için
            this.handSprite.alpha = 0;
            this.addChild(this.handSprite);
        } catch (e) {
            // Hand asset yoksa ok çiz
            console.log("Hand asset yok, ok çiziliyor");
            this.handSprite = this.createArrow();
            this.addChild(this.handSprite);
        }
    }

    /**
     * Fallback: Ok işareti oluştur
     */
    createArrow() {
        const arrow = new Graphics();
        arrow.beginFill(0xFFFFFF);
        // Ok şekli
        arrow.moveTo(0, 0);
        arrow.lineTo(-15, 20);
        arrow.lineTo(-5, 20);
        arrow.lineTo(-5, 40);
        arrow.lineTo(5, 40);
        arrow.lineTo(5, 20);
        arrow.lineTo(15, 20);
        arrow.lineTo(0, 0);
        arrow.endFill();
        arrow.alpha = 0;
        return arrow;
    }

    /**
     * Belirli sıradaki harflerin pozisyonlarını al
     */
    getLetterPositions(letterOrder) {
        const positions = [];
        const usedTiles = new Set();

        for (const targetLetter of letterOrder) {
            // Bu harfi henüz kullanmadığımız bir tile'da bul
            const tile = this.tray.tiles.find(t =>
                t.letter === targetLetter &&
                !t.isUsed &&
                !usedTiles.has(t)
            );

            if (tile) {
                positions.push({ x: tile.x, y: tile.y, letter: targetLetter });
                usedTiles.add(tile);
            }
        }

        return positions;
    }

    /**
     * Swipe animasyonu oluştur
     */
    createSwipeAnimation(positions, onComplete) {
        // Timeline varsa temizle
        if (this.timeline) {
            this.timeline.kill();
        }

        // Çizgiyi temizle
        this.pathLine.clear();

        // İlk pozisyona git
        this.handSprite.x = positions[0].x;
        this.handSprite.y = positions[0].y;

        // Timeline oluştur
        this.timeline = gsap.timeline({
            onComplete: () => {
                this.pathLine.clear();
                if (onComplete) onComplete();
            }
        });

        // Fade in
        this.timeline.to(this.handSprite, {
            alpha: 0.9,
            duration: 0.3
        });

        // İlk noktada bekle
        this.timeline.to(this.handSprite, {
            duration: 0.2
        });

        // Her harfe sırayla git
        for (let i = 1; i < positions.length; i++) {
            const toPos = positions[i];
            const currentIndex = i;

            // Swipe animasyonu
            this.timeline.to(this.handSprite, {
                x: toPos.x,
                y: toPos.y,
                duration: 0.35,
                ease: "power2.inOut",
                onUpdate: () => {
                    this.drawPath(positions, currentIndex);
                }
            });

            // Kısa bekle
            this.timeline.to(this.handSprite, {
                duration: 0.1
            });
        }

        // Son noktada bekle
        this.timeline.to(this.handSprite, {
            duration: 0.4
        });

        // Fade out
        this.timeline.to(this.handSprite, {
            alpha: 0,
            duration: 0.25,
            onComplete: () => {
                this.pathLine.clear();
            }
        });
    }

    /**
     * Swipe path'ini çiz
     */
    drawPath(positions, currentIndex) {
        this.pathLine.clear();
        this.pathLine.lineStyle(4, 0xF39C12, 0.6); // Turuncu çizgi

        if (positions.length > 0) {
            this.pathLine.moveTo(positions[0].x, positions[0].y);

            for (let i = 1; i <= currentIndex; i++) {
                if (i < positions.length) {
                    // Animasyon sırasında el pozisyonuna çiz
                    if (i === currentIndex) {
                        this.pathLine.lineTo(this.handSprite.x, this.handSprite.y);
                    } else {
                        this.pathLine.lineTo(positions[i].x, positions[i].y);
                    }
                }
            }
        }
    }

    /**
     * Tutorial'ı durdur
     */
    stop() {
        this.isPlaying = false;
        this.currentWord = null;
        this.stopAnimation();

        // Container'ı temizle
        this.removeChildren();
        this.handSprite = null;
        this.pathLine = null;
    }

    /**
     * Tutorial'ı yok et
     */
    destroy() {
        this.stop();
        super.destroy({ children: true });
    }
}
