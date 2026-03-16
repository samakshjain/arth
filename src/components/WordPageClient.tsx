'use client';

import { useEffect, useState } from 'react';
import type { SearchResult } from '@/types';
import { getWord } from '@/lib/search';

interface Props {
  word: string;
}

export default function WordPage({ word }: Props) {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!word) return;

    async function fetchWord() {
      setLoading(true);
      setError(null);
      try {
        const data = await getWord(word);
        if (data) {
          setResult(data);
        } else {
          setError('Word not found');
        }
      } catch (err) {
        setError('Failed to load word');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchWord();
  }, [word]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Word not found</h1>
        <p className="text-gray-600 mb-6">
          {error || 'The word you are looking for does not exist in the dictionary.'}
        </p>
        <a href="/" className="text-primary-600 hover:text-primary-700">
          Back to search
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/" className="hover:text-primary-600 transition-colors">
              Home
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium" aria-current="page">
            {result.word}
          </li>
        </ol>
      </nav>

      <article className="bg-white border border-gray-200 rounded-xl p-6">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 font-hindi mb-2">{result.word}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="text-lg">{result.transliteration}</span>
            {result.iast !== result.transliteration && (
              <span className="text-gray-400">• {result.iast}</span>
            )}
          </div>
          {result.ipa && <p className="text-gray-500 text-sm mt-1">{result.ipa}</p>}
          {result.urdu && <p className="text-gray-500 text-sm mt-1">Urdu: {result.urdu}</p>}
        </header>

        {result.definitions.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Definitions
            </h2>
            <ul className="space-y-3">
              {result.definitions.map((def, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="text-gray-400 text-sm shrink-0 w-8">{def.pos}</span>
                  <div>
                    <p className="text-gray-700">{def.meaning}</p>
                    {def.tags && def.tags.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {def.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {result.forms && result.forms.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Forms
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {result.forms.map((form, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="font-hindi text-gray-900">{form.form}</p>
                  {form.roman && <p className="text-xs text-gray-500">{form.roman}</p>}
                  <div className="flex gap-1 justify-center mt-1">
                    {form.tags.map((tag) => (
                      <span key={tag} className="text-xs text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {result.examples && result.examples.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Examples
            </h2>
            <ul className="space-y-3">
              {result.examples.map((ex, idx) => (
                <li key={idx} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-hindi text-gray-900 mb-1">{ex.text}</p>
                  {ex.roman && <p className="text-sm text-gray-500 mb-1">{ex.roman}</p>}
                  {ex.translation && (
                    <p className="text-sm text-gray-600 italic">{ex.translation}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <div className="mt-8 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to search
        </a>
      </div>
    </div>
  );
}
