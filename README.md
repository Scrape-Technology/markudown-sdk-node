# MarkUDown Node.js / TypeScript SDK

TypeScript SDK for [MarkUDown](https://scrapetechnology.com/markudown) — AI data extraction infrastructure that turns any website into structured, ready-to-use data.

Requires **Node 18+** (uses native `fetch`). Zero dependencies.

## Installation

```bash
npm install markudown
# or
pnpm add markudown
# or
yarn add markudown
```

## Quick Start

```typescript
import { MarkUDown } from "markudown";

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

Get your API key at [scrapetechnology.com/markudown](https://scrapetechnology.com/markudown). New accounts include **500 free credits**.

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

All async endpoints accept `wait: false` to return the job ID immediately:

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
// result.image → base64 PNG
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
// result.data.changed → true/false
// result.data.diff    → diff string
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

### `instagram(resource, target, opts?)` → Promise\<unknown\>

Extract public Instagram data.

| `resource` | `target` | Description |
|------------|----------|-------------|
| `"profile"` | username | Profile info + recent posts |
| `"post"` | shortcode | Single post |
| `"hashtag"` | hashtag | Recent posts for a hashtag |
| `"search"` | keyword | Search results |

```typescript
// Profile
const profile = await md.instagram("profile", "instagram");

// Hashtag
const posts = await md.instagram("hashtag", "webdev", { limit: 30 });

// Search
const results = await md.instagram("search", "coffee shops NYC");
```

---

### `x(resource, target, opts?)` → Promise\<unknown\>

Extract public X (Twitter) data.

| `resource` | `target` | Description |
|------------|----------|-------------|
| `"profile"` | username | Profile info + recent tweets |
| `"post"` | tweet ID | Single tweet |
| `"search"` | keyword | Search results |

```typescript
const profile = await md.x("profile", "elonmusk");
const results = await md.x("search", "web scraping tools", { limit: 25 });
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
import { MarkUDown, MarkUDownError, RateLimitError, InsufficientCreditsError } from "markudown";

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
- [GitHub](https://github.com/Scrape-Technology/MarkUDown-Engine)
- [MCP Server](https://github.com/Scrape-Technology/markudown-mcp)
