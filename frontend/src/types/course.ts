// Course content types — parsed from .tex files

export interface CourseTopicJSON {
  weekNum: number;
  topicNum: number;
  topicName: string;
  subtopics: string;
  freeProblems: number;
  premiumProblems: number;
  timeEstimate: string;
  prerequisites: string;
  learningObjectives: string[];
  sections: CourseSection[];
  problemIndex: ProblemIndexEntry[];
}

export interface CourseSection {
  title: string;
  blocks: ContentBlock[];
}

export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "subsection"; title: string }
  | { type: "conceptbox"; title: string; content: string }
  | { type: "techniquebox"; title: string; content: string }
  | { type: "keyresult"; title: string; content: string }
  | { type: "warningbox"; title: string; content: string }
  | {
      type: "workedproblem";
      number: string;
      difficulty: string;
      tier: "free" | "premium";
      content: string;
      solution: string;
      problemId?: string;
    }
  | {
      type: "freeproblem";
      number: string;
      difficulty: string;
      problemId: string;
      content: string;
      solution: string;
    }
  | {
      type: "premiumproblem";
      number: string;
      difficulty: string;
      problemId: string;
      content: string;
      solution: string;
    }
  | { type: "techniquesummary"; content: string };

export interface ProblemIndexEntry {
  number: string;
  name: string;
  problemId: string;
}

// Course structure types

export interface CourseWeek {
  weekNum: number;
  title: string;
  slug: string;
  topics: CourseTopic[];
}

export interface CourseTopic {
  topicNum: number;
  title: string;
  slug: string;
  fileName: string;
}
