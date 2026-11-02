import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const SOURCES = {
  select: require('../../assets/sounds/select.wav'),
  pour: require('../../assets/sounds/pour.wav'),
  invalid: require('../../assets/sounds/invalid.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  win: require('../../assets/sounds/win.wav'),
};

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let enabled = true;
let configured = false;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  try {
    if (!configured) {
      configured = true;
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    let player = players[name];
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      player.volume = name === 'select' ? 0.5 : 0.8;
      players[name] = player;
    }
    Promise.resolve(player.seekTo(0)).catch(() => {});
    player.play();
  } catch {
    // Sound is optional, so the game carries on without it.
  }
}
