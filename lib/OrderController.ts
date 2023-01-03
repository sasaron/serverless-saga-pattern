import * as stepFunctions from 'aws-cdk-lib/aws-stepfunctions';
import { Choice } from 'aws-cdk-lib/aws-stepfunctions';
import { StepFunctionsStartExecution } from 'aws-cdk-lib/aws-stepfunctions-tasks';
      
export interface OrderControllerProps {
  readonly router: Choice,
  readonly createOrderUseCase: StepFunctionsStartExecution,
}

export class OrderController {
  constructor(props: OrderControllerProps) {
    props.router.when(
      stepFunctions.Condition.stringEquals(
        stepFunctions.JsonPath.stringAt('$.detail-type'),
        "POST"
      ) && 
      stepFunctions.Condition.stringEquals(
        stepFunctions.JsonPath.stringAt('$.resource'),
        "/order"
      ),
      props.createOrderUseCase
    );
  }
}
