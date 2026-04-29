from langchain_openai import ChatOpenAI

# Connect to LM Studio's local OpenAI-compatible server
llm = ChatOpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio",  # LM Studio doesn't validate this
    model="qwen/qwen3-coder-30b",
    temperature=0.7,
)

response = llm.invoke("Say hello world!")
print(f"LLM Response: {response.content}")
