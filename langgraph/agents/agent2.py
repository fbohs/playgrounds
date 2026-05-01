# basic agent with memory and saving state to a file

from langchain.messages import HumanMessage, AIMessage
from typing import TypedDict, List, Union
from langgraph.graph import StateGraph, START, END
from langchain_ollama import ChatOllama

llm = ChatOllama(model="llama3.2:3b")


class State(TypedDict):
    messages: List[Union[HumanMessage, AIMessage]]


def llm_node(state: State) -> State:
    response = llm.invoke(state["messages"])
    state["messages"].append(AIMessage(content=response.content))
    print(f"\nAI: {response.content}")
    print("CURRENT STATE: ", state["messages"])

    return state


graph = StateGraph(State)
graph.add_node("llm_node", llm_node)
graph.add_edge(START, "llm_node")
graph.add_edge("llm_node", END)
app = graph.compile()

conversation_history = []

user_input = input("Enter: ")
while user_input != "exit":
    conversation_history.append(HumanMessage(content=user_input))
    result = app.invoke({"messages": conversation_history})
    conversation_history = result["messages"]
    user_input = input("Enter: ")


with open("logging.txt", "w") as file:
    file.write("Your Conversation Log:\n")

    for message in conversation_history:
        if isinstance(message, HumanMessage):
            file.write(f"You: {message.content}\n")
        elif isinstance(message, AIMessage):
            file.write(f"AI: {message.content}\n\n")
    file.write("End of Conversation")

print("Conversation saved to logging.txt")
