// Sound Manager using Web Audio API
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled) return;
        this.init();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Correct emotion sound - happy ascending notes
    playCorrect() {
        this.playTone(523.25, 0.1, 'sine'); // C5
        setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.15, 'sine'), 200); // G5
    }

    // Perfect score - triumphant chord
    playPerfect() {
        this.playTone(523.25, 0.3, 'sine'); // C5
        this.playTone(659.25, 0.3, 'sine'); // E5
        this.playTone(783.99, 0.3, 'sine'); // G5
        setTimeout(() => this.playTone(1046.50, 0.4, 'sine'), 150); // C6
    }

    // Wrong emotion - descending buzzer
    playWrong() {
        this.playTone(300, 0.1, 'sawtooth');
        setTimeout(() => this.playTone(200, 0.1, 'sawtooth'), 100);
        setTimeout(() => this.playTone(150, 0.2, 'sawtooth'), 200);
    }

    // Level up - fanfare
    playLevelUp() {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine'), i * 100);
        });
    }

    // Victory - epic fanfare
    playVictory() {
        const melody = [
            { freq: 523.25, time: 0 },
            { freq: 659.25, time: 200 },
            { freq: 783.99, time: 400 },
            { freq: 1046.50, time: 600 },
            { freq: 1318.51, time: 800 },
            { freq: 1568.00, time: 1000 },
        ];
        
        melody.forEach(({ freq, time }) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine'), time);
        });
    }

    // Countdown beep
    playCountdown() {
        this.playTone(800, 0.1, 'square');
    }

    // Countdown final beep (higher pitch)
    playCountdownGo() {
        this.playTone(1200, 0.2, 'square');
    }

    // Streak bonus sound
    playStreak() {
        this.playTone(1000, 0.1, 'sine');
        setTimeout(() => this.playTone(1200, 0.1, 'sine'), 50);
        setTimeout(() => this.playTone(1400, 0.15, 'sine'), 100);
    }

    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Set volume (0 to 1)
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
}

// Export singleton instance
export const soundManager = new SoundManager();

