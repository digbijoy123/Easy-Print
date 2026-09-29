import { del, get, put } from "@vercel/blob";

const ACCESS = "private" as const;

export async function writeJson<T>(pathname: string, value: T) {
  await put(pathname, JSON.stringify(value), {
    access: ACCESS,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: ACCESS });
  if (!result || result.statusCode !== 200 || !result.stream) return null;

  const text = await new Response(result.stream).text();
  return JSON.parse(text) as T;
}

export async function deleteBlob(pathname: string) {
  await del(pathname);
}

export function blobPath(...parts: string[]) {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}
