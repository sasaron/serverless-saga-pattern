import { Stack, StackProps } from 'aws-cdk-lib';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { CloudWatchLogGroup } from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EventBusAwsIntegration } from './EventBusAwsIntegration';
      
export interface RequestFrontStackProps extends StackProps {
  readonly prefix: string
}

export class RequestFrontStack extends Stack {
  private orderRequestBus: EventBus;
  constructor(scope: Construct, id: string, props?: RequestFrontStackProps) {
    super(scope, id, props);
    const region = Stack.of(this).region;

    const orderRequestBus = new EventBus(this, `${props?.prefix}RequestEventBus`, {
      eventBusName: `${props?.prefix}OrderRequestBus`
    });

//     const eventLoggerRule = new Rule(this, `${props?.prefix}EventLoggerRule`, {
//       description: "all events logging",
//       eventPattern: {
//         region: [ region ]
//       },
//       eventBus: orderRequestBus
//     });
// 
//     const logGroup = new LogGroup(this, `${props?.prefix}EventLogGroup`, {
//       logGroupName: `/aws/events/${props?.prefix}EventLogGroup`,
//       retention: RetentionDays.TWO_WEEKS,
//     });
// 
//     eventLoggerRule.addTarget(new CloudWatchLogGroup(logGroup));

    const restApi = new RestApi(this, `${props?.prefix}RestApi`, {
      restApiName: `${props?.prefix}RestApi`,
      deployOptions: {
        stageName: "v1",
        metricsEnabled: true,
        dataTraceEnabled: true,
      },
    });

    const apiRole = new Role(this, `${props?.prefix}ApiRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });

    apiRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [orderRequestBus.eventBusArn],
        actions: ['events:PutEvents'],
      })
    );

    const eventIntegration = new EventBusAwsIntegration({
      credentialsRole: apiRole,
      region: region,
      requestTemplate: {
          "application/json": JSON.stringify(
            {
              "Entries": [
                {
                  "Source": restApi.restApiName,
                  "DetailType": restApi.restApiId,
                  "Detail": "$input.body",
                  "EventBusName": orderRequestBus.eventBusArn
                }
              ]
            }
          )
        }
    })

    restApi.root.addResource('order')
      .addMethod('Post', eventIntegration);
  }

  public getOrderRequestBus() { 
    return this.orderRequestBus;
  }
}
