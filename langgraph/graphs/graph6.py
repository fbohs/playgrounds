# looping graph

from langgraph.graph import StateGraph, START, END
from typing import TypedDict


class AppAgentState(TypedDict):
    name: str
    value: int
    required: int


def greeter_function(state: AppAgentState) -> AppAgentState:
    # print(state)
    print(
        f"Hello {state['name']}, entered value is {state['value']}, required value is {state['required']}"
    )
    return state


def looper_function(state: AppAgentState) -> AppAgentState:
    print(f"in loop, current value is: {state['value']}")
    state["value"] = state["value"] + 1
    return state


def should_continue(state: AppAgentState) -> str:
    if state["value"] < state["required"]:
        return "loop"
    else:
        return "stop"


graph = StateGraph(AppAgentState)
graph.add_node("greeter_node", greeter_function)
graph.add_node("looper_node", looper_function)
graph.add_conditional_edges(
    "looper_node",
    should_continue,  # action ( not a node )
    {
        "loop": "looper_node",
        "stop": END,
    },
)

graph.add_edge(START, "greeter_node")
graph.add_edge("greeter_node", "looper_node")

graph = graph.compile()

result = graph.invoke({"name": "Madhu", "value": 3, "required": 5})
print(result)

# from IPython.display import Image

# with open("graph6.png", "wb") as f:
#     f.write(graph.get_graph().draw_mermaid_png())
