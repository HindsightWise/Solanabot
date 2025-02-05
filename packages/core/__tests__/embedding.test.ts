import { vi, describe, it, expect } from 'vitest';
import { LocalEmbeddingManager } from '../src/localembeddingManager';

vi.mock('@modelcontextprotocol/server-memory');

describe('LocalEmbeddingManager', () => {
  it('should initialize correctly', () => {
    const manager = new LocalEmbeddingManager();
    expect(manager).toBeDefined();
  });

  it('should store and retrieve embeddings', async () => {
    const manager = new LocalEmbeddingManager();
    const text = 'test text';
    const embedding = await manager.getEmbedding(text);
    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
  });
});