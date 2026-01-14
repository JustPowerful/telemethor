import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";

// Publisher client (used for publishing messages)
export const publisher: RedisClientType = createClient({
  url: REDIS_URL,
  password: REDIS_PASSWORD,
});

publisher.on("error", (err) => console.error("Redis Publisher Error:", err));

// Helper to create a dedicated subscriber client for each WebSocket connection.
export async function createSubscriber(): Promise<RedisClientType> {
  const sub = publisher.duplicate();
  sub.on("error", (err) => console.error("Redis Subscriber Error:", err));
  await sub.connect();
  return sub;
}

async function connectRedis() {
  if (!publisher.isOpen) {
    try {
      await publisher.connect();
      console.log("Redis publisher connected successfully.");
    } catch (error) {
      console.error("Failed to connect Redis publisher:", error);
    }
  }
}

connectRedis();

export default publisher;
