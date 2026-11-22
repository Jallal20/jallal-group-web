/**
 * Patch undici's fetch to remove the ALPNProtocols option, which is not
 * supported by Cloudflare Workers' Node.js compatibility layer.
 *
 * This must be imported before node-appwrite so that node-appwrite's live
 * binding to undici.fetch picks up the patched version.
 */
import { fetch as undiciFetch } from "undici";

const patchedFetch = async (
  input: unknown,
  init?: unknown,
): Promise<unknown> => {
  if (init && typeof init === "object" && "ALPNProtocols" in init) {
    const { ALPNProtocols, ...rest } = init as Record<string, unknown>;
    return undiciFetch(input as URL, rest);
  }
  return undiciFetch(input as URL);
};

export { patchedFetch as fetch };
