import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Archive, EventBus, Rule, EventPattern } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
      
export interface OrderControllerProps extends StackProps {
  readonly prefix: string,
  readonly eventBus: EventBus,
  readonly createOrderUseCase: StateMachine,
  readonly createOrderSource: string,
  readonly apiGatewayId: string,
}

export class OrderController extends Stack {
  constructor(scope: Construct, id: string, props: OrderControllerProps) {
    super(scope, id, props);

    const createOrderEventPattern : EventPattern = { 
      detailType: [props.apiGatewayId],
      source: [props.createOrderSource],
    }

    new Rule(this, `${props?.prefix}CreateOrderRule`, {
      eventPattern: createOrderEventPattern,
      targets: [ new SfnStateMachine(props.createOrderUseCase) ],
      eventBus: props.eventBus
    });

    new Archive(this, `${props?.prefix}CreateOrderArchive`, {
      sourceEventBus: props.eventBus,
      archiveName: `${props?.prefix}Archive`,
      eventPattern: createOrderEventPattern,
      retention: Duration.days(1)
    });
 }
}
