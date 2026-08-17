import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const globalForDb = globalThis as unknown as { sdDb?: DatabaseSync };

function createDb(): DatabaseSync {
  const dataDir = path.join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });

  const db = new DatabaseSync(path.join(dataDir, "students-drive.db"));
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");

  db.exec(`
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

  seed(db);

  return db;
}

function seed(db: DatabaseSync): void {
  db.exec("BEGIN IMMEDIATE");
  try {
    const { count } = db.prepare("SELECT COUNT(*) AS count FROM materials").get() as {
      count: number;
    };
    if (count > 0) {
      db.exec("COMMIT");
      return;
    }

    const now = Date.now();
    const insert = db.prepare(
      `INSERT INTO materials (title, type, subject, content, url, favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
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
        "Introductory paragraph:\n- Hook to grab the reader's attention.\n- Background context.\n- Thesis statement (your main argument).\n\nBody paragraphs:\n- Topic sentence, evidence, analysis (PEA).\n- One idea per paragraph.\n- Quote then explain how it supports your thesis.\n\nConclusion:\n- Restate the thesis in new words.\n- Summarise key points.\n- End with a thought-provoking final line.",
        "",
        0,
      ],
    ];
    samples.forEach((sample, i) => {
      const t = new Date(now - i * 86_400_000).toISOString();
      insert.run(sample[0], sample[1], sample[2], sample[3] || null, sample[4] || null, sample[5], t, t);
    });

    db.exec("COMMIT");
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export const db = globalForDb.sdDb ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.sdDb = db;