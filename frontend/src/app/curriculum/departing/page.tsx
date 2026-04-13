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

export default async function DepartingPage() {
  const mdxPath = path.join(
    process.cwd(),
    "src/data/course-mdx",
    "Epigram_Departing.mdx"
  );
  const mdxContent = fs.readFileSync(mdxPath, "utf-8");
  const processedMdx = preprocessMdx(mdxContent);

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      <UnifiedHeader />
      <div className="flex-1 flex overflow-hidden">
        <CourseSidebar
          currentWeekSlug=""
          currentTopicSlug=""
          standaloneSlug="departing"
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="flex-1 overflow-y-auto custom-scrollbar"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="max-w-4xl mx-auto px-8 py-8 text-base leading-relaxed course-mdx-content">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
