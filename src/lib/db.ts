import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";

let client: Client | undefined;
let initPromise: Promise<void> | undefined;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error("TURSO_DATABASE_URL is not set. Add it to your .env.local");
    }
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return client;
}

/**
 * Creates the schema and seeds sample data the first time it runs.
 * Safe to call from every request handler: it is lazy (never runs at build
 * time) and deduplicated across concurrent calls within a serverless instance.
 */
export async function initDb(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const db = getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT 'General',
        content TEXT,
        url TEXT,
        file_name TEXT,
        file_path TEXT,
        file_size INTEGER,
        favorite INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const { rows } = await db.execute("SELECT COUNT(*) AS count FROM materials");
    const count = Number(rows[0]?.count ?? 0);
    if (count > 0) return;

    const samples: [string, string, string, string, string, number][] = [
      [
        "Calculus: Integration techniques",
        "notes",
        "Mathematics",
        "Integration is the reverse of differentiation. It lets us find areas under curves, volumes, and the original function given its rate of change.\n\nKey techniques:\n1. Substitution — reverse of the chain rule.\n2. Integration by parts — reverse of the product rule.\n3. Partial fractions — for rational functions.\n4. Trigonometric substitution — for quadratic expressions.\n\nPractice problems: solve at least five of each technique before the exam.",
        "",
        1,
      ],
      [
        "Data structures — Unit 3",
        "notes",
        "Computer Science",
        "Trees:\n- A tree is a hierarchical structure of nodes.\n- A binary tree has at most two children per node.\n- BST invariant: left subtree < node < right subtree.\n\nTraversals:\n- In-order: left, node, right (sorted order for BST).\n- Pre-order: node, left, right.\n- Post-order: left, right, node.\n\nHeaps: complete binary trees used for priority queues.",
        "",
        0,
      ],
      [
        "Organic chemistry playlist",
        "video",
        "Chemistry",
        "",
        "https://www.youtube.com/watch?v=WUvTyaaNkzM",
        1,
      ],
      [
        "Physics: Laws of motion summary",
        "notes",
        "Physics",
        "Newton's laws:\n1. An object at rest stays at rest unless acted on by a net force.\n2. F = ma — force equals mass times acceleration.\n3. Every action has an equal and opposite reaction.\n\nFriction f = μN. Draw free-body diagrams before solving.",
        "",
        0,
      ],
      [
        "Essay writing template",
        "notes",
        "English",
        "Introductory paragraph:\n- Hook to grab the reader's attention.\n- Background context.\n- Thesis statement (your main argument).\n\nBody paragraphs:\n- Topic sentence, evidence, analysis (PEA).\n- One idea per paragraph.\n\nConclusion:\n- Restate the thesis in new words.\n- Summarise key points.\n- End with a thought-provoking final line.",
        "",
        0,
      ],
    ];

    const now = Date.now();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const t = new Date(now - i * 86_400_000).toISOString();
      await db.execute({
        sql: `INSERT INTO materials (title, type, subject, content, url, favorite, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [s[0], s[1], s[2], s[3] || null, s[4] || null, s[5], t, t],
      });
    }
  })();
  return initPromise;
}