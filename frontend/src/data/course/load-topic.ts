import type { CourseTopicJSON } from "@/types/course";
import { COURSE_WEEKS } from "./course-structure";

// Static imports for all topic JSON files
// Using dynamic imports would require async, so we import them statically
const topicModules: Record<string, CourseTopicJSON> = {};

// Lazy-load cache
let loaded = false;

function getRequireContext(): Record<string, CourseTopicJSON> {
  if (loaded) return topicModules;

  // Import all JSON files
  for (const week of COURSE_WEEKS) {
    for (const topic of week.topics) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const data = require(`./${topic.fileName}.json`) as CourseTopicJSON;
        topicModules[topic.fileName] = data;
      } catch {
        console.warn(`Could not load topic JSON: ${topic.fileName}`);
      }
    }
  }
  loaded = true;
  return topicModules;
}

export function loadTopicData(fileName: string): CourseTopicJSON | null {
  const modules = getRequireContext();
  return modules[fileName] ?? null;
}
