1、DeepSeek支持的model类型：

**V4:**
 model=deepseek-v4-flash，deepseek-v4-pro


Thinking Mode Toggle(1)	{"thinking": {"type": "enabled/disabled"}}
Thinking Effort Control(2)(3)	{"reasoning_effort": "high/max"}	{"output_config": {"effort": "high/max"}}


DEEPSEEK_API_KEY=sk-450b6d7ce1324528bb4979e887192ca1


When using the OpenAI SDK, you need to pass the thinking parameter within extra_body:

response = client.chat.completions.create(
  model="deepseek-v4-pro",
  # ...
  reasoning_effort="high",
  extra_body={"thinking": {"type": "enabled"}}
)



2、智谱大模型接口
BIGMODEL_API_KEY=b57f666d002c4819b7a37201eb55b7b5.X7ZupcNr37dANz62
BIGMODEL_MODEL=glm-4.5-air

