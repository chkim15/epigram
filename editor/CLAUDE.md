# Editor Tools — CLAUDE.md

## Local Editor (`problem_editor.html`)

Self-contained HTML file with MathJax for LaTeX rendering. Uses localStorage for persistence.

```bash
python editor/open_editor.py          # Quick launch
# Or open editor/problem_editor.html directly in browser
```

## Database Editor (`problem_editor_database.html`)

Supabase-connected editor with real-time database sync. Hosted via GitHub Pages at chkim15.github.io.

```bash
# Open editor/problem_editor_database.html in browser (requires Supabase setup)
```

## Supporting Files

- `topics.json` — topic reference data used by editors
- `README_editor.md` — comprehensive user guide
