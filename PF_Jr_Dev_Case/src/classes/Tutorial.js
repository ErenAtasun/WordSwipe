import { Container, Graphics, Sprite, Text } from "pixi.js";
import gsap from "gsap";

/**
 * Tutorial Class - Hand/arrow animation for active word
 * Shows the word from the green instruction text
 */
export default class Tutorial extends Container {
    constructor(tray) {
        super();

        this.tray = tray;
        this.handSprite = null;
        this.isPlaying = false;
        this.timeline = null;
        this.pathLine = null;

        // Active word (will be set from outside)
        this.currentWord = null;
    }

    /**
     * Start tutorial for specific word
     * @param {string} word - Word to show (e.g. "GOLD")
     */
    startForWord(word) {
        // Clear previous animation
        this.stopAnimation();

        if (!word || word.length === 0) return;

        this.currentWord = word;
        this.isPlaying = true;

        // Create hand sprite if not exists
        if (!this.handSprite) {
            this.createHand();
        }

        // Create Graphics for line if not exists
        if (!this.pathLine) {
            this.pathLine = new Graphics();
            this.addChildAt(this.pathLine, 0);
        }

        // Start animation for this word
        this.playWordAnimation();
    }

    /**
     * Play word animation (loop)
     */
    playWordAnimation() {
        if (!this.isPlaying || !this.currentWord) return;

        const letterOrder = this.currentWord.split('');
        const positions = this.getLetterPositions(letterOrder);

        if (positions.length < letterOrder.length) {
            // Not enough letters found, wait and try again
            gsap.delayedCall(0.5, () => this.playWordAnimation());
            return;
        }

        // Create animation
        this.createSwipeAnimation(positions, () => {
            // Animation finished, restart
            gsap.delayedCall(0.8, () => this.playWordAnimation());
        });
    }

    /**
     * Stop animation (clear timeline)
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
     * Start tutorial for GOLD word (for compatibility)
     */
    startGoldTutorial() {
        this.startForWord('GOLD');
    }

    /**
     * Create hand sprite
     */
    createHand() {
        try {
            this.handSprite = Sprite.from("hand");
            this.handSprite.width = 60;
            this.handSprite.height = 60;
            this.handSprite.anchor.set(0.2, 0.1); // For fingertip
            this.handSprite.alpha = 0;
            this.addChild(this.handSprite);
        } catch (e) {
            // Draw arrow if hand asset not available
            console.log("Hand asset not found, drawing arrow");
            this.handSprite = this.createArrow();
            this.addChild(this.handSprite);
        }
    }

    /**
     * Fallback: Create arrow shape
     */
    createArrow() {
        const arrow = new Graphics();
        arrow.beginFill(0xFFFFFF);
        // Arrow shape
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
     * Get positions of letters in specified order
     */
    getLetterPositions(letterOrder) {
        const positions = [];
        const usedTiles = new Set();

        for (const targetLetter of letterOrder) {
            // Find this letter in an unused tile
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
     * Create swipe animation
     */
    createSwipeAnimation(positions, onComplete) {
        // Clear existing timeline
        if (this.timeline) {
            this.timeline.kill();
        }

        // Clear line
        this.pathLine.clear();

        // Go to first position
        this.handSprite.x = positions[0].x;
        this.handSprite.y = positions[0].y;

        // Create timeline
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

        // Wait at first point
        this.timeline.to(this.handSprite, {
            duration: 0.2
        });

        // Go to each letter in order
        for (let i = 1; i < positions.length; i++) {
            const toPos = positions[i];
            const currentIndex = i;

            // Swipe animation
            this.timeline.to(this.handSprite, {
                x: toPos.x,
                y: toPos.y,
                duration: 0.35,
                ease: "power2.inOut",
                onUpdate: () => {
                    this.drawPath(positions, currentIndex);
                }
            });

            // Short wait
            this.timeline.to(this.handSprite, {
                duration: 0.1
            });
        }

        // Wait at last point
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
     * Draw swipe path
     */
    drawPath(positions, currentIndex) {
        this.pathLine.clear();
        this.pathLine.lineStyle(4, 0xF39C12, 0.6); // Orange line

        if (positions.length > 0) {
            this.pathLine.moveTo(positions[0].x, positions[0].y);

            for (let i = 1; i <= currentIndex; i++) {
                if (i < positions.length) {
                    // Draw to hand position during animation
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
     * Stop tutorial
     */
    stop() {
        this.isPlaying = false;
        this.currentWord = null;
        this.stopAnimation();

        // Clear container
        this.removeChildren();
        this.handSprite = null;
        this.pathLine = null;
    }

    /**
     * Destroy tutorial
     */
    destroy() {
        this.stop();
        super.destroy({ children: true });
    }
}
