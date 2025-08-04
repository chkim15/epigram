#!/usr/bin/env python3

import re

def test_improved_patterns():
    # Test cases based on actual extracted content
    test_cases = [
        "2 1 Finger exercises a. Find something",
        "4 2 Taylor Let f(x) = something",
        "6 3 Approximating a square root Let f(x) = something",
    ]
    
    patterns = [
        # Current problematic pattern
        r'(?:^\d+\s+)?(\d+)\s+([A-Z][a-z\s]+(?:[a-z\s]+)*)',
        
        # Improved pattern - stops title at first lowercase after space
        r'(?:^\d+\s+)?(\d+)\s+([A-Z][a-z]*(?:\s+[a-z]+)*)\s+([a-z].*)',
        
        # Alternative - stops title at first standalone lowercase letter
        r'(?:^\d+\s+)?(\d+)\s+([A-Z][a-z]*(?:\s+[a-z]+)*)\s+([a-z]\.\s+.*)',
        
        # Alternative - uses word boundaries more intelligently
        r'(?:^\d+\s+)?(\d+)\s+([A-Z][A-Za-z\s]+?)\s+([a-z]+.*)',
        
        # Most specific - matches the exact pattern we see
        r'(?:^\d+\s+)?(\d+)\s+([A-Z][a-z]*(?:\s+[a-z]+)*?)\s+([a-z]\.\s+.*|Let\s+.*)',
    ]
    
    pattern_names = [
        "Current pattern",
        "Stop at lowercase content",
        "Stop at 'a.' pattern",
        "Word boundary approach",
        "MIT-specific pattern"
    ]
    
    for i, test_case in enumerate(test_cases):
        print(f"\n{'='*80}")
        print(f"TEST CASE {i+1}: {repr(test_case)}")
        print('='*80)
        
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
    test_improved_patterns()