import { askQuestion } from "@/lib/server/qa/qaService";

export async function POST(req: Request) {
  try {
    const { question } = (await req.json()) as { question?: string };
    if (typeof question !== "string" || !question.trim()) {
      return Response.json({ error: "A question is required." }, { status: 400 });
    }
    return Response.json(await askQuestion(question));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
