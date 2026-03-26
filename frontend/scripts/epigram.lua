-- Pandoc Lua filter for Epigram .tex → .mdx conversion
-- Uses fenced divs with data attributes for custom environments.

-- ── Global lookups built from source .tex file ───────────────
-- Maps problem number → { difficulty, problemId }
local problem_meta = {}

-- ── Parse the source .tex to extract difficulty + id info ────
local function parse_source_tex()
  local input_files = PANDOC_STATE.input_files
  if #input_files == 0 then return end
  local path = input_files[1]
  local f = io.open(path, "r")
  if not f then return end
  local src = f:read("*a")
  f:close()

  -- Match each \begin{ENV} line and extract difficulty + id from it
  -- This avoids nested-brace issues by matching \difficultytitle{X} anywhere on the line
  for line in src:gmatch("[^\n]+") do
    -- workedbox: \begin{workedbox}{NUM}{...\difficultytitle{DIFF}}
    local wnum = line:match("\\begin{workedbox}{([^}]+)}")
    if wnum then
      local diff = line:match("\\difficultytitle{(%w+)}")
      problem_meta[wnum] = problem_meta[wnum] or {}
      if diff then problem_meta[wnum].difficulty = diff end
    end

    -- freeproblem: \begin{freeproblem}{NUM}{TIER}{\difficultytitle{DIFF}}{ID}
    local fnum = line:match("\\begin{freeproblem}{([^}]+)}")
    if fnum then
      local diff = line:match("\\difficultytitle{(%w+)}")
      -- ID is the last brace group; extract by finding the pattern after the diff
      -- The LaTeX pattern is {NUM}{tier}{\difficultytitle{diff}}{ID}
      -- Use a reverse search: last {content} on the line
      local id = line:match("}{([^}]+)}%s*$")
      if id then id = id:gsub("\\_", "_") end
      problem_meta[fnum] = {
        difficulty = diff or "",
        problemId = id or "",
      }
    end

    -- premiumproblem: \begin{premiumproblem}{NUM}{TIER}{\difficultytitle{DIFF}}{ID}
    local pnum = line:match("\\begin{premiumproblem}{([^}]+)}")
    if pnum then
      local diff = line:match("\\difficultytitle{(%w+)}")
      local id = line:match("}{([^}]+)}%s*$")
      if id then id = id:gsub("\\_", "_") end
      problem_meta[pnum] = {
        difficulty = diff or "",
        problemId = id or "",
      }
    end

    -- idtable: \idrow{NUM/WNUM}{TITLE}{ID}
    local inum, _, iid = line:match("\\idrow{([^}]+)}{([^}]*)}{([^}]+)}")
    if inum then
      iid = iid:gsub("\\_", "_")
      local norm = inum:match("^W(%d+)$")
      local key = norm or inum
      problem_meta[key] = problem_meta[key] or {}
      if not problem_meta[key].problemId or problem_meta[key].problemId == "" then
        problem_meta[key].problemId = iid
      end
    end
  end
end

-- Run on load
parse_source_tex()

-- ── Custom macro expansion in math ──────────────────────────
local function expand_macros(text)
  text = text:gsub("\\Prob([^%a])", "\\mathbb{P}%1")
  text = text:gsub("\\Prob$", "\\mathbb{P}")
  text = text:gsub("\\E([^%a])", "\\mathbb{E}%1")
  text = text:gsub("\\E$", "\\mathbb{E}")
  text = text:gsub("\\Var([^%a])", "\\text{Var}%1")
  text = text:gsub("\\Var$", "\\text{Var}")
  text = text:gsub("\\Cov([^%a])", "\\text{Cov}%1")
  text = text:gsub("\\Cov$", "\\text{Cov}")
  text = text:gsub("\\Corr([^%a])", "\\text{Corr}%1")
  text = text:gsub("\\Corr$", "\\text{Corr}")
  text = text:gsub("\\indep([^%a])", "\\perp\\!\\!\\!\\perp%1")
  text = text:gsub("\\indep$", "\\perp\\!\\!\\!\\perp")
  text = text:gsub("\\iid([^%a])", "\\text{i.i.d.}%1")
  text = text:gsub("\\iid$", "\\text{i.i.d.}")
  text = text:gsub("\\MSE([^%a])", "\\text{MSE}%1")
  text = text:gsub("\\MSE$", "\\text{MSE}")
  text = text:gsub("\\Bias([^%a])", "\\text{Bias}%1")
  text = text:gsub("\\Bias$", "\\text{Bias}")
  text = text:gsub("\\se([^%a])", "\\text{SE}%1")
  text = text:gsub("\\se$", "\\text{SE}")
  text = text:gsub("\\RSS([^%a])", "\\text{RSS}%1")
  text = text:gsub("\\RSS$", "\\text{RSS}")
  text = text:gsub("\\TSS([^%a])", "\\text{TSS}%1")
  text = text:gsub("\\TSS$", "\\text{TSS}")
  text = text:gsub("\\given([^%a])", "\\mid%1")
  text = text:gsub("\\given$", "\\mid")
  return text
end

function Math(el)
  el.text = expand_macros(el.text)
  return el
end

function RawInline(el)
  if el.format == "tex" or el.format == "latex" then
    el.text = expand_macros(el.text)
  end
  return el
end

function RawBlock(el)
  if el.format == "tex" or el.format == "latex" then
    el.text = expand_macros(el.text)
  end
  return el
end

-- ── Extract leading Span args from a Div ────────────────────
local function extract_span_args(div)
  local args = {}
  if #div.content == 0 or div.content[1].tag ~= "Para" then
    return args
  end

  local para = div.content[1]
  local remove_count = 0

  for i, el in ipairs(para.content) do
    if el.tag == "Span" then
      local text = pandoc.utils.stringify(el)
      if text ~= "" then
        table.insert(args, text)
      end
      remove_count = i
    elseif el.tag == "SoftBreak" or el.tag == "Space" then
      if remove_count > 0 then
        remove_count = i
      end
    else
      break
    end
  end

  for _ = 1, remove_count do
    para.content:remove(1)
  end
  while #para.content > 0 and
    (para.content[1].tag == "Space" or para.content[1].tag == "SoftBreak") do
    para.content:remove(1)
  end
  if #para.content == 0 then
    div.content:remove(1)
  end

  return args
end

-- ── Extract technique summary title from first Strong element ─
local function extract_technique_title(div)
  if #div.content == 0 or div.content[1].tag ~= "Para" then
    return nil
  end
  local para = div.content[1]
  for _, el in ipairs(para.content) do
    if el.tag == "Strong" then
      local title = pandoc.utils.stringify(el)
      if title ~= "" then
        -- Remove the title paragraph
        div.content:remove(1)
        return title
      end
    end
  end
  return nil
end

-- ── Handle custom Div environments ──────────────────────────
function Div(el)
  local classes = el.classes

  -- Box environments
  if classes:includes("conceptbox") or classes:includes("techniquebox")
    or classes:includes("keyresult") or classes:includes("warningbox") then
    local args = extract_span_args(el)
    el.attributes["title"] = args[1] or ""
    return el
  end

  -- workedbox: Pandoc only gives us Span(number), difficulty is lost
  -- Use problem_meta from source .tex parsing
  if classes:includes("workedbox") then
    local args = extract_span_args(el)
    local num = args[1] or ""
    el.attributes["number"] = num
    local meta = problem_meta[num]
    el.attributes["difficulty"] = meta and meta.difficulty or ""
    el.attributes["problemid"] = meta and meta.problemId or ""
    return el
  end

  -- freeproblem / premiumproblem: Pandoc gives Span(number) + Span(id)
  -- but difficulty is lost. Use problem_meta from source .tex parsing
  if classes:includes("freeproblem") or classes:includes("premiumproblem") then
    local args = extract_span_args(el)
    local num = args[1] or ""
    el.attributes["number"] = num
    local meta = problem_meta[num]
    el.attributes["difficulty"] = meta and meta.difficulty or ""
    el.attributes["problemId"] = meta and meta.problemId or ""
    return el
  end

  -- idtable — skip (already parsed from source)
  if classes:includes("idtable") then
    return pandoc.List()
  end

  -- tcolorbox — learning objectives or technique summary
  if classes:includes("tcolorbox") then
    local text = pandoc.utils.stringify(el)
    -- Technique summary: has "Technique Toolkit/Summary" in a Strong element
    if text:match("Technique Toolkit") or text:match("Technique Summary")
      or text:match("Summary of Key") then
      el.classes = {"techniquesummary"}
      local title = extract_technique_title(el)
      if title then
        el.attributes["title"] = title
      end
      return el
    end
    -- Learning objectives: detected by position in Pandoc() — just reclassify here
    -- (the tcolorbox title "By the end..." is consumed by Pandoc, so we detect by
    -- checking if it's the only tcolorbox with an OrderedList before first header)
    -- For now, mark any remaining tcolorbox as-is; Pandoc() will reclassify
  end

  -- center div — skip
  if classes:includes("center") then
    return pandoc.List()
  end

  return el
end

-- ── Remove preamble and Problem Index at top level only ─────
function Pandoc(doc)
  local result = pandoc.List()
  local seen_first_header = false
  local skip_section = false

  for _, block in ipairs(doc.blocks) do
    if block.tag == "Header" then
      local text = pandoc.utils.stringify(block)
      if text == "Problem Index" then
        skip_section = true
        goto continue
      else
        skip_section = false
        if not seen_first_header then
          seen_first_header = true
        end
      end
    end

    if skip_section then
      goto continue
    end

    -- Before first header: preserve tcolorbox (learning objectives), skip other preamble
    if not seen_first_header then
      if block.tag == "Header" then
        seen_first_header = true
        result:insert(block)
      elseif block.tag == "Div" and block.classes:includes("tcolorbox") then
        -- This is the learning objectives tcolorbox (appears before first section)
        block.classes = {"learningobjectives"}
        result:insert(block)
      end
      -- else skip preamble
    else
      result:insert(block)
    end

    ::continue::
  end

  return pandoc.Pandoc(result, doc.meta)
end
