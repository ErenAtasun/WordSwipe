/**
 * Level Class - Level verilerini yönetir ve parse eder
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
   * Level verilerini parse eder
   */
  parseLevelData() {
    // Harfleri parse et: "G,O,D,L" -> ["G", "O", "D", "L"]
    this.letters = this.lvlLetters.split(',').map(letter => letter.trim());
    
    // Kelimeleri parse et: "0,0,GOLD,H|0,0,GOD,V|..."
    const wordStrings = this.lvlWords.split('|');
    this.words = wordStrings.map(wordStr => {
      const [x, y, word, orientation] = wordStr.split(',');
      return {
        x: parseInt(x),
        y: parseInt(y),
        word: word.trim(),
        orientation: orientation.trim(), // 'H' (horizontal) veya 'V' (vertical)
        completed: false
      };
    });
  }

  /**
   * Belirli bir kelimeyi tamamlandı olarak işaretle
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
   * Tüm kelimeler tamamlandı mı?
   */
  isAllWordsCompleted() {
    return this.words.every(w => w.completed);
  }

  /**
   * Belirli bir pozisyonda hangi kelime var? (ilk bulunan)
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
   * Belirli bir pozisyondan geçen tüm kelimeleri döndür
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
   * Belirli bir pozisyondaki harfi döndür
   * Aynı pozisyonda birden fazla kelime varsa, hepsinde aynı harf olmalı
   */
  getLetterAtPosition(x, y) {
    const words = this.getWordsAtPosition(x, y);
    if (words.length === 0) return null;
    
    // İlk kelimeden harfi al
    const firstWord = words[0];
    let expectedLetter = null;
    
    if (firstWord.orientation === 'H') {
      const index = x - firstWord.x;
      expectedLetter = firstWord.word[index];
    } else {
      const index = y - firstWord.y;
      expectedLetter = firstWord.word[index];
    }
    
    // Diğer kelimelerde de aynı harf olmalı (kontrol)
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
      
      // Eğer farklı harf varsa, bu bir hata (level verisi yanlış)
      if (letter !== expectedLetter) {
        console.warn(`Pozisyon (${x},${y})'de farklı harfler var: ${expectedLetter} vs ${letter}`);
      }
    }
    
    return expectedLetter;
  }
}

