import { categorizeUncategorized } from "@/lib/server/categorize/categorizeService";

export async function POST() {
  try {
    return Response.json(await categorizeUncategorized());
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
