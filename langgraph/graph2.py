from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
import math
from functools import reduce
# from IPython.display import Image


class MyCustomState(TypedDict):
    name: str
    values: List[int]
    operation: str
    result: str | None


def llm_node(state: MyCustomState) -> dict:
    values = state["values"]
    op = state["operation"]
    name = state["name"]

    if op == "+":
        temp = str(sum(values))
    elif op == "-":
        temp = str(reduce(lambda x, y: x - y, values))
    elif op == "*":
        temp = str(math.prod(values))
    elif op == "/":
        temp = str(reduce(lambda x, y: x / y, values))
    else:
        temp = "Unknown operation"

    return {"result": f"Hi {name}, your result is {temp}"}


graph = StateGraph(MyCustomState)
graph.add_node("first-node", llm_node)
graph.add_edge(START, "first-node")
graph.add_edge("first-node", END)
app = graph.compile()

result = app.invoke(
    {
        "name": "Madhu",
        "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "operation": "*",
    }
)

print(result)

# with open("graph2.png", "wb") as f:
#     f.write(app.get_graph().draw_mermaid_png())
