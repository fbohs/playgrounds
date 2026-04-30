# conditional graph

from langgraph.graph import StateGraph, START, END
from typing import TypedDict


class MyCustomState(TypedDict):
    num1: int
    num2: int
    op1: str
    finalNum1: int | None


def decision_node_1(state: MyCustomState) -> MyCustomState:
    if state["op1"] == "+":
        return "addition_operation_1"
    elif state["op1"] == "-":
        return "subtraction_operation_1"


def addition_1(state: MyCustomState) -> MyCustomState:
    finalNum1 = state["num1"] + state["num2"]
    return {"finalNum1": finalNum1}


def subtraction_1(state: MyCustomState) -> MyCustomState:
    finalNum1 = state["num1"] - state["num2"]
    return {"finalNum1": finalNum1}


graph = StateGraph(MyCustomState)
graph.add_node("router_node_1", lambda state: state)  # pass through function
graph.add_node("addition_node_1", addition_1)
graph.add_node("subtraction_node_1", subtraction_1)

graph.add_edge(START, "router_node_1")
graph.add_conditional_edges(
    "router_node_1",
    decision_node_1,
    {
        "addition_operation_1": "addition_node_1",
        "subtraction_operation_1": "subtraction_node_1",
    },
)
graph.add_edge("addition_node_1", END)
graph.add_edge("subtraction_node_1", END)

app = graph.compile()

result = app.invoke(
    {
        "num1": 10,
        "num2": 20,
        "op1": "+",
    }
)

print(result["finalNum1"])

# from IPython.display import Image

# with open("graph4.png", "wb") as f:
#     f.write(app.get_graph().draw_mermaid_png())
