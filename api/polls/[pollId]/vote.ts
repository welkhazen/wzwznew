export const config = { runtime: "edge" };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let body: { optionId?: unknown };
  try {
    body = (await request.json()) as { optionId?: unknown };
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!body?.optionId || typeof body.optionId !== "string") {
    return json({ error: "missing_option_id" }, 400);
  }

  return json({ ok: true });
}
