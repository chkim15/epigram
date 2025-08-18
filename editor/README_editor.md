# Math Problems Database Editor

A comprehensive web interface for editing and managing math problems database. This tool allows you to review, edit, and enhance your math problems with features like typo checking, correct answer assignment, solution writing, difficulty classification, and topic tagging.

## Features

### 📝 **Editable Fields**
- **Problem Text**: Edit the main problem statement
- **Answer Options**: Modify multiple choice options (A, B, C, D, E, F, G, H)
- **Correct Answer**: Select the correct answer from available options
- **Solution**: Write detailed solution steps
- **Difficulty Level**: Assign Easy, Medium, or Hard difficulty
- **Topics**: Add/remove multiple topic tags for categorization (many-to-many)
- **Mathematical Approach**: Select multiple approaches (Algebraic, Geometric, etc.)
- **Type of Reasoning**: Select multiple reasoning types (Computational, Proof-based, etc.)
- **Exclude/Include**: Mark problems as excluded without deleting them

### 🔒 **Protected Fields**
- **Problem ID**: Read-only (cannot be modified)
- **Images**: Read-only (cannot be modified)

### 📊 **Progress Tracking**
- Visual indicators for complete vs incomplete problems
- Real-time statistics showing total, completed, and incomplete problems
- Automatic status updates as you edit

### 💾 **Data Management**
- Load JSON files from your computer
- Export edited data as JSON
- Save progress to browser storage
- Automatic backup and recovery

## Quick Start

### Option 1: Using the Python Script (Recommended)
```bash
python open_editor.py
```

This will:
1. Copy your `problems.json` file to the current directory
2. Open the web interface in your default browser
3. Provide instructions for loading the file

### Option 2: Manual Setup
1. Open `problem_editor.html` in your web browser
2. Click "Load JSON File" and select your `problems.json` file
3. Start editing!

## How to Use

### 1. **Loading Data**
- Click "📁 Load JSON File" button
- Select your JSON file (should have the structure like your `problems.json`)
- The interface will load all problems and display them in the sidebar

### 2. **Navigating Problems**
- Click on any problem in the left sidebar to select it
- The problem details will appear in the main editing panel
- Use the status indicators to see which problems are complete/incomplete

### 3. **Editing Problems**

#### Problem Text
- Click in the "Problem Text" textarea
- Edit the mathematical expressions and text as needed
- Changes are saved automatically

#### Answer Options
- Each answer option (A, B, C, D, E, F, G, H) can be edited
- Click in the text field next to each option to modify
- Use the radio buttons to select the correct answer

#### Correct Answer
- Use the dropdown menu to select the correct answer
- Or use the radio buttons in the answer options section

#### Solution
- Write detailed solution steps in the "Solution" textarea
- Include mathematical work, explanations, and final answer

#### Difficulty Level
- Click "Easy", "Medium", or "Hard" buttons
- The selected difficulty will be highlighted

#### Topics
- Type a topic in the input field and press Enter (or click "Add")
- Click on topic tags to remove them
- Topics help categorize problems for better organization

### 4. **Saving and Exporting**

#### Save Progress
- Click "💾 Save Progress" to save current work to browser storage
- This provides a backup in case you close the browser

#### Export Data
- Click "💾 Export JSON" to download the edited data
- The file will be named `problems_edited.json`
- This contains all your modifications

## Data Structure

The interface expects JSON files with this structure:
```json
{
  "metadata": {
    "total_problems": 15,
    "total_images": 2,
    "processed_at": "2025-07-31 15:20:38",
    "pages_processed": 7
  },
  "problems": [
    {
      "id": "math103_final_fall2014_p1",
      "problem_text": "The problem statement...",
      "answer_options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D",
        "E": "Option E",
        "F": "Option F",
        "G": "Option G",
        "H": "Option H"
      },
      "correct_answer": "A",
      "solution": "Detailed solution steps...",
      "images": ["image1.png"],
      "difficulty": "medium",
      "topics": ["derivatives", "implicit_differentiation"]
    }
  ]
}
```

## Problem Completion Criteria

A problem is considered "complete" when it has:
- ✅ Problem text
- ✅ Correct answer selected
- ✅ Solution written
- ✅ Difficulty level assigned
- ✅ At least one topic tag

## Tips for Efficient Editing

1. **Use the sidebar**: Quickly navigate between problems using the sidebar
2. **Check status indicators**: Green checkmarks show complete problems, yellow warnings show incomplete ones
3. **Save frequently**: Use "Save Progress" to avoid losing work
4. **Export regularly**: Download your changes periodically
5. **Use topics consistently**: Create a standard set of topics for better organization

## Browser Compatibility

The interface works best in modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### File won't load
- Make sure your JSON file has the correct structure
- Check that the file is valid JSON (no syntax errors)

### Changes not saving
- Use "Save Progress" to save to browser storage
- Use "Export JSON" to download the file
- Check browser console for any error messages

### Interface not working
- Try refreshing the page
- Clear browser cache and try again
- Check that JavaScript is enabled

## File Locations

- **Interface**: `problem_editor.html`
- **Launcher script**: `open_editor.py`
- **Your data**: `src/output/problems.json`
- **Exported data**: `problems_edited.json` (after export)

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Ensure your JSON file has the correct structure
3. Try loading the file manually through the interface
4. Make sure all required fields are filled for complete problems 