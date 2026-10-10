// Playground code travels in the URL as deflate-compressed base64url, so links stay short
// and nothing is stored on a server.

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

async function pipe(bytes: Uint8Array, stream: GenericTransformStream): Promise<Uint8Array> {
  const piped = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(piped).arrayBuffer())
}

export async function encodeCode(code: string): Promise<string> {
  const bytes = await pipe(new TextEncoder().encode(code), new CompressionStream("deflate-raw"))
  return toBase64Url(bytes)
}

export async function decodeCode(encoded: string): Promise<string> {
  const bytes = await pipe(fromBase64Url(encoded), new DecompressionStream("deflate-raw"))
  return new TextDecoder().decode(bytes)
}
