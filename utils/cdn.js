// Utility to rewrite storage/video/image URLs to Bunny CDN pull zone
// Rules:
// - If URL host matches Firebase Storage (googleapis) or ends with .firebasestorage.app, rewrite the entire hostname to NEXT_PUBLIC_CDN_HOST
// - If URL host is storage.googleapis.com, rewrite similarly
// - Otherwise return as-is

const CDN_HOST = process.env.NEXT_PUBLIC_CDN_HOST;

export function rewriteToCDN(url) {
  try {
    if (!url || !CDN_HOST) return url;

    const urlObj = new URL(url);
    const host = urlObj.hostname;

    const exactHosts = new Set([
      "firebasestorage.googleapis.com",
      "storage.googleapis.com",
    ]);

    const isFirebaseAppHost = host.endsWith(".firebasestorage.app");

    if (exactHosts.has(host) || isFirebaseAppHost) {
      urlObj.hostname = CDN_HOST; // replace entire hostname with CDN host
      urlObj.protocol = "https:"; // ensure https
      return urlObj.toString();
    }

    // Fallback: simple string replacement for legacy patterns
    const patterns = [
      "firebasestorage.googleapis.com",
      "storage.googleapis.com",
    ];
    for (const p of patterns) {
      if (url.includes(p)) {
        return url.replace(p, CDN_HOST);
      }
    }

    return url;
  } catch (e) {
    // Final safety fallback: non-URL-safe replacement
    try {
      if (!CDN_HOST) return url;
      const patterns = [
        "firebasestorage.googleapis.com",
        "storage.googleapis.com",
      ];
      for (const p of patterns) {
        if (url.includes(p)) {
          return url.replace(p, CDN_HOST);
        }
      }
      return url;
    } catch {
      return url;
    }
  }
}