# Word Puzzle Game - Case Study 🎮

A mobile-friendly word puzzle game built with PixiJS, featuring an engaging swipe-based letter connection mechanic.

![Word Puzzle Game](assets/screenshot.png)

## 📋 Overview

This project is a playable ad/game prototype for a word puzzle game. Players connect letters in a circular tray to form words that fill a crossword-style grid. The game features smooth animations, tutorial guidance, and progressive difficulty across multiple levels.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)

### Installation and Setup

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm start

# 3. Build for production
npm run build
```

The game will be available at `http://localhost:8081`

## 🎯 Features Implemented

### Core Gameplay
- **Swipe Letter Selection**: Drag across letters to form words with visual connection lines
- **Word Preview Display**: Real-time preview of the word being formed appears above the letter wheel
- **Crossword Grid**: Placed words appear on a crossword-style grid with proper intersections
- **Word Validation**: Only valid target words are accepted

### Visual & Audio Feedback
- **Connection Line Animation**: Animated lines connect selected letters during swipe
- **Tile Highlighting**: Selected letters highlight with scale and glow effects
- **Sound Effects**: Audio feedback for correct words, wrong attempts, and level completion
- **Particle Effects**: Success celebrations when completing words

### User Experience
- **Tutorial System**: Hand animation guides new players through the first word
- **Shuffle Button**: Randomizes letter positions for better visibility
- **Hint Banner**: Shows the current target word to find
- **Multi-Level Support**: Multiple levels with increasing difficulty

### UI/UX Improvements
- **Responsive Buttons**: Large, easy-to-tap buttons with extended hit areas for mobile
- **"Play Now" CTA**: Animated call-to-action button with glow effect
- **Level Complete Screen**: Celebration screen with "Next Level" button

## 🏗 Architecture

```
src/
├── index.js           # App entry point, PIXI initialization
├── game.js            # Main game logic and state management
├── levels.js          # Level data and configuration
└── classes/
    ├── Grid.js        # Crossword grid rendering and management
    ├── LetterTray.js  # Circular letter wheel with swipe detection
    ├── LetterTile.js  # Individual letter tile component
    ├── Level.js       # Level state and word completion tracking
    ├── Tutorial.js    # Tutorial hand animation system
    ├── SoundManager.js # Audio management
    └── WordValidator.js # Word validation logic
```

## 🔧 Technical Decisions

### Why PixiJS?
- Excellent 2D rendering performance for mobile web
- Rich animation capabilities with GSAP integration
- Good touch/pointer event handling for swipe mechanics

### Swipe Detection Approach
The letter selection uses a pointer-based system:
1. `pointerdown` on a tile starts word formation
2. `pointermove` detects entering new tiles (distance-based hit detection)
3. `pointerup` or `pointerupoutside` submits the word

This approach handles both mouse and touch input seamlessly.

### Word Preview Implementation
- Container positioned above the letter wheel
- Updates in real-time as letters are added/removed
- Smooth scale animation on each letter change
- Green rounded background for visibility

## 📱 Mobile Optimization

- Touch-optimized controls with generous hit areas
- Responsive viewport scaling (1000x1000 game units)
- Performant rendering suitable for mobile devices
- Large, easy-to-tap UI elements

## 🎨 Visual Style

- Dark background with vibrant accents
- Green highlights for correct/selected states
- Consistent rounded corners and modern aesthetics
- Smooth GSAP animations throughout

## 📦 Technologies Used

- **PixiJS 8** - 2D WebGL renderer
- **GSAP** - Animation library
- **Webpack** - Build system
- **Howler.js** (via SoundManager) - Audio

## 🔜 Potential Improvements

If given more time, these features could be added:
- Daily challenge mode
- Score/streak system
- More level content
- Achievement system
- Social sharing
- Leaderboards

## 📄 License

This project was created as a case study for Playable Factory.

---

**Author**: [Your Name]  
**Date**: January 2026
