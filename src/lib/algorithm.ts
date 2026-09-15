import { prisma } from "@/lib/prisma";

export type SessionMode = "random" | "repeat" | "weak" | "topic";

export type WordForSession = {
  id: string;
  kyrgyz: string;
  russian: string;
  type: string;
  topic: string;
  pos: string | null;
  difficulty: number;
};

export async function getWordsForSession(
  userId: string,
  mode: SessionMode,
  topic?: string,
  count = 10
): Promise<WordForSession[]> {
  // Load all candidate words with user stats
  const where: Record<string, unknown> = {};
  if (mode === "topic" && topic) where.topic = topic;

  const words = await prisma.word.findMany({
    where,
    include: {
      userStats: {
        where: { userId },
      },
    },
  });

  // Filter by mode
  const candidates = words.filter((w) => {
    const stat = w.userStats[0];
    if (mode === "repeat") return stat && stat.shown > 0;
    if (mode === "weak") {
      if (!stat || stat.shown === 0) return false;
      const errorRate = stat.shown > 0 ? stat.incorrect / stat.shown : 0;
      return errorRate > 0.4;
    }
    return true;
  });

  if (candidates.length === 0) return [];

  // Compute weights
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const weighted = candidates.map((w) => {
    const stat = w.userStats[0];
    let weight = 1;

    if (!stat || stat.shown === 0) {
      // New word
      weight *= 1.5;
    } else {
      const errorRate = stat.incorrect / stat.shown;
      if (errorRate > 0.4) weight *= 2;
      else if (stat.shown > 5 && errorRate < 0.2) weight *= 0.5;

      if (stat.lastShownAt) {
        const daysSince = now - new Date(stat.lastShownAt).getTime();
        if (daysSince > SEVEN_DAYS_MS) weight *= 1.5;
      }
    }

    // "weak" mode: amplify error weight further
    if (mode === "weak") {
      const errorRate = stat ? stat.incorrect / stat.shown : 0;
      if (errorRate > 0.4) weight *= 2;
    }

    return { word: w, weight };
  });

  // Weighted random sampling without replacement
  const selected: WordForSession[] = [];
  const pool = [...weighted];

  const target = Math.min(count, pool.length);
  for (let i = 0; i < target; i++) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      rand -= pool[j].weight;
      if (rand <= 0) {
        idx = j;
        break;
      }
    }
    const picked = pool.splice(idx, 1)[0];
    selected.push({
      id: picked.word.id,
      kyrgyz: picked.word.kyrgyz,
      russian: picked.word.russian,
      type: picked.word.type,
      topic: picked.word.topic,
      pos: picked.word.pos,
      difficulty: picked.word.difficulty,
    });
  }

  return selected;
}
