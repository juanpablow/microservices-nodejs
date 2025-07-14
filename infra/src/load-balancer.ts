import * as awsx from '@pulumi/awsx';
import { cluster } from './cluster';

export const appLoadBalancer = new awsx.classic.lb.ApplicationLoadBalancer('app-lb', {
  securityGroups: cluster.securityGroups, // define what the load balancer will see (our cluster) HTTPs
})

export const networkLoadBalancer = new awsx.classic.lb.NetworkLoadBalancer('net-lb', {
  subnets: cluster.vpc.publicSubnetIds, // the same as securityGroups, but outside the HTTP protocol
})

