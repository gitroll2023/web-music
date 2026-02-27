import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Web API 모의 구현
global.Request = class Request {};
global.Response = class Response {};
global.Headers = class Headers {};
global.fetch = jest.fn();
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  postMessage() {}
  close() {}
};

// FormData 모의 구현
class MockBlob {
  constructor(content, options) {
    this._content = content;
    this._options = options;
  }

  text() {
    return this._content[0];
  }
}

global.Blob = MockBlob;

global.FormData = class FormData {
  constructor() {
    this._data = new Map();
  }

  append(key, value) {
    this._data.set(key, value);
  }

  get(key) {
    return this._data.get(key);
  }

  has(key) {
    return this._data.has(key);
  }

  delete(key) {
    this._data.delete(key);
  }

  entries() {
    return this._data.entries();
  }

  values() {
    return this._data.values();
  }

  keys() {
    return this._data.keys();
  }

  *[Symbol.iterator]() {
    yield* this._data;
  }
};

// File 모의 구현
global.File = class File {
  constructor([content], filename, options = {}) {
    this.content = content;
    this.name = filename;
    this.type = options.type || '';
  }
};

// Mock Audio
class MockAudio {
  constructor(url) {
    this.url = url;
    this.paused = true;
    this.currentTime = 0;
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

global.Audio = MockAudio;

// Suppress console.error and console.log during tests
global.console.error = jest.fn();
global.console.log = jest.fn();
