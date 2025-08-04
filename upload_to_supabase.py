import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

def upload_to_supabase(json_file_path, project_name="math-problems"):
    """
    Upload math problems data to Supabase
    
    Args:
        json_file_path (str): Path to the JSON file containing the data
        project_name (str): Name of the Supabase project
    """
    
    # Check if Supabase credentials are set
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase credentials not found!")
        print("Please create a .env file with the following variables:")
        print("SUPABASE_URL=your_supabase_project_url")
        print("SUPABASE_ANON_KEY=your_supabase_anon_key")
        return False
    
    try:
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        print(f"✅ Connected to Supabase project: {project_name}")
        
        # Load the JSON data
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"📄 Loaded data from: {json_file_path}")
        print(f"📊 Document ID: {data['doc']['id']}")
        print(f"📝 Total problems: {data['doc']['total_problems']}")
        print(f"🖼️  Total images: {data['doc']['total_images']}")
        
        # Upload document metadata
        print("\n📤 Uploading document metadata...")
        doc_result = supabase.table('documents').upsert({
            'id': data['doc']['id'],
            'school': data['doc']['school'],
            'course': data['doc']['course'],
            'problem_type': data['doc']['problem_type'],
            'term': data['doc']['term'],
            'year': data['doc']['year'],
            'total_problems': data['doc']['total_problems'],
            'total_images': data['doc']['total_images'],
            'created_at': data['doc']['created_at'],
            'updated_at': data['doc']['updated_at'],
            'version': data['doc']['version']
        }).execute()
        
        print("✅ Document metadata uploaded successfully")
        
        # Upload problems
        print("\n📤 Uploading problems...")
        problems_data = []
        for problem in data['problems']:
            problem_data = {
                'id': problem['id'],
                'doc_id': problem['doc_id'],
                'problem_text': problem['problem_text'],
                'subproblems': problem.get('subproblems', {}),
                'correct_answer': problem.get('correct_answer'),
                'solution': problem.get('solution', {}),
                'images': problem.get('images', []),
                'difficulty': problem.get('difficulty'),
                'domain': problem.get('domain', []),
                'topics': problem.get('topics', []),
                'math_approach': problem.get('math_approach', []),
                'reasoning_type': problem.get('reasoning_type', [])
            }
            problems_data.append(problem_data)
        
        # Upload problems in batches to avoid payload size limits
        batch_size = 50
        for i in range(0, len(problems_data), batch_size):
            batch = problems_data[i:i + batch_size]
            print(f"📦 Uploading batch {i//batch_size + 1}/{(len(problems_data) + batch_size - 1)//batch_size}")
            
            problems_result = supabase.table('problems').upsert(batch).execute()
            
            if problems_result.data:
                print(f"✅ Uploaded {len(batch)} problems")
            else:
                print(f"❌ Failed to upload batch {i//batch_size + 1}")
                return False
        
        print(f"\n🎉 Successfully uploaded all data to Supabase!")
        print(f"📊 Document: {data['doc']['id']}")
        print(f"📝 Problems: {len(data['problems'])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error uploading to Supabase: {str(e)}")
        return False

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print("Usage: python upload_to_supabase.py <json_file_path> [project_name]")
        print("Example: python upload_to_supabase.py data/upload/stanford_tournament_competition_april_2024.json")
        return
    
    json_file_path = sys.argv[1]
    project_name = sys.argv[2] if len(sys.argv) > 2 else "math-problems"
    
    if not os.path.exists(json_file_path):
        print(f"❌ Error: File {json_file_path} not found!")
        return
    
    success = upload_to_supabase(json_file_path, project_name)
    
    if success:
        print("\n✅ Upload completed successfully!")
    else:
        print("\n❌ Upload failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 