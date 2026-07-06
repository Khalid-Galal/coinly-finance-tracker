# Coinly — Spoken Presentation Script (simple English)

This is the word-for-word script for the recorded demo. Planning notes, pre-flight checklist,
and the story-coverage map live in [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — read that first,
then record with this script open.

**How to use it:** lines in quotes are what you say. Lines in **[brackets]** are what you do.
Speak slowly. Short sentences are on purpose. Target time: about 17 minutes.

**Question safety rule:** only ask the Q&A questions written here. They are the shapes that
scored 100% in our evaluation, on months that exist in the demo data (May–July 2026). Do NOT
ask "biggest expense" questions on camera — that is the one shape the eval shows can miss.

---

## 0 · Intro and ID — 0:00 to 1:30

**[Camera on. Face clearly visible.]**

> "Hello. My name is Khaled Galal. This is my Capstone project for the Master of Science in
> Software Engineering at Quantic. I worked on this project alone."

**[Hold your government ID next to your face for about 4 seconds. Make sure name and photo are readable.]**

> "This is my ID, so you can check my name and my picture."

> "My project is called Coinly. It is a personal finance tracker that you host yourself.
> It reads bank statements from Egyptian banks. It uses AI in three ways: it puts your
> spending into categories, it writes short reports about your money, and you can ask it
> questions about your money in plain English — by typing or by voice."

**[Show the GitHub repo page, then the Actions tab with green runs.]**

> "Here is the code repository. Every push runs a full pipeline: lint, formatting, type
> checks, about three hundred sixty automated tests with a coverage gate, a security audit,
> a production build, and browser end-to-end tests. It is green."

**[Show the Trello board or TASK_BOARD.md briefly.]**

> "Here is the task board. All agreed user stories are done. Four small nice-to-have items
> were moved to version two before submission, and the board shows that clearly."

---

## 1 · Unlock, first-run wizard, accounts — 1:30 to 3:00

**[Open the live URL in a fresh browser window. The unlock screen appears.]**

> "This is the live app, deployed on Render. It is protected by a passcode, because it is
> a personal finance app on the public internet."

**[Enter the passcode. You land in the app.]**

> "The first time you use Coinly, a short setup wizard runs. You choose your base currency —
> I use Egyptian pounds — and you create your first account."

**[Show the accounts area. Point at the two accounts.]**

> "I have two accounts here: a bank account and a cash wallet. Coinly supports multiple
> accounts, and everything is shown in one base currency. If an account uses a different
> currency, the amounts are converted using daily exchange rates that Coinly fetches and
> caches automatically."

---

## 2 · Import bank files + duplicate protection — 3:00 to 5:00

**[Go to Import. Choose `docs/demo/cib-debit-credit.csv`.]**

> "Now I will import a real bank statement format. This file uses debit and credit columns,
> like CIB and Banque Misr statements."

**[Import it. Point at the result message.]**

> "It imported the rows and tells me how many."

**[Import the SAME file again. Point at the result.]**

> "Now watch this — I import the same file again. Nothing is duplicated. Coinly detects
> duplicates and skips them. This is important, because people often re-download the same
> statement."

**[If you already imported this file in a rehearsal, say instead: "This file was imported
before, so everything is skipped — this is the duplicate protection working."]**

> "Coinly also reads a second, different format — files with one signed amount column —
> and you can always add a transaction by hand."

**[Use Quick add. Type a small expense, for example "Coffee, 85 pounds", save it, show it in the list.]**

---

## 3 · AI categorization that learns — 5:00 to 7:00

**[Go to Transactions. Click Auto-categorize. Wait for the categories to appear.]**

> "Coinly comes with a ready-made set of default categories — groceries, fuel, rent, dining,
> and so on — so it is useful from the first minute, and you can change them all."

> "The new transactions have no categories yet. I click Auto-categorize. Coinly first tries
> simple rules — that is free and instant. Whatever is left goes to the Gemini model in one
> batch. For privacy, only the merchant name and the amount are sent — never the full data."

**[Point at a few categorized rows.]**

> "Now, sometimes the AI is wrong. Watch what happens when I correct it."

**[Change the category of one transaction by hand.]**

> "When I correct a category, Coinly saves a rule from my correction. Next time, the same
> merchant is categorized correctly without asking the AI at all. So the app learns from me,
> and it gets cheaper and better over time."

---

## 4 · Dashboard — 7:00 to 9:00

**[Open the Dashboard.]**

> "This is the dashboard. At the top: income, spending, and the difference, all in my base
> currency. Here is spending by category, and here is the trend over the last months."

**[Change the date range, for example from 'this month' to 'last 3 months'. Point at the numbers changing.]**

> "I can change the date range, and every number and chart updates."

**[Open Manage categories. Rename one category.]**

> "Categories are fully manageable. I can rename, archive, or merge them. Merging is safe —
> it moves all transactions, rules, and budgets to the target category in one step."

**[Make the browser window narrow, like a phone screen, for about five seconds. Then restore it.]**

> "And the whole app is responsive — it works on a phone screen too."

---

## 5 · Budgets — 9:00 to 10:30

**[Open Budgets. Show the existing budgets with progress bars.]**

> "I can set a monthly budget for any category. Each budget shows a progress bar."

**[Point at each budget state you have — try to show three different states.]**

> "There are three states: green means on track, yellow means approaching the limit — that
> is above eighty percent — and red means over budget. So problems are visible in one look."

**[If all bars are green: set a low budget on a high-spend category to force a red one, show it, then delete it.]**

---

## 6 · AI insights with a cost cap — 10:30 to 12:30

**[Open Insights. Click Generate weekly.]**

> "Coinly can write a short weekly or monthly report about my money, in normal language."

**[Read one or two sentences of the generated insight out loud.]**

> "It also flags anomalies — for example, a category where I spent clearly more than my
> usual average."

> "One engineering detail I am proud of: AI calls cost money, so there is a daily cost cap.
> If the cap is reached, Coinly does not fail — it generates a simpler report without AI.
> The app degrades gracefully by design."

---

## 7 · Ask your data — text and voice (the highlight) — 12:30 to 15:30

**[Open the Ask page.]**

> "This is my favorite part. I can ask questions about my own money in plain English."

**[Type: "How much did I spend on groceries last month?" Submit. Point at the answer.]**

> "It answers with a real number from my database."

**[Click "Show generated SQL". Point at the query.]**

> "How does it work? The AI translates my question into an SQL query. And for transparency,
> I can always see the exact query it ran."

> "Now the security part. The AI is only allowed to write one single read-only SELECT query,
> over special read-only views. Every query is parsed and checked against an allowlist before
> it runs. If the AI writes anything else — an update, a delete, another table — it is
> rejected. So the AI cannot damage or leak data."

**[Type: "Which category did I spend the most on last month?" Submit. Show the answer.]**

**[Type: "How much did I earn in May?" Submit. Show the answer.]**

> "Different question shapes: totals, rankings, and specific months."

**[Click the microphone. Speak clearly: "How much did I spend this month?" Wait for the answer.]**

> "And it works with voice too."

**[FALLBACK — if voice fails: stay calm and say: "The microphone is not cooperating, so I
will type the same question." Type it and continue. Do not retry voice more than twice.]**

> "One more thing. We did not just build this feature — we measured it. There is an
> evaluation set of thirty-two questions with reference SQL answers. On the latest full run,
> the model scored ninety-one percent, and the full log is committed in the repository. The
> deterministic part of that harness also runs in CI on every push."

---

## 8 · Engineering quality and close — 15:30 to 17:30

**[Show the GitHub Actions page with the green pipeline.]**

> "A quick look at the engineering. The CI gate runs on every push: lint, format, types,
> about three hundred sixty tests with about ninety-seven percent line coverage on the gated
> code, a dependency audit, the production build, and Playwright browser tests that click
> through the whole app — including the passcode gate."

**[Show DESIGN.md briefly, scroll slowly.]**

> "The data model is a typed Prisma schema with versioned migrations — the same migrations
> run automatically on every deploy. The design document explains every pattern we used and
> why — repository pattern, service layer, adapters, rules-first hybrid categorization —
> plus the deployment options with costs: running it on your own machine is free, the cloud
> setup we use costs a few dollars per month."

> "Things that go beyond the minimum requirements: the guarded text-to-SQL with an SQL
> allowlist, voice input, a measured evaluation harness, the AI cost cap with a non-AI
> fallback, API key rotation across multiple Gemini keys, rate limiting on the passcode
> gate, and an accessibility pass."

**[Face the camera.]**

> "To summarize: Coinly is deployed and live, all agreed user stories are done, the code is
> tested and documented, and the AI features are guarded and measured. Thank you for
> watching. I am Khaled Galal, and this was Coinly."

**[Stop recording. Check the video length is between 15 and 20 minutes before uploading.]**

---

## If something goes wrong during recording

- **A page errors:** reload once, say "let me reload", and continue. Do not apologize twice.
- **AI quota exhausted:** the insight falls back to the non-AI report — present it as the
  designed fallback ("this is the cost-cap fallback working").
- **Voice fails:** type the same question (see segment 7 fallback line).
- **You run over 19 minutes:** cut segment 4's category renaming and the third typed
  question in segment 7 — the coverage map in DEMO_SCRIPT.md shows these are safe trims.
- **Under 15 minutes is a rubric fail:** if you finish early, slow down in segments 7 and 8
  and read one full insight out loud.
