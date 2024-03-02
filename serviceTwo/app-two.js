const express = require("express");
const app = express();

const port = 5000;
const configureOpenTelemetry = require("./tracing");
configureOpenTelemetry("validate");
const { context, trace, propagation } = require("@opentelemetry/api");
app.get("/validateuser", (req, res) => {
  const ctx = propagation.extract(context.active(), req.headers); // Extract context from incoming request headers
  const tracer = trace.getTracer("express-tracer");
  console.log("Incoming request headers:", req.headers);
  console.log(
    "Extracted span from context:",
    trace.getSpan(ctx)?.spanContext()
  ); // Retrieve span from extracted context

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

app.listen(port, () => {
  console.log(`App two listening at http://localhost:${port}`);
});
