import { readEnv } from "./runtime.ts";
import type { JsonStore } from "./jsonStore.ts";

let hostedStore: Promise<JsonStore> | undefined;
export async function runtimeJsonStore(): Promise<JsonStore | null> {
  const configured = readEnv("BLOB_READ_WRITE_TOKEN") || readEnv("BLOB_STORE_ID");
  if (!configured) {
    if (readEnv("VERCEL")) throw Error("Durable private Blob storage is not configured");
    return null;
  }
  hostedStore ??= import("./blobStore.ts").then(({ createBlobStore }) => createBlobStore());
  return hostedStore;
}
