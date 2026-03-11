#!/usr/bin/env python3
"""
Transform Wiktionary JSONL to arth dictionary format.
Extracts: word, IAST transliteration, Urdu spelling, IPA, forms, definitions.
"""

import json
import re
import sys
from pathlib import Path
from typing import Any


def extract_iast(forms: list[dict]) -> str:
    """Extract IAST romanization from forms array."""
    for form in forms:
        if "romanization" in form.get("tags", []):
            return form.get("form", "")
    return ""


def extract_urdu(forms: list[dict]) -> str | None:
    """Extract Urdu spelling from forms array."""
    for form in forms:
        if "Urdu" in form.get("tags", []):
            return form.get("form", "")
    return None


def extract_ipa(sounds: list[dict]) -> str | None:
    """Extract IPA pronunciation (first Standard Hindi entry)."""
    for sound in sounds:
        if "ipa" in sound and "Hindi" in sound.get("tags", []):
            return sound.get("ipa", "")
    return None


def extract_forms(forms_data: list[dict]) -> list[dict]:
    """Extract grammatical forms (excluding romanization, Urdu, and inflection templates)."""
    result = []
    for form in forms_data:
        tags = form.get("tags", [])
        # Skip non-grammatical forms and inflection templates
        if (
            "romanization" in tags
            or "Urdu" in tags
            or "table-tags" in tags
            or "inflection-template" in tags
        ):
            continue
        result.append(
            {"form": form.get("form", ""), "tags": tags, "roman": form.get("roman", "")}
        )
    return result


def normalize_transliteration(iast: str) -> str:
    """
    Convert IAST to simplified transliteration for search.
    Handles: ś→sh, ṣ→sh, ṛ→ri, ñ→n, ṁ→m, etc.
    """
    replacements = {
        "ś": "sh",
        "ṣ": "sh",
        "ñ": "n",
        "ṅ": "ng",
        "ṇ": "n",
        "ṭ": "t",
        "ḍ": "d",
        "ṛ": "ri",
        "ṃ": "m",
        "ḥ": "h",
        "ā": "aa",
        "ī": "ee",
        "ū": "oo",
        "ē": "e",
        "ō": "o",
        "ç": "ch",
    }

    result = iast.lower()
    for iast_char, simple in replacements.items():
        result = result.replace(iast_char, simple)

    return result


def extract_definitions(senses: list[dict], pos: str) -> list[dict]:
    """Extract definitions from senses array."""
    definitions = []
    for sense in senses:
        glosses = sense.get("glosses", [])
        if not glosses:
            continue

        # Join multiple glosses with semicolon
        meaning = "; ".join(glosses)

        # Extract tags (masculine, feminine, etc.)
        tags = sense.get("tags", [])
        # Filter to only gender/grammar tags
        grammar_tags = [
            t for t in tags if t in ["masculine", "feminine", "neuter", "indeclinable"]
        ]

        definition = {"pos": pos, "meaning": meaning, "tags": grammar_tags}
        definitions.append(definition)

    return definitions


def extract_examples(wiktionary_entry: dict) -> list[dict] | None:
    """Extract example sentences with romanization and translation."""
    examples = []

    # Examples are usually in the "senses" array under "examples" key
    senses = wiktionary_entry.get("senses", [])
    for sense in senses:
        sense_examples = sense.get("examples", [])
        for example in sense_examples:
            if isinstance(example, dict):
                text = example.get("text", "")
                if text:
                    examples.append(
                        {
                            "text": text,
                            "roman": example.get("roman", ""),
                            "translation": example.get("translation", "")
                            or example.get("english", ""),
                        }
                    )
            elif isinstance(example, str):
                # Fallback for string-only examples
                examples.append({"text": example, "roman": "", "translation": ""})

    # Also check for examples in the top-level "examples" key
    top_examples = wiktionary_entry.get("examples", [])
    for example in top_examples:
        if isinstance(example, dict):
            text = example.get("text", "")
            if text:
                examples.append(
                    {
                        "text": text,
                        "roman": example.get("roman", ""),
                        "translation": example.get("translation", "")
                        or example.get("english", ""),
                    }
                )
        elif isinstance(example, str):
            examples.append({"text": example, "roman": "", "translation": ""})

    return examples if examples else None


def transform_entry(wiktionary_entry: dict) -> dict | None:
    """Transform a single Wiktionary entry to arth format."""
    word = wiktionary_entry.get("word", "")
    if not word:
        return None

    pos = wiktionary_entry.get("pos", "")
    forms = wiktionary_entry.get("forms", [])
    sounds = wiktionary_entry.get("sounds", [])
    senses = wiktionary_entry.get("senses", [])

    # Extract IAST
    iast = extract_iast(forms)
    if not iast:
        # Fallback: try to extract from head_templates
        head_templates = wiktionary_entry.get("head_templates", [])
        for template in head_templates:
            expansion = template.get("expansion", "")
            # Match pattern like "विश्व • (viśva)"
            match = re.search(r"\(([^)]+)\)", expansion)
            if match:
                iast = match.group(1)
                break

    if not iast:
        return None

    # Generate simplified transliteration for search
    transliteration = normalize_transliteration(iast)

    # Extract additional data
    urdu = extract_urdu(forms)
    ipa = extract_ipa(sounds)
    word_forms = extract_forms(forms)
    definitions = extract_definitions(senses, pos)
    examples = extract_examples(wiktionary_entry)

    if not definitions:
        return None

    return {
        "word": word,
        "transliteration": transliteration,
        "iast": iast,
        "urdu": urdu,
        "ipa": ipa,
        "definitions": definitions,
        "forms": word_forms if word_forms else None,
        "examples": examples,
    }


def process_file(input_path: Path, output_path: Path) -> tuple[int, int]:
    """Process Wiktionary JSONL file and write transformed entries."""
    entries_processed = 0
    entries_written = 0

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with (
        open(input_path, "r", encoding="utf-8") as infile,
        open(output_path, "w", encoding="utf-8") as outfile,
    ):
        for line_num, line in enumerate(infile, 1):
            line = line.strip()
            if not line:
                continue

            entries_processed += 1

            try:
                wiktionary_entry = json.loads(line)
                transformed = transform_entry(wiktionary_entry)

                if transformed:
                    outfile.write(json.dumps(transformed, ensure_ascii=False) + "\n")
                    entries_written += 1

            except json.JSONDecodeError as e:
                print(f"Error parsing line {line_num}: {e}", file=sys.stderr)
                continue
            except Exception as e:
                print(f"Error processing line {line_num}: {e}", file=sys.stderr)
                continue

    return entries_processed, entries_written


def main() -> int:
    """Main entry point."""
    if len(sys.argv) < 2:
        # Default paths
        project_root = Path(__file__).parent.parent
        input_path = project_root / "data" / "raw" / "wiktionary_hindi.jsonl"
        output_path = project_root / "src" / "data" / "dictionary.jsonl"
    else:
        input_path = Path(sys.argv[1])
        output_path = (
            Path(sys.argv[2]) if len(sys.argv) > 2 else Path("dictionary.jsonl")
        )

    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        print(
            "Usage: python3 transform-wiktionary.py <input.jsonl> [output.jsonl]",
            file=sys.stderr,
        )
        return 1

    print(f"Processing {input_path}...")
    processed, written = process_file(input_path, output_path)

    print(f"\nTransformation complete!")
    print(f"  - Entries processed: {processed}")
    print(f"  - Entries written: {written}")
    print(f"  - Output: {output_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
