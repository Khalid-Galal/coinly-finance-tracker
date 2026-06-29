import { Prisma } from "@prisma/client";
import { importCsv } from "@/lib/server/import/importService";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const accountId = form.get("accountId");

  if (!(file instanceof File) || typeof accountId !== "string" || !accountId) {
    return Response.json({ error: "file and accountId are required" }, { status: 400 });
  }

  try {
    const result = await importCsv(await file.text(), accountId);
    return Response.json(result);
  } catch (e) {
    // A Prisma error (e.g. a bad accountId FK) would leak schema details — return a safe message.
    // importService's own validation messages ("Unsupported CSV format") are safe to surface.
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return Response.json({ error: "import failed: invalid account or data" }, { status: 400 });
    }
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
