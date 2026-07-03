import { generateInsight, getRecentInsights } from "@/lib/server/insights/insightService";
import { getLlmUsage } from "@/lib/server/insights/costGuard";
import { detectAnomalies } from "@/lib/server/insights/anomalies";
import { monthKeyOf } from "@/lib/server/analytics/dateRange";
import { parseJson, apiError } from "@/lib/server/errors";

export async function GET() {
  const [insights, usage, anomalies] = await Promise.all([
    getRecentInsights(),
    getLlmUsage(),
    detectAnomalies(monthKeyOf(new Date())),
  ]);
  return Response.json({ insights, usage, anomalies });
}

export async function POST(req: Request) {
  try {
    const { type } = await parseJson<{ type?: string }>(req);
    if (type !== "weekly" && type !== "monthly") {
      return Response.json({ error: "type must be 'weekly' or 'monthly'" }, { status: 400 });
    }
    return Response.json(await generateInsight(type));
  } catch (e) {
    // Malformed JSON -> 400 (parseJson); LLM/Gemini failure -> 500 (no message leak).
    return apiError(e);
  }
}
