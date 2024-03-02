const express = require("express");
const app = express();

const port = 5000;
const configureOpenTelemetry = require("./tracing");
configureOpenTelemetry("validate");
const { context, trace, propagation } = require("@opentelemetry/api");
const { setKeyValue, getValueByKey } = require('./redis/client');
const pool = require('./sql');
const http = require('http');

app.get("/validateuser", async (req, res) => {
  const ctx = propagation.extract(context.active(), req.headers); // Extract context from incoming request headers
  const tracer = trace.getTracer("express-tracer");
  console.log("Incoming request headers:", req.headers);
  console.log(
    "Extracted span from context:",
    trace.getSpan(ctx)?.spanContext()
  ); // Retrieve span from extracted context
  try{
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting MySQL connection:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      console.log("here bro")
      const userInfo = { name: "John Doe", email: "john.doe@example.com" };
        res.json(userInfo);
    });
    await setKeyValue('user_info', JSON.stringify("aryan"));
  }catch(e){
    console.log(e);
  }
  const span = tracer.startSpan(
    "validate-user",
    {
      attributes: { "http.method": "GET", "http.url": req.url },
    },
    ctx
  );
  span.end();
  res.json({ success: true });
});

app.post('/signup', async (req, res) => {
  // Access the parent span from the request object
  const parentSpan = trace.getSpan(context.active());

  // validate(req, parentSpan);

  const userInfo = { name: "John Doe", email: "john.doe@example.com" };

  // Save user info to Redis

  // Set a color tag for the validation span
  // Add an event to the span with a color tag for validation
  // Add a tag to the `span for validation
  parentSpan.setAttribute('validation.tag', 'validation');
  // SaveToDB(req, parentSpan);
  // SendNotification(parentSpan);
  // End the parent span
  parentSpan.end();
  const traceId = parentSpan.spanContext().traceId;
  res.send(traceId,200);
});

app.listen(port, () => {
  console.log(`App two listening at http://localhost:${port}`);
});
