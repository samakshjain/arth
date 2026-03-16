import type { SearchResult } from '@/types';

interface ResultItemProps {
  result: SearchResult;
}

export default function ResultItem({ result }: ResultItemProps) {
  const firstDefinition = result.definitions[0];
  const otherDefinitionsCount = result.definitions.length - 1;

  return (
    <a
      href={`/word/${encodeURIComponent(result.word)}`}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-medium text-gray-900 font-hindi truncate">{result.word}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {result.transliteration}
            {result.iast !== result.transliteration && (
              <span className="text-gray-400"> • {result.iast}</span>
            )}
          </p>
        </div>
        {firstDefinition && (
          <span className="text-xs text-gray-400 uppercase tracking-wider shrink-0">
            {firstDefinition.pos}
          </span>
        )}
      </div>

      {firstDefinition && (
        <div className="mt-3">
          <ul className="space-y-1">
            {result.definitions.slice(0, 3).map((def, idx) => (
              <li key={idx} className="text-gray-700">
                <span className="text-gray-400 text-xs">{def.pos}</span> {def.meaning}
              </li>
            ))}
            {otherDefinitionsCount > 2 && (
              <li className="text-gray-400 text-sm">+{otherDefinitionsCount - 2} more meanings</li>
            )}
          </ul>
          {firstDefinition.tags && firstDefinition.tags.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {firstDefinition.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {result.forms && result.forms.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Forms:</p>
          <div className="flex gap-2 flex-wrap">
            {result.forms.slice(0, 4).map((form, idx) => (
              <span
                key={idx}
                className="text-sm px-2 py-1 bg-gray-50 text-gray-600 rounded font-hindi"
              >
                {form.form}
              </span>
            ))}
            {result.forms.length > 4 && (
              <span className="text-xs text-gray-400 self-center">
                +{result.forms.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </a>
  );
}
