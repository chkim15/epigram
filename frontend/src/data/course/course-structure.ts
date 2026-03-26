import type { CourseWeek } from "@/types/course";

export const COURSE_WEEKS: CourseWeek[] = [
  {
    weekNum: 1,
    title: "Probability",
    slug: "week-1",
    topics: [
      {
        topicNum: 1,
        title: "Foundations of Probability Modeling",
        slug: "topic-1",
        fileName: "Epigram_W1_T1_Foundations",
      },
      {
        topicNum: 2,
        title: "Conditional Probability",
        slug: "topic-2",
        fileName: "Epigram_W1_T2_ConditionalProbability",
      },
      {
        topicNum: 3,
        title: "Distributions",
        slug: "topic-3",
        fileName: "Epigram_W1_T3_Distributions",
      },
      {
        topicNum: 4,
        title: "Gaussian Distribution",
        slug: "topic-4",
        fileName: "Epigram_W1_T4_Gaussian",
      },
      {
        topicNum: 5,
        title: "Expectation & Variance",
        slug: "topic-5",
        fileName: "Epigram_W1_T5_ExpectationVariance",
      },
      {
        topicNum: 6,
        title: "Covariance & Correlation",
        slug: "topic-6",
        fileName: "Epigram_W1_T6_CovarianceCorrelation",
      },
      {
        topicNum: 7,
        title: "Miscellaneous Topics",
        slug: "topic-7",
        fileName: "Epigram_W1_T7_MiscTopics",
      },
    ],
  },
  {
    weekNum: 2,
    title: "Stochastic Processes",
    slug: "week-2",
    topics: [
      {
        topicNum: 8,
        title: "Markov Chains",
        slug: "topic-8",
        fileName: "Epigram_W2_T8_MarkovChains",
      },
      {
        topicNum: 9,
        title: "Martingales & Random Walks",
        slug: "topic-9",
        fileName: "Epigram_W2_T9_MartingalesRandomWalks",
      },
      {
        topicNum: 10,
        title: "Dynamic Programming",
        slug: "topic-10",
        fileName: "Epigram_W2_T10_DynamicProgramming",
      },
      {
        topicNum: 11,
        title: "Coding: Dynamic Programming I",
        slug: "topic-11",
        fileName: "Epigram_W2_T11_CodingDP1",
      },
      {
        topicNum: 12,
        title: "Coding: Dynamic Programming II",
        slug: "topic-12",
        fileName: "Epigram_W2_T12_CodingDP2",
      },
      {
        topicNum: 13,
        title: "Coding: Backtracking",
        slug: "topic-13",
        fileName: "Epigram_W2_T13_CodingBacktracking",
      },
      {
        topicNum: 14,
        title: "Coding: Data Structures",
        slug: "topic-14",
        fileName: "Epigram_W2_T14_CodingDataStructures",
      },
    ],
  },
  {
    weekNum: 3,
    title: "Statistics & Methods",
    slug: "week-3",
    topics: [
      {
        topicNum: 15,
        title: "CLT & Law of Large Numbers",
        slug: "topic-15",
        fileName: "Epigram_W3_T15_CLT_LLN",
      },
      {
        topicNum: 16,
        title: "Hypothesis Testing",
        slug: "topic-16",
        fileName: "Epigram_W3_T16_HypothesisTesting",
      },
      {
        topicNum: 17,
        title: "Linear Regression I",
        slug: "topic-17",
        fileName: "Epigram_W3_T17_LinearRegressionI",
      },
      {
        topicNum: 18,
        title: "Linear Regression II",
        slug: "topic-18",
        fileName: "Epigram_W3_T18_LinearRegressionII",
      },
      {
        topicNum: 19,
        title: "Time Series Basics",
        slug: "topic-19",
        fileName: "Epigram_W3_T19_TimeSeriesBasics",
      },
      {
        topicNum: 20,
        title: "Monte Carlo Methods",
        slug: "topic-20",
        fileName: "Epigram_W3_T20_MonteCarlo",
      },
      {
        topicNum: 21,
        title: "Coding: Stack and Queue",
        slug: "topic-21",
        fileName: "Epigram_W3_T21_CodingStackQueue",
      },
      {
        topicNum: 22,
        title: "Coding: BFS and DFS",
        slug: "topic-22",
        fileName: "Epigram_W3_T22_CodingBFSDFS",
      },
    ],
  },
  {
    weekNum: 4,
    title: "Game Theory & Finance",
    slug: "week-4",
    topics: [
      {
        topicNum: 23,
        title: "Nash Equilibrium",
        slug: "topic-23",
        fileName: "Epigram_W4_T23_NashEquilibrium",
      },
      {
        topicNum: 24,
        title: "Bayesian Games",
        slug: "topic-24",
        fileName: "Epigram_W4_T24_BayesianGames",
      },
      {
        topicNum: 25,
        title: "Number Theory and Mental Math",
        slug: "topic-25",
        fileName: "Epigram_W4_T25_NumberTheory",
      },
      {
        topicNum: 26,
        title: "Brain Teasers",
        slug: "topic-26",
        fileName: "Epigram_W4_T26_BrainTeasers",
      },
      {
        topicNum: 27,
        title: "Options Pricing and Black-Scholes",
        slug: "topic-27",
        fileName: "Epigram_W4_T27_OptionsBlackScholes",
      },
      {
        topicNum: 28,
        title: "Coding: Sorting Algorithms",
        slug: "topic-28",
        fileName: "Epigram_W4_T28_CodingSorting",
      },
      {
        topicNum: 29,
        title: "Coding: Searching Algorithms",
        slug: "topic-29",
        fileName: "Epigram_W4_T29_CodingBinarySearch",
      },
    ],
  },
];

export function getWeekBySlug(slug: string): CourseWeek | undefined {
  return COURSE_WEEKS.find((w) => w.slug === slug);
}

export function getTopicBySlug(
  weekSlug: string,
  topicSlug: string
): { week: CourseWeek; topic: CourseWeek["topics"][number] } | undefined {
  const week = getWeekBySlug(weekSlug);
  if (!week) return undefined;
  const topic = week.topics.find((t) => t.slug === topicSlug);
  if (!topic) return undefined;
  return { week, topic };
}

/** Get all topics in order across all weeks */
export function getAllTopicsFlat(): {
  weekSlug: string;
  topicSlug: string;
  weekNum: number;
  topicNum: number;
  title: string;
  weekTitle: string;
}[] {
  return COURSE_WEEKS.flatMap((week) =>
    week.topics.map((topic) => ({
      weekSlug: week.slug,
      topicSlug: topic.slug,
      weekNum: week.weekNum,
      topicNum: topic.topicNum,
      title: topic.title,
      weekTitle: week.title,
    }))
  );
}
