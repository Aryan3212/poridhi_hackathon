const configureOpenTelemetry = require("./tracing");
const express = require("express");
const app = express();
const port = 3000;
const { trace, context, propagation } = require("@opentelemetry/api");
const amqplib = require('amqplib');
const axios = require("axios");

// Assuming these are defined as environment variables or constants
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
console.log('rabbitmquql', RABBITMQ_URL)
const tracerProvider = configureOpenTelemetry("provider-service");

let rabbitConnection;
const exchange = 'logs'

const sendRabbitMqMessage = async (message) => {
  if (!rabbitConnection) {
    rabbitConnection = await amqplib.connect(RABBITMQ_URL);
  }

  const channel = await rabbitConnection.createChannel();
  /* Type "fanout" means sending the message to all consumers that subscribed to that exchange. */
  await channel.assertExchange(exchange, 'fanout')
  /* Notice that we pass an empty string as the queue name. This means the queue will be defined per consumer. */
  await channel.publish(exchange, '', Buffer.from(message))
}

app.use((req, res, next) => {
  const tracer = tracerProvider.getTracer("express-tracer");
  const span = tracer.startSpan("HTTP request");

  span.setAttribute("http.method", req.method);
  span.setAttribute("http.url", req.url);

  context.with(trace.setSpan(context.active(), span), () => {
    next();
  });
});

app.get("/getuser", async (req, res) => {
  const parentSpan = trace.getSpan(context.active());

  try {
    const user = { id: 1, name: "John Doe", email: "john.doe@example.com" };

    if (parentSpan) {
      parentSpan.setAttribute("user.id", user.id);
      parentSpan.setAttribute("user.name", user.name);
    }

    const message = JSON.stringify(user);
    console.log(`Send message: '${message}'`);
    await sendRabbitMqMessage(message);

    const validateResponse = await context.with(
      trace.setSpan(context.active(), parentSpan),
      async () => {
        const carrier = {};
        propagation.inject(context.active(), carrier);
        return axios.get("http://app-two:5000/validateuser", { headers: carrier });
      }
    );

    console.log("Response from validateuser:", validateResponse.data);
    res.json({ success: true, user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error sending message to RabbitMQ" });
  } finally {
    if (parentSpan) {
      parentSpan.end();
    }
  }
});

const server = app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  try {

  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
  }
});

const gracefulShutdown = () => {
  console.log("Initiating graceful shutdown...");
  server.close(async () => {
    console.log("HTTP server closed.");
    if (rabbitConnection) {
      await rabbitConnection.close();
      console.log("RabbitMQ connection closed.");
    }
    tracerProvider.shutdown().then(() => {
      console.log("Tracing terminated.");
      process.exit(0);
    }).catch((error) => console.error("Error shutting down tracing", error));
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
