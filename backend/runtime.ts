// Read only named server environment values; never expose them to the client.
export function readEnv(name: string): string {
  try {
    const runtime = globalThis as typeof globalThis & {
      Deno?: { env: { get(name: string): string | undefined } };
      process?: { env: Record<string, string | undefined> };
    };
    return runtime.Deno ? runtime.Deno.env.get(name) ?? "" : runtime.process?.env[name] ?? "";
  } catch { return ""; }
}
