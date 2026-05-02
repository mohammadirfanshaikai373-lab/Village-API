// lib/cors.ts
export function corsHeaders(request: Request, allowedOrigins?: string[]) {
  const origin = request.headers.get("origin") || "";
  const headers = new Headers();
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Auth-Return-Redirect, X-CSRF-Token, X-Requested-With"
  );
  headers.set("Access-Control-Max-Age", "86400");

  // If a whitelist is provided, use it; otherwise allow the exact origin of the request
  if (allowedOrigins && allowedOrigins.length > 0) {
    if (allowedOrigins.includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
  } else {
    // In development or when you want to allow all origins (be careful in production)
    headers.set("Access-Control-Allow-Origin", origin || "*");
  }
  return headers;
}

export function addCorsHeaders(response: Response, request: Request) {
  const headers = corsHeaders(request);
  const newHeaders = new Headers(response.headers);
  headers.forEach((value, key) => newHeaders.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}