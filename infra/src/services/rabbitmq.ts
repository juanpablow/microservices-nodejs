import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import { cluster } from "../cluster"
import { appLoadBalancer } from "../load-balancer";

const rabbitMQAdminTargetGroup = appLoadBalancer.createTargetGroup('rabbitmq-admin-target', {
  port: 15672,
  'protocol': 'HTTP',
  healthCheck: {
    path: '/',
    protocol: 'HTTP'
  }
})

const rabbitMQAdminHttpListener = appLoadBalancer.createListener('rabbitmq-admin-listener', {
  port: 15672,
  protocol: 'HTTP',
  targetGroup: rabbitMQAdminTargetGroup
})

new aws.cloudwatch.LogGroup("rabbitmq-log-group", {
  name: "/ecs/rabbitmq",
  retentionInDays: 7,
});

export const rabbitMQService = new awsx.classic.ecs.FargateService('fargate-rabbitmq', {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: 'rabbitmq:3-management',
      cpu: 256, 
      memory: 512,
      portMappings: [
        rabbitMQAdminHttpListener,
      ],
      environment: [
        { name: 'RABBITMQ_DEFAULT_USER', value: 'admin' },
        { name: 'RABBITMQ_DEFAULT_PASS', value: 'admin' }
      ],
      logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": "/ecs/rabbitmq",
            "awslogs-region": "us-east-1",
            "awslogs-stream-prefix": "ecs",
          },
        },
    },
  },
})