import { Stack, StackProps } from 'aws-cdk-lib';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EventBusAwsIntegration } from './EventBusAwsIntegration';
import * as openapix from '@alma-cdk/openapix';
import path = require('path');
      
export interface ApiGatewayStackProps extends StackProps {
  readonly prefix: string
}

export class ApiGatewayStack extends Stack {
  private requestEventBus: EventBus;
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
                "DetailType": "$context.method",
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

    new openapix.Api(this, `${props?.prefix}RestApi`, {
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
}
