#!/usr/bin/env python3
"""
Setup script for Supabase configuration
"""

import os
import sys

def create_env_file():
    """Create a .env file with Supabase configuration"""
    
    print("🔧 Setting up Supabase configuration...")
    print("\nTo get your Supabase credentials:")
    print("1. Go to https://supabase.com")
    print("2. Create a new project or select existing project 'math-problems'")
    print("3. Go to Settings > API")
    print("4. Copy the Project URL and anon/public key")
    print("\n" + "="*50)
    
    # Get Supabase URL
    supabase_url = input("Enter your Supabase Project URL (e.g., https://xyz.supabase.co): ").strip()
    if not supabase_url:
        print("❌ Supabase URL is required!")
        return False
    
    # Get Supabase anon key
    supabase_key = input("Enter your Supabase anon/public key: ").strip()
    if not supabase_key:
        print("❌ Supabase anon key is required!")
        return False
    
    # Create .env file
    env_content = f"""# Supabase Configuration
SUPABASE_URL={supabase_url}
SUPABASE_ANON_KEY={supabase_key}

# Mathpix Configuration (optional - for PDF processing)
MATHPIX_APP_ID=your_app_id_here
MATHPIX_APP_KEY=your_app_key_here
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ Created .env file successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating .env file: {str(e)}")
        return False

def check_supabase_tables():
    """Check if required tables exist in Supabase"""
    print("\n📋 Required Supabase Tables:")
    print("""
You need to create the following tables in your Supabase project:

1. 'documents' table:
   - id (text, primary key)
   - school (text)
   - course (text)
   - problem_type (text)
   - term (text)
   - year (text)
   - total_problems (integer)
   - total_images (integer)
   - created_at (timestamp)
   - updated_at (timestamp)
   - version (text)

2. 'problems' table:
   - id (text, primary key)
   - doc_id (text, foreign key to documents.id)
   - problem_text (text)
   - subproblems (jsonb)
   - correct_answer (text)
   - solution (jsonb)
   - images (text[])
   - difficulty (text)
   - domain (text[])
   - topics (text[])
   - math_approach (text[])
   - reasoning_type (text[])

You can create these tables in the Supabase dashboard under:
Database > Tables > Create new table
""")

def main():
    """Main setup function"""
    print("🚀 Supabase Setup for Math Problems Database")
    print("=" * 50)
    
    # Check if .env already exists
    if os.path.exists('.env'):
        print("⚠️  .env file already exists!")
        overwrite = input("Do you want to overwrite it? (y/N): ").strip().lower()
        if overwrite != 'y':
            print("Setup cancelled.")
            return
    
    # Create .env file
    if create_env_file():
        print("\n✅ Configuration complete!")
        print("\nNext steps:")
        print("1. Create the required tables in Supabase (see below)")
        print("2. Run: python upload_to_supabase.py data/upload/stanford_tournament_competition_april_2024.json")
        
        check_supabase_tables()
    else:
        print("\n❌ Setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 