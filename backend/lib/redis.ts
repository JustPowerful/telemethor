import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";

const client: RedisClientType = createClient({
  url: REDIS_URL,
  password: REDIS_PASSWORD,
});

client.on("error", (err) => console.error("Redis Client Error:", err));

async function connectRedis() {
  if (!client.isOpen) {
    try {
      await client.connect();
      console.log("Redis connected successfully.");
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
    }
  }
}

connectRedis();

export default client;
