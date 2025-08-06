#!/usr/bin/env python3
"""
Convenience script to run the PDF converter from the project root.
This script wraps the backend converter with proper path handling.
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend" / "src"
sys.path.insert(0, str(backend_path))

# Import and run the converter
from converter.pdf_converter import main

if __name__ == "__main__":
    main()