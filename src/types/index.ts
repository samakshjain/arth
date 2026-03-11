export interface Definition {
  pos: string;
  meaning: string;
}

export interface DictionaryEntry {
  word: string;
  transliteration: string;
  definitions: Definition[];
  examples?: string[];
}

export interface SearchIndex {
  transliteration: Record<string, string[]>;
  meaning: Record<string, string[]>;
}

export interface SearchResult {
  word: string;
  transliteration: string;
  definitions: Definition[];
  score?: number;
}
