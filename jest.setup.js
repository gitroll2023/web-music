require('@testing-library/jest-dom');

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
    ok: true
  })
);

// Mock Audio
class MockAudio {
  constructor() {
    this.src = '';
    this.currentTime = 0;
    this.duration = 100;
    this.paused = true;
    this.volume = 1;
    this.playbackRate = 1;
    this.play = jest.fn().mockResolvedValue(undefined);
    this.pause = jest.fn().mockResolvedValue(undefined);
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
  }
}

global.Audio = MockAudio;

// Suppress console.error and console.log during tests
global.console.error = jest.fn();
global.console.log = jest.fn();
