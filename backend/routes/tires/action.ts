import { type FastifyPluginAsync } from "fastify";
import {
  tirePressureSchema,
  tireTemperatureSchema,
} from "../../schemas/tires.schema";
import { parseAndValidateWsMessage, subForward } from "../../lib/utils/ws";
import { publisher, createSubscriber } from "../../lib/redis";
import { redisKeys } from "../../lib/constants";

const eventRoutes: FastifyPluginAsync = async (fastify) => {
  // Temporary in-memory state (lives for the process lifetime).
  // If you need persistence or multi-instance support, store this in Redis instead.

  // Endpoint to subscribe to all tire data updates via WebSocket
  fastify.get("/subscribe", { websocket: true }, async (socket, req) => {
    req.log.info("✅ New WebSocket connection established for /tires/getall");
    const sub = await createSubscriber();

    const tireKeys = Object.values(redisKeys.tires).filter(
      (key) => key !== redisKeys.tires.main
    );

    for (const key of tireKeys) {
      await sub.subscribe(key, (message) => {
        subForward(socket, key, message);
      });
    }

    // Clean up when the socket closes
    socket.on("close", async () => {
      try {
        await sub.unsubscribe(redisKeys.tires.pressure);
        await sub.unsubscribe(redisKeys.tires.temperature);
        await sub.destroy();
      } catch (err) {
        req.log.error({ err }, "Error cleaning up subscriber");
      }
      req.log.info("WebSocket client disconnected and subscriber cleaned up");
    });
  });

  fastify.get("/set/pressure", { websocket: true }, (socket, req) => {
    req.log.info(
      "✅ New WebSocket connection established for /tires/set/pressure"
    );

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
        schema: tirePressureSchema,
      });
      if (!data) return;

      publisher.publish(redisKeys.tire.pressure, JSON.stringify(data));

      socket.send(
        JSON.stringify({ type: "ok", received: data, current: data })
      );
    });
  });

  // WebSocket routes to SET DATA for the tires in real-time
  fastify.get(
    "/set/temperature",
    {
      websocket: true,
    },
    (socket, req) => {
      req.log.info(
        "✅ New WebSocket connection established for /tires/set/temperature"
      );

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

        // Update the temporary state.
        publisher.publish(redisKeys.tire.temperature, JSON.stringify(data));

        socket.send(
          JSON.stringify({ type: "ok", received: data, current: data })
        );
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
