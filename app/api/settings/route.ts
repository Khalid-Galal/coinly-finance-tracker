import { getBaseCurrency, setBaseCurrency } from "@/lib/server/settings/settingService";
import { parseJson, apiError } from "@/lib/server/errors";

export async function GET() {
  return Response.json({ baseCurrency: await getBaseCurrency() });
}

export async function PUT(req: Request) {
  try {
    const { baseCurrency } = await parseJson<{ baseCurrency?: string }>(req);
    return Response.json({ baseCurrency: await setBaseCurrency(baseCurrency ?? "") });
  } catch (e) {
    return apiError(e);
  }
}
