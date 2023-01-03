import { Stack, StackProps } from 'aws-cdk-lib';
import { Pass, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
      
export interface CreateOrderUseCaseStackProps extends StackProps {
  readonly prefix: string,
  // hogehoge: Service
}

export class CreateOrderUseCaseStack extends Stack {
  private createOrderStateMachine : StateMachine
  constructor(scope: Construct, id: string, props?: CreateOrderUseCaseStackProps) {
    super(scope, id, props);
    this.createOrderStateMachine = new StateMachine(this, `${props?.prefix}RouterStateMachine`, {
      stateMachineName: `${props?.prefix}CreateOrderUseCase`,
      definition: new Pass(this, 'CreateOrderUseCase')
    });
  }

  public getStateMachine(): StateMachine { 
    return this.createOrderStateMachine;
  }
}
