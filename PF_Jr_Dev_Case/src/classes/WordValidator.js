/**
 * WordValidator Class - Kelime doğrulama ve kontrol işlemleri
 */
export default class WordValidator {
  constructor(level, grid) {
    this.level = level;
    this.grid = grid;
  }

  /**
   * Grid'deki bir kelimeyi kontrol et
   */
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
      if (!letter) {
        return { valid: false, reason: 'missing_letters' };
      }
      
      letters.push(letter);
    }
    
    // Harfleri birleştir ve kelimeyi kontrol et
    const formedWord = letters.join('');
    
    if (formedWord === word) {
      return { valid: true, word: formedWord };
    } else {
      return { valid: false, reason: 'wrong_word', formed: formedWord, expected: word };
    }
  }

  /**
   * Tüm kelimeleri kontrol et
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
   * Belirli bir pozisyondaki kelimeyi kontrol et
   */
  checkWordAtPosition(x, y) {
    const wordData = this.level.getWordAtPosition(x, y);
    if (!wordData) return null;
    
    return this.checkWord(wordData);
  }

  /**
   * Bir harf yerleştirildiğinde etkilenen kelimeleri kontrol et
   */
  checkAffectedWords(x, y) {
    const affectedWords = [];
    
    // Bu pozisyondan geçen tüm kelimeleri bul
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

