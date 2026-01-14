import type { FastifyRequest } from "fastify";
import type { ZodTypeAny, z } from "zod";

function toUtf8String(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw instanceof Buffer) return raw.toString("utf8");
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString("utf8");

  // ws can deliver Buffer[] in some environments
  if (Array.isArray(raw) && raw.every((item) => item instanceof Buffer)) {
    return Buffer.concat(raw).toString("utf8");
  }

  return String(raw);
}

export function parseAndValidateWsMessage<TSchema extends ZodTypeAny>(params: {
  socket: { send(data: string): void };
  req: FastifyRequest;
  raw: unknown;
  schema: TSchema;
}): z.infer<TSchema> | null {
  const { socket, req, raw, schema } = params;

  const msg = toUtf8String(raw);
  req.log.info({ msg }, "WS message received");

  let parsed: unknown;
  try {
    parsed = JSON.parse(msg);
  } catch {
    socket.send(
      JSON.stringify({
        type: "error",
        error: "invalid_json",
        message: "Message must be valid JSON",
      })
    );
    return null;
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    socket.send(
      JSON.stringify({
        type: "error",
        error: "validation_failed",
        message: "Advanced message validation failed",
        issues: result.error.issues,
      })
    );
    return null;
  }

  return result.data;
}

/**
 * Helper to forward Redis pub/sub message for a specific channel over WebSocket
 * @param socket WebSocket to send the message to
 * @param channel Redis channel name
 * @param message Message received from Redis
 */
export function subForward(
  socket: WebSocket,
  channel: string,
  message: string
) {
  try {
    const payload = JSON.parse(message);
    socket.send(JSON.stringify({ channel, payload }));
  } catch (err) {
    // If parsing fails just send raw message
    socket.send(JSON.stringify({ channel, payload: message }));
  }
}
