#!/usr/bin/env python3
"""
Test script to validate MIT problem patterns - version 2
"""

# Sample texts extracted from the MIT PDF
sample_texts = [
    # Page 3 - Problem 1
    """2

1 Finger exercises
a. Find \( \int_{0}^{\pi / 2} \frac{\sin \theta}{\sqrt{\cos \theta}} d \theta \).

Solution. We will use \( u \)-substitution.""",

    # Page 5 - Problem 2  
    """4

2 Taylor
Let \( f(x)=e^{-x^{2}}+\frac{1}{10} x \).
a. Find the 2 nd-order Taylor series of \( f \) around \( x=0 \).""",

    # Page 7 - Problem 3
    """6

3 Approximating a square root
Let \( f(x)=x^{3} \).
a. Write down the straight line approximation of \( f(x) \) around \( x=10 \).""",

    # Page 9 - Problem 4
    """8

4 Center of mass
First let's review center of mass. Suppose that we have \( n \) particles with masses"""
]

import re

def test_patterns():
    print("ANALYZING TEXT STRUCTURE:")
    print("="*50)
    
    for i, text in enumerate(sample_texts, 1):
        print(f"\nSample {i}:")
        lines = text.split('\n')
        for j, line in enumerate(lines[:5]):
            print(f"  Line {j}: {repr(line)}")
    
    # Try various patterns
    patterns_to_test = [
        # Simple: just number followed by space and letters
        (r'^(\d+)\s+([A-Za-z].*)$', "Number + space + letters (start of line)"),
        
        # With newline prefix
        (r'(?:^|\n)(\d+)\s+([A-Za-z].*)$', "Number + space + letters (with newline)"),
        
        # More flexible
        (r'(?:^|\n)\s*(\d+)\s+([A-Za-z].*)', "Number + space + letters (flexible)"),
        
        # Match full problem content
        (r'(?:^|\n)\s*(\d+)\s+([A-Za-z][^\n]*(?:\n(?!\s*\d+\s+[A-Za-z])[^\n]*)*)', "Full problem content"),
    ]
    
    print(f"\n\nTESTING PATTERNS:")
    print("="*50)
    
    for pattern, description in patterns_to_test:
        print(f"\n{description}")
        print(f"Pattern: {pattern}")
        
        for j, text in enumerate(sample_texts, 1):
            matches = re.findall(pattern, text, re.MULTILINE)
            print(f"  Sample {j}: {len(matches)} matches")
            for match in matches:
                if isinstance(match, tuple):
                    num, content = match
                    print(f"    Problem {num}: {content[:50]}...")
                else:
                    print(f"    Match: {match[:50]}...")
    
    # Test on combined text
    print(f"\n\nTESTING ON COMBINED TEXT:")
    print("="*50)
    
    combined_text = "\n\n".join(sample_texts)
    print("Combined text structure:")
    lines = combined_text.split('\n')
    for i, line in enumerate(lines):
        if line.strip() and (line.strip().isdigit() or re.match(r'\d+\s+[A-Za-z]', line)):
            print(f"  Line {i}: {repr(line)}")
    
    # Test the most promising pattern
    best_pattern = r'(?:^|\n)\s*(\d+)\s+([A-Za-z][^\n]*(?:\n(?!\s*\d+\s+[A-Za-z])[^\n]*)*)'
    matches = re.findall(best_pattern, combined_text, re.MULTILINE)
    print(f"\nBest pattern results: {len(matches)} matches")
    for match in matches:
        num, content = match
        print(f"  Problem {num}: {content.strip()[:100]}...")

if __name__ == "__main__":
    test_patterns()