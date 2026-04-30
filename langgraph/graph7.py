# looping graph

from langgraph.graph import StateGraph, START, END
from typing import TypedDict
import random


class AppAgentState(TypedDict):
    player_name: str
    guesses: list[int]
    attempts: int
    lower_bound: int
    upper_bound: int
    target_number: int
    hint: str


def setup_function(state: AppAgentState) -> AppAgentState:
    # This function will only be executed once at the start of the graph
    state["player_name"] = f"Welcome, {state['player_name']}!"
    state["guesses"] = []
    state["attempts"] = 0
    state["lower_bound"] = state["lower_bound"]
    state["upper_bound"] = state["upper_bound"]
    state["target_number"] = random.randint(state["lower_bound"], state["upper_bound"])
    state["hint"] = "Game started! Try to guess the number."

    print(
        f"{state['player_name']} The game has begun. target number is {state['target_number']}"
    )
    print(
        f"I'm thinking of a number between {state['lower_bound']} and {state['upper_bound']}."
    )

    return state


def guess_function(state: AppAgentState) -> AppAgentState:
    # guess a num bw lower and upper bound
    guess = random.randint(state["lower_bound"], state["upper_bound"])
    state["guesses"].append(guess)
    state["attempts"] += 1

    print(
        f"Range -> ({state['lower_bound']}, {state['upper_bound']}), guess -> {state['guesses'][-1]}"
    )
    return state


def hint_function(state: AppAgentState) -> AppAgentState:
    curr_guess = state["guesses"][-1]
    if curr_guess == state["target_number"]:
        state["hint"] = "Correct guess!"
    elif curr_guess < state["target_number"]:
        state["hint"] = "Too low!"
        state["lower_bound"] = curr_guess + 1
    else:
        state["hint"] = "Too high!"
        state["upper_bound"] = curr_guess - 1

    print(f"hint is: {state['hint']}")

    return state


def should_continue(state: AppAgentState) -> str:
    if (state["guesses"][-1] != state["target_number"]) and (state["attempts"] < 7):
        return "loop"
    elif state["guesses"][-1] == state["target_number"]:
        print("SUCCESS! Found the number in {} attempts.".format(state["attempts"]))
        return "stop"
    else:
        print(
            "FAILED! ran out of attempts. number was {}".format(state["target_number"])
        )
        return "stop"


graph = StateGraph(AppAgentState)
graph.add_node("setup_node", setup_function)
graph.add_node("guess_node", guess_function)
graph.add_node("hint_node", hint_function)

graph.add_edge(START, "setup_node")
graph.add_edge("setup_node", "guess_node")
graph.add_edge("guess_node", "hint_node")

graph.add_conditional_edges(
    "hint_node",
    should_continue,  # action ( not a node )
    {
        "loop": "guess_node",
        "stop": END,
    },
)

graph = graph.compile()

result = graph.invoke(
    {
        "player_name": "Student",
        "guesses": [],
        "attempts": 0,
        "lower_bound": 1,
        "upper_bound": 200,
    }
)
print(result)

# from IPython.display import Image

# with open("graph7.png", "wb") as f:
#     f.write(graph.get_graph().draw_mermaid_png())
