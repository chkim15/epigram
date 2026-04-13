import fs from "fs";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import "katex/dist/katex.min.css";
import UnifiedHeader from "@/components/layout/UnifiedHeader";
import CourseSidebar from "@/components/course/CourseSidebar";
import CourseContent from "@/components/course/CourseContent";
import { getTopicBySlug } from "@/data/course/course-structure";
import { loadTopicData } from "@/data/course/load-topic";
import { preprocessMdx } from "@/lib/mdx/preprocess";
import {
  ConceptBox,
  TechniqueBox,
  KeyResult,
  WarningBox,
  WorkedBox,
  SolutionBox,
  FreeProblem,
  PremiumProblem,
  TechniqueSummary,
  LearningObjectives,
  GoldBox,
  GrayBox,
} from "@/components/course/mdx-components";
import MdxTopicHeader from "@/components/course/MdxTopicHeader";
import TopicCompleteButton from "@/components/course/TopicCompleteButton";

const mdxComponents = {
  ConceptBox,
  TechniqueBox,
  KeyResult,
  WarningBox,
  WorkedBox,
  SolutionBox,
  FreeProblem,
  PremiumProblem,
  TechniqueSummary,
  LearningObjectives,
  GoldBox,
  GrayBox,
};

export default async function TopicPage({
  params,
}: {
  params: Promise<{ weekId: string; topicId: string }>;
}) {
  const { weekId, topicId } = await params;
  const result = getTopicBySlug(weekId, topicId);

  if (!result) {
    return (
      <div
        className="h-screen flex flex-col"
        style={{ backgroundColor: "var(--background)" }}
      >
        <UnifiedHeader />
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: "var(--muted-foreground)" }}>Topic not found</p>
        </div>
      </div>
    );
  }

  const { topic, week } = result;
  const topicData = loadTopicData(topic.fileName);

  // Try to load MDX file
  let mdxContent: string | null = null;
  try {
    const mdxPath = path.join(
      process.cwd(),
      "src/data/course-mdx",
      `${topic.fileName}.mdx`
    );
    mdxContent = fs.readFileSync(mdxPath, "utf-8");
  } catch {
    // No MDX file available, fall back to JSON
  }

  if (!topicData && !mdxContent) {
    return (
      <div
        className="h-screen flex flex-col"
        style={{ backgroundColor: "var(--background)" }}
      >
        <UnifiedHeader />
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: "var(--muted-foreground)" }}>
            Could not load topic data
          </p>
        </div>
      </div>
    );
  }

  // MDX rendering path
  if (mdxContent) {
    const processedMdx = preprocessMdx(mdxContent);

    return (
      <div
        className="h-screen flex flex-col"
        style={{ backgroundColor: "var(--background)" }}
      >
        <UnifiedHeader />
        <div className="flex-1 flex overflow-hidden">
          <CourseSidebar currentWeekSlug={weekId} currentTopicSlug={topicId} />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* TopicNavBar hidden for now */}
            <div
              className="flex-1 overflow-y-auto custom-scrollbar"
              style={{ backgroundColor: "#ffffff" }}
            >
              <div className="max-w-4xl mx-auto px-8 py-8 text-base leading-relaxed course-mdx-content">
                {topicData && <MdxTopicHeader topicData={topicData} hideLearningObjectives />}

                <div className="mdx-content-body">
                  <MDXRemote
                    source={processedMdx}
                    components={mdxComponents}
                    options={{
                      mdxOptions: {
                        remarkPlugins: [remarkMath, remarkGfm],
                        rehypePlugins: [
                          [
                            rehypeKatex,
                            {
                              macros: { "\\DOLLAR": "\\$" },
                            },
                          ],
                          [
                            rehypePrettyCode,
                            {
                              theme: "github-light",
                              keepBackground: false,
                            },
                          ],
                        ],
                      },
                    }}
                  />
                </div>

                <TopicCompleteButton weekNum={week.weekNum} topicNum={topic.topicNum} />

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // JSON rendering path (fallback)
  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      <UnifiedHeader />
      <div className="flex-1 flex overflow-hidden">
        <CourseSidebar currentWeekSlug={weekId} currentTopicSlug={topicId} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TopicNavBar hidden for now */}
          <CourseContent topicData={topicData!} weekNum={week.weekNum} topicNum={topic.topicNum} />
        </div>
      </div>
    </div>
  );
}
