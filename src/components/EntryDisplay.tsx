import type { DictionaryEntry } from '@/types';
import DefinitionList from './DefinitionList';

interface EntryDisplayProps {
  entry: DictionaryEntry;
}

export default function EntryDisplay({ entry }: EntryDisplayProps) {
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-white p-6 sm:p-8 border-b border-gray-100">
        <h1 className="text-5xl sm:text-6xl font-medium text-gray-900 font-hindi mb-4">
          {entry.word}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-lg text-gray-600">
          <span className="font-medium">{entry.transliteration}</span>
          {entry.iast !== entry.transliteration && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 italic">{entry.iast}</span>
            </>
          )}
        </div>

        {entry.ipa && <p className="mt-3 text-gray-500 font-mono text-base">IPA: {entry.ipa}</p>}

        {entry.urdu && (
          <p className="mt-2 text-gray-600 text-xl" dir="rtl">
            Urdu: {entry.urdu}
          </p>
        )}
      </div>

      {/* Definitions */}
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Definitions</h2>
        <DefinitionList definitions={entry.definitions} />
      </div>

      {/* Examples */}
      {entry.examples && entry.examples.length > 0 && (
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-6">Examples</h2>
          <ul className="space-y-4">
            {entry.examples.slice(0, 5).map((example, index) => (
              <li key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-300">
                {/* Romanization above */}
                {example.roman && (
                  <p className="text-sm text-gray-400 italic mb-1">{example.roman}</p>
                )}
                {/* Hindi text */}
                <p className="font-hindi text-lg text-gray-800">{example.text}</p>
                {/* Translation below */}
                {example.translation && (
                  <p className="font-hindi text-lg text-gray-600 mt-1">{example.translation}</p>
                )}
              </li>
            ))}
          </ul>
          {entry.examples.length > 5 && (
            <p className="text-sm text-gray-500 mt-3">
              + {entry.examples.length - 5} more examples
            </p>
          )}
        </div>
      )}

      {/* Forms */}
      {entry.forms && entry.forms.length > 0 && (
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Forms</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {entry.forms.slice(0, 12).map((form, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="font-hindi text-lg text-gray-900">{form.form}</div>
                {form.roman && <div className="text-sm text-gray-500">{form.roman}</div>}
                {form.tags.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {form.tags.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
