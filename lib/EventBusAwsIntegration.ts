import { AwsIntegration, PassthroughBehavior, IntegrationResponse } from "aws-cdk-lib/aws-apigateway";
import * as openapix from '@alma-cdk/openapix';
import { HttpMethod } from "aws-cdk-lib/aws-events";
import { IRole } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface EventBusAwsIntegrationProps{
  credentialsRole: IRole,
  region: string,
  requestTemplate: {[contentType: string]: string},
  responseTemplate?: IntegrationResponse[]
}

export class EventBusAwsIntegration extends openapix.AwsIntegration { 
  constructor(scope: Construct, props: EventBusAwsIntegrationProps) {
    const responseTemplate = props.responseTemplate ?? [
      {
        statusCode: "200",
        responseTemplates: {
          "application/json": JSON.stringify({
            "data": "$input.path('$')"
          })
        }
      }
    ];
    super(scope, {
      service: "events",
      action: "PutEvents",
      region: props.region,
      integrationHttpMethod: HttpMethod.POST,
      options: {
        credentialsRole: props.credentialsRole,
        passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
        requestParameters: {
          "integration.request.header.X-Amz-Target": "'AWSEvents.PutEvents'",
          "integration.request.header.Content-Type": "'application/x-amz-json-1.1'"
        },
        requestTemplates: props.requestTemplate,
        integrationResponses: responseTemplate
      }
    });
  }
}
