#!/usr/bin/env python3
"""
Upload topic notes PDFs to Supabase Storage and update database with URLs.

Usage:
    python upload_topic_notes.py --notes-dir /path/to/notes/folder
"""

import os
import sys
import argparse
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Initialize Supabase client."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # Use service role for storage upload
    
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables")
    
    return create_client(url, key)

def upload_pdf_to_storage(client: Client, file_path: Path, storage_path: str) -> Optional[str]:
    """
    Upload a PDF file to Supabase storage.
    
    Args:
        client: Supabase client
        file_path: Local path to PDF file
        storage_path: Path in storage bucket (e.g., 'notes/topics/1_limits_continuity.pdf')
    
    Returns:
        Public URL of uploaded file or None if failed
    """
    try:
        # Read file
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Upload to storage
        # Use existing pdf-notes bucket
        bucket_name = "pdf-notes"
        
        # Upload file
        response = client.storage.from_(bucket_name).upload(
            path=storage_path,
            file=file_data,
            file_options={"content-type": "application/pdf", "upsert": "true"}
        )
        
        # Get public URL
        public_url = client.storage.from_(bucket_name).get_public_url(storage_path)
        
        print(f"✓ Uploaded: {file_path.name} -> {storage_path}")
        return public_url
        
    except Exception as e:
        print(f"✗ Failed to upload {file_path.name}: {e}")
        return None

def update_database_urls(client: Client, topic_files: Dict[int, Dict]) -> None:
    """
    Update topic_notes table with file URLs and metadata.
    
    Args:
        client: Supabase client
        topic_files: Dictionary mapping topic_id to file info
    """
    for topic_id, info in topic_files.items():
        if info.get('url'):
            try:
                # Update the record with URL and file size
                response = client.table('topic_notes').update({
                    'file_url': info['url'],
                    'file_size_bytes': info.get('size', None)
                }).eq('topic_id', topic_id).execute()
                
                print(f"✓ Updated database for topic {topic_id}")
            except Exception as e:
                print(f"✗ Failed to update database for topic {topic_id}: {e}")

def main():
    parser = argparse.ArgumentParser(description='Upload topic notes PDFs to Supabase')
    parser.add_argument('--notes-dir', required=True, help='Directory containing PDF files')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be uploaded without uploading')
    args = parser.parse_args()
    
    notes_dir = Path(args.notes_dir)
    if not notes_dir.exists():
        print(f"Error: Directory {notes_dir} does not exist")
        sys.exit(1)
    
    # Get all PDF files
    pdf_files = sorted(notes_dir.glob('*.pdf'))
    print(f"Found {len(pdf_files)} PDF files")
    
    if args.dry_run:
        print("\nDry run - would upload:")
        for pdf in pdf_files:
            print(f"  {pdf.name}")
        return
    
    # Initialize Supabase client
    try:
        client = get_supabase_client()
        print("Connected to Supabase")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Upload files and collect info
    topic_files = {}
    
    for pdf_path in pdf_files:
        # Extract topic ID from filename (e.g., "1_limits_continuity_and_ivt.pdf" -> 1)
        filename = pdf_path.name
        try:
            topic_id = int(filename.split('_')[0])
        except (ValueError, IndexError):
            print(f"⚠ Skipping {filename} - cannot extract topic ID")
            continue
        
        # Storage path matches what we put in the database
        storage_path = f"topics/{filename}"
        
        # Upload file
        url = upload_pdf_to_storage(client, pdf_path, storage_path)
        
        if url:
            file_size = pdf_path.stat().st_size
            topic_files[topic_id] = {
                'url': url,
                'size': file_size,
                'filename': filename
            }
    
    # Update database with URLs
    print(f"\nUpdating database with {len(topic_files)} file URLs...")
    update_database_urls(client, topic_files)
    
    # Summary
    print(f"\n=== Summary ===")
    print(f"Total files: {len(pdf_files)}")
    print(f"Successfully uploaded: {len(topic_files)}")
    print(f"Failed: {len(pdf_files) - len(topic_files)}")
    
    # Show first few URLs as examples
    print(f"\nExample URLs:")
    for topic_id in sorted(list(topic_files.keys())[:3]):
        info = topic_files[topic_id]
        print(f"  Topic {topic_id}: {info['url']}")

if __name__ == "__main__":
    main()