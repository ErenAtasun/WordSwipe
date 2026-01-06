/**
 * SoundManager - Web Audio API ile programatik ses efektleri
 * Dosya yüklemeden, kod ile ses oluşturur
 */
class SoundManager {
    static audioContext = null;
    static isInitialized = false;

    /**
     * AudioContext başlat (kullanıcı etkileşimi gerektirir)
     */
    static init() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isInitialized = true;
            console.log("SoundManager initialized");
        } catch (e) {
            console.warn("Web Audio API desteklenmiyor:", e);
        }
    }

    /**
     * Ses çal
     * @param {string} soundType - 'correct', 'wrong', 'wordComplete', 'levelComplete'
     */
    static play(soundType) {
        // Lazy init
        if (!this.isInitialized) {
            this.init();
        }

        if (!this.audioContext) return;

        // Suspended ise resume et
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        switch (soundType) {
            case 'correct':
                this.playCorrectSound();
                break;
            case 'wrong':
                this.playWrongSound();
                break;
            case 'wordComplete':
                this.playWordCompleteSound();
                break;
            case 'levelComplete':
                this.playLevelCompleteSound();
                break;
            default:
                console.warn("Bilinmeyen ses tipi:", soundType);
        }
    }

    /**
     * Doğru cevap sesi - Kısa pozitif "ding"
     */
    static playCorrectSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Oscillator (ana ses)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1108, now + 0.1); // C#6

        // Gain (volume envelope)
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * Yanlış cevap sesi - Kısa "buzz"
     */
    static playWrongSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // İki oscillator ile buzzy ses
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(150, now);

        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(155, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
    }

    /**
     * Kelime tamamlama sesi - Mutlu kısa melodi
     */
    static playWordCompleteSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord arpeggio)

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.25, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    /**
     * Level tamamlama sesi - Fanfar/kutlama melodisi
     */
    static playLevelCompleteSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Fanfar melodisi: C-E-G-C (octave)
        const notes = [
            { freq: 523.25, time: 0, dur: 0.15 },      // C5
            { freq: 659.25, time: 0.15, dur: 0.15 },   // E5
            { freq: 783.99, time: 0.30, dur: 0.15 },   // G5
            { freq: 1046.50, time: 0.45, dur: 0.4 },   // C6 (longer)
        ];

        notes.forEach((note) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, now);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now + note.time);
            gain.gain.linearRampToValueAtTime(0.3, now + note.time + 0.03);
            gain.gain.setValueAtTime(0.25, now + note.time + note.dur - 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + note.time);
            osc.stop(now + note.time + note.dur + 0.1);
        });

        // Harmonik katman
        const pad = ctx.createOscillator();
        pad.type = 'sine';
        pad.frequency.setValueAtTime(261.63, now); // C4 (bass)

        const padGain = ctx.createGain();
        padGain.gain.setValueAtTime(0, now);
        padGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        padGain.gain.setValueAtTime(0.15, now + 0.7);
        padGain.gain.exponentialRampToValueAtTime(0.01, now + 1);

        pad.connect(padGain);
        padGain.connect(ctx.destination);

        pad.start(now);
        pad.stop(now + 1);
    }
}

// Global erişim için window'a ekle
window.SoundManager = SoundManager;

export default SoundManager;
