export interface Definition {
  pos: string;
  meaning: string;
  iast?: string;
  tags?: string[];
}

export interface WordForm {
  form: string;
  tags: string[];
  roman?: string;
}

export interface Example {
  text: string;
  roman?: string;
  translation?: string;
}

export interface DictionaryEntry {
  word: string;
  transliteration: string;
  iast: string;
  urdu?: string;
  ipa?: string;
  definitions: Definition[];
  forms?: WordForm[];
  examples?: Example[];
}

export interface SearchIndex {
  transliteration: Record<string, string[]>;
  meaning: Record<string, string[]>;
}

export interface SearchResult {
  word: string;
  transliteration: string;
  iast: string;
  definitions: Definition[];
  score?: number;
}
