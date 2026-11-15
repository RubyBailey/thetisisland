/**
 * Cloudflare Worker: Fire hazard rating scraper.
 *
 * - Cron trigger (hourly): scrapes thetisislandfire.ca for the current
 *   fire danger rating by matching the hazard-bar image filename.
 * - HTTP endpoint: GET /rating returns the latest rating as JSON.
 *
 * KV key "fire-rating" stores:
 *   { rating: string, updated_at: string, consecutive_failures: number }
 *
 * Valid ratings: LOW, MODERATE, HIGH, EXTREME
 */

interface Env {
  FIRE_KV: KVNamespace;
  ALLOWED_ORIGINS: string;
}

interface RatingData {
  rating: string;
  updated_at: string;
  consecutive_failures: number;
}

const VALID_RATINGS = ["LOW", "MODERATE", "HIGH", "EXTREME"] as const;
const SCRAPE_URL = "https://www.thetisislandfire.ca/";
const KV_KEY = "fire-rating";
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

function readRatingData(raw: string | null): RatingData | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const data = parsed as Record<string, unknown>;
    if (typeof data.rating !== "string" || !VALID_RATINGS.some((r) => r === data.rating)) return null;
    if (typeof data.updated_at !== "string" || !Number.isFinite(Date.parse(data.updated_at))) return null;
    if (typeof data.consecutive_failures !== "number" || !Number.isInteger(data.consecutive_failures) || data.consecutive_failures < 0) return null;
    return data as unknown as RatingData;
  } catch {
    return null;
  }
}

export default {
  // --- HTTP handler: only public read access to the current rating ---
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const corsHeaders: Record<string, string> = {
      "Vary": "Origin",
      "Cache-Control": "public, max-age=300", // 5-minute browser cache
    };
    // No CORS authorization for unknown origins; direct GETs without Origin remain public.
    if (origin && allowedOrigins.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    if (url.pathname !== "/rating") {
      // The old /scrape route has been deliberately removed. Cron is the only updater.
      return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    if (request.method === "OPTIONS") {
      if (!origin || !allowedOrigins.includes(origin)) {
        return new Response(null, { status: 403, headers: { "Cache-Control": "no-store" } });
      }
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          "Cache-Control": "no-store",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { ...corsHeaders, "Allow": "GET, OPTIONS", "Cache-Control": "no-store" },
      });
    }

    return handleRating(env, corsHeaders);
  },

  // --- Cron handler: scrape every hour ---
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await scrapeAndStore(env);
  },
} satisfies ExportedHandler<Env>;

/**
 * Return the current rating from KV as JSON.
 * If data is stale (>24h) or missing, return a fallback response.
 */
async function handleRating(env: Env, headers: Record<string, string>): Promise<Response> {
  const raw = await env.FIRE_KV.get(KV_KEY);

  const data = readRatingData(raw);
  if (!data) {
    return jsonResponse({ rating: null, stale: true, message: "No valid data available" }, headers);
  }

  const age = Date.now() - Date.parse(data.updated_at);
  const stale = age > STALE_THRESHOLD_MS || age < -5 * 60 * 1000;

  return jsonResponse(
    {
      rating: stale ? null : data.rating,
      stale,
      updated_at: data.updated_at,
      message: stale ? "Data is older than 24 hours" : undefined,
    },
    headers,
  );
}

/**
 * Scrape thetisislandfire.ca for the current hazard rating.
 * Looks for an image src matching: hazard-bar-(LOW|MODERATE|HIGH|EXTREME).jpg
 */
async function scrapeAndStore(env: Env): Promise<void> {
  // Load previous state for failure tracking
  const prevRaw = await env.FIRE_KV.get(KV_KEY);
  const prev = readRatingData(prevRaw);
  let consecutiveFailures = prev?.consecutive_failures ?? 0;

  try {
    const response = await fetch(SCRAPE_URL, {
      headers: {
        "User-Agent": "ThetisIslandCommunity-FireHazardChecker/1.0 (thetisisland.net; contact unger.karl11@gmail.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Match the hazard bar image filename
    const match = html.match(/hazard-bar-(LOW|MODERATE|HIGH|EXTREME)\.jpg/i);

    if (!match) {
      throw new Error("Could not find hazard-bar image in page HTML");
    }

    const rating = match[1].toUpperCase();

    if (!VALID_RATINGS.includes(rating as (typeof VALID_RATINGS)[number])) {
      throw new Error(`Unexpected rating value: ${rating}`);
    }

    // Success — store the result and reset failure counter
    const data: RatingData = {
      rating,
      updated_at: new Date().toISOString(),
      consecutive_failures: 0,
    };

    await env.FIRE_KV.put(KV_KEY, JSON.stringify(data));
    console.log(`Fire rating updated: ${rating}`);
  } catch (err) {
    consecutiveFailures++;
    console.error(`Scrape failed (${consecutiveFailures} consecutive): ${err}`);

    // Update the failure counter in KV (preserve last known good rating)
    if (prev) {
      prev.consecutive_failures = consecutiveFailures;
      await env.FIRE_KV.put(KV_KEY, JSON.stringify(prev));
    }

    // After 3 consecutive failures, we'd send an alert email.
    // Cloudflare Workers can't send email natively, so this would use
    // a Formspree endpoint or Cloudflare Email Workers in production.
    // For now, log loudly — we'll wire up alerts after deployment.
    if (consecutiveFailures >= 3) {
      console.error(
        `ALERT: Fire hazard scraper has failed ${consecutiveFailures} times in a row. ` +
        `Last successful rating: ${prev?.rating ?? "unknown"} at ${prev?.updated_at ?? "unknown"}.`,
      );
    }
  }
}

function jsonResponse(body: Record<string, unknown>, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });
}
