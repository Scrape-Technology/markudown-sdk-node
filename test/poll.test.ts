import { afterEach, describe, expect, it, vi } from "vitest";
import { JobFailedError, MarkUDown, MarkUDownError } from "../src/index.js";

function mockApi(status: unknown, httpStatus = 200) {
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: { method: string }) => {
    const body = init.method === "POST" ? { success: true, id: "j1", url: "/api/crawl/j1" } : status;
    return new Response(JSON.stringify(body), { status: init.method === "POST" ? 200 : httpStatus });
  }));
}

const md = () => new MarkUDown({ apiKey: "k", baseUrl: "http://test", pollInterval: 0, pollTimeout: 5_000 });

afterEach(() => vi.unstubAllGlobals());

describe("_poll", () => {
  it("stops with 404 on status not_found", async () => {
    mockApi({ success: false, id: "j1", status: "not_found" });
    await expect(md().crawl("https://example.com")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("stops with 404 on HTTP 404", async () => {
    mockApi({ detail: "Job not found" }, 404);
    await expect(md().crawl("https://example.com")).rejects.toBeInstanceOf(MarkUDownError);
  });

  it("throws JobFailedError on failed", async () => {
    mockApi({ success: false, id: "j1", status: "failed", error: "boom" });
    await expect(md().crawl("https://example.com")).rejects.toBeInstanceOf(JobFailedError);
  });

  it("gives up at pollTimeout", async () => {
    mockApi({ success: false, id: "j1", status: "processing" });
    const client = new MarkUDown({ apiKey: "k", baseUrl: "http://test", pollInterval: 1, pollTimeout: 20 });
    await expect(client.crawl("https://example.com")).rejects.toThrow(/timed out/);
  });
});
