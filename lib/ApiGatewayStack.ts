import { Stack, StackProps, aws_stepfunctions } from 'aws-cdk-lib';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EventBusAwsIntegration } from './EventBusAwsIntegration';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { CloudWatchLogGroup } from 'aws-cdk-lib/aws-events-targets';
      
export interface ApiGatewayStackProps extends StackProps {
  readonly prefix: string
}

export class ApiGatewayStack extends Stack {
  private requestEventBusRule: Rule;
  constructor(scope: Construct, id: string, props?: ApiGatewayStackProps) {
    super(scope, id, props);
    const region = Stack.of(this).region;

    const restApi = new RestApi(this, `${props?.prefix}RestApi`, {
      restApiName: `${props?.prefix}RestApi`,
      deployOptions: {
        stageName: "v1",
        metricsEnabled: true,
        dataTraceEnabled: true,
      },
    });

    const requestEventBus = new EventBus(this, `${props?.prefix}RequestEventBus`, {
      eventBusName: `${props?.prefix}RequestEventBus`
    });

    const apiRole = new Role(this, `${props?.prefix}ApiRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });

    apiRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [requestEventBus.eventBusArn],
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
                "Source": "$context.path",
                "DetailType": "$context.method",
                "Detail": "$input.body",
                "resources": [ restApi.restApiId, ],
                "EventBusName": requestEventBus.eventBusArn
              }
            ]
          }
        )
      }
    });

    this.requestEventBusRule = new Rule(this, `${props?.prefix}EventBusRule`, {
      description: "api gateway event rule",
      eventPattern: {
        region: [ region ],
        resources: [ restApi.restApiId ],
      },
      eventBus: requestEventBus
    });

    // debugger
    const logGroup = new LogGroup(this, `${props?.prefix}EventLogGroup`, {
       logGroupName: `/aws/events/${props?.prefix}EventLogGroup`,
       retention: RetentionDays.TWO_WEEKS,
     });

    this.requestEventBusRule.addTarget(new CloudWatchLogGroup(logGroup));

    restApi.root.addResource('order')
      .addMethod('Post', eventIntegration);
  }

  public getRequestEventBusRule(): Rule { 
    return this.requestEventBusRule;
  }
}
