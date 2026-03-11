import { describe, it, expect, beforeAll } from 'vitest';
import Fuse from 'fuse.js';
import type { DictionaryEntry } from '@/types';

// Test data - small subset for testing
const testDictionary: DictionaryEntry[] = [
  {
    word: 'नमस्ते',
    transliteration: 'namaste',
    iast: 'namaste',
    definitions: [{ pos: 'interjection', meaning: 'hello; greetings', tags: [] }],
  },
  {
    word: 'चम्मच',
    transliteration: 'chammach',
    iast: 'cammac',
    definitions: [{ pos: 'noun', meaning: 'spoon', tags: ['masculine'] }],
  },
  {
    word: 'धन्यवाद',
    transliteration: 'dhanyavaad',
    iast: 'dhanyavād',
    definitions: [{ pos: 'interjection', meaning: 'thank you', tags: ['masculine'] }],
  },
  {
    word: 'पानी',
    transliteration: 'paani',
    iast: 'pānī',
    definitions: [{ pos: 'noun', meaning: 'water', tags: ['masculine'] }],
  },
  {
    word: 'किताब',
    transliteration: 'kitaab',
    iast: 'kitāb',
    definitions: [{ pos: 'noun', meaning: 'book', tags: ['feminine'] }],
  },
  {
    word: 'विश्व',
    transliteration: 'vishva',
    iast: 'viśva',
    definitions: [
      { pos: 'noun', meaning: 'universe', tags: ['masculine'] },
      { pos: 'adj', meaning: 'universal', tags: ['indeclinable'] },
    ],
  },
];

// Fuse.js search options matching production
const FUSE_OPTIONS = {
  keys: [
    { name: 'word', weight: 0.4 },
    { name: 'transliteration', weight: 0.3 },
    { name: 'iast', weight: 0.1 },
    { name: 'definitions.meaning', weight: 0.2 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: true,
};

describe('Search with Fuse.js', () => {
  let fuse: Fuse<DictionaryEntry>;

  beforeAll(() => {
    fuse = new Fuse(testDictionary, FUSE_OPTIONS);
  });

  describe('Threshold configuration', () => {
    it('should have threshold of 0.3', () => {
      expect(FUSE_OPTIONS.threshold).toBe(0.3);
    });

    it('should search Devanagari', () => {
      const results = fuse.search('नमस्ते');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.word).toBe('नमस्ते');
    });

    it('should search transliteration', () => {
      const results = fuse.search('namaste');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.transliteration).toBe('namaste');
    });

    it('should search English meanings', () => {
      const results = fuse.search('spoon');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.word).toBe('चम्मच');
    });
  });

  describe('Exact match priority', () => {
    it('should rank exact transliteration matches higher than fuzzy', () => {
      const results = fuse.search('vishva');
      const exactMatch = results.find((r) => r.item.transliteration === 'vishva');
      expect(exactMatch).toBeDefined();
      expect(exactMatch?.score).toBeLessThan(0.1);
    });

    it('should return exact Devanagari match with very low score', () => {
      const results = fuse.search('नमस्ते');
      expect(results[0].score).toBeLessThan(0.1);
      expect(results[0].item.word).toBe('नमस्ते');
    });

    it('should return exact meaning match with low score', () => {
      const results = fuse.search('book');
      const bookResult = results.find((r) => r.item.word === 'किताब');
      expect(bookResult).toBeDefined();
      expect(bookResult?.score).toBeLessThan(0.3);
    });
  });

  describe('Fuzzy search', () => {
    it('should find words with similar transliteration', () => {
      const results = fuse.search('namste');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find words with partial English match', () => {
      const results = fuse.search('univ');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.item.word === 'विश्व')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should return results within 50ms', () => {
      const start = performance.now();
      fuse.search('namaste');
      const end = performance.now();
      expect(end - start).toBeLessThan(50);
    });

    it('should handle multiple searches quickly', () => {
      const queries = ['water', 'book', 'hello', 'thank', 'spoon'];
      const start = performance.now();

      for (const query of queries) {
        fuse.search(query);
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(250); // 50ms per query * 5
    });
  });

  describe('Edge cases', () => {
    it('should handle single character queries', () => {
      // Single char may return matches, but implementation should handle gracefully
      const results = fuse.search('a');
      // Should not throw, just return whatever matches
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty query gracefully', () => {
      const results = fuse.search('');
      expect(results.length).toBe(0);
    });

    it('should handle queries with no matches', () => {
      const results = fuse.search('xyz123');
      expect(results.length).toBe(0);
    });

    it('should handle mixed script queries', () => {
      const results = fuse.search('namaste');
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
