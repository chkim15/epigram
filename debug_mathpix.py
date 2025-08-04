#!/usr/bin/env python3
"""
Debug script to test Mathpix API directly on page images
to understand what text content is actually being extracted.
"""

import os
import requests
import base64
from dotenv import load_dotenv
import fitz  # PyMuPDF

# Load environment variables
load_dotenv()

MATHPIX_APP_ID = os.getenv('MATHPIX_APP_ID')
MATHPIX_APP_KEY = os.getenv('MATHPIX_APP_KEY')

def convert_pdf_page_to_image(pdf_path, page_num, output_path):
    """Convert a specific PDF page to PNG image."""
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    
    # Convert to image with 2x scaling for better quality
    mat = fitz.Matrix(2, 2)
    pix = page.get_pixmap(matrix=mat)
    pix.save(output_path)
    doc.close()
    print(f"Saved page {page_num + 1} to {output_path}")

def test_mathpix_on_image(image_path):
    """Test Mathpix API directly on an image file."""
    if not MATHPIX_APP_ID or not MATHPIX_APP_KEY:
        print("Error: MATHPIX_APP_ID and MATHPIX_APP_KEY must be set in .env file")
        return None
    
    # Read and encode image
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode()
    
    # Mathpix API request
    headers = {
        'app_id': MATHPIX_APP_ID,
        'app_key': MATHPIX_APP_KEY,
        'Content-type': 'application/json'
    }
    
    data = {
        'src': f'data:image/png;base64,{image_data}',
        'formats': ['text', 'latex_styled'],
        'data_options': {
            'include_asciimath': True,
            'include_latex': True
        }
    }
    
    response = requests.post('https://api.mathpix.com/v3/text', 
                           headers=headers, 
                           json=data)
    
    if response.status_code == 200:
        result = response.json()
        return result
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return None

if __name__ == "__main__":
    pdf_path = "data/test/MIT01_Fall21_PracticeFinal_Sols.pdf"
    
    # Test first few pages to see the structure
    for page_num in range(3):  # Test pages 0, 1, 2
        print(f"\n{'='*60}")
        print(f"TESTING PAGE {page_num + 1}")
        print('='*60)
        
        # Convert PDF page to image
        temp_image = f"temp_page_{page_num + 1}.png"
        convert_pdf_page_to_image(pdf_path, page_num, temp_image)
        
        # Test Mathpix on this image
        result = test_mathpix_on_image(temp_image)
        
        if result:
            print(f"\nRAW MATHPIX RESPONSE:")
            print(f"Confidence: {result.get('confidence', 'N/A')}")
            print(f"Text length: {len(result.get('text', ''))}")
            
            # Show the actual extracted text
            text = result.get('text', '')
            print(f"\nEXTRACTED TEXT:")
            print("-" * 40)
            print(repr(text))  # Use repr to show escape characters
            print("-" * 40)
            print(text)
            
            # Look for problem numbers in the text
            import re
            problem_patterns = [
                r'(?:^|\n)\s*(\d+)\.\s*',
                r'(?:^|\n)\s*Problem\s+(\d+)',
                r'\b(\d+)\s*\.',
                r'Problem\s*(\d+)'
            ]
            
            print(f"\nPROBLEM NUMBER ANALYSIS:")
            for i, pattern in enumerate(problem_patterns):
                matches = re.findall(pattern, text, re.MULTILINE)
                print(f"Pattern {i+1} ({pattern}): {matches}")
        
        # Clean up temp file
        if os.path.exists(temp_image):
            os.remove(temp_image)
        
        print("\n")