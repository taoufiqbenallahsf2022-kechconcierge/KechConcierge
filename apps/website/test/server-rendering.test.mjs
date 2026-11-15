import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const website = fileURLToPath(new URL("../", import.meta.url));
const hiddenTypes = new Set(["PACK", "SPA"]);
const categories = { VILLA: "villas", TRANSPORTATION: "transportation", SWIMMINGPOOL: "beachclubs", NIGHTCLUB: "nightclubs", PACK: "packs", ACTIVITY: "experiences", RESTAURANT: "restaurants", SPA: "spa" };
const homeKeys = { VILLA: "villa", TRANSPORTATION: "transportation", SWIMMINGPOOL: "swimmingpool", NIGHTCLUB: "nightclub", PACK: "pack", ACTIVITY: "activity", RESTAURANT: "restaurant", SPA: "spa" };
function product(type, language, page = 1) {
  return { id: `fixture-${type}`, type, uniqueCode: `fixture-${type.toLowerCase()}`, title: `SSR ${language} ${type} page ${page}`, subtitle: `Subtitle ${language}`, description: `Full public description ${language} ${type}`, address: "Marrakech", order: 1, thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", thumbnailAlt: `Photo ${language}`, image1: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", imageAlts: {}, priceEuro: 750, priceWithDriverEuro: type === "VILLA" ? 820 : null, priceWithDriverLabel: "Driver included", currency: "EUR", priceTitle: "From", details: [{ label: "Guests", value: "6" }], tags: [], plans: [{ id: "fixture-plan", uniqueCode: "fixture-plan", title: "Fixture service option", description: "Plan description", salePrice: 120, currency: "EUR", pricingUnit: "PER_VEHICLE", options: [{ id: "fixture-inclusion", title: "Private driver", order: 1 }] }] };
}
const visible = html => html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test("Production HTML contains public content and crawlable links across languages and product types", { timeout: 120000 }, async () => {
  const counts = new Map();
  const api = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    counts.set(req.url, (counts.get(req.url) || 0) + 1);
    const language = (url.searchParams.get("lang") || "en").toUpperCase();
    const send = (data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
    if (url.pathname === "/api/website-configuration/hero") return send({ heroSlides: [{ id: "fixture-hero", mediaType: "IMAGE", mediaUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", title: `SSR ${language} homepage heading`, description: `Homepage description ${language}`, eyebrow: "Marrakech", buttonLabel: "Explore villas", buttonUrl: "/villas", altText: "Villa", isActive: true }], settings: { durationMs: 7000, transitionMs: 1000 } });
    if (url.pathname === "/api/products/home") return send(Object.fromEntries(Object.keys(categories).map(type => [homeKeys[type], [product(type, language)]])));
    if (url.pathname.startsWith("/api/products/details/")) {
      if (url.pathname.endsWith("/missing")) return send({ message: "Not found" }, 404);
      if (url.pathname.endsWith("/temporary-failure")) return send({ message: "Temporary failure" }, 503);
      return send(product(url.searchParams.get("type"), language));
    }
    const type = url.pathname.split("/").pop();
    if (categories[type]) { const page = Number(url.searchParams.get("page") || 1); return send({ items: [product(type, language, page)], page, perPage: 12, total: 13, totalPages: 2 }); }
    return send({ message: "Not found" }, 404);
  });
  api.listen(0, "127.0.0.1"); await once(api, "listening");
  const reservation = createServer(); reservation.listen(0, "127.0.0.1"); await once(reservation, "listening");
  const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const base = `http://localhost:${port}`;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "localhost"], { cwd: website, env: { ...process.env, API_URL: `http://127.0.0.1:${api.address().port}`, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let logs = ""; child.stdout.on("data", data => { logs = (logs + data).slice(-12000); }); child.stderr.on("data", data => { logs = (logs + data).slice(-12000); });
  try {
    for (let attempt = 0; !logs.includes("Ready") && attempt < 100; attempt++) { assert.equal(child.exitCode, null, logs); await wait(200); }
    assert.ok(logs.includes("Ready"), logs);
    for (const language of ["en", "fr", "es", "it", "de", "pt"]) {
      const prefix = language === "en" ? "" : `/${language}`;
      const homeResponse = await fetch(`${base}${prefix || "/"}`);
      const home = visible(await homeResponse.text());
      assert.equal(home.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1], `SSR ${language.toUpperCase()} homepage heading`, `${homeResponse.url} initial heading; API requests: ${JSON.stringify([...counts.keys()])}`);
      for (const type of Object.keys(categories).filter(type => !hiddenTypes.has(type))) {
        assert.ok(home.includes(`SSR ${language.toUpperCase()} ${type} page 1`));
        assert.ok(home.includes(`href="${prefix}/${categories[type]}/fixture-${type.toLowerCase()}"`));
      }
      assert.ok(!home.includes(`SSR ${language.toUpperCase()} PACK`), "Hidden packs are not promoted on the homepage");
      for (const [type, category] of Object.entries(categories)) {
        if (hiddenTypes.has(type)) {
          assert.equal((await fetch(`${base}${prefix}/${category}`)).status, 404, `${language}/${category} is unavailable publicly`);
          assert.equal((await fetch(`${base}${prefix}/${category}/fixture-${type.toLowerCase()}`)).status, 404, "Hidden product URLs are unavailable too");
          continue;
        }
        const listing = visible(await fetch(`${base}${prefix}/${category}?page=2`).then(r => r.text()));
        assert.ok(listing.includes(`SSR ${language.toUpperCase()} ${type} page 2`), `${language}/${category} initial listing`);
        if (language === "en" && ["VILLA", "TRANSPORTATION"].includes(type)) {
          const expected = type === "VILLA" ? "Luxury Villa Rentals in Marrakech | Moorish Concierge" : "Private Transfers & Chauffeur Services in Marrakech | Moorish Concierge";
          assert.equal(listing.match(/<title[^>]*>(.*?)<\/title>/)?.[1].replaceAll("&amp;", "&"), expected);
          assert.equal(listing.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1], type === "VILLA" ? "Villas" : "Transportation", "SEO titles do not alter the visible category heading");
        }
        assert.ok(listing.includes('aria-current="page"'), "Pagination retains its current-page marker");
        const path = `/api/products/details/fixture-${type.toLowerCase()}?lang=${language.toUpperCase()}&type=${type}`;
        const before = counts.get(path) || 0;
        const detail = visible(await fetch(`${base}${prefix}/${category}/fixture-${type.toLowerCase()}`).then(r => r.text()));
        assert.match(detail, new RegExp(`<h1[^>]*>SSR ${language.toUpperCase()} ${type} page 1</h1>`));
        assert.ok(detail.includes(`Full public description ${language.toUpperCase()} ${type}`));
        assert.ok(detail.includes("750"));
        assert.ok(detail.includes('data-track-component="product"'));
        assert.equal(counts.get(path) - before, 1, "Metadata and body share one product API response per request");
      }
    }
    const sitemap = await fetch(`${base}/sitemap.xml`).then(r => r.text());
    assert.ok(!/\/(packs|spa)(?:[\/<])/.test(sitemap), "Hidden categories and products are not in the sitemap");
    for (const alias of ["pack", "packs", "spa"]) {
      assert.equal((await fetch(`${base}/fr/${alias}`)).status, 404, "Hidden aliases cannot reopen a category");
    }
    const missing = await fetch(`${base}/villas/missing`); assert.equal(missing.status, 404);
    const temporary = await fetch(`${base}/villas/temporary-failure`); assert.equal(temporary.status, 200, "Temporary upstream failures preserve browser retry fallback");
    assert.ok(!visible(await temporary.text()).includes("SSR EN VILLA"), "A failed page must not reuse another request's product");
    assert.ok(!logs.includes("ReferenceError"), logs);
    await Promise.all(["en", "fr", "de", "it", "es", "pt"].map(async language => {
      const prefix = language === "en" ? "" : `/${language}`;
      const html = visible(await fetch(`${base}${prefix}/transportation/fixture-transportation`).then(r => r.text()));
      assert.equal(html.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1], `SSR ${language.toUpperCase()} TRANSPORTATION page 1`, "Concurrent requests keep their own language");
    }));
  } catch (error) { console.error(logs); throw error; } finally {
    child.kill();
    await Promise.race([once(child, "exit"), wait(5000)]);
    api.closeAllConnections(); await new Promise(resolve => api.close(resolve));
  }
});
