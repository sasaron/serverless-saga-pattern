import { Stack, StackProps } from 'aws-cdk-lib';
import * as stepFunctions from 'aws-cdk-lib/aws-stepfunctions';
import { StepFunctionsStartExecution } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
      
export interface CreateOrderUseCaseStackProps extends StackProps {
  readonly prefix: string,
  // hogehoge: Service
}

export class CreateOrderUseCaseStack extends Stack {
  private task : StepFunctionsStartExecution
  constructor(scope: Construct, id: string, props?: CreateOrderUseCaseStackProps) {
    super(scope, id, props);
    const createOrderStateMachine = new stepFunctions.StateMachine(this, `${props?.prefix}RouterStateMachine`, {
      stateMachineName: `${props?.prefix}CreateOrderUseCase`,
      definition: new stepFunctions.Pass(this, 'CreateOrderUseCase')
    });

    this.task = new StepFunctionsStartExecution(
      this,
      `${props?.prefix}CreateOrderUseCaseTask`,
      {
        stateMachine: createOrderStateMachine,
        associateWithParent: true,
      }
    );
  }

  public getTask(): StepFunctionsStartExecution { 
    return this.task;
  }
}
