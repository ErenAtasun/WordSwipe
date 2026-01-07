/**
 * Level Class - Manages and parses level data
 */
export default class Level {
  constructor(lvlLetters, lvlWords) {
    this.lvlLetters = lvlLetters;
    this.lvlWords = lvlWords;
    this.letters = [];
    this.words = [];
    this.completedWords = new Set();

    this.parseLevelData();
  }

  /**
   * Parse level data
   */
  parseLevelData() {
    // Parse letters: "G,O,D,L" -> ["G", "O", "D", "L"]
    this.letters = this.lvlLetters.split(',').map(letter => letter.trim());

    // Parse words: "0,0,GOLD,H|0,0,GOD,V|..."
    const wordStrings = this.lvlWords.split('|');
    this.words = wordStrings.map(wordStr => {
      const [x, y, word, orientation] = wordStr.split(',');
      return {
        x: parseInt(x),
        y: parseInt(y),
        word: word.trim(),
        orientation: orientation.trim(), // 'H' (horizontal) or 'V' (vertical)
        completed: false
      };
    });
  }

  /**
   * Mark a word as completed
   */
  completeWord(word) {
    const wordData = this.words.find(w => w.word === word);
    if (wordData && !wordData.completed) {
      wordData.completed = true;
      this.completedWords.add(word);
      return true;
    }
    return false;
  }

  /**
   * Are all words completed?
   */
  isAllWordsCompleted() {
    return this.words.every(w => w.completed);
  }

  /**
   * Which word is at this position? (first found)
   */
  getWordAtPosition(x, y) {
    return this.words.find(w => {
      if (w.orientation === 'H') {
        return w.y === y && x >= w.x && x < w.x + w.word.length;
      } else {
        return w.x === x && y >= w.y && y < w.y + w.word.length;
      }
    });
  }

  /**
   * Return all words passing through a position
   */
  getWordsAtPosition(x, y) {
    return this.words.filter(w => {
      if (w.orientation === 'H') {
        return w.y === y && x >= w.x && x < w.x + w.word.length;
      } else {
        return w.x === x && y >= w.y && y < w.y + w.word.length;
      }
    });
  }

  /**
   * Return the letter at a position
   * If multiple words at same position, all should have same letter
   */
  getLetterAtPosition(x, y) {
    const words = this.getWordsAtPosition(x, y);
    if (words.length === 0) return null;

    // Get letter from first word
    const firstWord = words[0];
    let expectedLetter = null;

    if (firstWord.orientation === 'H') {
      const index = x - firstWord.x;
      expectedLetter = firstWord.word[index];
    } else {
      const index = y - firstWord.y;
      expectedLetter = firstWord.word[index];
    }

    // Verify other words have same letter (validation)
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      let letter;

      if (word.orientation === 'H') {
        const index = x - word.x;
        letter = word.word[index];
      } else {
        const index = y - word.y;
        letter = word.word[index];
      }

      // If different letter exists, this is an error (level data incorrect)
      if (letter !== expectedLetter) {
        console.warn(`Position (${x},${y}) has different letters: ${expectedLetter} vs ${letter}`);
      }
    }

    return expectedLetter;
  }
}
