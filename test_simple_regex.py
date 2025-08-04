#!/usr/bin/env python3

import re

def test_patterns():
    # Test cases based on what we actually see in the extracted content
    test_cases = [
        "2 1 Finger exercises a. Find something",
        "4 2 Taylor Let f(x) = something",
        "6 3 Approximating a square root Let f(x) = something",
        "1 Finger exercises\na. Find something",
        "2 Taylor\nLet f(x) = something",
        "3 Approximating a square root\nLet f(x) = something"
    ]
    
    patterns = [
        # Original MIT pattern (all uppercase)
        r'(?:^|\n)\s*(\d+)\s+([A-Z][A-Z\s]+)(?:\n(.+?))?(?=(?:^|\n)\s*\d+\s+[A-Z]|\Z)',
        
        # Updated MIT pattern (title case)
        r'(?:^|\n)\s*(\d+)\s+([A-Z][a-z\s]+(?:[a-z\s]+)*)(?:\n(.+?))?(?=(?:^|\n)\s*\d+\s+[A-Z]|\Z)',
        
        # Simplified pattern without lookahead
        r'(\d+)\s+([A-Z][a-z\s]+(?:[a-z\s]+)*)',
        
        # Pattern that handles page numbers before problem numbers
        r'(?:^\d+\s+)?(\d+)\s+([A-Z][a-z\s]+(?:[a-z\s]+)*)',
        
        # Pattern specifically for the format we see
        r'\b(\d+)\s+([A-Z][a-z\s]+(?:[a-z\s]+)*)',
    ]
    
    pattern_names = [
        "Original MIT (all uppercase)",
        "Updated MIT (title case)",
        "Simplified (no lookahead)",
        "With page number handling",
        "Word boundary based"
    ]
    
    for i, test_case in enumerate(test_cases):
        print(f"\n{'='*60}")
        print(f"TEST CASE {i+1}: {repr(test_case)}")
        print('='*60)
        
        for j, pattern in enumerate(patterns):
            print(f"\nPattern {j+1} ({pattern_names[j]}):")
            print(f"  Regex: {pattern}")
            
            matches = list(re.finditer(pattern, test_case, re.DOTALL | re.IGNORECASE | re.MULTILINE))
            print(f"  Matches: {len(matches)}")
            
            for k, match in enumerate(matches):
                print(f"    Match {k+1}:")
                print(f"      Full: {repr(match.group(0))}")
                print(f"      Number: {repr(match.group(1))}")
                print(f"      Title: {repr(match.group(2))}")
                if len(match.groups()) >= 3 and match.group(3):
                    print(f"      Content: {repr(match.group(3))}")

if __name__ == "__main__":
    test_patterns()