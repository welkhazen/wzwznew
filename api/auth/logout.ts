import { json } from "../_lib/authServer";
import { isTrustedOrigin } from "../_lib/requestSecurity";
import { buildClearedSessionCookie } from "../_lib/sessionAuth";

export const config = { runtime: "nodejs" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": buildClearedSessionCookie() },
  });
}
