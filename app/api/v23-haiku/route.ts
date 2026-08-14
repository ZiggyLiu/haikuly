import type { Haiku } from "../../haiku.ts";
import { POST as generateStrictHaiku } from "../haiku/route.ts";
import { illustrationForContent } from "../modern-haiku/route.ts";

type RequestBody = {
  mode?: unknown;
  keyword?: unknown;
};

type StrictHaikuResponse = {
  haiku?: Haiku;
  [key: string]: unknown;
};

export async function POST(request: Request) {
  let requestBody: RequestBody = {};
  try {
    requestBody = await request.clone().json() as RequestBody;
  } catch {
    // The strict generator returns the authoritative request error.
  }

  const response = await generateStrictHaiku(request);
  const result = await response.json() as StrictHaikuResponse;
  if (!response.ok || !result.haiku) {
    return Response.json(result, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const keyword = requestBody.mode === "keyword" && typeof requestBody.keyword === "string"
    ? requestBody.keyword.trim()
    : null;
  const haiku: Haiku = {
    ...result.haiku,
    illustration: illustrationForContent(result.haiku.lines, keyword, result.haiku.seed),
  };

  return Response.json({
    ...result,
    haiku,
    form: "5-7-5",
    version: 23,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
