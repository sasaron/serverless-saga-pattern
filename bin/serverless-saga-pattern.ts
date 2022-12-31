#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RequestFrontStack } from '../lib/request-front-stack';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage');
const name = app.node.tryGetContext('name');
const context = app.node.tryGetContext(stage);
const appName = `${context.prefix}${name}`;

new RequestFrontStack(app, `${appName}RequestFrontStack`, {
  prefix: appName
});