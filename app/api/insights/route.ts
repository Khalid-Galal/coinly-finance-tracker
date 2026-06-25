import { generateInsight, getRecentInsights } from "@/lib/server/insights/insightService";
import { getLlmUsage } from "@/lib/server/insights/costGuard";
import { detectAnomalies } from "@/lib/server/insights/anomalies";
import { monthKeyOf } from "@/lib/server/analytics/dateRange";

export async function GET() {
  const [insights, usage, anomalies] = await Promise.all([
    getRecentInsights(),
    getLlmUsage(),
    detectAnomalies(monthKeyOf(new Date())),
  ]);
  return Response.json({ insights, usage, anomalies });
}

export async function POST(req: Request) {
  const { type } = (await req.json()) as { type?: string };
  if (type !== "weekly" && type !== "monthly") {
    return Response.json({ error: "type must be 'weekly' or 'monthly'" }, { status: 400 });
  }
  try {
    return Response.json(await generateInsight(type));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
