import { describe, it, expect } from 'vitest';
import { LivepeerProvider } from '../src/providers/livepeer';

describe('Model Provider Configuration', () => {
  describe('Livepeer Provider', () => {
    const provider = new LivepeerProvider({
      endpoint: 'http://gateway.test-gateway',
      defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      imageModel: 'ByteDance/SDXL-Lightning',
      maxInputTokens: 8000,
      maxOutputTokens: 8192,
      temperature: 0,
      stop: []
    });

    it('should have correct endpoint configuration', () => {
      expect(provider.endpoint).toBe('http://gateway.test-gateway');
    });

    it('should have correct model mappings', () => {
      expect(provider.defaultModel).toBe('meta-llama/Meta-Llama-3.1-8B-Instruct');
    });

    it('should have correct settings configuration', () => {
      expect(provider.settings).toEqual({
        maxInputTokens: 8000,
        maxOutputTokens: 8192,
        temperature: 0,
        stop: []
      });
    });
  });

  describe('Generation with Livepeer', () => {
    const provider = new LivepeerProvider({
      endpoint: 'http://gateway.test-gateway',
      imageModel: 'ByteDance/SDXL-Lightning'
    });

    it('should have correct image generation settings', () => {
      expect(provider.imageModel).toBe('ByteDance/SDXL-Lightning');
    });

    it('should use default image model', () => {
      const defaultProvider = new LivepeerProvider({
        endpoint: 'http://gateway.test-gateway'
      });
      expect(defaultProvider.imageModel).toBe('ByteDance/SDXL-Lightning');
    });
  });
});