# MarkUDown Node.js / TypeScript SDK

[![npm version](https://img.shields.io/npm/v/markudown-sdk.svg)](https://www.npmjs.com/package/markudown-sdk)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK for [MarkUDown](https://scrapetechnology.com/markudown) — AI data extraction infrastructure that turns any website into structured, ready-to-use data.

Requires **Node 18+** (uses native `fetch`). Zero dependencies.

Get a free API key at [scrapetechnology.com/markudown/register](https://scrapetechnology.com/markudown/register) — **500 free credits, no credit card**. Full reference: [scrapetechnology.com/markudown/docs](https://scrapetechnology.com/markudown/docs).

## Installation

```bash
npm install markudown-sdk
# or
pnpm add markudown-sdk
# or
yarn add markudown-sdk
```

## Quick Start

```typescript
import { MarkUDown } from "markudown-sdk";

const md = new MarkUDown({ apiKey: "your-api-key" });

// Scrape a page
const result = await md.scrape("https://example.com");

// Search the web
const results = await md.search("best web scraping tools 2025", {
  engine: "google",
  limit: 5,
});

// Extract structured data
const data = await md.extract(
  "https://shop.example.com/products",
  [
    { name: "title",  type: "string", active: true },
    { name: "price",  type: "float",  active: true },
    { name: "rating", type: "float",  active: true },
  ],
  { extractQuery: "Extract all product listings" }
);
```

Get your API key at [scrapetechnology.com/markudown/register](https://scrapetechnology.com/markudown/register). New accounts include **500 free credits** (no credit card).

---

## Configuration

```typescript
const md = new MarkUDown({
  apiKey: "your-api-key",
  baseUrl: "https://api.scrapetechnology.com", // default
  timeout: 120_000,      // HTTP timeout in ms (default: 120 000)
  pollInterval: 2_000,   // ms between status polls (default: 2 000)
  pollTimeout: 300_000,  // max ms to wait for a job (default: 300 000)
});
```

Async endpoints (everything except `scrape`, `screenshot`, `createSchema` and the monitor calls) poll until the job finishes and return the job object — `{ success, id, status: "completed", data: <job result> }` — so the output is under `result.data`. Pass `wait: false` to return the job ID immediately:

```typescript
const job = await md.crawl("https://example.com", { wait: false }) as { id: string };

// Check later
const status = await md.getJobStatus("crawl", job.id);
```

---

## API Reference

### `scrape(url, opts?)` → Promise\<unknown\>

Scrape a single URL. Returns result immediately.

```typescript
const result = await md.scrape("https://example.com", {
  mainContent: true,
  includeLinks: true,
  excludeTags: ["header", "nav", "footer"],
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | number | 60 | Timeout in seconds |
| `excludeTags` | string[] | `["header","nav","footer"]` | HTML tags to strip |
| `mainContent` | boolean | true | Extract only main content |
| `includeLinks` | boolean | false | Include hyperlinks |
| `includeHtml` | boolean | false | Include raw HTML |

---

### `screenshot(url, opts?)` → Promise\<unknown\>

Take a screenshot of a URL.

```typescript
const result = await md.screenshot("https://example.com");
// result.screenshot → base64 PNG
```

---

### `map(url, opts?)` → Promise\<unknown\>

Discover all URLs on a website.

```typescript
const result = await md.map("https://example.com", {
  maxUrls: 500,
  allowedWords: ["product", "shop"],
  blockedWords: ["blog", "careers"],
});
```

---

### `crawl(url, opts?)` → Promise\<unknown\>

Crawl a website recursively and extract content from every page.

```typescript
const result = await md.crawl("https://docs.example.com", {
  maxDepth: 3,
  limit: 50,
  includeOnly: ["*guide*", "*tutorial*"],
});
```

| Option | Type | Default |
|--------|------|---------|
| `maxDepth` | number | 2 |
| `limit` | number | 10 |
| `timeout` | number | 60 |
| `includeLinks` | boolean | false |
| `blockedWords` | string[] | [] |
| `includeOnly` | string[] | [] |
| `mainContent` | boolean | true |
| `callbackUrl` | string | — |
| `wait` | boolean | true |

---

### `extract(url, schema, opts?)` → Promise\<unknown\>

Schema-based structured data extraction with AI.

```typescript
const result = await md.extract(
  "https://shop.example.com",
  [
    { name: "title",    type: "string", active: true },
    { name: "price",    type: "float",  active: true },
    { name: "in_stock", type: "string", active: true },
  ],
  {
    extractQuery: "Product listings with title, price and availability",
    extractionScope: "whole_site",
  }
);
```

---

### `createSchema(query)` → Promise\<unknown\>

Generate an extraction schema automatically from a natural language description.

```typescript
const schema = await md.createSchema(
  "Extract all products from https://shop.example.com with title, price and rating"
);
```

---

### `promptExtract(url, prompt, opts?)` → Promise\<unknown\>

Extract data using a natural language prompt — no schema required.

```typescript
const result = await md.promptExtract(
  "https://example.com/team",
  "List all team members with their name, title and LinkedIn URL"
);
```

---

### `batchScrape(urls, opts?)` → Promise\<unknown\>

Scrape multiple URLs in parallel.

```typescript
const result = await md.batchScrape([
  "https://example.com/page-1",
  "https://example.com/page-2",
  "https://example.com/page-3",
]);
```

---

### `search(query, opts?)` → Promise\<unknown\>

Web search with optional scraping of result pages.

```typescript
const result = await md.search("open source web scraping", {
  engine: "all",       // "google" | "bing" | "duckduckgo" | "all"
  limit: 10,
  scrapeResults: true,
  lang: "en",
  country: "us",
});
```

---

### `rss(url, opts?)` → Promise\<unknown\>

Generate an RSS feed from any web page.

```typescript
const result = await md.rss("https://blog.example.com", {
  maxItems: 20,
  title: "My Blog Feed",
});
```

---

### `changeDetection(url, opts?)` → Promise\<unknown\>

Detect and diff content changes on a page.

```typescript
const result = await md.changeDetection("https://example.com/pricing", {
  includeDiff: true,
});
// result.data.data.changed           → true/false
// result.data.data.previous_markdown → previous content (when changed and includeDiff)
```

---

### `deepResearch(query, urls, opts?)` → Promise\<unknown\>

Scrape multiple pages and synthesize findings with an LLM.

```typescript
const result = await md.deepResearch(
  "What are the pricing differences between these competitors?",
  [
    "https://competitor-a.com/pricing",
    "https://competitor-b.com/pricing",
  ],
  { maxTokens: 4096 }
);
```

---

### `agent(url, prompt, opts?)` → Promise\<unknown\>

AI autonomous navigation agent that clicks, scrolls, and fills forms.

```typescript
const result = await md.agent(
  "https://example.com",
  "Find the contact email on this website",
  { maxSteps: 15, includeScreenshots: false }
);
```

---

### `smartExtract(url, goal, opts?)` → Promise\<unknown\>

Guided extraction: analyzes the site, plans interactions, and returns complete data.

```typescript
const result = await md.smartExtract(
  "https://example.com/products",
  "Extract all products with name, price, and description",
  {
    outputFormat: "json",
    hints: ["Click 'Load more' button to get all items"],
  }
);
```

---

### `rank(keyword, domain, opts?)` → Promise\<unknown\>

Check where a domain ranks for a keyword in search results.

```typescript
const result = await md.rank("web scraping api", "scrapetechnology.com", {
  engine: "google",
  country: "us",
  depth: 100,
});
// result.data.position → e.g. 4
```

---

### `dataset(url, goal, opts?)` → Promise\<unknown\>

Auto-paginate a listing page and extract all items as a structured dataset.

```typescript
const result = await md.dataset(
  "https://books.toscrape.com",
  "Extract all books with title, price, rating and availability",
  { maxPages: 10, outputFormat: "json" }
);
```

---

### Monitor

```typescript
// Create
const sub = await md.monitorCreate(
  "https://example.com/pricing",
  "https://yourapp.com/webhook",
  { intervalMinutes: 60 }
);
const subId = (sub as { subscription_id: string }).subscription_id;

// List
const monitors = await md.monitorList();

// Delete
await md.monitorDelete(subId);
```

---

### Job Management

```typescript
// Get status
const status = await md.getJobStatus("crawl", "job-id");
// status.status → "pending" | "processing" | "completed" | "failed"

// Cancel
await md.cancelJob("agent", "job-id");
```

---

## Error Handling

```typescript
import { MarkUDown, MarkUDownError, RateLimitError, InsufficientCreditsError } from "markudown-sdk";

const md = new MarkUDown({ apiKey: "your-key" });

try {
  const result = await md.scrape("https://example.com");
} catch (e) {
  if (e instanceof RateLimitError) {
    console.log("Rate limit hit — wait a minute and retry");
  } else if (e instanceof InsufficientCreditsError) {
    console.log("Out of credits — upgrade at scrapetechnology.com");
  } else if (e instanceof MarkUDownError) {
    console.log(`API error ${e.statusCode}: ${e.message}`);
  }
}
```

> **Note:** a key the API does not recognise is not rejected — it is served as the anonymous free tier (20 requests/day), and a 429 "Free tier daily limit exceeded" follows once that is used up. If you see that message with a paid key, check the key in your dashboard. Only a missing key returns 401.

---

## Build

```bash
npm install
npm run build       # compiles to dist/
npm run typecheck   # type-check without emitting
```

---

## Links

- [Website](https://scrapetechnology.com/markudown)
- [Documentation](https://scrapetechnology.com/markudown/docs)
- [GitHub](https://github.com/Scrape-Technology/markudown-sdk-node)
- [MCP Server](https://github.com/Scrape-Technology/markudown-mcp)
