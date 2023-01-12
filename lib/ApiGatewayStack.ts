import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Archive, EventBus, HttpMethod } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EventBusAwsIntegration } from './EventBusAwsIntegration';
import * as openapix from '@alma-cdk/openapix';
import path = require('path');
import { ApiDefinition, Method, RestApi } from 'aws-cdk-lib/aws-apigateway';
      
export interface ApiGatewayStackProps extends StackProps {
  readonly prefix: string
}

export class ApiGatewayStack extends Stack {
  private requestEventBus: EventBus;
  private apiGateWay: openapix.Api;
  constructor(scope: Construct, id: string, props?: ApiGatewayStackProps) {
    super(scope, id, props);
    const region = Stack.of(this).region;

    this.requestEventBus = new EventBus(this, `${props?.prefix}RequestEventBus`, {
      eventBusName: `${props?.prefix}RequestEventBus`
    });
    
    const apiRole = new Role(this, `${props?.prefix}ApiRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });

    apiRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [this.requestEventBus.eventBusArn],
        actions: ['events:PutEvents'],
      })
    );

    const eventIntegration = new EventBusAwsIntegration(this, {
      credentialsRole: apiRole,
      region: region,
      requestTemplate: {
        "application/json": JSON.stringify(
          {
            "Entries": [
              {
                "Source": "$context.path",
                "DetailType": "$context.httpMethod",
                "Detail": "$input.body",
                "resources": [],
                "EventBusName": this.requestEventBus.eventBusArn
              }
            ]
          }
        )
      }
    });

    // API Gateway => VPC Endpoint　=> NLB => ECSの予定
    const mockIntegration = new openapix.MockIntegration({
      integrationResponses: [
        {
          statusCode: '200',
        }
      ]
    });

    this.apiGateWay = new openapix.Api(this, `${props?.prefix}RestApi`, {
      source: path.join(__dirname, '../schema/openapi.yaml'),
      paths: {
        '/order': {
          post: eventIntegration,
        },
        '/order/{order_id}': {
          get: mockIntegration,
          put: eventIntegration,
          delete: eventIntegration,
        },
        '/order/list': {
          get: mockIntegration,
        }
      }
    });
  }

  public getRequestEventBus(): EventBus { 
    return this.requestEventBus;
  }

  public getCreateOrderMethodRequestArn(): string { 
    return this.apiGateWay.arnForExecuteApi('POST', '/order');
  }

  public getApiGateWayId(): string { 
    return this.apiGateWay.restApiId;
  }
}
