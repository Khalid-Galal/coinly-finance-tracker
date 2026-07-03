import { budgetInputSchema } from "@/lib/shared/schemas";
import { setBudget, getBudgetProgress } from "@/lib/server/budgets/budgetService";
import { parseJson, apiError } from "@/lib/server/errors";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function GET(req: Request) {
  const month = new URL(req.url).searchParams.get("month") ?? "";
  if (!MONTH_RE.test(month)) {
    return Response.json({ error: "month query (YYYY-MM) is required" }, { status: 400 });
  }
  try {
    return Response.json(await getBudgetProgress(month));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = budgetInputSchema.safeParse(await parseJson(req));
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues }, { status: 400 });
    }
    return Response.json(await setBudget(parsed.data));
  } catch (e) {
    // parseJson -> 400 invalid JSON; bad categoryId FK (P2003) -> 400; else 500.
    return apiError(e);
  }
}
