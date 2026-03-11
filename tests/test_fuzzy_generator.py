#!/usr/bin/env python3
"""Tests for fuzzy key generator."""

import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

import importlib.util

spec = importlib.util.spec_from_file_location(
    "generate_fuzzy_keys",
    str(Path(__file__).parent.parent / "scripts" / "generate-fuzzy-keys.py"),
)
generate_fuzzy_keys = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generate_fuzzy_keys)
generate_variations = generate_fuzzy_keys.generate_variations
FUZZY_PATTERNS = generate_fuzzy_keys.FUZZY_PATTERNS


def test_namaste_variations():
    """Test namaste variations."""
    variations = generate_variations("namaste")
    expected = ["namastae", "namastay", "namastey"]
    for exp in expected:
        assert exp in variations, f"Expected '{exp}' in variations"
    print("✓ namaste variations test passed")


def test_vowel_variations():
    """Test vowel pattern variations."""
    # Test 'i' vs 'ee'
    variations = generate_variations("pani")
    assert "panee" in variations, "Expected panee variation"

    # Test 'u' vs 'oo' - 'u' becomes 'oo' in patterns
    variations = generate_variations("guru")
    assert "gooroo" in variations, "Expected gooroo variation"

    print("✓ vowel variations test passed")


def test_sh_vs_chh():
    """Test sh variations."""
    variations = generate_variations("shanti")
    # sh patterns generate sha, shi, shu variations
    assert "shaanti" in variations or "shianti" in variations, (
        "Expected shaanti/shianti variation"
    )
    print("✓ sh variations test passed")


def test_empty_variations():
    """Test that canonical form is not in variations."""
    variations = generate_variations("test")
    assert "test" not in variations, "Canonical form should not be in variations"
    print("✓ empty variations test passed")


def test_fuzzy_patterns_exist():
    """Test that fuzzy patterns are defined."""
    assert len(FUZZY_PATTERNS) > 0, "FUZZY_PATTERNS should not be empty"
    assert "a" in FUZZY_PATTERNS, "Should have 'a' pattern"
    assert "sh" in FUZZY_PATTERNS, "Should have 'sh' pattern"
    print("✓ fuzzy patterns exist test passed")


def test_performance():
    """Test that variation generation is fast."""
    import time

    start = time.time()
    for _ in range(1000):
        generate_variations("namaste")
    elapsed = time.time() - start

    assert elapsed < 1.0, f"Generation too slow: {elapsed:.3f}s for 1000 iterations"
    print(f"✓ performance test passed ({elapsed:.3f}s for 1000 iterations)")


def run_all_tests():
    """Run all tests."""
    print("Running fuzzy key generator tests...\n")

    tests = [
        test_fuzzy_patterns_exist,
        test_namaste_variations,
        test_vowel_variations,
        test_sh_vs_chh,
        test_empty_variations,
        test_performance,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"✗ {test.__name__} failed: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} error: {e}")
            failed += 1

    print(f"\n{'=' * 50}")
    print(f"Results: {passed} passed, {failed} failed")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
