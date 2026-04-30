from langgraph.graph import StateGraph, MessagesState, START, END
# from IPython.display import Image


def mock_llm(state: MessagesState):
    # print(state)
    print(state["messages"][-1].content)

    return {"messages": [{"role": "ai", "content": "hello world"}]}


graph = StateGraph(MessagesState)
graph.add_node("mock_llm_node", mock_llm)
graph.add_edge(START, "mock_llm_node")
graph.add_edge("mock_llm_node", END)
graph = graph.compile()

result = graph.invoke({"messages": [{"role": "user", "content": "hi!"}]})

print(result["messages"])

# with open("graph1.png", "wb") as f:
#     f.write(graph.get_graph().draw_mermaid_png())
