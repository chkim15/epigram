#!/usr/bin/env python3
"""
Script to open the Math Problems Database Editor with the existing problems.json file.
"""

import os
import sys
import shutil
import webbrowser
from pathlib import Path

def main():
    # Get the current directory
    current_dir = Path.cwd()
    
    # Define paths
    problems_json = current_dir / "src" / "output" / "problems.json"
    editor_html = current_dir / "problem_editor.html"
    images_dir = current_dir / "src" / "spring2019_output" / "images"
    
    # Check if problems.json exists
    if not problems_json.exists():
        print(f"Error: problems.json not found at {problems_json}")
        print("Please make sure the file exists in src/output/problems.json")
        sys.exit(1)
    
    # Check if the HTML file exists
    if not editor_html.exists():
        print(f"Error: problem_editor.html not found at {editor_html}")
        sys.exit(1)
    
    # Copy problems.json to the same directory as the HTML file for easy access
    target_json = current_dir / "problems.json"
    try:
        shutil.copy2(problems_json, target_json)
        print(f"✓ Copied {problems_json} to {target_json}")
    except Exception as e:
        print(f"Warning: Could not copy problems.json: {e}")
        print("You can still load the file manually through the interface.")
    
    # Copy images directory if it exists
    target_images_dir = current_dir / "output" / "images"
    if images_dir.exists():
        try:
            # Create target directory if it doesn't exist
            target_images_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy all image files
            for image_file in images_dir.glob("*"):
                if image_file.is_file():
                    target_file = target_images_dir / image_file.name
                    shutil.copy2(image_file, target_file)
            
            print(f"✓ Copied images from {images_dir} to {target_images_dir}")
        except Exception as e:
            print(f"Warning: Could not copy images: {e}")
            print("Problem images may not display correctly.")
    else:
        print(f"Info: Images directory not found at {images_dir}")
        print("Problem images may not display correctly.")
    
    # Open the HTML file in the default browser
    try:
        webbrowser.open(f"file://{editor_html.absolute()}")
        print(f"✓ Opened {editor_html} in your default browser")
        print("\nInstructions:")
        print("1. Click 'Load JSON File' and select 'problems.json' from the current directory")
        print("2. Or if the file was copied successfully, you can load it directly")
        print("3. Edit the problems as needed")
        print("4. Use 'Export JSON' to save your changes")
        print("\nFeatures:")
        print("- Click on problem text to edit LaTeX")
        print("- Click on answer options to edit LaTeX")
        print("- Text answers for non-multiple choice problems")
        print("- Images will display automatically if available")
    except Exception as e:
        print(f"Error opening browser: {e}")
        print(f"Please manually open {editor_html} in your web browser")

if __name__ == "__main__":
    main() 