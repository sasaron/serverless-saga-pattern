#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/ApiGatewayStack';
import { CreateOrderUseCaseStack } from '../lib/CreateOrderUsecaseStack';
import { RouterStack } from '../lib/RouterStack';
import { OrderController } from '../lib/OrderController';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage');
const name = app.node.tryGetContext('name');
const context = app.node.tryGetContext(stage);
const appName = `${context.prefix}${name}`;

const apiGateWayStack = new ApiGatewayStack(app, `${appName}RequestFrontStack`, {
  prefix: appName
});

const createOrderUseCaseStack = new CreateOrderUseCaseStack(app, `${appName}ControllerStack`, {
  prefix: appName,
});

const routerStack = new RouterStack(app, `${appName}RouterStack`, {
  prefix: appName,
  eventBusRule: apiGateWayStack.getRequestEventBusRule(),
});

new OrderController({
  router: routerStack.getRouter(),
  createOrderUseCase: createOrderUseCaseStack.getTask()
});

routerStack.saveStateMachine();