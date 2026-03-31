"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MathContent } from "@/lib/utils/katex";
import { Problem, Subproblem } from "@/types/database";
import { ChevronRight, Sigma, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

interface MathFieldElement extends HTMLElement {
  value?: string;
  getValue?: () => string;
}

interface InterviewProblemDisplayProps {
  problem: Problem;
  subproblems: Subproblem[];
  problemIndex: number;
  isLastProblem: boolean;
  onAnswersChange: (answers: { [key: string]: string }) => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function InterviewProblemDisplay({
  problem,
  subproblems,
  problemIndex,
  isLastProblem,
  onAnswersChange,
  onNext,
  onSubmit,
}: InterviewProblemDisplayProps) {
  const { user } = useAuthStore();
  const answersRef = useRef<{ [key: string]: string }>({});
  const answerContentEditableRefs = useRef<{
    [key: string]: HTMLDivElement | null;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  const saveAndGradeAnswers = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const subs = subproblems;
      for (const [key, answerText] of Object.entries(answersRef.current)) {
        if (!answerText.trim()) continue;

        let subproblemId: string | null = null;
        let correctAnswer: string | null = null;
        let problemText: string | null = null;

        if (key === "main") {
          correctAnswer = problem.correct_answer;
          problemText = problem.problem_text;
        } else {
          const subKey = key.replace("sub_", "");
          const sub = subs.find((s) => s.key === subKey);
          if (sub) {
            subproblemId = sub.id;
            correctAnswer = sub.correct_answer || null;
            problemText = sub.problem_text || null;
          }
        }

        try {
          const { data: insertData } = await supabase
            .from("user_answers")
            .insert({
              user_id: user.id,
              problem_id: problem.id,
              subproblem_id: subproblemId,
              answer_text: answerText.trim(),
              attempt_number: 1,
            })
            .select("id")
            .single();

          if (insertData && correctAnswer) {
            fetch("/api/grade", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userAnswer: answerText.trim(),
                correctAnswer,
                problemText,
              }),
            })
              .then((res) => (res.ok ? res.json() : null))
              .then((result) => {
                if (result) {
                  supabase
                    .from("user_answers")
                    .update({ is_correct: result.isCorrect })
                    .eq("id", insertData.id)
                    .then(() => {});
                }
              })
              .catch(() => {});
          }
        } catch (err) {
          console.error("Error saving answer:", err);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextClick = async () => {
    await saveAndGradeAnswers();
    onNext();
  };

  const handleSubmitClick = async () => {
    await saveAndGradeAnswers();
    onSubmit();
  };

  // Import MathLive when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("mathlive")
        .then(({ MathfieldElement }) => {
          if (!customElements.get("math-field")) {
            try {
              customElements.define("math-field", MathfieldElement);
            } catch (err) {
              console.warn("MathLive already registered:", err);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load MathLive:", err);
        });
    }
  }, []);

  const handleAnswerChange = (key: string, value: string) => {
    answersRef.current = { ...answersRef.current, [key]: value };
    onAnswersChange(answersRef.current);
  };

  const insertMathField = (key: string) => {
    const contentEditable = answerContentEditableRefs.current[key];
    if (!contentEditable) return;

    // Clean up any empty math fields first
    const existingMathFields = contentEditable.querySelectorAll("math-field");
    existingMathFields.forEach((field) => {
      if (!field.getAttribute("value")) {
        field.remove();
      }
    });

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      contentEditable.focus();
      const range = document.createRange();
      range.selectNodeContents(contentEditable);
      range.collapse(false);
      const newSelection = window.getSelection();
      if (newSelection) {
        newSelection.removeAllRanges();
        newSelection.addRange(range);
      }
      return insertMathField(key);
    }

    const range = selection.getRangeAt(0);

    if (!contentEditable.contains(range.commonAncestorContainer)) {
      contentEditable.focus();
      const newRange = document.createRange();
      newRange.selectNodeContents(contentEditable);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return insertMathField(key);
    }

    const mathField = document.createElement("math-field");
    const uniqueId = Date.now();
    mathField.setAttribute("data-index", uniqueId.toString());
    mathField.style.display = "inline-block";
    mathField.style.fontSize = "inherit";
    mathField.setAttribute("value", "");
    mathField.setAttribute("virtual-keyboard-mode", "off");
    mathField.setAttribute("menu", "false");

    range.deleteContents();
    range.insertNode(mathField);

    const spaceAfter = document.createTextNode("\u00A0");
    mathField.parentNode?.insertBefore(spaceAfter, mathField.nextSibling);

    range.setStartAfter(spaceAfter);
    range.setEndAfter(spaceAfter);
    selection.removeAllRanges();
    selection.addRange(range);

    mathField.addEventListener("focus", () => {
      mathField.classList.remove("inactive");
    });

    mathField.addEventListener("blur", (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (
        relatedTarget &&
        (mathField.contains(relatedTarget) ||
          relatedTarget.closest(".ML__popover") ||
          relatedTarget.closest('[role="menu"]'))
      ) {
        return;
      }

      setTimeout(() => {
        const activeElement = document.activeElement;
        const hasMenuOpen = document.querySelector(
          '.ML__popover:not([style*="display: none"])'
        );
        const hasDropdown = document.querySelector(
          '[role="menu"]:not([style*="display: none"])'
        );

        if (
          !mathField.contains(activeElement as Node) &&
          !hasMenuOpen &&
          !hasDropdown
        ) {
          mathField.classList.add("inactive");
          if (!mathField.getAttribute("value")) {
            mathField.remove();
          }
        }
      }, 150);
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const hasMenu =
            document.querySelector(".ML__popover") ||
            document.querySelector('[role="menu"]');
          if (hasMenu) {
            mathField.classList.remove("inactive");
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const mathFieldWithObserver = mathField as HTMLElement & {
      __observer?: MutationObserver;
    };
    mathFieldWithObserver.__observer = observer;

    setTimeout(() => {
      mathField.focus();
    }, 0);

    handleContentEditableChange(key, contentEditable);
  };

  const getContentEditableText = (element: HTMLDivElement): string => {
    let result = "";

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        if (tagName === "math-field") {
          const mathFieldElement = el as MathFieldElement;
          const latex =
            mathFieldElement.value ||
            mathFieldElement.getValue?.() ||
            el.getAttribute("value") ||
            el.textContent ||
            "";
          result += `$$${latex}$$`;
        } else if (tagName === "br") {
          result += "\n";
        } else if (tagName === "div" || tagName === "p") {
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          result += "\n";
        } else {
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
        }
      }
    };

    for (const child of Array.from(element.childNodes)) {
      processNode(child);
    }

    return result.trim();
  };

  const handleContentEditableChange = (
    key: string,
    element: HTMLDivElement
  ) => {
    const text = getContentEditableText(element);
    handleAnswerChange(key, text);
  };

  const renderAnswerInput = (key: string) => (
    <div className="mt-4" data-answer-section={key}>
      <div
        className="flex items-center gap-2 rounded-2xl border px-2"
        style={{
          backgroundColor: "var(--input)",
          borderColor: "var(--border)",
        }}
      >
        <button
          className="h-8 w-10 rounded-xl border cursor-pointer flex items-center justify-center flex-shrink-0"
          aria-label="Insert math equation"
          onClick={() => insertMathField(key)}
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
          }}
        >
          <Sigma
            className="h-5 w-5"
            aria-hidden="true"
            style={{ color: "var(--foreground)" }}
          />
        </button>
        <div
          ref={(el) => {
            answerContentEditableRefs.current[key] = el;
          }}
          contentEditable
          className="flex-1 min-h-[50px] max-h-[150px] overflow-y-auto py-3 px-2 outline-none bg-transparent custom-scrollbar"
          style={{
            color: "var(--foreground)",
            minHeight: "50px",
            maxHeight: "150px",
            outline: "none",
            boxShadow: "none",
            fontSize: "16px",
            lineHeight: "24px",
          }}
          data-placeholder="Type your answer here..."
          onInput={(e) =>
            handleContentEditableChange(key, e.currentTarget)
          }
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          Problem {problemIndex + 1}
        </h2>
        {problem.problem_name && (
          <span
            className="text-sm"
            style={{ color: "var(--foreground)", opacity: 0.6 }}
          >
            <MathContent content={problem.problem_name} />
          </span>
        )}
      </div>

      <div
        className="prose prose-sm max-w-none rounded-xl border p-5"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "var(--border)",
        }}
      >
        <MathContent content={problem.problem_text || ""} />
      </div>

      {/* Main problem answer (only if no subproblems) */}
      {subproblems.length === 0 && renderAnswerInput("main")}

      {/* Subproblems with individual answer inputs */}
      {subproblems.length > 0 && (
        <div className="space-y-6">
          {subproblems.map((sp) => {
            const key = `sub_${sp.key}`;
            return (
              <div key={sp.id}>
                <div
                  className="font-medium text-base mb-2"
                  style={{ color: "var(--foreground)" }}
                >
                  {sp.key}.
                </div>
                <div className="prose prose-sm max-w-none overflow-hidden break-words">
                  <MathContent content={sp.problem_text || ""} />
                </div>
                {renderAnswerInput(key)}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        {isLastProblem ? (
          <Button
            onClick={handleSubmitClick}
            disabled={isSaving}
            className="rounded-xl cursor-pointer px-6"
            style={{ backgroundColor: "#141310", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
          </Button>
        ) : (
          <Button
            onClick={handleNextClick}
            disabled={isSaving}
            className="rounded-xl cursor-pointer px-6"
            style={{ backgroundColor: "#141310", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
