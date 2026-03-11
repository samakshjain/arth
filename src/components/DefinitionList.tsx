import type { Definition } from '@/types';

interface DefinitionListProps {
  definitions: Definition[];
}

export default function DefinitionList({ definitions }: DefinitionListProps) {
  // Group definitions by part of speech
  const grouped = definitions.reduce(
    (acc, def) => {
      if (!acc[def.pos]) {
        acc[def.pos] = [];
      }
      acc[def.pos].push(def);
      return acc;
    },
    {} as Record<string, Definition[]>,
  );

  const posOrder = [
    'noun',
    'verb',
    'adj',
    'adjective',
    'adv',
    'adverb',
    'interjection',
    'particle',
    'character',
  ];

  // Sort POS groups by preferred order
  const sortedPos = Object.keys(grouped).sort((a, b) => {
    const aIndex = posOrder.indexOf(a);
    const bIndex = posOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-6">
      {sortedPos.map((pos) => (
        <div key={pos} className="border-l-4 border-primary-500 pl-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {pos}
          </h3>
          <ol className="space-y-3 list-decimal list-inside">
            {grouped[pos].map((def, index) => (
              <li key={index} className="text-gray-800">
                <span className="font-medium">{def.meaning}</span>
                {def.tags && def.tags.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">({def.tags.join(', ')})</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
