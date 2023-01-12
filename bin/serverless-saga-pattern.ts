#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/ApiGatewayStack';
import { CreateOrderUseCaseStack } from '../lib/CreateOrderUsecaseStack';
import { OrderController } from '../lib/OrderController';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage');
const name = app.node.tryGetContext('name');
const context = app.node.tryGetContext(stage);
const appName = `${context.prefix}${name}`;

const apiGateWayStack = new ApiGatewayStack(app, `${appName}RequestFrontStack`, {
  prefix: appName
});

const createOrderUseCaseStack = new CreateOrderUseCaseStack(app, `${appName}UseCaseStack`, {
  prefix: appName,
});

new OrderController(app, `${appName}ControllerStack`, {
  prefix: appName,
  eventBus: apiGateWayStack.getRequestEventBus(),
  createOrderUseCase: createOrderUseCaseStack.getStateMachine(),
  createOrderSource: apiGateWayStack.getCreateOrderMethodRequestArn(),
  apiGatewayId: apiGateWayStack.getApiGateWayId(),
});