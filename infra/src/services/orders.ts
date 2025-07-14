import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import { ordersDockerImage } from "../images/orders";
import { cluster } from "../cluster";

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
      },
    },
  }
);
