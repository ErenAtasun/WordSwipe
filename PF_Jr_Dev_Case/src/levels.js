/**
 * Level Verileri - Crossword tarzı düzen
 */
export const LEVELS = [
  {
    id: 1,
    name: "Level 1",
    letters: "G,O,D,L",
    // G O L D  (row 0)
    // O   O    (row 1)
    // D O G    (row 2)
    words: "0,0,GOLD,H|0,0,GOD,V|0,2,DOG,H|2,0,LOG,V"
  },
  {
    id: 2,
    name: "Level 2",
    letters: "S,T,A,R,I,L,D,E,O,V",
    // S T A R  (row 0)
    // A N O I  (row 1)
    // I D E D  (row 2)
    // L O V E  (row 3)
    // STAR yatay, SAIL dikey, RIDE dikey, LOVE yatay
    words: "0,0,STAR,H|0,0,SAIL,V|3,0,RIDE,V|0,3,LOVE,H"
  },
  {
    id: 3,
    name: "Level 3",
    letters: "B,E,A,R",
    // B E A R  (row 0)
    // A   R    (row 1)
    // R A E    (row 2)
    // BEAR yatay, BAR dikey, ARE dikey (A'dan), EAR yatay 
    words: "0,0,BEAR,H|0,0,BAR,V|2,0,ARE,V|0,2,RAE,H"
  },
  {
    id: 4,
    name: "Level 4",
    letters: "F,I,S,H",
    // F I S H  (row 0)
    // I       (row 1)
    // S       (row 2)
    // H I S   (row 3)
    // FISH yatay, sadece basit yapı
    words: "0,0,FISH,H|3,0,HIS,V"
  },
  {
    id: 5,
    name: "Level 5",
    letters: "T,R,E,E",
    // T R E E  (row 0)
    // R   E    (row 1)
    // E E R    (row 2)
    // TREE yatay, TRE dikey (T'den)
    words: "0,0,TREE,H|0,0,TRE,V"
  },
  {
    id: 6,
    name: "Level 6",
    letters: "M,O,O,N",
    // M O O N  (row 0)
    // O   O    (row 1)
    // O N O    (row 2)
    // MOON yatay, MOO dikey, NOO dikey (N'den)
    words: "0,0,MOON,H|0,0,MOO,V|2,0,OON,V"
  },
  {
    id: 7,
    name: "Level 7",
    letters: "S,T,A,R",
    // S T A R  (row 0)
    // T   A    (row 1)
    // A R T    (row 2)
    // STAR yatay, STA dikey, RAT dikey (R'den), ART yatay
    words: "0,0,STAR,H|0,0,STA,V|3,0,RAT,V|0,2,ART,H"
  },
  {
    id: 8,
    name: "Level 8",
    letters: "L,O,V,E",
    // L O V E  (row 0)
    // O   O    (row 1)
    // V O L    (row 2)
    // LOVE yatay, LOV dikey, EVO dikey (E'den)
    words: "0,0,LOVE,H|0,0,LOV,V|3,0,EVO,V"
  },
  {
    id: 9,
    name: "Level 9",
    letters: "B,O,O,K",
    // B O O K  (row 0)
    // O   O    (row 1)
    // O K O    (row 2)
    // BOOK yatay, BOO dikey
    words: "0,0,BOOK,H|0,0,BOO,V"
  },
  {
    id: 10,
    name: "Level 10",
    letters: "H,O,M,E",
    // H O M E  (row 0)
    // O   O    (row 1)
    // M E H    (row 2)
    // HOME yatay, HOM dikey
    words: "0,0,HOME,H|0,0,HOM,V|3,0,EMO,V"
  }
];

/**
 * Level ID'ye göre level verisi al
 */
export function getLevelById(id) {
  return LEVELS.find(level => level.id === id);
}

/**
 * Toplam level sayısı
 */
export function getTotalLevels() {
  return LEVELS.length;
}
