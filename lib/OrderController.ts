import { Stack, StackProps } from 'aws-cdk-lib';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
      
export interface OrderControllerProps extends StackProps {
  readonly prefix: string,
  readonly eventBus: EventBus,
  readonly createOrderUseCase: StateMachine,
}

export class OrderController extends Stack {
  constructor(scope: Construct, id: string, props: OrderControllerProps) {
    super(scope, id, props);

    new Rule(this, `${props?.prefix}CreateOrderRule`, {
      description: "api gateway event rule",
      eventPattern: {
        detailType: ['POST'],
        source: ['/order']
      },
      targets: [ new SfnStateMachine(props.createOrderUseCase) ],
      eventBus: props.eventBus
    });
 }
}
