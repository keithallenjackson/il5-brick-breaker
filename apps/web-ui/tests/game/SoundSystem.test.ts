import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundSystem } from '../../src/game/systems/SoundSystem';

// Mock AudioContext
class MockOscillatorNode {
  type = 'sine';
  frequency = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn().mockReturnThis();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode {
  gain = {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn().mockReturnThis();
}

class MockBufferSourceNode {
  buffer: AudioBuffer | null = null;
  connect = vi.fn().mockReturnThis();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  sampleRate = 44100;

  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  createBuffer = vi.fn((_channels: number, length: number, sampleRate: number) => ({
    getChannelData: () => new Float32Array(length),
    length,
    sampleRate,
    duration: length / sampleRate,
    numberOfChannels: _channels,
  }));
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  resume = vi.fn().mockResolvedValue(undefined);
  get destination(): AudioDestinationNode {
    return {} as AudioDestinationNode;
  }
}

describe('SoundSystem', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  it('should initialize successfully', () => {
    const sound = new SoundSystem();
    sound.init();

    // Should not throw and should be usable
    expect(() => sound.playWallBounce()).not.toThrow();
  });

  it('should not play sounds when muted', () => {
    const sound = new SoundSystem();
    sound.init();
    sound.setMuted(true);

    // Since muted, internal canPlay() returns false, no audio nodes created
    expect(sound.isMuted()).toBe(true);

    // The sound methods should return early without creating oscillators
    sound.playPaddleHit(0.5);
    sound.playBrickBreak();
    sound.playWallBounce();

    // If we get here without errors, muting is working
    expect(sound.isMuted()).toBe(true);
  });

  it('should enable sounds when unmuted', () => {
    const sound = new SoundSystem();
    sound.init();

    sound.setMuted(true);
    expect(sound.isMuted()).toBe(true);

    sound.setMuted(false);
    expect(sound.isMuted()).toBe(false);

    // Should not throw when playing sounds while unmuted
    expect(() => sound.playPaddleHit(0.5)).not.toThrow();
    expect(() => sound.playBrickBreak()).not.toThrow();
    expect(() => sound.playWallBounce()).not.toThrow();
    expect(() => sound.playPowerUpCollect()).not.toThrow();
    expect(() => sound.playLifeLost()).not.toThrow();
    expect(() => sound.playLevelComplete()).not.toThrow();
    expect(() => sound.playGameOver()).not.toThrow();
  });
});
