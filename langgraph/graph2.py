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


def llm_node(current_state: MyCustomState) -> MyCustomState:
    temp_state = current_state
    print(temp_state)

    if temp_state["operation"] == "+":
        temp_state["result"] = str(sum(temp_state["values"]))
    elif temp_state["operation"] == "-":
        temp_state["result"] = str(reduce(lambda x, y: x - y, temp_state["values"]))
    elif temp_state["operation"] == "*":
        temp_state["result"] = str(math.prod(temp_state["values"]))
    elif temp_state["operation"] == "/":
        temp_state["result"] = str(reduce(lambda x, y: x / y, temp_state["values"]))
    else:
        temp_state["result"] = "Unknown operation"

    return temp_state


graph = StateGraph(MyCustomState)
graph.add_node("first-node", llm_node)
graph.add_edge(START, "first-node")
graph.add_edge("first-node", END)
app = graph.compile()

result = app.invoke(
    {
        "name": "John",
        "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "operation": "*",
    }
)

print(result)

# with open("graph2.png", "wb") as f:
#     f.write(app.get_graph().draw_mermaid_png())
