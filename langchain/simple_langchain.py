from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Connect to LM Studio's local OpenAI-compatible server
# Ensure LM Studio is running and the "Local Server" is started
llm = ChatOpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio",
    model="qwen-coder",
    temperature=0.7,
)

# Define a simple prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that specializes in coding."),
    ("user", "{input}")
])

# Create a chain using LCEL (LangChain Expression Language)
chain = prompt | llm | StrOutputParser()

# Run the demo
if __name__ == "__main__":
    question = "Write a simple Python function to calculate the factorial of a number."
    print(f"--- Question ---\n{question}\n")
    
    print("--- Response ---")
    try:
        for chunk in chain.stream({"input": question}):
            print(chunk, end="", flush=True)
        print("\n")
    except Exception as e:
        print(f"\nError: Could not connect to LM Studio. Make sure the server is running at http://localhost:1234/v1\nDetail: {e}")
