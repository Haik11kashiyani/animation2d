// Story schema — output from Gemini AI story generator

export type CameraMovement = 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight' | 'panUp' | 'panDown' | 'slowPush' | 'static';
export type TransitionType = 'fade' | 'wipe' | 'zoom' | 'dissolve' | 'flash' | 'glitch';
export type ColorGrade = 'warm' | 'cool' | 'neon' | 'desaturated' | 'golden' | 'midnight';
export type CharacterEmotion = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry' | 'thinking' | 'excited' | 'scared';
export type CharacterPose = 'idle' | 'talking' | 'walking' | 'pointing' | 'sitting' | 'celebrating';
export type ParticleType = 'dust' | 'sparkles' | 'snow' | 'embers' | 'rain' | 'orbs' | 'stars' | 'none';
export type AmbientSFX = 'rain' | 'wind' | 'crowd' | 'night' | 'forest' | 'ocean' | 'fire' | 'silence';
export type SceneMood = 'peaceful' | 'tense' | 'joyful' | 'mysterious' | 'dramatic' | 'melancholic' | 'epic' | 'romantic';

export interface CharacterState {
  id: string;
  name: string;
  emotion: CharacterEmotion;
  pose: CharacterPose;
  position: 'left' | 'center' | 'right';
  scale: number;
}

export interface SceneBackground {
  type: 'gradient' | 'illustrated';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  elements: string[]; // e.g. ["mountains", "stars", "clouds"]
  lightingDirection: 'left' | 'right' | 'center' | 'top';
}

export interface Scene {
  id: number;
  title: string;
  narration: string;
  mood: SceneMood;
  background: SceneBackground;
  characters: CharacterState[];
  camera: CameraMovement;
  transition: TransitionType;
  colorGrade: ColorGrade;
  particles: ParticleType;
  ambientSfx: AmbientSFX;
}

export interface StoryData {
  title: string;
  genre: string;
  mood: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  scenes: Scene[];
  outro: {
    text: string;
    cta: string;
  };
}

// Audio timing output
export interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface SceneTiming {
  sceneId: number;
  durationMs: number;
  durationFrames: number;
  audioFile: string;
  words: WordTiming[];
}

export interface TimingData {
  fps: number;
  totalFrames: number;
  totalDurationMs: number;
  introFrames: number;
  outroFrames: number;
  scenes: SceneTiming[];
}
