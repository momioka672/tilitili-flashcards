import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { TOPICS_ORDER } from "@/lib/topics";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Word counts per topic
  const wordCounts = await prisma.word.groupBy({
    by: ["topic"],
    _count: { id: true },
  });
  const countMap: Record<string, number> = {};
  for (const row of wordCounts) countMap[row.topic] = row._count.id;

  // User's topic progress
  const progress = await prisma.userTopicProgress.findMany({
    where: { userId: auth.userId },
  });
  const progressMap: Record<string, { completed: boolean; bestScore: number }> = {};
  for (const p of progress) {
    progressMap[p.topic] = { completed: p.completed, bestScore: p.bestScore };
  }

  // Build ordered list — topics with no words are skipped
  const allTopics = TOPICS_ORDER.filter((t) => (countMap[t] ?? 0) > 0);

  let prevCompleted = true; // first topic always available
  const topics = allTopics.map((topic, i) => {
    const p = progressMap[topic];
    const completed = p?.completed ?? false;
    const bestScore = p?.bestScore ?? 0;
    const wordCount = countMap[topic] ?? 0;

    let status: "available" | "locked" | "completed";
    if (completed) {
      status = "completed";
    } else if (i === 0 || prevCompleted) {
      status = "available";
    } else {
      status = "locked";
    }

    prevCompleted = completed;

    return { topic, wordCount, status, bestScore };
  });

  return NextResponse.json({ topics });
}
