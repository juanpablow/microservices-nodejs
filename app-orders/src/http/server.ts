import { fastify } from "fastify";
// import { fastifyCors } from "@fastify/cors"
import fastifyCors from "@fastify/cors";
import { randomUUID } from "crypto";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";
import { dispatchOrderCreated } from "../broker/messages/order-created.ts";
import { db } from "../db/client.ts";
import { schema } from "../db/schema/index.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, { origin: "*" });

app.get("/health", () => {
  return "OK";
});

app.post(
  "/orders",
  {
    schema: {
      body: z.object({
        amount: z.coerce.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body;

    const orderId = randomUUID();

    dispatchOrderCreated({
      orderId,
      amount,
      customer: {
        id: "e5d26176-0b50-47d3-aa2b-3b1a81963c16",
      },
    });

    await db.insert(schema.orders).values({
      id: orderId,
      customerId: "e5d26176-0b50-47d3-aa2b-3b1a81963c16",
      amount,
    });

    return reply.status(201).send();
  }
);

app.listen({ host: "0.0.0.0", port: 3333 }).then(() => {
  console.log("[Orders] HTTP Server running");
});
