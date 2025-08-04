#!/usr/bin/env python3
"""
Test script to validate MIT problem patterns
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
    # Current patterns (not working)
    current_patterns = [
        r'(?:^|\n)\s*(\d+)\.\s*(.+?)(?=(?:^|\n)\s*\d+\.\s|\Z)',
        r'(?:^|\n)\s*Problem\s+(\d+)[:\.]?\s*(.+?)(?=(?:^|\n)\s*Problem\s+\d+|\Z)'
    ]
    
    # New MIT-specific pattern
    mit_pattern = r'(?:^|\n)\s*(\d+)\s+([A-Za-z][^0-9\n]*?)(?=(?:^|\n)\s*\d+\s+[A-Za-z]|\Z)'
    
    print("TESTING CURRENT PATTERNS (should fail):")
    print("="*50)
    
    for i, pattern in enumerate(current_patterns):
        print(f"\nPattern {i+1}: {pattern}")
        for j, text in enumerate(sample_texts):
            matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
            print(f"  Sample {j+1}: {matches}")
    
    print(f"\n\nTESTING NEW MIT PATTERN (should work):")
    print("="*50)
    print(f"Pattern: {mit_pattern}")
    
    for j, text in enumerate(sample_texts):
        matches = re.findall(mit_pattern, text, re.MULTILINE | re.DOTALL)
        print(f"  Sample {j+1}: {matches}")
        
    # Test the complete extraction logic
    print(f"\n\nTESTING COMPLETE EXTRACTION:")
    print("="*50)
    
    # Combine all samples to simulate full document
    full_text = "\n\n".join(sample_texts)
    matches = re.findall(mit_pattern, full_text, re.MULTILINE | re.DOTALL)
    
    print(f"Full document matches: {len(matches)}")
    for i, (num, title) in enumerate(matches):
        print(f"  Problem {num}: {title.strip()[:50]}...")

if __name__ == "__main__":
    test_patterns()