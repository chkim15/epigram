#!/usr/bin/env python3
"""
Script to open the Math Problems Database Editor.
"""

import os
import sys
import webbrowser
from pathlib import Path

def main():
    # Get the current directory
    current_dir = Path.cwd()
    
    # Define path to HTML editor
    editor_html = current_dir / "problem_editor.html"
    
    # Check if the HTML file exists
    if not editor_html.exists():
        print(f"Error: problem_editor.html not found at {editor_html}")
        sys.exit(1)
    
    # Open the HTML file in the default browser
    try:
        webbrowser.open(f"file://{editor_html.absolute()}")
        print(f"✓ Opened {editor_html} in your default browser")
        print("\nInstructions:")
        print("1. Click 'Load JSON File' to upload your JSON file from anywhere on your computer")
        print("2. Edit the problems as needed using the interface")
        print("3. Use 'Export JSON' to save your changes")
        print("\nFeatures:")
        print("- Upload any JSON file with the correct problem structure")
        print("- Click on problem text to edit LaTeX")
        print("- Click on answer options to edit LaTeX")
        print("- Sub-problems support with expandable sections")
        print("- Enhanced difficulty levels including 'Very Hard'")
        print("- Domain classification and mathematical approach tracking")
        print("- Type of reasoning categorization")
        print("- Images will display automatically if available")
    except Exception as e:
        print(f"Error opening browser: {e}")
        print(f"Please manually open {editor_html} in your web browser")

if __name__ == "__main__":
    main() 