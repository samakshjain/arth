#!/usr/bin/env python3
"""
Generate fuzzy search variations for Hindi transliterations.
Creates mapping of common spelling variants to canonical forms.
"""

import json
import sys
from pathlib import Path
from typing import Any


# Common transliteration variation patterns
FUZZY_PATTERNS = {
    # Vowel variations
    "a": ["a", "aa"],
    "aa": ["a", "aa"],
    "i": ["i", "ee", "ea"],
    "ee": ["i", "ee", "ea"],
    "ea": ["i", "ee", "ea"],
    "u": ["u", "oo"],
    "oo": ["u", "oo"],
    "e": ["e", "ay", "ei"],
    "ay": ["e", "ay", "ei"],
    "ei": ["e", "ay", "ei"],
    "o": ["o", "oh"],
    "oh": ["o", "oh"],
    # Consonant variations
    "sh": ["sh", "sha", "shi", "shu"],
    "chh": ["chh", "ch"],
    "ch": ["ch", "chh"],
    "gh": ["gh", "g"],
    "kh": ["kh", "k"],
    "ph": ["ph", "f"],
    "bh": ["bh", "b"],
    "th": ["th", "t"],
    "dh": ["dh", "d"],
    "jh": ["jh", "j"],
    # Nasal variations
    "n": ["n", "nn"],
    "m": ["m", "mm"],
    # Common endings
    "e": ["e", "ey", "ay"],
    "ey": ["e", "ey", "ay"],
}


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


def generate_variations(transliteration: str) -> list[str]:
    """
    Generate common spelling variations for a transliteration.
    Uses pattern matching to create plausible alternatives.
    """
    variations = set()
    variations.add(transliteration)  # Canonical form

    lower = transliteration.lower()

    # Generate variations based on patterns
    for pattern, alternatives in FUZZY_PATTERNS.items():
        if pattern in lower:
            for alt in alternatives:
                if alt != pattern:
                    # Replace all occurrences
                    variant = lower.replace(pattern, alt)
                    variations.add(variant)

    # Handle specific common cases
    # "namaste" variations
    if lower == "namaste":
        variations.update(["namastey", "namastay", "namastae"])

    # "dhanyavaad" variations
    if "dhanya" in lower:
        variations.update(
            [
                lower.replace("dhanya", "dhanye"),
                lower.replace("dhanya", "dhany"),
            ]
        )

    # Remove the canonical form from variations (we'll map TO it)
    variations.discard(transliteration)
    variations.discard(lower)

    return sorted(list(variations))


def build_fuzzy_index(entries: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Build fuzzy search index mapping variants to canonical transliterations.
    """
    fuzzy_map: dict[str, str] = {}
    stats = {
        "total_entries": len(entries),
        "entries_with_variants": 0,
        "total_variants": 0,
    }

    for entry in entries:
        transliteration = entry.get("transliteration", "").lower()
        word = entry.get("word", "")

        if not transliteration:
            continue

        variations = generate_variations(transliteration)

        if variations:
            stats["entries_with_variants"] += 1
            stats["total_variants"] += len(variations)

        # Map each variation to the canonical transliteration
        for variant in variations:
            # If variant already exists, keep first mapping (deterministic)
            if variant not in fuzzy_map:
                fuzzy_map[variant] = transliteration

    return {
        "fuzzy_map": fuzzy_map,
        "stats": stats,
    }


def save_fuzzy_index(index: dict[str, Any], output_path: Path) -> None:
    """Save fuzzy index to JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def main() -> int:
    """Main entry point."""
    project_root = Path(__file__).parent.parent
    dictionary_path = project_root / "src" / "data" / "dictionary.jsonl"
    output_path = project_root / "src" / "data" / "fuzzy-index.json"

    if not dictionary_path.exists():
        print(f"Error: Dictionary file not found: {dictionary_path}", file=sys.stderr)
        return 1

    print(f"Loading dictionary from {dictionary_path}...")
    entries = load_dictionary(dictionary_path)
    print(f"Loaded {len(entries)} entries")

    print("Generating fuzzy variations...")
    index = build_fuzzy_index(entries)

    print(f"Saving fuzzy index to {output_path}...")
    save_fuzzy_index(index, output_path)

    # Print stats
    stats = index["stats"]
    print(f"\nFuzzy index built successfully!")
    print(f"  - Total entries: {stats['total_entries']}")
    print(f"  - Entries with variants: {stats['entries_with_variants']}")
    print(f"  - Total variant mappings: {stats['total_variants']}")
    print(f"  - Unique variants: {len(index['fuzzy_map'])}")

    # Show some examples
    print("\nExample mappings:")
    examples = list(index["fuzzy_map"].items())[:5]
    for variant, canonical in examples:
        print(f"  '{variant}' → '{canonical}'")

    return 0


if __name__ == "__main__":
    sys.exit(main())
