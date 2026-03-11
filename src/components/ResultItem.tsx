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
          <p className="text-gray-700">
            {firstDefinition.meaning}
            {otherDefinitionsCount > 0 && (
              <span className="text-gray-400"> +{otherDefinitionsCount} more</span>
            )}
          </p>
          {firstDefinition.tags && firstDefinition.tags.length > 0 && (
            <div className="flex gap-2 mt-2">
              {firstDefinition.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </a>
  );
}
