import {
  type FastifyInstance,
  type FastifyServerOptions,
  fastify,
} from "fastify";

import "dotenv/config";

type Fastify = typeof fastify;
declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
    };
  }
}

// Create the Fastify server app
async function createServerApp(fastify: Fastify, opts: FastifyServerOptions) {
  const app: FastifyInstance = fastify(opts);

  // With Bun + TS + noEmit, there is no compiled .js file on disk.
  // Import the TypeScript module directly so routes/plugins (including websocket) actually load.
  app.register(import("./app.ts")).ready((err) => {
    if (err) throw err;
    app.log.info("Server app is ready.");
  });

  return app;
}

const app = await createServerApp(fastify, { logger: true });

const port = process.env.PORT || 8080;
const host = "localhost";

app.listen({ host, port: Number(port) }, (err) => {
  console.log(`Server listening at http://${host}:${port}`);
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
