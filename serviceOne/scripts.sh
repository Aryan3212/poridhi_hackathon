
$ 
docker run -d --name jaeger   -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 
http://localhost:16686/search

npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http

npm install @opentelemetry/exporter-jaeger