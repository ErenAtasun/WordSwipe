import { Container, Graphics, Text, Sprite } from "pixi.js";
import gsap from "gsap";

/**
 * LetterTile Class - Selectable letter square (for Line Connect)
 */
export default class LetterTile extends Container {
  constructor(letter, size = 60) {
    super();

    this.letter = letter;
    this.size = size;
    this.isSelected = false;
    this.isUsed = false;
    this.center = { x: size / 2, y: size / 2 }; // Local center

    // For interaction
    this.interactive = true;
    this.buttonMode = true; // Hand cursor

    this.createVisual();
  }

  /**
   * Set used state
   */
  setUsed(used) {
    this.isUsed = used;
    this.interactive = !used;
    this.buttonMode = !used;

    gsap.to(this, {
      alpha: used ? 0 : 1, // Completely hide or fade out
      duration: 0.2
    });
  }

  /**
   * Create visual
   */
  createVisual() {
    this.removeChildren();

    // No background (transparent) - In reference only letter is visible
    // Just show letter text
    this.text = new Text(this.letter, {
      fontFamily: 'Arial',
      fontSize: 42,
      fill: 0xF39C12, // Orange color
      fontWeight: 'bold',
      align: 'center'
    });
    this.text.anchor.set(0.5);
    this.text.x = 0; // Center (with anchor 0.5)
    this.text.y = 0;
    this.addChild(this.text);
  }

  /**
   * Selection state (Highlight)
   */
  select() {
    if (this.isSelected) return;
    this.isSelected = true;

    // Scale up and change color
    gsap.to(this.scale, { x: 1.3, y: 1.3, duration: 0.1 });
    this.text.style.fill = 0xFFFFFF; // White
  }

  /**
   * Deselect
   */
  deselect() {
    if (!this.isSelected) return;
    this.isSelected = false;

    gsap.to(this.scale, { x: 1, y: 1, duration: 0.1 });
    this.text.style.fill = 0xF39C12; // Orange back
  }

  /**
   * Animation when correct word found
   */
  animateSuccess() {
    gsap.to(this, {
      angle: 360,
      duration: 0.5,
      ease: "back.out(1.7)"
    });
  }

  /**
   * Wrong word (shake)
   */
  animateError() {
    gsap.to(this, {
      x: this.x + 5,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.x = this.originalX || this.x; // Return back
      }
    });
  }
}
