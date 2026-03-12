#!/usr/bin/env python3
"""
Split dictionary into alphabetically chunked JSONL files for efficient loading.
Creates separate files for each starting letter/character.
"""

import gzip
import json
import sys
from pathlib import Path
from collections import defaultdict


def split_dictionary(input_path: Path, output_dir: Path) -> dict:
    """Split dictionary into chunks by first character."""
    chunks = defaultdict(list)

    print(f"Reading {input_path}...")
    with open(input_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            try:
                entry = json.loads(line)
                word = entry.get("word", "")
                if word:
                    # Get first character (handles Devanagari)
                    first_char = word[0].lower() if word[0].isalpha() else "other"
                    chunks[first_char].append(entry)
            except json.JSONDecodeError:
                continue

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Write chunks
    stats = {}
    total_compressed = 0
    total_uncompressed = 0

    for char, entries in sorted(chunks.items()):
        # Write uncompressed JSONL
        jsonl_path = output_dir / f"dict_{char}.jsonl"
        with open(jsonl_path, "w", encoding="utf-8") as f:
            for entry in entries:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")

        # Write compressed version
        gz_path = output_dir / f"dict_{char}.jsonl.gz"
        with gzip.open(gz_path, "wt", encoding="utf-8") as f:
            for entry in entries:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")

        uncompressed_size = jsonl_path.stat().st_size
        compressed_size = gz_path.stat().st_size

        stats[char] = {
            "count": len(entries),
            "uncompressed": uncompressed_size,
            "compressed": compressed_size,
        }

        total_uncompressed += uncompressed_size
        total_compressed += compressed_size

        print(
            f"  {char}: {len(entries):>5} entries, {uncompressed_size / 1024 / 1024:.1f}MB → {compressed_size / 1024 / 1024:.1f}MB"
        )

    # Write manifest
    manifest = {
        "chunks": list(chunks.keys()),
        "stats": stats,
        "total_entries": sum(len(entries) for entries in chunks.values()),
        "total_uncompressed_mb": total_uncompressed / 1024 / 1024,
        "total_compressed_mb": total_compressed / 1024 / 1024,
    }

    manifest_path = output_dir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    return manifest


def main():
    project_root = Path(__file__).parent.parent
    input_path = project_root / "src" / "data" / "dictionary.jsonl"
    output_dir = project_root / "public" / "data" / "chunks"

    if not input_path.exists():
        print(f"Error: Dictionary not found at {input_path}")
        return 1

    manifest = split_dictionary(input_path, output_dir)

    print(f"\n✓ Split complete!")
    print(f"  Total entries: {manifest['total_entries']:,}")
    print(f"  Uncompressed: {manifest['total_uncompressed_mb']:.1f}MB")
    print(f"  Compressed: {manifest['total_compressed_mb']:.1f}MB")
    print(
        f"  Compression ratio: {manifest['total_uncompressed_mb'] / manifest['total_compressed_mb']:.1f}x"
    )

    # Check if any chunk exceeds limit
    max_chunk = max(manifest["stats"].items(), key=lambda x: x[1]["compressed"])
    print(
        f"\n  Largest chunk: '{max_chunk[0]}' ({max_chunk[1]['compressed'] / 1024 / 1024:.1f}MB)"
    )

    if max_chunk[1]["compressed"] > 25 * 1024 * 1024:
        print(f"  ⚠️ WARNING: Largest chunk exceeds 25MB limit!")
    else:
        print(f"  ✓ All chunks under 25MB limit")

    return 0


if __name__ == "__main__":
    sys.exit(main())
