"use client";

import type { CourseTopicJSON, ContentBlock } from "@/types/course";
import { MathContent } from "@/lib/utils/katex";
import LearningObjectives from "./blocks/LearningObjectives";
import ConceptBox from "./blocks/ConceptBox";
import TechniqueBox from "./blocks/TechniqueBox";
import KeyResultBox from "./blocks/KeyResultBox";
import WarningBox from "./blocks/WarningBox";
import WorkedProblem from "./blocks/WorkedProblem";
import CourseProblem from "./blocks/CourseProblem";
import TechniqueSummary from "./blocks/TechniqueSummary";
import TopicCompleteButton from "./TopicCompleteButton";

interface CourseContentProps {
  topicData: CourseTopicJSON;
  weekNum: number;
  topicNum: number;
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return (
        <div
          className="text-sm leading-relaxed my-3"
          style={{ color: "var(--foreground)" }}
        >
          <MathContent content={block.content} />
        </div>
      );
    case "subsection":
      return (
        <div
          role="heading"
          aria-level={3}
          className="text-base font-semibold mt-6 mb-2"
          style={{ color: "var(--foreground)" }}
        >
          <MathContent content={block.title} />
        </div>
      );
    case "conceptbox":
      return <ConceptBox title={block.title} content={block.content} />;
    case "techniquebox":
      return <TechniqueBox title={block.title} content={block.content} />;
    case "keyresult":
      return <KeyResultBox title={block.title} content={block.content} />;
    case "warningbox":
      return <WarningBox title={block.title} content={block.content} />;
    case "workedproblem":
      return (
        <WorkedProblem
          number={block.number}
          difficulty={block.difficulty}
          content={block.content}
          solution={block.solution}
          problemId={block.problemId}
        />
      );
    case "freeproblem":
    case "premiumproblem":
      return (
        <CourseProblem
          type={block.type}
          number={block.number}
          difficulty={block.difficulty}
          problemId={block.problemId}
          content={block.content}
          solution={block.solution}
        />
      );
    case "techniquesummary":
      return <TechniqueSummary content={block.content} />;
    default:
      return null;
  }
}

export default function CourseContent({ topicData, weekNum, topicNum }: CourseContentProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-3xl mx-auto px-8 py-6">
        {/* Topic header */}
        <div className="mb-6">
          <h1
            className="text-xl font-bold mb-1"
            style={{ color: "var(--foreground)" }}
          >
            {topicData.topicName}
          </h1>
          {topicData.subtopics && (
            <div
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              <MathContent content={topicData.subtopics} />
            </div>
          )}
          <div
            className="flex items-center gap-4 mt-2 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span>{topicData.timeEstimate}</span>
            <span>{topicData.freeProblems + topicData.premiumProblems} problems</span>
            {topicData.prerequisites !== "None" && (
              <span>Prerequisites: {topicData.prerequisites}</span>
            )}
          </div>
        </div>

        {/* Learning objectives */}
        <LearningObjectives objectives={topicData.learningObjectives} />

        {/* Sections */}
        {topicData.sections.map((section, sIdx) => (
          <div key={sIdx}>
            <div
              role="heading"
              aria-level={2}
              className="text-lg font-semibold mt-8 mb-3"
              style={{ color: "var(--foreground)" }}
            >
              <MathContent content={section.title} />
            </div>
            {section.blocks.map((block, bIdx) => (
              <BlockRenderer key={`${sIdx}-${bIdx}`} block={block} />
            ))}
          </div>
        ))}

        <TopicCompleteButton weekNum={weekNum} topicNum={topicNum} />
      </div>
    </div>
  );
}
