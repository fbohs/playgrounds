# sequential graph

from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List


class MyCustomState(TypedDict):
    name: str
    skills: List[str]
    age: str
    result: str | None


def greet_user(state: MyCustomState) -> dict:
    name = state["name"]
    return {"result": f"Well Hello Hello {name}, How are you doing today?"}


def age_reducer(state: MyCustomState) -> dict:
    age = state["age"]
    return {"result": state["result"] + f" Your Age is {age}."}


def skill_analyser(state: MyCustomState) -> dict:
    skills = state["skills"]
    skills_list = ", ".join(skills)
    return {"result": state["result"] + f" Your Skills are {skills_list}."}


graph = StateGraph(MyCustomState)

graph.add_node("name-node", greet_user)
graph.add_node("age-node", age_reducer)
graph.add_node("skills-node", skill_analyser)

graph.add_edge(START, "name-node")
graph.add_edge("name-node", "age-node")
graph.add_edge("age-node", "skills-node")
graph.add_edge("skills-node", END)

app = graph.compile()

result = app.invoke(
    {
        "name": "Madhu",
        "skills": ["Python", "LangGraph", "React", "NodeJS"],
        "age": 28,
    }
)

print(result["result"])

# from IPython.display import Image

# with open("graph3.png", "wb") as f:
#     f.write(app.get_graph().draw_mermaid_png())
