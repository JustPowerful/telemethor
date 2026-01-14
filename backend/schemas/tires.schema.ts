import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

export const tireTemperatureSchema = z.object({
  frontRightTireTemperature: z.number(),
  frontLeftTireTemperature: z.number(),
  rearRightTireTemperature: z.number(),
  rearLeftTireTemperature: z.number(),
});

export const tirePressureSchema = z.object({
  frontRightTirePressure: z.number(),
  frontLeftTirePressure: z.number(),
  rearRightTirePressure: z.number(),
  rearLeftTirePressure: z.number(),
});

export type TireTemperatureInput = z.infer<typeof tireTemperatureSchema>;
export type TirePressureInput = z.infer<typeof tirePressureSchema>;

export const { schemas: tireSchemas, $ref } = buildJsonSchemas(
  {
    tireTemperatureSchema,
    tirePressureSchema,
  },
  {
    $id: "tireSchema",
  }
);
