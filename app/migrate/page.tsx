"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

interface MigrationResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function MigratePage() {
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function migrate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const recipes = JSON.parse(String(formData.get("recipes") || ""));
      if (!Array.isArray(recipes)) {
        throw new Error("The pasted JSON must be an array of recipes.");
      }
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipes }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Migration failed.");
      }
      setResult(payload as MigrationResult);
    } catch (migrationError) {
      setError(
        migrationError instanceof Error
          ? migrationError.message
          : "Migration failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="centered-page migration-page">
      <section className="card migration-card">
        <Link href="/" className="back-link">
          ← Back to recipes
        </Link>
        <p className="eyebrow">One-time transfer</p>
        <h1>Import Old Recipes</h1>
        <p>
          In the browser containing your old recipes, open Developer Tools and
          run:
        </p>
        <pre>
          <code>
            {
              "JSON.stringify(JSON.parse(localStorage.getItem('recipe-vault-v1')))"
            }
          </code>
        </pre>
        <p>Copy the result, paste it below, and import it once.</p>
        <form onSubmit={migrate}>
          <label>
            Recipe JSON
            <textarea
              name="recipes"
              rows={14}
              required
              placeholder="Paste your localStorage JSON here"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Importing…" : "Import Recipes"}
          </button>
        </form>
        {result && (
          <div className="migration-result" role="status">
            <strong>{result.imported} imported</strong>
            <span>{result.skipped} skipped</span>
            {result.errors.length > 0 && (
              <ul>
                {result.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
