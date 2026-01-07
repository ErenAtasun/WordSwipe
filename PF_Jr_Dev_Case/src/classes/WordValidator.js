/**
 * WordValidator Class - Word validation and checking operations
 */
export default class WordValidator {
  constructor(level, grid) {
    this.level = level;
    this.grid = grid;
  }

  /**
   * Check a word on grid
   */
  checkWord(wordData) {
    const { x, y, word, orientation } = wordData;
    const letters = [];

    // Collect all letters in word
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
      if (!letter) {
        return { valid: false, reason: 'missing_letters' };
      }

      letters.push(letter);
    }

    // Combine letters and check word
    const formedWord = letters.join('');

    if (formedWord === word) {
      return { valid: true, word: formedWord };
    } else {
      return { valid: false, reason: 'wrong_word', formed: formedWord, expected: word };
    }
  }

  /**
   * Check all words
   */
  checkAllWords() {
    const results = [];

    this.level.words.forEach(wordData => {
      if (!wordData.completed) {
        const result = this.checkWord(wordData);
        if (result.valid) {
          results.push({
            word: wordData.word,
            wordData: wordData,
            completed: true
          });
        }
      }
    });

    return results;
  }

  /**
   * Check word at specific position
   */
  checkWordAtPosition(x, y) {
    const wordData = this.level.getWordAtPosition(x, y);
    if (!wordData) return null;

    return this.checkWord(wordData);
  }

  /**
   * Check affected words when a letter is placed
   */
  checkAffectedWords(x, y) {
    const affectedWords = [];

    // Find all words passing through this position
    this.level.words.forEach(wordData => {
      if (wordData.completed) return;

      let isAffected = false;

      if (wordData.orientation === 'H') {
        isAffected = wordData.y === y && x >= wordData.x && x < wordData.x + wordData.word.length;
      } else {
        isAffected = wordData.x === x && y >= wordData.y && y < wordData.y + wordData.word.length;
      }

      if (isAffected) {
        const result = this.checkWord(wordData);
        affectedWords.push({
          wordData: wordData,
          result: result
        });
      }
    });

    return affectedWords;
  }
}
