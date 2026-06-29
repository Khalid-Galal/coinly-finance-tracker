import { db } from "@/lib/server/db";

// Reads the DB to decide whether to show the first-run wizard prompt (US-G1).
export const dynamic = "force-dynamic";

export default async function Home() {
  const firstRun = (await db.account.count()) === 0;

  return (
    <main>
      <h1>Coinly</h1>
      <p>Self-hosted personal finance tracker.</p>

      {firstRun && (
        <section className="card">
          <strong>👋 Welcome!</strong> It looks like this is a fresh install. Let&apos;s set up your
          currency and first account.
          <p style={{ margin: "8px 0 0" }}>
            <a href="/welcome" className="btn-primary">
              Start setup →
            </a>
          </p>
        </section>
      )}

      <ul>
        <li>
          <a href="/import">Import CSV</a>
        </li>
        <li>
          <a href="/quick-add">Add transaction</a>
        </li>
        <li>
          <a href="/accounts">Accounts</a>
        </li>
      </ul>
      <p style={{ color: "#666", fontSize: 13 }}>
        Health: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
