# conditional graph with two branches

from langgraph.graph import StateGraph, START, END
from typing import TypedDict


class MyCustomState(TypedDict):
    num1: int
    num2: int
    num3: int
    num4: int
    op1: str
    op2: str
    finalNum1: int | None
    finalNum2: int | None


def decision_node_1(state: MyCustomState) -> str:
    if state["op1"] == "+":
        return "addition_operation_1"
    elif state["op1"] == "-":
        return "subtraction_operation_1"


def decision_node_2(state: MyCustomState) -> str:
    if state["op2"] == "+":
        return "addition_operation_2"
    elif state["op2"] == "-":
        return "subtraction_operation_2"


def addition_1(state: MyCustomState) -> MyCustomState:
    finalNum1 = state["num1"] + state["num2"]
    return {"finalNum1": finalNum1}


def subtraction_1(state: MyCustomState) -> MyCustomState:
    finalNum1 = state["num1"] - state["num2"]
    return {"finalNum1": finalNum1}


def addition_2(state: MyCustomState) -> MyCustomState:
    finalNum2 = state["num3"] + state["num4"]
    return {"finalNum2": finalNum2}


def subtraction_2(state: MyCustomState) -> MyCustomState:
    finalNum2 = state["num3"] - state["num4"]
    return {"finalNum2": finalNum2}


graph = StateGraph(MyCustomState)
graph.add_node("router_node_1", lambda state: state)
graph.add_node("addition_node_1", addition_1)
graph.add_node("subtraction_node_1", subtraction_1)
graph.add_node("router_node_2", lambda state: state)
graph.add_node("addition_node_2", addition_2)
graph.add_node("subtraction_node_2", subtraction_2)

graph.add_edge(START, "router_node_1")
graph.add_conditional_edges(
    "router_node_1",
    decision_node_1,
    {
        "addition_operation_1": "addition_node_1",
        "subtraction_operation_1": "subtraction_node_1",
    },
)
graph.add_edge("addition_node_1", "router_node_2")
graph.add_edge("subtraction_node_1", "router_node_2")
graph.add_conditional_edges(
    "router_node_2",
    decision_node_2,
    {
        "addition_operation_2": "addition_node_2",
        "subtraction_operation_2": "subtraction_node_2",
    },
)
graph.add_edge("addition_node_2", END)
graph.add_edge("subtraction_node_2", END)

app = graph.compile()

result = app.invoke(
    {
        "num1": 20,
        "num2": 10,
        "op1": "-",
        "num3": 40,
        "num4": 30,
        "op2": "+",
    }
)

print(result["finalNum1"])
print(result["finalNum2"])

# from IPython.display import Image

# with open("graph5.png", "wb") as f:
#     f.write(app.get_graph().draw_mermaid_png())
