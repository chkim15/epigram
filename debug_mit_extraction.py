#!/usr/bin/env python3

import requests
import json
import base64
import os
import re
import time
from pathlib import Path
from PIL import Image
import io
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def process_single_page_image(image_path, app_id, app_key):
    """Process a single page image with Mathpix API and return raw content"""
    
    # Encode image to base64
    with open(image_path, 'rb') as image_file:
        image_data = base64.b64encode(image_file.read()).decode('utf-8')
    
    # Prepare request
    url = "https://api.mathpix.com/v3/text"
    headers = {
        'app_id': app_id,
        'app_key': app_key,
        'Content-Type': 'application/json'
    }
    
    data = {
        'src': f'data:image/png;base64,{image_data}',
        'formats': ['text', 'latex_styled'],
        'format_options': {
            'text': {
                'transforms': ['rm_spaces', 'rm_newlines'],
                'math_inline_delimiters': ['$', '$'],
                'math_display_delimiters': ['$$', '$$']
            }
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error processing image: {response.status_code} - {response.text}")
        return None

def filter_page_content(content, page_num):
    """Filter out common exam headers and metadata"""
    print(f"   🧹 Filtering content for page {page_num} (original length: {len(content)})")
    
    # Common patterns to remove from exams
    patterns_to_remove = [
        # Common exam headers and instructions
        r'Math \d+.*?Final Exam.*?',
        r'Name:.*?ID:.*?',
        r'Instructions:.*?(?=Problem|Question|\d+\.|\Z)',
        r'You have.*?minutes.*?to complete',
        r'Show all work.*?credit',
        r'No calculators.*?allowed',
        r'Page \d+ of \d+',
        r'Downloaded by.*?gmail\.com',
        r'Studocu.*?',
        r'Scan to open on Studocu',
        r'Studocu is not sponsored.*?university',
        # More patterns...
    ]
    
    filtered_content = content
    
    for pattern in patterns_to_remove:
        old_len = len(filtered_content)
        filtered_content = re.sub(pattern, '', filtered_content, flags=re.IGNORECASE | re.DOTALL)
        if len(filtered_content) != old_len:
            print(f"   ✂️  Removed pattern: {pattern}")
    
    # Remove excessive whitespace
    filtered_content = re.sub(r'\s+', ' ', filtered_content)
    
    print(f"   ✅ Filtered content length: {len(filtered_content)}")
    return filtered_content.strip()

def test_mit_patterns(content, page_num):
    """Test MIT-specific regex patterns"""
    
    print(f"\n🔍 Testing MIT patterns on page {page_num}")
    print(f"Content preview: {repr(content[:200])}...")
    
    # The MIT pattern from the converter (updated for title case)
    mit_pattern = r'(?:^|\n)\s*(\d+)\s+([A-Z][a-z\s]+(?:[a-z\s]+)*)(?:\n(.+?))?(?=(?:^|\n)\s*\d+\s+[A-Z]|\Z)'
    
    print(f"\n🎯 MIT Pattern: {mit_pattern}")
    
    matches = list(re.finditer(mit_pattern, content, re.DOTALL | re.IGNORECASE | re.MULTILINE))
    
    print(f"📊 Found {len(matches)} matches")
    
    for i, match in enumerate(matches):
        print(f"\n  Match {i+1}:")
        print(f"    Full match: {repr(match.group(0))}")
        print(f"    Group 1 (number): {repr(match.group(1))}")
        print(f"    Group 2 (title): {repr(match.group(2))}")
        if len(match.groups()) >= 3 and match.group(3):
            print(f"    Group 3 (content): {repr(match.group(3)[:100])}...")
        else:
            print(f"    Group 3 (content): None")
    
    return matches

def is_valid_problem_content(content):
    """Check if content represents a valid math problem"""
    
    print(f"   🔍 Validating content: {repr(content[:50])}...")
    
    # Must have minimum length
    if len(content.strip()) < 20:
        print(f"      ❌ Content too short: {len(content.strip())} chars")
        return False
    
    # Must contain math-related content
    math_indicators = [
        r'\b(derivative|integral|limit|function|equation|solve|find|calculate|compute)\b',
        r'[a-zA-Z]\([a-zA-Z]\)',  # f(x), g(y), etc.
        r'[0-9]+\s*[+\-*/]\s*[0-9]+',  # Basic arithmetic
        r'[a-zA-Z]\s*=\s*[a-zA-Z0-9+\-*/()]+',  # Variable assignments
        r'[a-zA-Z]\^[0-9]+',  # x^2, y^3, etc.
        r'\\frac\{.*?\}\{.*?\}',  # LaTeX fractions
        r'\\sqrt\{.*?\}',  # LaTeX square roots
        r'\\int',  # LaTeX integrals
        r'\\lim',  # LaTeX limits
    ]
    
    for pattern in math_indicators:
        if re.search(pattern, content, re.IGNORECASE):
            print(f"      ✅ Found math indicator: {pattern}")
            return True
    
    print(f"      ❌ No math indicators found")
    return False

def main():
    # Load API credentials
    app_id = os.getenv('MATHPIX_APP_ID')
    app_key = os.getenv('MATHPIX_APP_KEY')
    
    if not app_id or not app_key:
        print("❌ Missing Mathpix API credentials in .env file")
        return
    
    # Test pages that should contain problem titles
    test_pages = [
        "/Users/chulhee/src/mathpix/output/mit_debug_with_pages/temp_pages/page_3.png",  # Should have "1 FINGER EXERCISES"
        "/Users/chulhee/src/mathpix/output/mit_debug_with_pages/temp_pages/page_5.png",  # Should have "2 TAYLOR"
        "/Users/chulhee/src/mathpix/output/mit_debug_with_pages/temp_pages/page_7.png",  # Should have "3 APPROXIMATING A SQUARE ROOT"
    ]
    
    for page_path in test_pages:
        if not Path(page_path).exists():
            print(f"❌ Page not found: {page_path}")
            continue
            
        page_num = int(Path(page_path).stem.split('_')[1])
        print(f"\n{'='*60}")
        print(f"🔍 ANALYZING PAGE {page_num}")
        print(f"{'='*60}")
        
        # Step 1: Get raw content from Mathpix
        print(f"📤 Sending page {page_num} to Mathpix API...")
        result = process_single_page_image(page_path, app_id, app_key)
        
        if not result or 'text' not in result:
            print(f"❌ Failed to get content from page {page_num}")
            continue
        
        raw_content = result['text']
        print(f"📄 Raw content length: {len(raw_content)}")
        print(f"📄 Raw content preview:\n{raw_content[:500]}...")
        
        # Step 2: Apply filtering
        print(f"\n🧹 FILTERING CONTENT")
        filtered_content = filter_page_content(raw_content, page_num)
        print(f"📄 Filtered content preview:\n{filtered_content[:500]}...")
        
        # Step 3: Test MIT pattern matching
        print(f"\n🎯 PATTERN MATCHING")
        matches = test_mit_patterns(filtered_content, page_num)
        
        # Step 4: Test content validation for each match
        if matches:
            print(f"\n✅ CONTENT VALIDATION")
            for i, match in enumerate(matches):
                problem_num = int(match.group(1))
                title = match.group(2).strip()
                content = match.group(3).strip() if match.group(3) else ""
                problem_content = f"{title}\n{content}".strip()
                
                print(f"\n  Testing problem {problem_num}:")
                print(f"    Combined content: {repr(problem_content[:100])}...")
                valid = is_valid_problem_content(problem_content)
                print(f"    ✅ Valid: {valid}")
        
        # Small delay to avoid rate limiting
        time.sleep(2)

if __name__ == "__main__":
    main()