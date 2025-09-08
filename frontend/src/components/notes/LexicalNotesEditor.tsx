'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { 
  $getSelection, 
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createParagraphNode,
  $getNodeByKey
} from 'lexical';
import { 
  $createHeadingNode, 
  $createQuoteNode,
  HeadingNode,
  QuoteNode 
} from '@lexical/rich-text';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  ListNode,
  ListItemNode
} from '@lexical/list';
import { $createCodeNode, CodeNode } from '@lexical/code';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $setBlocksType } from '@lexical/selection';
import { MathNode, $createMathNode } from './nodes/MathNode';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Code,
  Link,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Minus,
  Plus,
  FunctionSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LexicalNotesEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
}

// Toolbar component
function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const [blockType, setBlockType] = React.useState('paragraph');
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [fontSize, setFontSize] = React.useState(15);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      
      if (elementDOM !== null) {
        const type = element.getType();
        if (type === 'heading') {
          const headingNode = element as HeadingNode;
          setBlockType(headingNode.getTag());
        } else {
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateToolbar]);

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const insertEquation = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const mathNode = $createMathNode('', false);
        selection.insertNodes([mathNode]);
      }
    });
  };

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(10, Math.min(30, fontSize + delta));
    setFontSize(newSize);
    // Note: Font size would need custom implementation in Lexical
    // This is a placeholder for the UI
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-700 flex-wrap">
      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Block Type */}
      <Select
        value={blockType}
        onValueChange={(value) => {
          if (value === 'h1') formatHeading('h1');
          else if (value === 'h2') formatHeading('h2');
          else if (value === 'h3') formatHeading('h3');
          else if (value === 'paragraph') formatParagraph();
        }}
      >
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Normal</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
        </SelectContent>
      </Select>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Font Size */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => changeFontSize(-1)}
          title="Decrease font size"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <div className="w-12 text-center text-sm font-medium">{fontSize}</div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => changeFontSize(1)}
          title="Increase font size"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Text Format */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", isBold && "bg-gray-200 dark:bg-gray-700")}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", isItalic && "bg-gray-200 dark:bg-gray-700")}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", isUnderline && "bg-gray-200 dark:bg-gray-700")}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Equation */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={insertEquation}
        title="Insert Equation"
      >
        <FunctionSquare className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function LexicalNotesEditor({
  initialContent,
  onContentChange,
  placeholder = "Type your notes here...",
}: LexicalNotesEditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialConfig = {
    namespace: 'NotesEditor',
    theme: {
      paragraph: 'mb-2',
      heading: {
        h1: 'text-2xl font-bold mb-4',
        h2: 'text-xl font-semibold mb-3',
        h3: 'text-lg font-medium mb-2',
      },
      list: {
        ul: 'list-disc ml-6 mb-2',
        ol: 'list-decimal ml-6 mb-2',
        listitem: 'mb-1'
      },
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        code: 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-sm',
      },
    },
    nodes: [MathNode, HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    editorState: undefined as any,
  };

  // Load initial content
  useEffect(() => {
    if (initialContent) {
      try {
        // Check if it's JSON (Lexical state) or plain text
        const parsed = JSON.parse(initialContent);
        if (parsed.root) {
          initialConfig.editorState = initialContent;
        }
      } catch {
        // Plain text, convert to Lexical format
        if (initialContent) {
          initialConfig.editorState = JSON.stringify({
            root: {
              children: [{
                children: [{ text: initialContent, type: 'text', format: 0 }],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
              }],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
            }
          });
        }
      }
    }
  }, []);

  const handleChange = useCallback((editorState: any) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      const json = editorState.toJSON();
      onContentChange(JSON.stringify(json));
    }, 1500);
  }, [onContentChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        <Toolbar />
        <div className="flex-1 relative overflow-hidden">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  "h-full w-full px-4 py-3 overflow-y-auto",
                  "focus:outline-none",
                  "prose prose-sm dark:prose-invert max-w-none",
                  "[&_.katex-display]:my-4",
                  "[&_.katex]:text-inherit",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500"
                )}
                placeholder={placeholder}
              />
            }
            ErrorBoundary={() => (
              <div className="text-red-500 p-4">
                An error occurred in the editor
              </div>
            )}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <ListPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}