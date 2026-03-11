#!/usr/bin/env python3
"""Build search index from dictionary JSONL file."""

import json
import sys
from pathlib import Path
from typing import Any


def load_dictionary(jsonl_path: Path) -> list[dict[str, Any]]:
    """Load dictionary entries from JSONL file."""
    entries = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                entries.append(entry)
            except json.JSONDecodeError as e:
                print(f"Error parsing line {line_num}: {e}", file=sys.stderr)
                continue
    return entries


def build_index(entries: list[dict[str, Any]]) -> dict[str, Any]:
    """Build inverted search indices."""
    transliteration_index: dict[str, list[str]] = {}
    meaning_index: dict[str, list[str]] = {}

    for entry in entries:
        word = entry.get("word", "")
        transliteration = entry.get("transliteration", "").lower()
        definitions = entry.get("definitions", [])

        # Index by transliteration
        if transliteration:
            if transliteration not in transliteration_index:
                transliteration_index[transliteration] = []
            if word not in transliteration_index[transliteration]:
                transliteration_index[transliteration].append(word)

        # Index by English meanings
        for definition in definitions:
            meaning = definition.get("meaning", "").lower()
            # Split meaning into words for better search
            words = meaning.replace(";", " ").replace(",", " ").split()
            for w in words:
                w = w.strip()
                if len(w) > 2:  # Only index words longer than 2 chars
                    if w not in meaning_index:
                        meaning_index[w] = []
                    if word not in meaning_index[w]:
                        meaning_index[w].append(word)

    return {
        "transliteration": transliteration_index,
        "meaning": meaning_index,
        "entry_count": len(entries),
    }


def save_index(index: dict[str, Any], output_path: Path) -> None:
    """Save search index to JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def main() -> int:
    """Main entry point."""
    project_root = Path(__file__).parent.parent
    dictionary_path = project_root / "src" / "data" / "dictionary.jsonl"
    output_path = project_root / "src" / "data" / "search-index.json"

    if not dictionary_path.exists():
        print(f"Error: Dictionary file not found: {dictionary_path}", file=sys.stderr)
        return 1

    print(f"Loading dictionary from {dictionary_path}...")
    entries = load_dictionary(dictionary_path)
    print(f"Loaded {len(entries)} entries")

    print("Building search index...")
    index = build_index(entries)

    print(f"Saving index to {output_path}...")
    save_index(index, output_path)

    # Print stats
    trans_keys = len(index["transliteration"])
    meaning_keys = len(index["meaning"])
    print(f"Index built successfully!")
    print(f"  - Entries: {index['entry_count']}")
    print(f"  - Transliteration keys: {trans_keys}")
    print(f"  - Meaning keys: {meaning_keys}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
