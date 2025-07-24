import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

import { ordersDockerImage } from "../images/orders";
import { cluster } from "../cluster";
import { amqpListener } from "./rabbitmq";
import { appLoadBalancer } from "../load-balancer";

const ordersTargetGroup = appLoadBalancer.createTargetGroup('orders-target', {
  port: 3333,
  'protocol': 'HTTP',
  healthCheck: {
    path: '/health',
    protocol: 'HTTP'
  }
})

export const ordersHttpListener = appLoadBalancer.createListener('orders-listener', {
  port: 3333,
  protocol: 'HTTP',
  targetGroup: ordersTargetGroup
})

new aws.cloudwatch.LogGroup("orders-log-group", {
  name: "/ecs/orders",
  retentionInDays: 7,
});

export const ordersService = new awsx.classic.ecs.FargateService(
  "fargate-orders",
  {
    cluster,
    desiredCount: 1,
    waitForSteadyState: false,
    taskDefinitionArgs: {
      container: {
        image: ordersDockerImage.ref,
        cpu: 256,
        memory: 512,
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": "/ecs/orders",
            "awslogs-region": "us-east-1",
            "awslogs-stream-prefix": "ecs",
          },
        },
        portMappings: [ordersHttpListener],
        environment: [
          {
            name: 'BROKER_URL',
            value: pulumi.interpolate`amqp://admin:admin@${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}`
          },
          {
            name: 'DATABASE_URL',
            value: 'postgresql://neondb_owner:npg_ytUK0e3CNxIO@ep-wild-mountain-adabufms.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
          },

          {
              name: "OTEL_TRACES_EXPORTER",
              value: "otlp"
          },
          {
              name: "OTEL_EXPORTER_OTLP_ENDPOINT",
              value: "https://otlp-gateway-prod-sa-east-1.grafana.net/otlp"
          },
          {
              name: "OTEL_SERVICE_NAME",
              value: "orders"
          },
          {
              name: "OTEL_EXPORTER_OTLP_HEADERS",
              value: "Authorization=Basic MTMyNDg0NDpnbGNfZXlKdklqb2lNVFE0T1RRNE1pSXNJbTRpT2lKbGRtVnVkQzF0YVdOeWIzTmxjblpwWTJWekxXNXZaR1ZxY3lJc0ltc2lPaUkwZFRreVNUWTNTMU5TTnpWRE9ITXpVa3RsVTJseE5rY2lMQ0p0SWpwN0luSWlPaUp3Y205a0xYTmhMV1ZoYzNRdE1TSjlmUT09"
          },
          {
              name: "OTEL_RESOURCE_ATTRIBUTES",
              value: "service.name=my-app,service.namespace=my-application-group,deployment.environment=production"
          },
          {
              name: "OTEL_NODE_RESOURCE_DETECTORS",
              value: "env,host,os"
          },
          {
            name: "OTEL_NODE_ENABLED_INSTRUMENTATIONS",
            value: "http,fastify,pg,amqplib"
          }
          
        ]
      },
    },
  }
);
