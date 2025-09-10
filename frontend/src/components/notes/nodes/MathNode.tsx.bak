import {
  $applyNodeReplacement,
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  LexicalNode,
  LexicalEditor,
} from 'lexical';
import { MathContent } from '@/lib/utils/katex';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type SerializedMathNode = Spread<
  {
    latex: string;
    displayMode: boolean;
    type: 'math';
    version: 1;
  },
  SerializedLexicalNode
>;

export class MathNode extends DecoratorNode<JSX.Element> {
  __latex: string;
  __displayMode: boolean;

  static getType(): string {
    return 'math';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__latex, node.__displayMode, node.__key);
  }

  constructor(latex: string, displayMode = false, key?: NodeKey) {
    super(key);
    this.__latex = latex;
    this.__displayMode = displayMode;
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    const { latex, displayMode } = serializedNode;
    const node = $createMathNode(latex, displayMode);
    return node;
  }

  exportJSON(): SerializedMathNode {
    return {
      latex: this.getLatex(),
      displayMode: this.__displayMode,
      type: 'math',
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = this.__displayMode ? 'block my-2' : 'inline-block';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getLatex(): string {
    return this.__latex;
  }

  setLatex(latex: string): void {
    const writable = this.getWritable();
    writable.__latex = latex;
  }

  isDisplayMode(): boolean {
    return this.__displayMode;
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <MathNodeComponent
        latex={this.__latex}
        displayMode={this.__displayMode}
        nodeKey={this.__key}
        editor={editor}
      />
    );
  }
}

export function $createMathNode(latex: string, displayMode = false): MathNode {
  return $applyNodeReplacement(new MathNode(latex, displayMode));
}

export function $isMathNode(
  node: LexicalNode | null | undefined
): node is MathNode {
  return node instanceof MathNode;
}

// Component for rendering the math node
function MathNodeComponent({
  latex,
  displayMode,
  nodeKey,
  editor,
}: {
  latex: string;
  displayMode: boolean;
  nodeKey: NodeKey;
  editor: LexicalEditor;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLatex, setEditedLatex] = useState(latex);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedLatex(latex);
  }, [latex]);

  const handleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editedLatex !== latex) {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey) as MathNode;
        if (node) {
          node.setLatex(editedLatex);
        }
      });
    }
  }, [editedLatex, latex, nodeKey, editor]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditedLatex(latex);
      setIsEditing(false);
    }
  }, [latex, handleBlur]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editedLatex}
        onChange={(e) => setEditedLatex(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-block px-2 py-1 rounded",
          "bg-gray-100 dark:bg-gray-800",
          "border border-gray-300 dark:border-gray-600",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          "font-mono text-sm",
          displayMode && "w-full my-2"
        )}
        placeholder="Enter LaTeX..."
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={cn(
        "cursor-pointer rounded px-1",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "transition-colors",
        displayMode ? "block my-2 text-center" : "inline-block"
      )}
    >
      <MathContent content={`$${displayMode ? '$' : ''}${latex}$${displayMode ? '$' : ''}`} />
    </span>
  );
}