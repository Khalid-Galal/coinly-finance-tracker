# Coinly — Spoken Presentation Script (simple English)

This is the word-for-word script for the recorded demo. Planning notes, pre-flight checklist,
and the story-coverage map live in [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — read that first,
then record with this script open.

**How to read this script:**

| Marker | Meaning |
| --- | --- |
| 🗣️ **SAY** | Speak these exact words out loud. |
| 👆 **DO** | Do this on screen. Do not speak while marked DO unless a SAY follows. |
| ⚠️ **IF** | Only if something goes wrong — the recovery line to say. |

Speak slowly. Short sentences are on purpose. Target time: about 17 minutes.

**Question safety rule:** only ask the Q&A questions written here. They are the shapes that
scored 100% in our evaluation, on months that exist in the demo data (May–July 2026). Do NOT
ask "biggest expense" questions on camera — that is the one shape the eval shows can miss.

---

## Part 0 · Intro and ID — 0:00 to 1:30

👆 **DO:** Turn the camera on. Your face must be clearly visible.

🗣️ **SAY:**

> "Hello. My name is Khaled Galal. This is my Capstone project for the Master of
> Science in Software Engineering at Quantic. I worked on this project alone."

👆 **DO:** Hold your government ID next to your face for about 4 seconds. Name and photo must be readable.

🗣️ **SAY:**

> "This is my ID, so you can check my name and my picture."

🗣️ **SAY:**

> "My project is called Coinly. It is a personal finance tracker that you host yourself.
> It reads bank statements from Egyptian banks. It uses AI in three ways: it puts your
> spending into categories, it writes short reports about your money, and you can ask it
> questions about your money in plain English — by typing or by voice."

👆 **DO:** Show the GitHub repo page, then the Actions tab with green runs.

🗣️ **SAY:**

> "Here is the code repository. Every push runs a full pipeline: lint, formatting, type
> checks, about three hundred sixty automated tests with a coverage gate, a security
> audit, a production build, and browser end-to-end tests. It is green."

👆 **DO:** Show the Trello board (or TASK_BOARD.md) briefly.

🗣️ **SAY:**

> "Here is the task board. All agreed user stories are done. Four small nice-to-have
> items were moved to version two before submission, and the board shows that clearly."

---

## Part 1 · Unlock, first-run wizard, accounts — 1:30 to 3:00

👆 **DO:** Open the live URL in a fresh browser window. The unlock screen appears.

🗣️ **SAY:**

> "This is the live app, deployed on Render. It is protected by a passcode, because it
> is a personal finance app on the public internet."

👆 **DO:** Enter the passcode. You land in the app.

🗣️ **SAY:**

> "The first time you use Coinly, a short setup wizard runs. You choose your base
> currency — I use Egyptian pounds — and you create your first account."

👆 **DO:** Show the accounts area. Point at the two accounts.

🗣️ **SAY:**

> "I have two accounts here: a bank account and a cash wallet. Coinly supports multiple
> accounts, and everything is shown in one base currency. If an account uses a different
> currency, the amounts are converted using daily exchange rates that Coinly fetches
> and caches automatically."

---

## Part 2 · Import bank files + duplicate protection — 3:00 to 5:00

👆 **DO:** Go to Import. Choose the file `docs/demo/cib-debit-credit.csv`.

🗣️ **SAY:**

> "Now I will import a real bank statement format. This file uses debit and credit
> columns, like CIB and Banque Misr statements."

👆 **DO:** Import it. Point at the result message.

🗣️ **SAY:**

> "It imported the rows and tells me how many."

👆 **DO:** Import the SAME file again. Point at the result.

🗣️ **SAY:**

> "Now watch this — I import the same file again. Nothing is duplicated. Coinly detects
> duplicates and skips them. This is important, because people often re-download the
> same statement."

⚠️ **IF** you already imported this file in a rehearsal, **SAY instead:**

> "This file was imported before, so everything is skipped — this is the duplicate
> protection working."

🗣️ **SAY:**

> "Coinly also reads a second, different format — files with one signed amount column —
> and you can always add a transaction by hand."

👆 **DO:** Use Quick add. Type a small expense, for example "Coffee, 85 pounds". Save it. Show it in the list.

---

## Part 3 · AI categorization that learns — 5:00 to 7:00

👆 **DO:** Go to Transactions.

🗣️ **SAY:**

> "Coinly comes with a ready-made set of default categories — groceries, fuel, rent,
> dining, and so on — so it is useful from the first minute, and you can change them all."

🗣️ **SAY:**

> "The new transactions have no categories yet. I click Auto-categorize. Coinly first
> tries simple rules — that is free and instant. Whatever is left goes to the Gemini
> model in one batch. For privacy, only the merchant name and the amount are sent —
> never the full data."

👆 **DO:** Click Auto-categorize. Wait for the categories to appear. Point at a few categorized rows.

🗣️ **SAY:**

> "Now, sometimes the AI is wrong. Watch what happens when I correct it."

👆 **DO:** Change the category of one transaction by hand.

🗣️ **SAY:**

> "When I correct a category, Coinly saves a rule from my correction. Next time, the
> same merchant is categorized correctly without asking the AI at all. So the app
> learns from me, and it gets cheaper and better over time."

---

## Part 4 · Dashboard — 7:00 to 9:00

👆 **DO:** Open the Dashboard.

🗣️ **SAY:**

> "This is the dashboard. At the top: income, spending, and the difference, all in my
> base currency. Here is spending by category, and here is the trend over the last
> months."

👆 **DO:** Change the date range, for example from "this month" to "last 3 months". Point at the numbers changing.

🗣️ **SAY:**

> "I can change the date range, and every number and chart updates."

👆 **DO:** Open Manage categories. Rename one category.

🗣️ **SAY:**

> "Categories are fully manageable. I can rename, archive, or merge them. Merging is
> safe — it moves all transactions, rules, and budgets to the target category in one
> step."

👆 **DO:** Make the browser window narrow, like a phone screen, for about five seconds. Then restore it.

🗣️ **SAY:**

> "And the whole app is responsive — it works on a phone screen too."

---

## Part 5 · Budgets — 9:00 to 10:30

👆 **DO:** Open Budgets. Show the existing budgets with progress bars.

🗣️ **SAY:**

> "I can set a monthly budget for any category. Each budget shows a progress bar."

👆 **DO:** Point at each budget state you have — try to show three different states.

🗣️ **SAY:**

> "There are three states: green means on track, yellow means approaching the limit —
> that is above eighty percent — and red means over budget. So problems are visible in
> one look."

⚠️ **IF** all bars are green: set a low budget on a high-spend category to force a red one, show it, then delete it. No extra words needed — just do it while the previous line is still fresh.

---

## Part 6 · AI insights with a cost cap — 10:30 to 12:30

👆 **DO:** Open Insights. Click Generate weekly.

🗣️ **SAY:**

> "Coinly can write a short weekly or monthly report about my money, in normal
> language."

👆 **DO:** Read one or two sentences of the generated insight out loud, from the screen.

🗣️ **SAY:**

> "It also flags anomalies — for example, a category where I spent clearly more than
> my usual average."

🗣️ **SAY:**

> "One engineering detail I am proud of: AI calls cost money, so there is a daily cost
> cap. If the cap is reached, Coinly does not fail — it generates a simpler report
> without AI. The app degrades gracefully by design."

---

## Part 7 · Ask your data — text and voice (the highlight) — 12:30 to 15:30

👆 **DO:** Open the Ask page.

🗣️ **SAY:**

> "This is my favorite part. I can ask questions about my own money in plain English."

👆 **DO:** Type exactly: `How much did I spend on groceries last month?` — submit, point at the answer.

🗣️ **SAY:**

> "It answers with a real number from my database."

👆 **DO:** Click "Show generated SQL". Point at the query.

🗣️ **SAY:**

> "How does it work? The AI translates my question into an SQL query. And for
> transparency, I can always see the exact query it ran."

🗣️ **SAY:**

> "Now the security part. The AI is only allowed to write one single read-only SELECT
> query, over special read-only views. Every query is parsed and checked against an
> allowlist before it runs. If the AI writes anything else — an update, a delete,
> another table — it is rejected. So the AI cannot damage or leak data."

👆 **DO:** Type exactly: `Which category did I spend the most on last month?` — submit, show the answer.

👆 **DO:** Type exactly: `How much did I earn in May?` — submit, show the answer.

🗣️ **SAY:**

> "Different question shapes: totals, rankings, and specific months."

👆 **DO:** Click the microphone. Speak clearly: "How much did I spend this month?" Wait for the answer.

🗣️ **SAY:**

> "And it works with voice too."

⚠️ **IF** voice fails, stay calm and **SAY:**

> "The microphone is not cooperating, so I will type the same question."

Then type it and continue. Do not retry voice more than twice.

🗣️ **SAY:**

> "One more thing. We did not just build this feature — we measured it. There is an
> evaluation set of thirty-two questions with reference SQL answers. On the latest full
> run, the model scored ninety-one percent, and the full log is committed in the
> repository. The deterministic part of that harness also runs in CI on every push."

---

## Part 8 · Engineering quality and close — 15:30 to 17:30

👆 **DO:** Show the GitHub Actions page with the green pipeline.

🗣️ **SAY:**

> "A quick look at the engineering. The CI gate runs on every push: lint, format,
> types, about three hundred sixty tests with about ninety-seven percent line coverage
> on the gated code, a dependency audit, the production build, and Playwright browser
> tests that click through the whole app — including the passcode gate."

👆 **DO:** Show DESIGN.md briefly. Scroll slowly.

🗣️ **SAY:**

> "The data model is a typed Prisma schema with versioned migrations — the same
> migrations run automatically on every deploy. The design document explains every
> pattern we used and why — repository pattern, service layer, adapters, rules-first
> hybrid categorization — plus the deployment options with costs: running it on your
> own machine is free, the cloud setup we use costs a few dollars per month."

🗣️ **SAY:**

> "Things that go beyond the minimum requirements: the guarded text-to-SQL with an SQL
> allowlist, voice input, a measured evaluation harness, the AI cost cap with a non-AI
> fallback, API key rotation across multiple Gemini keys, rate limiting on the
> passcode gate, and an accessibility pass."

👆 **DO:** Face the camera.

🗣️ **SAY:**

> "To summarize: Coinly is deployed and live, all agreed user stories are done, the
> code is tested and documented, and the AI features are guarded and measured. Thank
> you for watching. I am Khaled Galal, and this was Coinly."

👆 **DO:** Stop recording. Check the video length is between 15 and 20 minutes before uploading.

---

## If something goes wrong during recording

- **A page errors:** reload once, say "let me reload", and continue. Do not apologize twice.
- **AI quota exhausted:** the insight falls back to the non-AI report — present it as the
  designed fallback. **SAY:** "This is the cost-cap fallback working."
- **Voice fails:** type the same question (see the Part 7 fallback line).
- **You run over 19 minutes:** cut Part 4's category renaming and the third typed
  question in Part 7 — the coverage map in DEMO_SCRIPT.md shows these are safe trims.
- **Under 15 minutes is a rubric fail:** if you finish early, slow down in Parts 7 and 8
  and read one full insight out loud.
