import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

export const tireTemperatureSchema = z.object({
  frontRightTireTemperature: z.number(),
  frontLeftTireTemperature: z.number(),
  rearRightTireTemperature: z.number(),
  rearLeftTireTemperature: z.number(),
});

export type TireTemperatureInput = z.infer<typeof tireTemperatureSchema>;

export const { schemas: tireSchemas, $ref } = buildJsonSchemas(
  {
    tireTemperatureSchema,
  },
  {
    $id: "tireSchema",
  }
);
