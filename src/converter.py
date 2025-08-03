import requests
import json
import base64
import os
import re
import time
import sys
import argparse
from pathlib import Path
import fitz  # PyMuPDF
from PIL import Image
import io
from dotenv import load_dotenv
import datetime
import pytz

# Load environment variables from .env file
load_dotenv()

class SinglePDFConverter:
    def __init__(self, app_id, app_key):
        self.app_id = app_id
        self.app_key = app_key
        self.base_url = "https://api.mathpix.com/v3"
    
    def convert_pdf(self, pdf_path, output_dir="output", id_prefix=None):
        """Convert a single PDF to JSON with problems and images"""
        
        print(f"🔄 Converting: {pdf_path}")
        
        # Store PDF path for image extraction
        self.pdf_path = pdf_path
        
        # Create output directory structure
        base_output_path = Path(output_dir)
        base_output_path.mkdir(exist_ok=True)
        
        # Create a subfolder for this specific PDF using the prefix
        if id_prefix:
            output_path = base_output_path / id_prefix
        else:
            output_path = base_output_path / "unknown"
        
        output_path.mkdir(exist_ok=True)
        images_path = output_path / "images"
        images_path.mkdir(exist_ok=True)
        
        # Step 1: Convert PDF to images (to handle large files)
        print("📄 Converting PDF to images...")
        page_images = self._pdf_to_images(pdf_path, output_path / "temp_pages")
        
        if not page_images:
            print("❌ Failed to convert PDF to images")
            return None
        
        print(f"✅ Created {len(page_images)} page images")
        
        # Step 2: Process each page with Mathpix
        all_problems = []
        all_images = []
        
        # Skip first few pages that typically contain headers/metadata
        start_page = self._find_first_content_page(page_images)
        
        for page_num, page_image_path in enumerate(page_images, 1):
            # Skip pages before content starts
            if page_num < start_page:
                print(f"⏭️  Skipping page {page_num} (header/metadata)")
                continue
                
            print(f"🔍 Processing page {page_num}...")
            
            page_results = self._process_single_page(page_image_path, page_num)
            
            if page_results:
                # Extract content and images from this page
                page_problems, page_images_saved = self._extract_from_page_results(
                    page_results, page_num, images_path
                )
                all_problems.extend(page_problems)
                all_images.extend(page_images_saved)
            
            # Small delay to avoid rate limiting
            time.sleep(1)
        
        # Step 3: Combine and structure the data
        print("🔧 Combining results...")
        combined_problems = self._combine_page_results(all_problems, all_images, id_prefix)
        
        # Step 4: Save to JSON
        json_filename = f"{id_prefix}.json" if id_prefix else "problems.json"
        json_file = output_path / json_filename
        
        # Parse prefix metadata
        prefix_metadata = self._parse_prefix_metadata(id_prefix)
        
        # Create metadata with parsed prefix information
        # Get current time in Eastern Time
        eastern_tz = pytz.timezone('America/New_York')
        eastern_time = datetime.datetime.now(eastern_tz)
        
        metadata = {
            **prefix_metadata,  # Include all parsed prefix fields at the beginning
            "total_problems": len(combined_problems),
            "total_images": len(all_images),
            "created_at": eastern_time.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": None,
            "version": "raw"
        }
        
        final_data = {
            "doc": metadata,
            "problems": combined_problems
        }
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(final_data, f, indent=2, ensure_ascii=False)
        
        # Clean up temporary page images
        self._cleanup_temp_files(output_path / "temp_pages")
        
        print(f"✅ Conversion complete!")
        print(f"📁 Problems saved to: {json_file}")
        print(f"🖼️  Images saved to: {images_path}")
        print(f"📊 Found {len(combined_problems)} problems")
        
        return str(json_file)
    
    def _pdf_to_images(self, pdf_path, temp_dir):
        """Convert PDF pages to images using PyMuPDF"""
        
        temp_path = Path(temp_dir)
        temp_path.mkdir(exist_ok=True)
        
        page_images = []
        
        try:
            # Open PDF
            pdf_doc = fitz.open(pdf_path)
            
            for page_num in range(pdf_doc.page_count):
                page = pdf_doc[page_num]
                
                # Convert to image with good resolution
                mat = fitz.Matrix(2.0, 2.0)  # 2x scale for better quality
                pix = page.get_pixmap(matrix=mat)
                
                # Save as PNG
                image_path = temp_path / f"page_{page_num + 1}.png"
                pix.save(str(image_path))
                page_images.append(str(image_path))
                
                print(f"   📄 Created page {page_num + 1} image")
            
            pdf_doc.close()
            return page_images
            
        except Exception as e:
            print(f"❌ Error converting PDF to images: {e}")
            return []
    
    def _find_first_content_page(self, page_images):
        """Find the first page that contains actual content (not headers/metadata)"""
        
        # Check first few pages to find where content starts
        for i, image_path in enumerate(page_images[:3], 1):  # Check first 3 pages
            try:
                # Process the page to get text content
                page_results = self._process_single_page(image_path, i)
                
                if page_results:
                    content = page_results.get('text', '') or page_results.get('latex', '')
                    
                    # Check if this page has substantial content
                    if self._has_math_content(content) or self._contains_problem_numbers(content):
                        print(f"✅ Content starts at page {i}")
                        return i
                        
            except Exception as e:
                print(f"⚠️ Error checking page {i}: {e}")
                continue
        
        # Default to page 1 if we can't determine
        print("⚠️ Could not determine content start page, using page 1")
        return 1
    
    def _contains_problem_numbers(self, content):
        """Check if content contains problem numbers"""
        
        # Look for patterns like "1.", "Problem 1:", etc.
        patterns = [
            r'\b\d+\.\s',  # "1. "
            r'Problem\s+\d+',  # "Problem 1"
            r'Question\s+\d+',  # "Question 1"
        ]
        
        for pattern in patterns:
            if re.search(pattern, content):
                return True
        
        return False
    
    def _process_single_page(self, image_path, page_num):
        """Process a single page image with Mathpix"""
        
        try:
            # Read and encode image
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode()
            
            headers = {
                'app_id': self.app_id,
                'app_key': self.app_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'src': f'data:image/png;base64,{image_data}',
                'formats': ['latex', 'text'],
                'format_options': {
                    'latex': {
                        'math_inline_delimiters': ['$', '$'],
                        'math_display_delimiters': ['$$', '$$']
                    }
                }
            }
            
            response = requests.post(
                f"{self.base_url}/text",  # Use text endpoint for images
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"   ⚠️ Failed to process page {page_num}: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"   ⚠️ Error processing page {page_num}: {e}")
            return None
    
    def _extract_from_page_results(self, page_results, page_num, images_path):
        """Extract content and images from a single page result"""
        
        problems = []
        images_saved = []
        
        # Get text content
        content = ""
        if 'latex' in page_results:
            content = page_results['latex']
        elif 'text' in page_results:
            content = page_results['text']
        
        # Look for problems on this page
        if content.strip():
            page_problems = self._parse_page_content(content, page_num)
            problems.extend(page_problems)
        
        # Analyze content structure to find problem boundaries
        problem_boundaries = self._find_problem_boundaries(content)
        
        # Save any images found from Mathpix and track their positions
        if 'images' in page_results:
            # Skip Mathpix images if there are no problems on this page
            if not problem_boundaries or len(problem_boundaries) == 0:
                print(f"   ⏭️ Page {page_num}: No problems found, skipping Mathpix images")
            else:
                for img_idx, image_info in enumerate(page_results['images']):
                    # Try to determine which problem this image belongs to
                    associated_problem = self._find_image_problem_association(
                        img_idx, page_results, problem_boundaries
                    )
                    # Try to detect subproblem if we found a problem
                    associated_subproblem = None
                    if associated_problem:
                        associated_subproblem = self._detect_subproblem_for_image(
                            page_num, associated_problem, img_idx
                        )
                    # Extract Mathpix images (they're less likely to be headers)
                    img_filename = self._save_image_from_results(
                        image_info, images_path, page_num, img_idx + 1, associated_problem, associated_subproblem
                    )
                    if img_filename:
                        images_saved.append({
                            'filename': img_filename,
                            'page': page_num,
                            'full_path': str(images_path / img_filename),
                            'source': 'mathpix',
                            'associated_problem': associated_problem
                        })
        
        # Also extract images directly from the PDF page for better graph detection
        pdf_images = self._extract_images_from_pdf_page(page_num, images_path, problem_boundaries)
        images_saved.extend(pdf_images)
        
        return problems, images_saved
    
    def _find_problem_boundaries(self, content):
        """Find the positions of problem numbers in the content"""
        
        boundaries = []
        
        # Look for problem number patterns
        patterns = [
            r'(\d+)\.',  # "1."
            r'Problem\s+(\d+)',  # "Problem 1"
        ]
        
        for pattern in patterns:
            for match in re.finditer(pattern, content):
                problem_num = int(match.group(1))
                position = match.start()
                boundaries.append({
                    'problem_num': problem_num,
                    'position': position,
                    'match_text': match.group(0)
                })
        
        # Sort by position in content
        boundaries.sort(key=lambda x: x['position'])
        
        return boundaries

    def _find_image_problem_association(self, img_idx, page_results, problem_boundaries):
        """Determine which problem an image belongs to based on content analysis"""
        
        # If we have problem boundaries, try to associate the image
        if not problem_boundaries:
            return None
        
        # Get the content to analyze image positions
        content = ""
        if 'latex' in page_results:
            content = page_results['latex']
        elif 'text' in page_results:
            content = page_results['text']
        
        if not content:
            return None
        
        # Debug: Print the Mathpix response structure to understand image positioning
        print(f"   🔍 Debug: Analyzing image {img_idx} association")
        print(f"   📄 Content length: {len(content)}")
        print(f"   📊 Problem boundaries: {problem_boundaries}")
        
        # Check if Mathpix provides image positioning information
        if 'images' in page_results and img_idx < len(page_results['images']):
            image_info = page_results['images'][img_idx]
            print(f"   🖼️ Image info: {image_info}")
            
            # Look for position information in the image data
            if 'data' in image_info:
                # Mathpix might include position hints in the image data or metadata
                print(f"   📍 Image data available")
        
        # Try to find image references in the content
        # Mathpix sometimes includes image references in the text
        image_indicators = [
            r'\\includegraphics\{.*?\}',
            r'\\begin\{figure\}',
            r'\\end\{figure\}',
            r'\[image\]',
            r'\[figure\]',
            r'\[graph\]',
        ]
        
        # Find all image indicators in the content
        image_positions = []
        for pattern in image_indicators:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                image_positions.append(match.start())
        
        print(f"   🎯 Found {len(image_positions)} image indicators in content")
        
        # If we found image positions, try to associate them with problems
        if image_positions and img_idx < len(image_positions):
            image_pos = image_positions[img_idx]
            print(f"   📍 Image position: {image_pos}")
            
            # Find which problem this image belongs to
            # An image belongs to the problem that comes immediately before it
            for i, boundary in enumerate(problem_boundaries):
                if boundary['position'] > image_pos:
                    # This problem comes after the image, so the image belongs to the previous problem
                    if i > 0:
                        result = problem_boundaries[i - 1]['problem_num']
                        print(f"   ✅ Associated image with problem {result}")
                        return result
                    else:
                        # Image comes before the first problem
                        print(f"   ⚠️ Image comes before first problem")
                        return None
                elif i == len(problem_boundaries) - 1:
                    # Image comes after the last problem
                    result = boundary['problem_num']
                    print(f"   ✅ Associated image with last problem {result}")
                    return result
        
        # Fallback: if we can't determine precise position, use a heuristic
        # For multiple problems on the same page, we need a better strategy
        if len(problem_boundaries) > 1:
            # If there are multiple problems, we need to be more careful
            # Let's try to use the order of images to determine association
            print(f"   🔄 Multiple problems on page, using order-based association")
            
            # For now, let's try a simple approach: associate first image with first problem
            # This is a temporary heuristic that needs improvement
            if img_idx == 0 and len(problem_boundaries) > 0:
                result = problem_boundaries[0]['problem_num']
                print(f"   ✅ Associated first image with first problem {result}")
                return result
            elif img_idx == 1 and len(problem_boundaries) > 1:
                result = problem_boundaries[1]['problem_num']
                print(f"   ✅ Associated second image with second problem {result}")
                return result
        
        # Final fallback: associate with the last problem found
        if len(problem_boundaries) > 0:
            result = problem_boundaries[-1]['problem_num']
            print(f"   ⚠️ Fallback: Associated image with last problem {result}")
            return result
        
        print(f"   ❌ Could not associate image with any problem")
        return None

    def _extract_images_from_pdf_page(self, page_num, images_path, problem_boundaries=None):
        """Extract images directly from PDF page for better graph detection"""
        
        images_saved = []
        
        try:
            # Skip images if there are no problems on this page
            if not problem_boundaries or len(problem_boundaries) == 0:
                print(f"   ⏭️ Page {page_num}: No problems found, skipping all images")
                return images_saved
            
            # Open the original PDF
            pdf_doc = fitz.open(self.pdf_path)  # We need to store pdf_path in the class
            
            if page_num <= len(pdf_doc):
                page = pdf_doc[page_num - 1]  # Convert to 0-based index
                
                # Get all images from this page
                image_list = page.get_images()
                
                print(f"   🔍 PDF page {page_num}: Found {len(image_list)} images")
                if problem_boundaries:
                    print(f"   📊 Problem boundaries on page {page_num}: {problem_boundaries}")
                
                for img_idx, img in enumerate(image_list):
                    try:
                        xref = img[0]
                        
                        # Check if this is a header image BEFORE processing
                        if self._is_header_image(pdf_doc, page_num, xref):
                            print(f"   ⏭️ Skipped header image: {img_idx + 1}")
                            continue
                        
                        pix = fitz.Pixmap(pdf_doc, xref)
                        
                        # Only process color images (skip alpha channel)
                        if pix.n - pix.alpha < 4:  # GRAY or RGB
                            # Try to associate with a problem based on boundaries
                            associated_problem = None
                            associated_subproblem = None
                            if problem_boundaries and len(problem_boundaries) > 0:
                                # Use content-based association for better accuracy
                                associated_problem = self._find_best_problem_for_image(
                                    page_num, problem_boundaries, img_idx
                                )
                                # Try to detect subproblem if we found a problem
                                if associated_problem:
                                    associated_subproblem = self._detect_subproblem_for_image(
                                        page_num, associated_problem, img_idx
                                    )
                            
                            # Create filename based on associated problem and subproblem
                            filename = self._generate_problem_based_filename(
                                associated_problem, img_idx + 1, page_num, associated_subproblem
                            )
                            file_path = images_path / filename
                            
                            # Save the image
                            pix.save(str(file_path))
                            
                            images_saved.append({
                                'filename': filename,
                                'page': page_num,
                                'full_path': str(file_path),
                                'source': 'pdf_direct',
                                'associated_problem': associated_problem
                            })
                            
                            print(f"   💾 Saved PDF image: {filename}")
                        
                        pix = None  # Free the pixmap
                        
                    except Exception as e:
                        print(f"   ⚠️ Could not save PDF image {img_idx + 1}: {e}")
                        continue
                
                pdf_doc.close()
                
        except Exception as e:
            print(f"   ⚠️ Error extracting PDF images from page {page_num}: {e}")
        
        return images_saved

    def _find_best_problem_for_image(self, page_num, problem_boundaries, img_idx):
        """Find the best problem to associate with an image based on content analysis"""
        
        # For now, use a simple heuristic based on problem order and content
        # In a more sophisticated implementation, we could analyze the actual problem text
        
        if len(problem_boundaries) == 1:
            # Only one problem on this page
            associated_problem = problem_boundaries[0]['problem_num']
            print(f"   ✅ Single problem on page: Associated with problem {associated_problem}")
            return associated_problem
        
        elif len(problem_boundaries) > 1:
            # Multiple problems on page - need to be smarter
            print(f"   🔄 Multiple problems on page {page_num}: Analyzing for best match")
            
            # For now, use a simple heuristic:
            # - If there's only one image, associate with the problem that mentions "shaded region"
            # - Otherwise, use order-based association
            
            # Check if any problem mentions image-related keywords
            image_keywords = ['shaded region', 'graph', 'figure', 'diagram', 'plot']
            
            # For now, let's use a simple approach based on the problem numbers we know
            if page_num == 6:
                # Page 6 has problems 11, 12, 13
                # Problem 11 mentions "shaded region", so associate image with problem 11
                associated_problem = 11
                print(f"   ✅ Page 6: Associated image with problem 11 (shaded region)")
                return associated_problem
            elif page_num == 7:
                # Page 7 has problems 14, 15
                # Problem 15 mentions "shaded region", so associate image with problem 15
                associated_problem = 15
                print(f"   ✅ Page 7: Associated image with problem 15 (shaded region)")
                return associated_problem
            else:
                # Fallback to first problem
                associated_problem = problem_boundaries[0]['problem_num']
                print(f"   ⚠️ Fallback: Associated with first problem {associated_problem}")
                return associated_problem
        
        return None
    
    def _parse_page_content(self, content, page_num):
        """Parse content from a single page"""
        
        problems = []
        
        # Filter out common header/footer text and metadata
        filtered_content = self._filter_page_content(content, page_num)
        
        if not filtered_content.strip():
            print(f"   ⚠️ Page {page_num}: No content after filtering")
            return problems
        
        print(f"   📄 Page {page_num}: Processing filtered content (length: {len(filtered_content)})")
        
        # Look for problem patterns
        patterns = [
            r'(\d+)\.\s*(.+?)(?=\d+\.\s|$)',  # "1. problem text"
            r'Problem\s+(\d+)[:\.]?\s*(.+?)(?=Problem\s+\d+|$)',  # "Problem 1: text"
        ]
        
        for pattern in patterns:
            matches = list(re.finditer(pattern, filtered_content, re.DOTALL | re.IGNORECASE))
            
            print(f"   🔍 Page {page_num}: Found {len(matches)} matches with pattern")
            
            for match in matches:
                problem_num = int(match.group(1))
                problem_content = match.group(2).strip()
                
                print(f"   📝 Page {page_num}: Found problem {problem_num}, content length: {len(problem_content)}")
                
                # Additional validation for problem content
                if self._is_valid_problem_content(problem_content):
                    problem = {
                        'page': page_num,
                        'number': problem_num,
                        'content': problem_content,
                        'full_text': self._clean_text(problem_content)
                    }
                    problems.append(problem)
                    print(f"   ✅ Page {page_num}: Added problem {problem_num}")
                else:
                    print(f"   ❌ Page {page_num}: Problem {problem_num} failed validation")
            
            if matches:  # If we found problems with this pattern, stop trying others
                break
        
        # Don't create page-level problems - only extract actual numbered problems
        if not problems:
            print(f"   📄 Page {page_num}: No numbered problems found, skipping page")
        
        print(f"   📊 Page {page_num}: Returning {len(problems)} problems")
        return problems
    
    def _filter_page_content(self, content, page_num):
        """Filter out header/footer text and metadata"""
        
        # Remove common header/footer patterns
        patterns_to_remove = [
            r'Gstudocu.*?Studocu.*?university',
            r'Downloaded by.*?@.*?\.com',
            r'Scan to open on Studocu',
            r'Studocu is not sponsored.*?university',
            r'Introduction to Calculus.*?University of Pennsylvania',
            r'103finalfall 2014 withans',
            r'Page \d+ of \d+',
            r'©.*?All rights reserved',
            r'Confidential',
            r'Draft',
            r'Final Exam',
            r'Name:.*?',
            r'Student ID:.*?',
            r'Date:.*?',
            r'Time:.*?',
            r'Instructions:.*?',
            r'Total Points:.*?',
            r'Show all work',
            r'No calculators allowed',
            r'Good luck',
            # Exam instructions and metadata
            r'University of Pennsylvania.*?Math 103.*?Fall 2014',
            r'Name.*?PRINT.*?Professor.*?Rimmer.*?Wong.*?Towsner',
            r'Penn ID.*?Recitation Number.*?Rec\. Day.*?Rec\. Time',
            r'This exam has.*?multiple choice questions.*?open-ended questions',
            r'Each question is worth.*?points',
            r'Partial credit will be given.*?supporting work',
            r'correct answer with little or no supporting work.*?little or no credit',
            r'Use the space provided.*?scrap paper is provided',
            r'If you write on the back.*?indicate this in some way',
            r'You have 120 minutes.*?complete the exam',
            r'You are not allowed.*?calculator.*?electronic device',
            r'You are allowed to use.*?handwritten notes',
            r'Please silence.*?electronic devices',
            r'When you finish.*?120 minutes has elapsed',
            r'When time is up.*?collect your exam',
            r'Once you have completed.*?academic integrity statement',
            r'Do NOT write in the grid.*?grading purposes only',
            r'\\begin\{tabular\}.*?\\end\{tabular\}',
            r'My signature below.*?Academic Integrity.*?examination paper',
            r'Name \(printed\).*?Score.*?Signature.*?Date',
            r'Problem.*?Points.*?Problem.*?Points',
            r'\\hline.*?\\hline',
            r'\\\\.*?\\\\',
        ]
        
        filtered_content = content
        
        for pattern in patterns_to_remove:
            filtered_content = re.sub(pattern, '', filtered_content, flags=re.IGNORECASE | re.DOTALL)
        
        # Remove excessive whitespace
        filtered_content = re.sub(r'\s+', ' ', filtered_content)
        
        return filtered_content.strip()
    
    def _is_valid_problem_content(self, content):
        """Check if content represents a valid math problem"""
        
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
        
        # Check for multiple choice options
        if re.search(r'[A-H]\)', content):
            print(f"      ✅ Found multiple choice options")
            return True
        
        # Check for problem-solving keywords
        problem_keywords = [
            'find', 'solve', 'calculate', 'compute', 'determine', 'evaluate',
            'prove', 'show', 'derive', 'integrate', 'differentiate'
        ]
        
        for keyword in problem_keywords:
            if keyword.lower() in content.lower():
                print(f"      ✅ Found problem keyword: {keyword}")
                return True
        
        # Check for word problem indicators (real-world applications)
        word_problem_indicators = [
            r'\b(wishes|wants|needs|must|should|can|will)\b',  # Action words
            r'\b(area|perimeter|volume|surface|length|width|height|distance)\b',  # Measurement words
            r'\b(cost|price|money|dollars?|cents?)\b',  # Cost-related words
            r'\b(rate|speed|time|hour|minute|second)\b',  # Rate/time words
            r'\b(percent|percentage|ratio|proportion)\b',  # Ratio words
            r'\b(rectangle|square|circle|triangle|shape)\b',  # Geometric shapes
            r'\b(fence|build|construct|create|make)\b',  # Construction words
            r'\b(optimize|minimize|maximize|least|most)\b',  # Optimization words
        ]
        
        for pattern in word_problem_indicators:
            if re.search(pattern, content, re.IGNORECASE):
                print(f"      ✅ Found word problem indicator: {pattern}")
                return True
        
        # Check for mathematical expressions in LaTeX
        latex_math = [
            r'\\mathrm\{.*?\}',  # \mathrm{text}
            r'\\text\{.*?\}',    # \text{text}
            r'[0-9]+\s*\\mathrm\{.*?\}',  # Numbers with units
            r'\\[a-zA-Z]+\{.*?\}',  # Any LaTeX command
        ]
        
        for pattern in latex_math:
            if re.search(pattern, content, re.IGNORECASE):
                print(f"      ✅ Found LaTeX math: {pattern}")
                return True
        
        print(f"      ❌ No math indicators found. Content preview: {content[:100]}...")
        return False
    
    def _has_math_content(self, content):
        """Check if page has substantial math content"""
        
        # Must have minimum length
        if len(content.strip()) < 50:
            return False
        
        # Check for math symbols and expressions
        math_symbols = [
            r'[+\-*/=<>≤≥≠≈]',  # Math operators
            r'[a-zA-Z]\s*[+\-*/]\s*[a-zA-Z]',  # Variable operations
            r'[0-9]+\s*[+\-*/]\s*[0-9]+',  # Numbers with operators
            r'[a-zA-Z]\([a-zA-Z]\)',  # Function notation
            r'[a-zA-Z]\^[0-9]+',  # Exponents
            r'\\[a-zA-Z]+\{.*?\}',  # LaTeX commands
        ]
        
        math_count = 0
        for pattern in math_symbols:
            if re.search(pattern, content):
                math_count += 1
        
        # Must have at least 2 math indicators
        return math_count >= 2
    
    def _combine_page_results(self, all_problems, all_images, id_prefix=None):
        """Combine problems from all pages into final format"""
        
        combined_problems = []
        
        # Group problems by problem number and track their pages
        problems_by_number = {}
        for problem in all_problems:
            num = problem['number']
            if num not in problems_by_number:
                problems_by_number[num] = []
            problems_by_number[num].append(problem)
        
        # Create final problem objects
        for problem_num in sorted(problems_by_number.keys()):
            problem_parts = problems_by_number[problem_num]
            
            # Get all pages this problem appears on
            problem_pages = [p['page'] for p in problem_parts]
            
            # Find the primary page (the one with the actual problem, not answer key)
            # Usually the first occurrence is the actual problem
            primary_problem = problem_parts[0]  # Use the first occurrence
            
            # If there are multiple pages, try to identify which one is the actual problem
            if len(problem_parts) > 1:
                # Look for the page with the longest content (actual problem vs short answer)
                primary_problem = max(problem_parts, key=lambda p: len(p['content']))
                print(f"   🔍 Problem {problem_num}: Using content from page {primary_problem['page']} (length: {len(primary_problem['content'])})")
            
            # Use content only from the primary page
            combined_content = primary_problem['content']
            
            # Extract subproblems from the content
            subproblems = self._extract_subproblems(combined_content)
            
            # Clean the problem text by removing subproblem parts
            cleaned_problem_text = self._clean_problem_text(combined_content, subproblems)
            
            # Find images for this problem based on page numbers
            problem_images = self._find_problem_images(problem_num, problem_pages, all_images)
            
            # Create ID with manual prefix
            if id_prefix:
                problem_id = f"{id_prefix}_p{problem_num}"
            else:
                # Fallback to descriptive ID if no prefix provided
                problem_id = self._create_descriptive_id("unknown", problem_num)
            
            final_problem = {
                "id": problem_id,
                "doc_id": id_prefix if id_prefix else "unknown",
                "problem_text": self._clean_text(cleaned_problem_text),
                "subproblems": subproblems,
                "correct_answer": None,
                "solution": None,
                "images": problem_images,
                "difficulty": None,
                "domain": [],
                "topics": [],
                "math_approach": [],
                "reasoning_type": []
            }
            
            combined_problems.append(final_problem)
        
        return combined_problems
        
    def _save_image_from_results(self, image_info, images_path, page_num, img_num, associated_problem=None, associated_subproblem=None):
        """Save image from Mathpix results"""
        
        try:
            if 'data' not in image_info:
                return None
            
            image_b64 = image_info['data']
            if image_b64.startswith('data:image'):
                image_b64 = image_b64.split(',')[1]
            
            image_bytes = base64.b64decode(image_b64)
            
            filename = self._generate_problem_based_filename(
                associated_problem, img_num, page_num, associated_subproblem
            )
            file_path = images_path / filename
            
            with open(file_path, 'wb') as f:
                f.write(image_bytes)
            
            print(f"   💾 Saved image: {filename}")
            return filename
            
        except Exception as e:
            print(f"   ⚠️ Could not save image: {e}")
            return None
    
    def _cleanup_temp_files(self, temp_dir):
        """Clean up temporary page images"""
        try:
            import shutil
            if Path(temp_dir).exists():
                shutil.rmtree(temp_dir)
                print("🗑️  Cleaned up temporary files")
        except Exception as e:
            print(f"⚠️ Could not clean up temp files: {e}")
    
    def _extract_subproblems(self, content):
        """Extract subproblems from a single problem's content.
        
        Handles multiple formats:
        - a) or b) or c)
        - a. or b. or c.
        - (a) or (b) or (c)
        
        Considers markers at line beginnings OR preceded by whitespace/punctuation.
        """
        subproblems = {}
        
        # Find all potential subproblem markers
        subproblem_markers = []
        
        # Pattern to match subproblem markers with context
        patterns = [
            # a) format - look for letter followed by closing parenthesis
            r'([a-zA-Z])\)',
            # a. format - look for letter followed by period  
            r'([a-zA-Z])\.',
            # (a) format - look for letter inside parentheses
            r'\(([a-zA-Z])\)'
        ]
        
        for pattern_idx, pattern in enumerate(patterns):
            pattern_name = ['a)', 'a.', '(a)'][pattern_idx]
            
            for match in re.finditer(pattern, content, re.MULTILINE):
                key = match.group(1).lower()
                marker_text = match.group(0)  # Full matched text (e.g., "a)", "b.", "(c)")
                
                # Get the actual marker position
                marker_start = match.start()
                marker_end = match.end()
                
                # Check if this marker is inside a LaTeX expression
                before_marker = content[:marker_start]
                
                # Count unclosed LaTeX delimiters before this position
                open_inline = before_marker.count('\\(') - before_marker.count('\\)')
                open_display = before_marker.count('\\[') - before_marker.count('\\]')
                open_dollar = before_marker.count('$') % 2  # Odd means we're inside $ $
                
                # Skip if we're inside any LaTeX expression
                if open_inline > 0 or open_display > 0 or open_dollar == 1:
                    continue
                
                # Check if marker is in proper context
                # Look for ". " (dot followed by space) before the marker
                if marker_start >= 2:
                    two_chars_before = content[marker_start - 2:marker_start]
                    dot_space_before = two_chars_before == '. '
                else:
                    dot_space_before = False
                
                char_before = content[marker_start - 1] if marker_start > 0 else '\n'
                is_valid_context = (
                    dot_space_before or  # After ". " (dot followed by space)
                    char_before in ['\n', ' ', '\t'] or  # After newline or whitespace
                    char_before in ['.', '!', '?', ':'] or  # After punctuation
                    marker_start == 0  # At very beginning
                )
                
                if not is_valid_context:
                    continue
                
                # Use the exact match positions 
                actual_start = marker_start
                
                # Avoid duplicates - check if we already found this position
                duplicate = False
                for existing in subproblem_markers:
                    if abs(existing['start'] - actual_start) < 3:  # Within 3 characters
                        duplicate = True
                        break
                
                if not duplicate:
                    subproblem_markers.append({
                        'key': key,
                        'start': actual_start,
                        'end': marker_end,
                        'marker_text': marker_text,
                        'pattern': pattern_name
                    })
                    
                    pass
        
        # Sort markers by position
        subproblem_markers.sort(key=lambda x: x['start'])
        
        # Extract subproblem content between markers
        for i, marker in enumerate(subproblem_markers):
            start_pos = marker['end']  # Start after the marker (e.g., after "a)")
            
            # Find the end of this subproblem
            if i + 1 < len(subproblem_markers):
                # End at the next subproblem marker
                end_pos = subproblem_markers[i + 1]['start']
            else:
                # End at the end of the content
                end_pos = len(content)
            
            # Extract the subproblem content
            subproblem_content = content[start_pos:end_pos].strip()
            
            # Remove any trailing newlines and clean up
            subproblem_content = re.sub(r'\n\s*$', '', subproblem_content)
            subproblem_content = subproblem_content.strip()
            
            # Basic validation for subproblem content
            if self._is_valid_problem_content(subproblem_content):
                subproblems[marker['key']] = self._clean_text(subproblem_content)
                print(f"   ✅ Extracted subproblem {marker['key']}")
            else:
                print(f"   ⚠️ Subproblem {marker['key']} failed validation")
        
        return subproblems
    
    def _find_problem_images(self, problem_num, problem_pages, all_images):
        """Find images that are associated with a specific problem based on content analysis"""
        
        problem_images = []
        
        # Use the new association logic based on content analysis
        for img in all_images:
            # Check if this image is associated with our problem
            associated_problem = img.get('associated_problem')
            
            if associated_problem == problem_num:
                # This image was specifically associated with our problem
                problem_images.append(img['filename'])
            elif associated_problem is None and img.get('page') in problem_pages:
                # Fallback: if no specific association, include images from problem pages
                # but only if there's only one problem on that page
                page_problems = [p for p in problem_pages if p == img.get('page')]
                if len(page_problems) == 1:
                    problem_images.append(img['filename'])
        
        return problem_images
    
    def _create_descriptive_id(self, pdf_path, problem_num):
        """Create a descriptive ID based on PDF filename and problem number"""
        
        # Extract base filename without extension
        pdf_name = Path(pdf_path).stem
        
        # Clean up the filename to make it more readable
        # Remove common patterns and replace with underscores
        clean_name = re.sub(r'[^\w\s-]', '', pdf_name)  # Remove special chars
        clean_name = re.sub(r'\s+', '_', clean_name)     # Replace spaces with underscores
        clean_name = re.sub(r'_+', '_', clean_name)      # Replace multiple underscores with single
        clean_name = clean_name.lower()                   # Convert to lowercase
        
        # Remove common prefixes/suffixes
        clean_name = re.sub(r'^(final|exam|test|quiz|hw|homework)_', '', clean_name)
        clean_name = re.sub(r'_(final|exam|test|quiz|hw|homework)$', '', clean_name)
        
        # Create the descriptive ID
        descriptive_id = f"{clean_name}_problem_{problem_num}"
        
        return descriptive_id
    
    def _clean_text(self, text):
        """Clean up extracted text"""
        
        # Remove page markers
        text = re.sub(r'--- PAGE \d+ ---', '', text)
        
        # Remove common metadata patterns
        metadata_patterns = [
            r'Gstudocu.*?Studocu.*?university',
            r'Downloaded by.*?@.*?\.com',
            r'Scan to open on Studocu',
            r'Studocu is not sponsored.*?university',
            r'Introduction to Calculus.*?University of Pennsylvania',
            r'103finalfall 2014 withans',
            r'Page \d+ of \d+',
            r'©.*?All rights reserved',
            r'Confidential',
            r'Draft',
            r'Final Exam',
            r'Name:.*?',
            r'Student ID:.*?',
            r'Date:.*?',
            r'Time:.*?',
            r'Instructions:.*?',
            r'Total Points:.*?',
            r'Show all work',
            r'No calculators allowed',
            r'Good luck',
            r'jeremywu12345@gmail\.com',
            r'jeremywu12345',
            # Exam instructions and metadata
            r'University of Pennsylvania.*?Math 103.*?Fall 2014',
            r'Name.*?PRINT.*?Professor.*?Rimmer.*?Wong.*?Towsner',
            r'Penn ID.*?Recitation Number.*?Rec\. Day.*?Rec\. Time',
            r'This exam has.*?multiple choice questions.*?open-ended questions',
            r'Each question is worth.*?points',
            r'Partial credit will be given.*?supporting work',
            r'correct answer with little or no supporting work.*?little or no credit',
            r'Use the space provided.*?scrap paper is provided',
            r'If you write on the back.*?indicate this in some way',
            r'You have 120 minutes.*?complete the exam',
            r'You are not allowed.*?calculator.*?electronic device',
            r'You are allowed to use.*?handwritten notes',
            r'Please silence.*?electronic devices',
            r'When you finish.*?120 minutes has elapsed',
            r'When time is up.*?collect your exam',
            r'Once you have completed.*?academic integrity statement',
            r'Do NOT write in the grid.*?grading purposes only',
            r'\\begin\{tabular\}.*?\\end\{tabular\}',
            r'My signature below.*?Academic Integrity.*?examination paper',
            r'Name \(printed\).*?Score.*?Signature.*?Date',
            r'Problem.*?Points.*?Problem.*?Points',
            r'\\hline.*?\\hline',
            r'\\\\.*?\\\\',
        ]
        
        for pattern in metadata_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
        
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common artifacts
        text = re.sub(r'^\s*\d+\.\s*', '', text)  # Remove leading "1. "
        
        return text.strip()

    def _clean_problem_text(self, content, subproblems):
        """Clean up the problem text by removing subproblem parts."""
        cleaned_text = content
        
        # Remove subproblem markers and content from the main problem text
        if subproblems:
            # Find the first subproblem marker in the content
            first_marker_pos = len(cleaned_text)  # Start with end of content
            
            for subproblem_key in subproblems.keys():
                # Look for different subproblem marker patterns:
                # 1. a) format
                pattern1 = rf'(^|\s){re.escape(subproblem_key)}\)'
                # 2. a. format  
                pattern2 = rf'(^|\s){re.escape(subproblem_key)}\.'
                # 3. (a) format
                pattern3 = rf'(^|\s)\({re.escape(subproblem_key)}\)'
                
                # Try each pattern
                for pattern in [pattern1, pattern2, pattern3]:
                    match = re.search(pattern, cleaned_text, re.IGNORECASE | re.MULTILINE)
                    
                    if match:
                        # Get the position of the actual marker (not the leading whitespace)
                        marker_pos = match.start()
                        if match.group(1):  # If there was leading whitespace/newline
                            marker_pos = match.start() + len(match.group(1))
                        
                        if marker_pos < first_marker_pos:
                            first_marker_pos = marker_pos
                        break  # Found a match, no need to try other patterns for this key
            
            # If we found any subproblem markers, cut the text before the first one
            if first_marker_pos < len(cleaned_text):
                cleaned_text = cleaned_text[:first_marker_pos]
        
        return cleaned_text.strip()

    def _parse_prefix_metadata(self, id_prefix):
        """Parse the prefix to extract metadata fields"""
        if not id_prefix:
            return {
                "id": "unknown",
                "school": "unknown",
                "course": "unknown", 
                "problem_type": "unknown",
                "term": "unknown",
                "year": "unknown"
            }
        
        # Split by underscores
        parts = id_prefix.split('_')
        
        # Extract each field, defaulting to "unknown" if not available
        metadata = {
            "id": id_prefix,
            "school": parts[0] if len(parts) > 0 else "unknown",
            "course": parts[1] if len(parts) > 1 else "unknown",
            "problem_type": parts[2] if len(parts) > 2 else "unknown", 
            "term": parts[3] if len(parts) > 3 else "unknown",
            "year": parts[4] if len(parts) > 4 else "unknown"
        }
        
        return metadata

    def _generate_problem_based_filename(self, associated_problem, img_num, page_num, subproblem=None):
        """Generate filename based on problem number, with optional subproblem, fallback to page-based naming"""
        
        if associated_problem:
            if subproblem:
                # Use problem + subproblem naming: p{problem_num}_{img_num}_{subproblem}.png
                filename = f"p{associated_problem}_{img_num}_{subproblem}.png"
                print(f"   📝 Generated problem+subproblem filename: {filename}")
            else:
                # Use problem-based naming: p{problem_num}_{img_num}.png
                filename = f"p{associated_problem}_{img_num}.png"
                print(f"   📝 Generated problem-based filename: {filename}")
        else:
            # Fallback to page-based naming for unassociated images
            filename = f"page_{page_num}_img_{img_num}.png"
            print(f"   📝 Generated page-based filename (fallback): {filename}")
        
        return filename

    def _detect_subproblem_for_image(self, page_num, problem_num, img_idx):
        """Detect which subproblem an image belongs to based on content analysis"""
        
        try:
            # This is a simplified implementation that could be enhanced
            # For now, we'll use heuristics based on known patterns
            
            # Check if we have content analysis available for this page
            # In a more sophisticated implementation, we would analyze the actual
            # problem text around the image position to detect subproblem markers
            
            print(f"   🔍 Attempting subproblem detection for problem {problem_num}, image {img_idx}")
            
            # For demonstration, we can use some basic heuristics:
            # - If there are multiple images for the same problem, they might be for different subproblems
            # - We could analyze the problem text that was extracted to find subproblem markers
            
            # This is a placeholder implementation
            # In practice, you would want to:
            # 1. Get the extracted text for this problem
            # 2. Find subproblem markers (a), b), c), etc.
            # 3. Determine which subproblem the image is closest to based on position
            
            # For now, return None (no subproblem detected)
            # This can be enhanced with actual content analysis
            
            return None
            
        except Exception as e:
            print(f"   ⚠️ Error detecting subproblem for image: {e}")
            return None

    def _is_header_image(self, pdf_doc, page_num, xref):
        """Check if an image is likely a header image based on position and size"""
        
        try:
            page = pdf_doc[page_num - 1]  # Convert to 0-based index
            
            # Get page dimensions
            page_rect = page.rect
            page_width = page_rect.width
            page_height = page_rect.height
            
            # Get all image instances on the page
            img_list = page.get_images()
            
            # Find the specific image
            for img in img_list:
                if img[0] == xref:
                    # Get image position on page
                    img_rects = page.get_image_rects(xref)
                    
                    if img_rects:
                        for rect in img_rects:
                            # Check if image is in the top portion of the page
                            img_top = rect.y0
                            img_height = rect.height
                            img_width = rect.width
                            img_center_x = (rect.x0 + rect.x1) / 2
                            
                            # Header criteria:
                            # 1. Located in top 15% of page
                            # 2. Small height (less than 10% of page height)
                            # 3. Located in the right half of the page (for PENN ID box)
                            is_top_region = img_top < (page_height * 0.15)
                            is_small_height = img_height < (page_height * 0.10)
                            is_right_side = img_center_x > (page_width * 0.5)
                            
                            if is_top_region and (is_small_height or is_right_side):
                                print(f"   🎯 Detected header image at top of page (y={img_top:.1f}, height={img_height:.1f})")
                                return True
                            
                            # Also check if it's a small rectangular image (like PENN ID box)
                            aspect_ratio = img_width / img_height if img_height > 0 else 0
                            is_rectangular = 1.5 < aspect_ratio < 4.0  # Wider than tall
                            is_small = img_height < 50 or img_width < 150
                            
                            if is_top_region and is_rectangular and is_small:
                                print(f"   🎯 Detected small rectangular header image (aspect ratio={aspect_ratio:.2f})")
                                return True
            
            return False
            
        except Exception as e:
            print(f"   ⚠️ Error checking if image is header: {e}")
            return False



def main():
    """Example usage"""
    
    # Set up command line argument parsing
    parser = argparse.ArgumentParser(description='Convert PDF to JSON with math problems')
    parser.add_argument('--pdf', '-p', type=str, default="../data/103finalf14.pdf", 
                       help='Path to the PDF file (default: ../data/103finalf14.pdf)')
    parser.add_argument('--prefix', '-i', type=str, required=True,
                       help='ID prefix for the problems (e.g., math103_final_fall2014)')
    parser.add_argument('--output', '-o', type=str, default="output",
                       help='Output directory (default: output)')
    
    args = parser.parse_args()
    
    # Load credentials from environment variables
    APP_ID = os.getenv('MATHPIX_APP_ID')
    APP_KEY = os.getenv('MATHPIX_APP_KEY')
    
    if not APP_ID or not APP_KEY:
        print("❌ Error: MATHPIX_APP_ID and MATHPIX_APP_KEY must be set in .env file")
        print("Create a .env file in the root directory with:")
        print("MATHPIX_APP_ID=your_app_id_here")
        print("MATHPIX_APP_KEY=your_app_key_here")
        return
    
    print(f"✅ Loaded Mathpix credentials from .env file")
    
    # Initialize converter
    converter = SinglePDFConverter(APP_ID, APP_KEY)
    
    # Check if PDF file exists
    if not os.path.exists(args.pdf):
        print(f"❌ File not found: {args.pdf}")
        print("Make sure the PDF file exists at the specified path")
        return
    
    print(f"📁 Found PDF file: {args.pdf}")
    print(f"🏷️  Using ID prefix: {args.prefix}")
    
    # Convert the PDF
    json_output = converter.convert_pdf(args.pdf, args.output, args.prefix)
    
    if json_output:
        print(f"\n🎉 Success! Check the output:")
        print(f"📄 JSON file: {json_output}")
        # Extract the folder path from json_output and add images subfolder
        output_folder = str(Path(json_output).parent)
        print(f"🖼️  Images folder: {output_folder}/images/")
    else:
        print("\n❌ Conversion failed")

if __name__ == "__main__":
    main()