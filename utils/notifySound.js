let audioCtx = null;
let listenersAttached = false;
let lastPlayedAt = 0;

export function isSoundEnabled() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    return window.localStorage.getItem('wd-sound-enabled') !== '0';
  } catch {
    return true;
  }
}

export function setSoundEnabled(on) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem('wd-sound-enabled', on ? '1' : '0');
  } catch {
    // ignore
  }
}

function getContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    } catch {
      // ignore
    }
  }
  return audioCtx;
}

export function unlockAudio() {
  if (typeof window === 'undefined' || listenersAttached) return;
  listenersAttached = true;

  try {
    const opts = { capture: true, passive: true };
    const resumeOnInteraction = () => {
      try {
        const ctx = getContext();
        if (ctx && ctx.state !== 'running') {
          ctx.resume().catch(() => {});
        }
      } catch {
        // ignore
      }
    };

    document.addEventListener('click', resumeOnInteraction, opts);
    document.addEventListener('touchstart', resumeOnInteraction, opts);
    document.addEventListener('keydown', resumeOnInteraction, opts);

    window.addEventListener('focus', () => {
      try {
        if (audioCtx && audioCtx.state !== 'running') {
          audioCtx.resume().catch(() => {});
        }
      } catch {
        // ignore
      }
    });

    document.addEventListener('visibilitychange', () => {
      try {
        if (document.visibilityState === 'visible' && audioCtx && audioCtx.state !== 'running') {
          audioCtx.resume().catch(() => {});
        }
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

export async function playChime(options = {}) {
  try {
    if (!options?.force && !isSoundEnabled()) return false;

    const ctx = getContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }

    if (ctx.state !== 'running') return false;

    if (!options?.force) {
      if (Date.now() - lastPlayedAt < 2000) return false;
    }
    lastPlayedAt = Date.now();

    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.connect(ctx.destination);

    const notes = [
      { f: 880, delay: 0 },
      { f: 660, delay: 0.18 },
    ];

    notes.forEach((note) => {
      const startTime = now + note.delay;

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(1, startTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.02 + 0.9);
      noteGain.connect(masterGain);

      // Sine primary
      const oscSine = ctx.createOscillator();
      oscSine.type = 'sine';
      oscSine.frequency.setValueAtTime(note.f, startTime);
      const sineGain = ctx.createGain();
      sineGain.gain.setValueAtTime(0.7, startTime);
      oscSine.connect(sineGain);
      sineGain.connect(noteGain);

      // Triangle quieter
      const oscTri = ctx.createOscillator();
      oscTri.type = 'triangle';
      oscTri.frequency.setValueAtTime(note.f, startTime);
      const triGain = ctx.createGain();
      triGain.gain.setValueAtTime(0.3, startTime);
      oscTri.connect(triGain);
      triGain.connect(noteGain);

      oscSine.start(startTime);
      oscSine.stop(startTime + 0.95);
      oscTri.start(startTime);
      oscTri.stop(startTime + 0.95);
    });

    return true;
  } catch {
    return false;
  }
}

export function testChime() {
  return playChime({ force: true });
}
