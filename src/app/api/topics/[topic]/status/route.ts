import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { TOPICS_ORDER } from "@/lib/topics";

export async function GET(
  req: NextRequest,
  { params }: { params: { topic: string } }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const topic = decodeURIComponent(params.topic);
  const index = TOPICS_ORDER.indexOf(topic);
  if (index === -1) {
    return NextResponse.json({ error: "Топик не найден" }, { status: 404 });
  }

  const progress = await prisma.userTopicProgress.findUnique({
    where: { userId_topic: { userId: auth.userId, topic } },
  });
  const completed = progress?.completed ?? false;
  const bestScore = progress?.bestScore ?? 0;

  let status: "available" | "locked" | "completed";
  if (completed) {
    status = "completed";
  } else if (index === 0) {
    status = "available";
  } else {
    const prevTopic = TOPICS_ORDER[index - 1];
    const prevProgress = await prisma.userTopicProgress.findUnique({
      where: { userId_topic: { userId: auth.userId, topic: prevTopic } },
    });
    status = prevProgress?.completed ? "available" : "locked";
  }

  return NextResponse.json({ topic, status, bestScore });
}
