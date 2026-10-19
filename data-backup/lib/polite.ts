import { createHash } from "node:crypto";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";

export const USER_AGENT =
  "BARRACAxSOTI-data-backup/1.0 (+https://github.com/barracafh/BARRACAxSOTI)";

export interface Entry {
  url: string;
  finalUrl: string;
  file: string;
  status: number;
  contentType: string | null;
  bytes: number;
  sha256: string;
  fetchedAt: string;
}

interface Options {
  /** Folder of the source; raw responses go to `<dir>/raw/`. */
  dir: string;
  /** Minimum gap between two requests, in milliseconds. */
  minIntervalMs?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);
// Statuses that will not change on a retry: keep them and do not ask again.
const FINAL = (status: number) => status < 400 || status === 404;

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/**
 * Sequential HTTP client that stores each response body untouched. It waits
 * between requests, retries with backoff and resumes from `raw/manifest.json`.
 */
export class PoliteClient {
  readonly rawDir: string;
  private manifestPath: string;
  private entries = new Map<string, Entry>();
  private last = 0;
  private refresh = process.argv.includes("--refresh");
  stats = { fetched: 0, cached: 0, failed: 0 };

  constructor(private options: Options) {
    this.rawDir = join(options.dir, "raw");
    this.manifestPath = join(this.rawDir, "manifest.json");
    mkdirSync(this.rawDir, { recursive: true });
  }

  async load() {
    if (!existsSync(this.manifestPath)) return this;
    const list: Entry[] = await Bun.file(this.manifestPath).json();
    for (const entry of list) this.entries.set(entry.url, entry);
    return this;
  }

  /** Returns the stored body, downloading it only when it is missing. */
  async get(
    url: string,
    file: string,
    headers: Record<string, string> = {},
  ): Promise<{ entry: Entry; body: Uint8Array } | null> {
    const known = this.entries.get(url);
    const path = join(this.rawDir, file);
    if (known && !this.refresh && FINAL(known.status) && existsSync(path)) {
      this.stats.cached++;
      return { entry: known, body: await Bun.file(path).bytes() };
    }
    const maxRetries = this.options.maxRetries ?? 5;
    for (let attempt = 0; ; attempt++) {
      await this.wait();
      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            ...this.options.headers,
            ...headers,
          },
          signal: AbortSignal.timeout(90_000),
        });
      } catch (error) {
        if (attempt >= maxRetries) {
          console.error(`  ✗ ${url}: ${error}`);
          this.stats.failed++;
          return null;
        }
        await this.backoff(attempt, null, String(error));
        continue;
      }
      if (RETRYABLE.has(response.status) && attempt < maxRetries) {
        await response.body?.cancel();
        await this.backoff(
          attempt,
          response.headers.get("retry-after"),
          `HTTP ${response.status}`,
        );
        continue;
      }
      const body = new Uint8Array(await response.arrayBuffer());
      await Bun.write(path, body);
      const entry: Entry = {
        url,
        finalUrl: response.url,
        file,
        status: response.status,
        contentType: response.headers.get("content-type"),
        bytes: body.byteLength,
        sha256: createHash("sha256").update(body).digest("hex"),
        fetchedAt: new Date().toISOString(),
      };
      this.entries.set(url, entry);
      await this.save();
      if (FINAL(response.status)) this.stats.fetched++;
      else this.stats.failed++;
      console.log(`  ${response.status} ${url} (${body.byteLength} B)`);
      return { entry, body };
    }
  }

  private async wait() {
    const gap = this.options.minIntervalMs ?? 1100;
    const delay = this.last + gap - Date.now();
    if (delay > 0) await sleep(delay);
    this.last = Date.now();
  }

  private async backoff(
    attempt: number,
    retryAfter: string | null,
    why: string,
  ) {
    const seconds = Number(retryAfter);
    const ms =
      Number.isFinite(seconds) && seconds > 0
        ? Math.min(seconds, 120) * 1000
        : 2000 * 2 ** attempt + Math.random() * 1000;
    console.warn(`  … ${why}; reintento en ${Math.round(ms / 1000)} s`);
    await sleep(ms);
  }

  private async save() {
    const list = [...this.entries.values()].sort((a, b) =>
      a.file.localeCompare(b.file),
    );
    const temporary = `${this.manifestPath}.tmp`;
    await Bun.write(temporary, `${JSON.stringify(list, null, 2)}\n`);
    renameSync(temporary, this.manifestPath);
  }

  summary(label: string) {
    const { fetched, cached, failed } = this.stats;
    console.log(
      `${label}: ${fetched} descargadas, ${cached} ya estaban, ${failed} con error.`,
    );
  }
}

/** Stable, readable file name for a URL: slug of the path and query plus a short hash. */
export function fileFor(url: string, extension: string) {
  const { pathname, search } = new URL(url);
  const slug = `${pathname}${search}`
    .replace(/^\/+/, "")
    .replace(/[^A-Za-z0-9.-]+/g, "_")
    .slice(0, 90)
    .replace(/_+$/, "");
  const hash = createHash("sha256").update(url).digest("hex").slice(0, 8);
  return `${slug}-${hash}.${extension}`;
}
