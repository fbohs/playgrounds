from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_agent

# Connect to LM Studio's local OpenAI-compatible server
llm = ChatOpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio",  # LM Studio doesn't validate this
    model="qwen/qwen3-coder-30b",
    temperature=0.7,
)

# Tools — use the @tool decorator so LangChain generates the JSON schema
# that gets sent to the model for function calling
@tool
def get_weather(city: str) -> str:
    """Get the current weather for a given city."""
    return f"It's sunny and 25°C in {city}!"

@tool
def add_numbers(a: float, b: float) -> float:
    """Add two numbers together and return the result."""
    return a + b

# create_react_agent builds a ReAct loop:
# model decides → calls tool → observes result → decides again → final answer
agent = create_agent(
    model=llm,
    tools=[get_weather, add_numbers],
    system_prompt="You are a helpful assistant. Use the available tools when needed.",
)

result = agent.invoke({
    "messages": [
        {"role": "user", "content": "What's the weather in San Francisco? Also what is 42 + 58?"}
    ]
})

# The last message in the list is the final agent response
print(result["messages"][-1].content)