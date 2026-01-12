import { type FastifyPluginAsync } from "fastify";
import { $ref } from "../../schemas/tires.schema";

const eventRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get(
    "/temperature",
    {
      websocket: true,
      schema: {
        querystring: $ref("tireTemperatureSchema"),
      },
    },
    async (socket, req) => {}
  );
};

export default eventRoutes;
