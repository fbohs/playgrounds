# basic agent using langgraph and ollama

from langchain.messages import HumanMessage, AIMessage
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_ollama import ChatOllama


class State(TypedDict):
    input: list[HumanMessage]
    output: list[AIMessage]


def llm_node(state: State):
    llm = ChatOllama(model="llama3.2:3b")
    response = llm.invoke(state["input"])
    return {"output": response}


graph = StateGraph(State)
graph.add_node("llm_node", llm_node)
graph.add_edge(START, "llm_node")
graph.add_edge("llm_node", END)
app = graph.compile()

user_input = input("Enter: ")
while user_input != "exit":
    result = app.invoke({"input": [HumanMessage(content=user_input)]})
    print(result["output"].content)
    user_input = input("Enter: ")
