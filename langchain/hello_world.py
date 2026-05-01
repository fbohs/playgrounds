from langchain_openai import ChatOpenAI

# Connect to LM Studio's local OpenAI-compatible server
llm = ChatOpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio",  # LM Studio doesn't validate this
    model="llama3.2:3b",
    temperature=0.7,
)

response = llm.invoke("Say hello world!")
print(f"LLM Response: {response.content}")
