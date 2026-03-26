"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { COURSE_WEEKS } from "@/data/course/course-structure";

interface TopicProgress {
  week_num: number;
  topic_num: number;
  status: "not_started" | "in_progress" | "completed";
  problems_solved: number;
  problems_total: number;
}

interface ProblemProgress {
  problem_id: string;
  solved: boolean;
}

export function useCourseProgress() {
  const { user } = useAuthStore();
  const [topicProgressMap, setTopicProgressMap] = useState<
    Map<string, TopicProgress>
  >(new Map());
  const [problemProgressMap, setProblemProgressMap] = useState<
    Map<string, ProblemProgress[]>
  >(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch progress on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchProgress() {
      try {
        const { data: topicData } = await supabase
          .from("course_topic_progress")
          .select("*")
          .eq("user_id", user!.id);

        if (topicData) {
          const map = new Map<string, TopicProgress>();
          for (const row of topicData) {
            map.set(`${row.week_num}-${row.topic_num}`, row as TopicProgress);
          }
          setTopicProgressMap(map);
        }

        const { data: problemData } = await supabase
          .from("course_problem_progress")
          .select("*")
          .eq("user_id", user!.id);

        if (problemData) {
          const map = new Map<string, ProblemProgress[]>();
          for (const row of problemData) {
            const key = `${row.week_num}-${row.topic_num}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(row as ProblemProgress);
          }
          setProblemProgressMap(map);
        }
      } catch {
        // Tables may not exist yet — that's fine
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [user]);

  const getTopicStatus = useCallback(
    (weekNum: number, topicNum: number): "not_started" | "in_progress" | "completed" => {
      const key = `${weekNum}-${topicNum}`;
      return topicProgressMap.get(key)?.status ?? "not_started";
    },
    [topicProgressMap]
  );

  const getWeekProgress = useCallback(
    (weekNum: number): { completed: number; total: number; percent: number } => {
      const week = COURSE_WEEKS.find((w) => w.weekNum === weekNum);
      if (!week) return { completed: 0, total: 0, percent: 0 };

      const total = week.topics.length;
      let completed = 0;
      for (const topic of week.topics) {
        if (getTopicStatus(weekNum, topic.topicNum) === "completed") {
          completed++;
        }
      }
      return {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },
    [getTopicStatus]
  );

  const getTopicProblemProgress = useCallback(
    (
      weekNum: number,
      topicNum: number
    ): { solved: number; total: number } => {
      const key = `${weekNum}-${topicNum}`;
      const topicProg = topicProgressMap.get(key);
      const problems = problemProgressMap.get(key) ?? [];
      const solved = problems.filter((p) => p.solved).length;
      return {
        solved,
        total: topicProg?.problems_total ?? 0,
      };
    },
    [topicProgressMap, problemProgressMap]
  );

  const markProblemSolved = useCallback(
    async (
      weekNum: number,
      topicNum: number,
      problemId: string,
      problemsTotal: number
    ) => {
      if (!user) return;

      const key = `${weekNum}-${topicNum}`;

      // Upsert problem progress
      await supabase.from("course_problem_progress").upsert(
        {
          user_id: user.id,
          week_num: weekNum,
          topic_num: topicNum,
          problem_id: problemId,
          solved: true,
          solved_at: new Date().toISOString(),
        },
        { onConflict: "user_id,week_num,topic_num,problem_id" }
      );

      // Update local state
      setProblemProgressMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(key) ?? [];
        const idx = existing.findIndex((p) => p.problem_id === problemId);
        if (idx >= 0) {
          existing[idx] = { problem_id: problemId, solved: true };
        } else {
          existing.push({ problem_id: problemId, solved: true });
        }
        next.set(key, [...existing]);
        return next;
      });

      // Count solved problems
      const problems = problemProgressMap.get(key) ?? [];
      const solvedCount =
        problems.filter((p) => p.solved).length +
        (problems.some((p) => p.problem_id === problemId) ? 0 : 1);

      // Determine status
      const status =
        solvedCount >= problemsTotal ? "completed" : "in_progress";

      // Upsert topic progress
      await supabase.from("course_topic_progress").upsert(
        {
          user_id: user.id,
          week_num: weekNum,
          topic_num: topicNum,
          status,
          problems_solved: solvedCount,
          problems_total: problemsTotal,
          started_at:
            topicProgressMap.get(key)?.status === "not_started"
              ? new Date().toISOString()
              : undefined,
          completed_at:
            status === "completed" ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,week_num,topic_num" }
      );

      // Update local topic progress
      setTopicProgressMap((prev) => {
        const next = new Map(prev);
        next.set(key, {
          week_num: weekNum,
          topic_num: topicNum,
          status: status as "not_started" | "in_progress" | "completed",
          problems_solved: solvedCount,
          problems_total: problemsTotal,
        });
        return next;
      });
    },
    [user, topicProgressMap, problemProgressMap]
  );

  return {
    loading,
    getTopicStatus,
    getWeekProgress,
    getTopicProblemProgress,
    markProblemSolved,
  };
}
