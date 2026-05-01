from langchain_core.messages import SystemMessage
from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode


# Step 1: Define state using the built-in MessagesState
# This replaces the manual setup with Annotated and add_messages
class AgentState(MessagesState):
    pass


@tool
def add(a: int, b: int):
    """This is an addition function that adds 2 numbers together"""
    return a + b


@tool
def subtract(a: int, b: int):
    """Subtraction function"""
    return a - b


@tool
def multiply(a: int, b: int):
    """Multiplication function"""
    return a * b


tools = [add, subtract, multiply]

# Step 2: Define model and bind tools
model = ChatOllama(model="llama3.2:3b").bind_tools(tools)


def model_call(state: AgentState) -> dict:
    # State update just needs to return a dict with the new message
    system_prompt = SystemMessage(
        content="You are my AI assistant, please answer my query to the best of your ability."
    )
    response = model.invoke([system_prompt] + state["messages"])
    return {"messages": [response]}


def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    if not last_message.tool_calls:
        return "end"
    else:
        return "continue"


# Step 3: Define the graph
graph = StateGraph(AgentState)

graph.add_node("our_agent", model_call)

tool_node = ToolNode(tools=tools)
graph.add_node("tools", tool_node)

# Use START node instead of the legacy set_entry_point
graph.add_edge(START, "our_agent")

graph.add_conditional_edges(
    "our_agent",
    should_continue,
    {
        "continue": "tools",
        "end": END,
    },
)

graph.add_edge("tools", "our_agent")

app = graph.compile()

# from IPython.display import Image

# with open("agent4.png", "wb") as f:
#     f.write(app.get_graph().draw_mermaid_png())


def print_stream(stream):
    for s in stream:
        # stream_mode="values" yields the full state at each step.
        # We can safely just grab the last message and print it.
        message = s["messages"][-1]
        message.pretty_print()


if __name__ == "__main__":
    inputs = {
        "messages": [
            (
                "user",
                "Add 40 + 12 and then multiply the result by 6. Also tell me a joke please.",
            )
        ]
    }
    print("Invoking agent...\n")
    print_stream(app.stream(inputs, stream_mode="values"))
