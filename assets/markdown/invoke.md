
```python
import boto3
import json

  

client = boto3.client('bedrock-agentcore', region_name='us-east-1', aws_access_key_id='', aws_secret_access_key='')
payload = json.dumps({"prompt": "Explain machine learning in simple terms"})

response = client.invoke_agent_runtime(
    agentRuntimeArn='arn:aws:bedrock-agentcore:us-east-1:878065585215:runtime/hosted_agent_1p3c6-ex9ab020d7',
    runtimeSessionId='test-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0001', # Must be 33+ char. Every new SessionId will create a new MicroVM
    payload=payload,
    qualifier='DEFAULT'
)

response_body = response['response'].read()
response_data = json.loads(response_body)
print("Agent Response:", response_data)
```
调用需要具备以下权限
```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "VisualEditor0",
			"Effect": "Allow",
			"Action": "bedrock-agentcore:InvokeAgentRuntime",
			"Resource": "*"
		}
	]
}
```