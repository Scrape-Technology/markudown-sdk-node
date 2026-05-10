/**
 * MarkUDown Node.js / TypeScript SDK
 * https://scrapetechnology.com/markudown
 *
 * Zero-dependency client — uses native fetch (Node 18+).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MarkUDownOptions {
  apiKey: string;
  baseUrl?: string;
  /** HTTP request timeout in milliseconds (default: 120 000) */
  timeout?: number;
  /** Milliseconds between status polls for async jobs (default: 2 000) */
  pollInterval?: number;
  /** Max milliseconds to wait for a job to complete (default: 300 000) */
  pollTimeout?: number;
}

export interface ScrapeOptions {
  timeout?: number;
  excludeTags?: string[];
  mainContent?: boolean;
  includeLinks?: boolean;
  includeHtml?: boolean;
}

export interface MapOptions {
  allowedWords?: string[];
  blockedWords?: string[];
  maxUrls?: number;
  wait?: boolean;
}

export interface CrawlOptions {
  maxDepth?: number;
  limit?: number;
  timeout?: number;
  includeLinks?: boolean;
  includeHtml?: boolean;
  excludeTags?: string[];
  blockedWords?: string[];
  includeOnly?: string[];
  mainContent?: boolean;
  callbackUrl?: string;
  wait?: boolean;
}

export interface ExtractSchema {
  name: string;
  type: "string" | "float" | "integer" | "date" | "url";
  active: boolean;
}

export interface ExtractOptions {
  extractQuery?: string;
  extractionScope?: "whole_site" | "category" | "single_page" | "search_query" | "list_page";
  extractionTarget?: string;
  allowedWords?: string[];
  blockedWords?: string[];
  allowedPatterns?: string[];
  blockedPatterns?: string[];
  callbackUrl?: string;
  wait?: boolean;
}

export interface PromptExtractOptions {
  timeout?: number;
  mainContent?: boolean;
  callbackUrl?: string;
  wait?: boolean;
}

export interface BatchScrapeOptions {
  timeout?: number;
  excludeTags?: string[];
  mainContent?: boolean;
  includeLinks?: boolean;
  includeHtml?: boolean;
  wait?: boolean;
}

export type SearchEngine = "google" | "bing" | "duckduckgo" | "all";

export interface SearchOptions {
  limit?: number;
  scrapeResults?: boolean;
  lang?: string;
  country?: string;
  timeout?: number;
  engine?: SearchEngine;
  callbackUrl?: string;
  wait?: boolean;
}

export interface RssOptions {
  maxItems?: number;
  title?: string;
  timeout?: number;
  callbackUrl?: string;
  wait?: boolean;
}

export interface ChangeDetectionOptions {
  mainContent?: boolean;
  includeDiff?: boolean;
  timeout?: number;
  callbackUrl?: string;
  wait?: boolean;
}

export interface DeepResearchOptions {
  maxTokens?: number;
  timeout?: number;
  callbackUrl?: string;
  wait?: boolean;
}

export interface AgentOptions {
  maxSteps?: number;
  maxPages?: number;
  allowNavigation?: boolean;
  includeScreenshots?: boolean;
  timeout?: number;
  callbackUrl?: string;
  wait?: boolean;
}

export type OutputFormat = "markdown" | "json" | "csv";

export interface SmartExtractOptions {
  hints?: string[];
  schema?: Record<string, string>;
  outputFormat?: OutputFormat;
  maxPages?: number;
  timeout?: number;
  callbackUrl?: string;
  wait?: boolean;
}

export type RankEngine = "google" | "bing";

export interface RankOptions {
  engine?: RankEngine;
  lang?: string;
  country?: string;
  depth?: number;
  timeout?: number;
  callbackUrl?: string;
  wait?: boolean;
}

export interface DatasetOptions {
  schema?: Record<string, string>;
  maxPages?: number;
  outputFormat?: "json" | "csv";
  timeout?: number;
  callbackUrl?: string;
  wait?: boolean;
}

export interface MonitorCreateOptions {
  intervalMinutes?: number;
  mainContent?: boolean;
  timeout?: number;
}

export type InstagramResource = "profile" | "post" | "hashtag" | "search";
export type XResource = "profile" | "post" | "search";

export interface SocialOptions {
  limit?: number;
  sessionCookie?: string;
  callbackUrl?: string;
  wait?: boolean;
}

export interface JobResponse {
  success: boolean;
  id: string;
  url: string;
}

export interface JobStatus {
  success: boolean;
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "not_found";
  data?: unknown;
  error?: string;
  progress?: unknown;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class MarkUDownError extends Error {
  public readonly statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "MarkUDownError";
    this.statusCode = statusCode;
  }
}

export class RateLimitError extends MarkUDownError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

export class InsufficientCreditsError extends MarkUDownError {
  constructor(message = "Insufficient credits") {
    super(message, 403);
    this.name = "InsufficientCreditsError";
  }
}

export class JobFailedError extends MarkUDownError {
  constructor(message = "Job failed") {
    super(message);
    this.name = "JobFailedError";
  }
}

// ── Client ────────────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = "https://api.scrapetechnology.com";
const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_POLL_INTERVAL = 2_000;
const DEFAULT_POLL_TIMEOUT = 300_000;

export class MarkUDown {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly pollInterval: number;
  private readonly pollTimeout: number;

  constructor(opts: MarkUDownOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = opts.timeout ?? DEFAULT_TIMEOUT;
    this.pollInterval = opts.pollInterval ?? DEFAULT_POLL_INTERVAL;
    this.pollTimeout = opts.pollTimeout ?? DEFAULT_POLL_TIMEOUT;
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private async _request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!resp.ok) {
      let detail = `HTTP ${resp.status}`;
      try {
        const json = (await resp.json()) as { detail?: string };
        detail = json.detail ?? detail;
      } catch {
        // ignore
      }
      if (resp.status === 429) throw new RateLimitError(detail);
      if (resp.status === 402 || resp.status === 403) throw new InsufficientCreditsError(detail);
      throw new MarkUDownError(detail, resp.status);
    }

    return resp.json() as Promise<T>;
  }

  private async _poll(queue: string, jobId: string): Promise<JobStatus> {
    const deadline = Date.now() + this.pollTimeout;
    while (Date.now() < deadline) {
      const status = await this._request<JobStatus>("GET", `/api/${queue}/${jobId}`);
      if (status.status === "completed") return status;
      if (status.status === "failed") throw new JobFailedError(status.error ?? "Job failed");
      if (status.status === "not_found") throw new MarkUDownError(`Job ${jobId} not found`);
      await new Promise((r) => setTimeout(r, this.pollInterval));
    }
    throw new MarkUDownError(`Polling timed out after ${this.pollTimeout}ms`);
  }

  private async _submit(queue: string, body: unknown, wait: boolean): Promise<unknown> {
    const resp = await this._request<JobResponse>("POST", `/api/${queue}`, body);
    if (!wait) return resp;
    return this._poll(queue, resp.id);
  }

  // ── Scrape ──────────────────────────────────────────────────────────────────

  /**
   * Scrape a single URL. Returns result immediately.
   */
  async scrape(url: string, opts: ScrapeOptions = {}): Promise<unknown> {
    return this._request("POST", "/api/scrape", {
      url: [url],
      timeout: opts.timeout ?? 60,
      exclude_tags: opts.excludeTags ?? ["header", "nav", "footer"],
      main_content: opts.mainContent ?? true,
      include_link: opts.includeLinks ?? false,
      include_html: opts.includeHtml ?? false,
    });
  }

  /**
   * Take a screenshot of a URL. Returns result immediately.
   */
  async screenshot(url: string, opts: { timeout?: number } = {}): Promise<unknown> {
    return this._request("POST", "/api/screenshot", {
      url: [url],
      timeout: opts.timeout ?? 60,
    });
  }

  // ── Map ─────────────────────────────────────────────────────────────────────

  /**
   * Discover all URLs on a website.
   */
  async map(url: string, opts: MapOptions = {}): Promise<unknown> {
    return this._submit("map", {
      url: [url],
      max_urls: opts.maxUrls ?? 1000,
      allowed_words: opts.allowedWords ?? [],
      blocked_words: opts.blockedWords ?? [],
    }, opts.wait ?? true);
  }

  // ── Crawl ───────────────────────────────────────────────────────────────────

  /**
   * Crawl a website recursively and extract content from every page.
   */
  async crawl(url: string, opts: CrawlOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      url: [url],
      max_depth: opts.maxDepth ?? 2,
      limit: opts.limit ?? 10,
      timeout: opts.timeout ?? 60,
      include_link: opts.includeLinks ?? false,
      include_html: opts.includeHtml ?? false,
      exclude_tags: opts.excludeTags ?? [],
      blocked_words: opts.blockedWords ?? [],
      include_only: opts.includeOnly ?? [],
      main_content: opts.mainContent ?? true,
    };
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("crawl", body, opts.wait ?? true);
  }

  // ── Extract ─────────────────────────────────────────────────────────────────

  /**
   * Schema-based structured data extraction with AI.
   *
   * @example
   * const result = await md.extract("https://shop.example.com", [
   *   { name: "title", type: "string", active: true },
   *   { name: "price", type: "float",  active: true },
   * ], { extractQuery: "Extract all product listings" });
   */
  async extract(url: string, schema: ExtractSchema[], opts: ExtractOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      url,
      schema,
      extract_query: opts.extractQuery ?? "",
      allowed_words: opts.allowedWords ?? [],
      blocked_words: opts.blockedWords ?? [],
      allowed_patterns: opts.allowedPatterns ?? [],
      blocked_patterns: opts.blockedPatterns ?? [],
    };
    if (opts.extractionScope) body["extraction_scope"] = opts.extractionScope;
    if (opts.extractionTarget) body["extraction_target"] = opts.extractionTarget;
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("extract", body, opts.wait ?? true);
  }

  /**
   * Extract data using a natural language prompt — no schema needed.
   */
  async promptExtract(url: string, prompt: string, opts: PromptExtractOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      url,
      prompt,
      timeout: opts.timeout ?? 60,
      main_content: opts.mainContent ?? true,
    };
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    const resp = await this._request<JobResponse>("POST", "/api/prompt-extract", body);
    if (!(opts.wait ?? true)) return resp;
    return this._poll("extract", resp.id);
  }

  /**
   * Generate an extraction schema from a natural language query.
   */
  async createSchema(query: string): Promise<unknown> {
    return this._request("POST", "/api/create-schema", { query });
  }

  // ── Batch Scrape ────────────────────────────────────────────────────────────

  /**
   * Scrape multiple URLs in parallel.
   */
  async batchScrape(urls: string[], opts: BatchScrapeOptions = {}): Promise<unknown> {
    return this._submit("batch-scrape", {
      url: urls,
      timeout: opts.timeout ?? 60,
      main_content: opts.mainContent ?? true,
      include_link: opts.includeLinks ?? false,
      include_html: opts.includeHtml ?? false,
      exclude_tags: opts.excludeTags ?? [],
    }, opts.wait ?? true);
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  /**
   * Web search + optional scraping of result pages.
   */
  async search(query: string, opts: SearchOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      query,
      limit: opts.limit ?? 5,
      scrape_results: opts.scrapeResults ?? true,
      lang: opts.lang ?? "en",
      country: opts.country ?? "us",
      timeout: opts.timeout ?? 60,
      engine: opts.engine ?? "google",
    };
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("search", body, opts.wait ?? true);
  }

  // ── RSS ─────────────────────────────────────────────────────────────────────

  /**
   * Generate an RSS feed from any web page.
   */
  async rss(url: string, opts: RssOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      url,
      max_items: opts.maxItems ?? 20,
      timeout: opts.timeout ?? 60,
    };
    if (opts.title) body["title"] = opts.title;
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("rss", body, opts.wait ?? true);
  }

  // ── Change Detection ────────────────────────────────────────────────────────

  /**
   * Detect and diff content changes on a page.
   */
  async changeDetection(url: string, opts: ChangeDetectionOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      url,
      main_content: opts.mainContent ?? true,
      include_diff: opts.includeDiff ?? true,
      timeout: opts.timeout ?? 60,
    };
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("change-detection", body, opts.wait ?? true);
  }

  // ── Deep Research ───────────────────────────────────────────────────────────

  /**
   * Scrape multiple pages and synthesize findings with an LLM.
   */
  async deepResearch(query: string, urls: string[], opts: DeepResearchOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      query,
      urls,
      max_tokens: opts.maxTokens ?? 4096,
      timeout: opts.timeout ?? 180,
    };
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("deep-research", body, opts.wait ?? true);
  }

  // ── Agent ───────────────────────────────────────────────────────────────────

  /**
   * AI autonomous navigation agent that clicks, scrolls and fills forms.
   */
  async agent(url: string, prompt: string, opts: AgentOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      url,
      prompt,
      max_steps: opts.maxSteps ?? 10,
      max_pages: opts.maxPages ?? 5,
      allow_navigation: opts.allowNavigation ?? true,
      include_screenshots: opts.includeScreenshots ?? false,
      timeout: opts.timeout ?? 120,
    };
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("agent", body, opts.wait ?? true);
  }

  // ── Smart Extract ───────────────────────────────────────────────────────────

  /**
   * Guided extraction: analyzes the site structure, plans interactions, returns complete data.
   */
  async smartExtract(url: string, goal: string, opts: SmartExtractOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      url,
      goal,
      hints: opts.hints ?? [],
      output_format: opts.outputFormat ?? "markdown",
      max_pages: opts.maxPages ?? 20,
      timeout: opts.timeout ?? 60,
    };
    if (opts.schema) body["schema"] = opts.schema;
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("smart-extract", body, opts.wait ?? true);
  }

  // ── Rank ────────────────────────────────────────────────────────────────────

  /**
   * Check where a domain ranks for a keyword in search results.
   */
  async rank(keyword: string, domain: string, opts: RankOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      keyword,
      domain,
      engine: opts.engine ?? "google",
      lang: opts.lang ?? "en",
      country: opts.country ?? "us",
      depth: opts.depth ?? 100,
      timeout: opts.timeout ?? 60,
    };
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("rank", body, opts.wait ?? true);
  }

  // ── Dataset ─────────────────────────────────────────────────────────────────

  /**
   * Auto-paginate a listing page and extract all items as a structured dataset.
   */
  async dataset(url: string, goal: string, opts: DatasetOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      url,
      goal,
      max_pages: opts.maxPages ?? 10,
      output_format: opts.outputFormat ?? "json",
      timeout: opts.timeout ?? 180,
    };
    if (opts.schema) body["schema"] = opts.schema;
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("dataset", body, opts.wait ?? true);
  }

  // ── Monitor ─────────────────────────────────────────────────────────────────

  /**
   * Create a persistent URL monitor that calls a webhook when content changes.
   */
  async monitorCreate(url: string, callbackUrl: string, opts: MonitorCreateOptions = {}): Promise<unknown> {
    return this._request("POST", "/api/monitor", {
      url,
      callback_url: callbackUrl,
      interval_minutes: opts.intervalMinutes ?? 60,
      main_content: opts.mainContent ?? true,
      timeout: opts.timeout ?? 60,
    });
  }

  /**
   * List all active monitor subscriptions.
   */
  async monitorList(): Promise<unknown> {
    return this._request("GET", "/api/monitor");
  }

  /**
   * Deactivate a monitor subscription.
   */
  async monitorDelete(subscriptionId: string): Promise<unknown> {
    return this._request("DELETE", `/api/monitor/${subscriptionId}`);
  }

  // ── Social Media ────────────────────────────────────────────────────────────

  /**
   * Extract public Instagram data.
   *
   * @param resource - "profile" | "post" | "hashtag" | "search"
   * @param target   - username, post shortcode, hashtag, or search term
   *
   * @example
   * // Profile
   * const profile = await md.instagram("profile", "instagram");
   * // Hashtag
   * const posts = await md.instagram("hashtag", "webdev", { limit: 30 });
   */
  async instagram(resource: InstagramResource, target: string, opts: SocialOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      resource,
      target,
      limit: opts.limit ?? 20,
    };
    if (opts.sessionCookie) body["session_cookie"] = opts.sessionCookie;
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("instagram", body, opts.wait ?? true);
  }

  /**
   * Extract public X (Twitter) data.
   *
   * @param resource - "profile" | "post" | "search"
   * @param target   - username, tweet ID, or search term
   *
   * @example
   * // Profile
   * const profile = await md.x("profile", "elonmusk");
   * // Search
   * const results = await md.x("search", "web scraping tools", { limit: 25 });
   */
  async x(resource: XResource, target: string, opts: SocialOptions = {}): Promise<unknown> {
    const body: Record<string, unknown> = {
      resource,
      target,
      limit: opts.limit ?? 20,
    };
    if (opts.sessionCookie) body["session_cookie"] = opts.sessionCookie;
    if (opts.callbackUrl) body["callback_url"] = opts.callbackUrl;
    return this._submit("x", body, opts.wait ?? true);
  }

  // ── Job Management ──────────────────────────────────────────────────────────

  /**
   * Get the current status of any async job.
   */
  async getJobStatus(queue: string, jobId: string): Promise<JobStatus> {
    return this._request<JobStatus>("GET", `/api/${queue}/${jobId}`);
  }

  /**
   * Cancel a running async job.
   */
  async cancelJob(queue: string, jobId: string): Promise<unknown> {
    return this._request("DELETE", `/api/${queue}/${jobId}`);
  }
}
