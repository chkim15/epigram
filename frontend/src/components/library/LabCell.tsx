"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { resetLabWorker, runLabCode, type LabResult } from "@/components/library/labWorker";

export interface Lab {
  id: string;
  title: string;
  instructions: string;
  starter: string;
}

// Includes the first load of Python, which can take a while on a slow connection.
const RUN_LIMIT_MS = 90000;

export default function LabCell({ lab }: { lab: Lab }) {
  const [code, setCode] = useState(lab.starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LabResult | null>(null);
  const runToken = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = (next: LabResult) => {
    if (timer.current) clearTimeout(timer.current);
    setResult(next);
    setRunning(false);
  };

  const stop = (message: string) => {
    runToken.current += 1;
    resetLabWorker();
    finish({ text: message, charts: [], failed: true });
  };

  const run = async () => {
    const token = ++runToken.current;
    setRunning(true);
    setResult(null);
    timer.current = setTimeout(() => stop("Stopped: this run took too long. Check for an endless loop."), RUN_LIMIT_MS);
    try {
      const next = await runLabCode(code);
      if (token === runToken.current) finish(next);
    } catch (error) {
      if (token === runToken.current) finish({ text: (error as Error).message, charts: [], failed: true });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (!running) run();
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = event.currentTarget;
      const target = event.currentTarget;
      setCode(`${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = selectionStart + 4;
      });
    }
  };

  return (
    <section className="library-lab">
      <h3 className="library-lab-title">{lab.title}</h3>
      <p className="library-lab-instructions">
        {lab.instructions.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}
      </p>
      <textarea
        className="library-lab-editor custom-scrollbar"
        aria-label={`Code for ${lab.title}`}
        value={code}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        rows={Math.min(lab.starter.split("\n").length + 1, 26)}
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={onKeyDown}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
      />
      <div className="flex items-center gap-2 mt-2">
        {running ? (
          <button type="button" onClick={() => stop("Stopped.")} className="library-lab-button cursor-pointer">Stop</button>
        ) : (
          <button type="button" onClick={run} className="library-lab-button library-lab-run cursor-pointer">Run</button>
        )}
        <button
          type="button"
          onClick={() => {
            setCode(lab.starter);
            setResult(null);
          }}
          disabled={running}
          className="library-lab-button cursor-pointer"
        >
          Reset
        </button>
        {running && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Running. The first run also loads Python, which can take up to a minute.</span>}
      </div>
      {result && (
        <div aria-live="polite">
          {result.text && <pre className={`library-output library-lab-output${result.failed ? " library-lab-error" : ""}`}>{result.text}</pre>}
          {result.charts.map((chart, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} className="library-chart" alt={`Chart ${i + 1} from this run`} draggable={false} src={`data:image/png;base64,${chart}`} />
          ))}
        </div>
      )}
    </section>
  );
}
