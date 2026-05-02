import { handlers } from "@/auth";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function corsHeaders(req: Request): Headers {
  const origin = req.headers.get("origin") || FRONTEND_URL;
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Auth-Return-Redirect, X-CSRF-Token, X-Requested-With"
  );
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

function addCorsHeaders(original: Response, req: Request): Response {
  const newHeaders = new Headers(original.headers);
  corsHeaders(req).forEach((value, key) => newHeaders.set(key, value));
  return new Response(original.body, {
    status: original.status,
    statusText: original.statusText,
    headers: newHeaders,
  });
}

export const GET = async (req: Request) => {
  const res = await (handlers as any).GET(req);
  return addCorsHeaders(res, req);
};

export const POST = async (req: Request) => {
  const res = await (handlers as any).POST(req);

  // ⚡ Force redirect to the frontend portal
  if (res.status === 302) {
    const newHeaders = new Headers(res.headers);
    newHeaders.set("Location", `${FRONTEND_URL}/portal`);
    return addCorsHeaders(
      new Response(res.body, { status: 302, statusText: res.statusText, headers: newHeaders }),
      req
    );
  }

  return addCorsHeaders(res, req);
};

export const OPTIONS = (req: Request) => {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
};