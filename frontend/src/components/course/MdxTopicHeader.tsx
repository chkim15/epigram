"use client";

import { MathContent } from "@/lib/utils/katex";
import type { CourseTopicJSON } from "@/types/course";

function convertDashes(text: string): string {
  return text
    .replace(/ --- /g, " \u2014 ")
    .replace(/(\w)--(\w)/g, "$1\u2013$2")
    .replace(/\\&/g, "&");
}

interface MdxTopicHeaderProps {
  topicData: CourseTopicJSON;
  hideLearningObjectives?: boolean;
}

export default function MdxTopicHeader({ topicData, hideLearningObjectives }: MdxTopicHeaderProps) {
  return (
    <>
      {/* Topic header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--foreground)" }}
        >
          {convertDashes(topicData.topicName)}
        </h1>
        {topicData.subtopics && (
          <div
            className="mt-1.5 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            <MathContent content={topicData.subtopics} />
          </div>
        )}
        <div
          className="mt-1.5 text-xs"
          style={{ color: "var(--muted-foreground)" }}
        >
          {convertDashes(topicData.timeEstimate)}
        </div>
        <div
          className="mt-1.5 text-xs"
          style={{ color: "var(--muted-foreground)" }}
        >
          {topicData.freeProblems + topicData.premiumProblems} problems
        </div>
        {topicData.prerequisites && (
          <div
            className="mt-1.5 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            Prerequisites: {convertDashes(topicData.prerequisites)}
          </div>
        )}
      </div>

      {/* Learning objectives */}
      {!hideLearningObjectives && topicData.learningObjectives.length > 0 && (
        <div
          className="rounded-lg my-6 border overflow-hidden shadow-sm"
          style={{
            backgroundColor: "#f0f2f6",
            borderColor: "#31364d",
          }}
        >
          <div
            className="px-4 py-2.5 text-sm font-semibold tracking-wide"
            style={{ backgroundColor: "#31364d", color: "white" }}
          >
            By the end of this topic, you will be able to&hellip;
          </div>
          <ol
            className="px-4 py-3 pl-8 space-y-1.5 list-decimal"
            style={{ color: "var(--foreground)" }}
          >
            {topicData.learningObjectives.map((obj, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <MathContent content={obj} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
