const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
};

export const json = <T>(data: T, status = 200) =>
  Response.json(data, { status, headers: CORS });

export const ok = () => json({ ok: true });