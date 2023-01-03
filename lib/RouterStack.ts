import { Stack, StackProps } from 'aws-cdk-lib';
import * as stepFunctions from 'aws-cdk-lib/aws-stepfunctions';
import { Rule } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { Choice, Pass, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
      
export interface RouterStackProps extends StackProps {
  readonly prefix: string,
  readonly eventBusRule: Rule,
}

export class RouterStack extends Stack {
  private router: Choice;
  private routerStateMachine: StateMachine;
  private eventBusRule: Rule;
  private prefix: string;

  constructor(scope: Construct, id: string, props: RouterStackProps) {
    super(scope, id, props);
    this.router = new stepFunctions.Choice(this, `${props.prefix}RouteChoice`);
    this.router.otherwise(new Pass(this, 'NotFound'));

    this.eventBusRule = props.eventBusRule;
    this.prefix = props.prefix;
  }

  public getRouter(): Choice { 
    return this.router;
  }

  public saveStateMachine() { 
    const routerStateMachine = new stepFunctions.StateMachine(this, `${this.prefix}Router`, {
      definition: this.router,
      stateMachineName: `${this.prefix}Router`
    });

    this.eventBusRule.addTarget(new SfnStateMachine(routerStateMachine));

  }
}
