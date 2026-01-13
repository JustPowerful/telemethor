import { type FastifyPluginAsync } from "fastify";
import { tireTemperatureSchema } from "../../schemas/tires.schema";
import { parseAndValidateWsMessage } from "../../lib/utils/ws";
import redisClient from "../../lib/redis";

const eventRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/temperature",
    {
      websocket: true,
    },
    (socket, req) => {
      req.log.info(
        "✅ New WebSocket connection established for /tires/temperature"
      );

      redisClient.set("last_connection", new Date().toISOString());

      // Let the client know the upgrade + handler is live.
      socket.send(
        JSON.stringify({
          type: "connection",
          message: "connection established",
        })
      );

      socket.on("message", (raw: Buffer) => {
        const data = parseAndValidateWsMessage({
          socket,
          req,
          raw,
          schema: tireTemperatureSchema,
        });
        if (!data) return;

        socket.send(JSON.stringify({ type: "ok", received: data }));
      });

      socket.on("error", (err: Error) => {
        req.log.error({ err }, "WS error");
      });

      socket.on("close", (code: number, reason: string) => {
        req.log.info({ code, reason: reason.toString() }, "WS closed");
      });
    }
  );
};

export default eventRoutes;
