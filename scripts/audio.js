import { GameSettings } from './settings.js';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Create master gain node to route all sounds through for real-time control
const masterGain = audioCtx.createGain();
masterGain.gain.setValueAtTime(GameSettings.volume, audioCtx.currentTime);
masterGain.connect(audioCtx.destination);

let ambientInitialized = false;

export function updateMasterVolume(val) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    GameSettings.volume = parseFloat(val);
    GameSettings.save();
    if (masterGain) {
        masterGain.gain.setValueAtTime(GameSettings.volume, audioCtx.currentTime);
    }
}

export const setAudioVolume = updateMasterVolume;
export const initAudio = initAmbientSounds;

export function initAmbientSounds() {
    if (ambientInitialized) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        // Generate white noise buffer for wind
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const windSource = audioCtx.createBufferSource();
        windSource.buffer = noiseBuffer;
        windSource.loop = true;
        
        const windLFO = audioCtx.createOscillator();
        windLFO.frequency.value = 0.05; // slow sweep (20s)
        
        const windLFOGain = audioCtx.createGain();
        windLFOGain.gain.value = 180;
        
        const windFilter = audioCtx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 400; // wind pitch
        windFilter.Q.value = 9.0; // resonant whistle
        
        const volumeLFO = audioCtx.createOscillator();
        volumeLFO.frequency.value = 0.08;
        
        const volumeLFOGain = audioCtx.createGain();
        volumeLFOGain.gain.value = 0.008;
        
        const windGain = audioCtx.createGain();
        windGain.gain.value = 0.012; // ambient wind level
        
        windLFO.connect(windLFOGain);
        windLFOGain.connect(windFilter.frequency);
        
        volumeLFO.connect(volumeLFOGain);
        volumeLFOGain.connect(windGain.gain);
        
        windSource.connect(windFilter);
        windFilter.connect(windGain);
        // Connect to masterGain instead of direct destination
        windGain.connect(masterGain);
        
        windSource.start(0);
        windLFO.start(0);
        volumeLFO.start(0);
        
        playProceduralMusicTrack();
        setInterval(() => {
            if (document.hidden) return;
            playProceduralMusicTrack();
        }, 30000);

        setInterval(() => {
            if (document.hidden) return;
            const isNight = (window.currentEnvStatus === 'NACHT' || window.currentEnvStatus === 'NIGHT');
            const chance = Math.random();
            if (isNight) {
                if (chance < 0.45) {
                    playProceduralCricketChirp();
                }
            }
        }, 8000);
        
        ambientInitialized = true;
    } catch (err) {
        console.warn("Ambient sounds failed to load: ", err);
    }
}

let musicPlaying = false;
function playProceduralMusicTrack() {
    if (musicPlaying) return;
    musicPlaying = true;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const progressions = [
            [261.63, 329.63, 392.00, 493.88],
            [349.23, 440.00, 523.25, 587.33],
            [293.66, 349.23, 440.00, 587.33],
            [220.00, 329.63, 392.00, 440.00]
        ];
        const chord = progressions[Math.floor(Math.random() * progressions.length)];
        const now = audioCtx.currentTime;
        chord.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const noteDelay = idx * 1.6 + Math.random() * 0.4;
            const noteStart = now + noteDelay;
            const duration = 7.0 + Math.random() * 2.0;
            gain.gain.setValueAtTime(0.0, noteStart);
            gain.gain.linearRampToValueAtTime(0.012, noteStart + 2.5);
            gain.gain.setValueAtTime(0.012, noteStart + duration - 2.5);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);
            const delay = audioCtx.createDelay();
            delay.delayTime.value = 0.5;
            const delayGain = audioCtx.createGain();
            delayGain.gain.value = 0.35;
            osc.connect(gain);
            // Connect to masterGain instead of direct destination
            gain.connect(masterGain);
            gain.connect(delay);
            delay.connect(delayGain);
            delayGain.connect(masterGain);
            delayGain.connect(delay);
            osc.start(noteStart);
            osc.stop(noteStart + duration);
        });
        setTimeout(() => { musicPlaying = false; }, 20000);
    } catch (e) {
        musicPlaying = false;
    }
}

function playProceduralCricketChirp() {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const chirpsCount = Math.floor(Math.random() * 4) + 5; // 5 to 8 rapid chirps
        let startTime = now;
        
        for (let i = 0; i < chirpsCount; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(4200, startTime);
            
            gain.gain.setValueAtTime(0.0, startTime);
            gain.gain.linearRampToValueAtTime(0.006, startTime + 0.015);
            gain.gain.linearRampToValueAtTime(0.0, startTime + 0.03);
            
            osc.connect(gain);
            // Connect to masterGain instead of direct destination
            gain.connect(masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.035);
            
            startTime += 0.05;
        }
    } catch(e){}
}

export function playSound(type) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        initAmbientSounds();
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        // Connect to masterGain instead of direct destination
        gain.connect(masterGain);
        
        const now = audioCtx.currentTime;
        
        if (type === 'break') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.12);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'place') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'jump') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(350, now + 0.1);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'pickup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'craft') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.09);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.09);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (type === 'click' || type === 'ui_click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.05);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'ui_hover') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1150, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.03);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.03);
            osc.start(now);
            osc.stop(now + 0.03);
        } else if (type === 'crouch') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    } catch (e) {
        console.warn("Audio Error: ", e);
    }
}
