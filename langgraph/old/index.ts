import 'dotenv/config';
import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

const AgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (a, b) => a.concat(b),
        default: () => [],
    }),
});

// Define the type for the State object
type AgentStateSchema = typeof AgentState.State;

const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
});

const startNode = async (state: AgentStateSchema): Promise<Partial<AgentStateSchema>> => {
    console.log('--- Executing Start Node ---');
    return {};
};

const llmNode = async (state: AgentStateSchema): Promise<Partial<AgentStateSchema>> => {
    console.log('--- Executing LLM Node ---');
    const lastMessage = state.messages.slice(-1)[0];
    if (!lastMessage) {
        throw new Error('No message found in state.');
    }

    const prompt = [
        new HumanMessage(
            `You are a friendly AI assistant. Say a personalized "Hello World!" greeting based on this input: "${lastMessage.content}"`,
        ),
    ];

    const response = await model.invoke(prompt);

    // Return the LLM's response message to be added to the state
    return {
        messages: [response],
    };
};

const workflow = new StateGraph(AgentState)
    .addNode('start_node', startNode)
    .addNode('llm_node', llmNode)
    .addEdge(START, 'start_node')
    .addEdge('start_node', 'llm_node')
    .addEdge('llm_node', END);

// Compile the workflow into a runnable
const app = workflow.compile();

// --- 5. Run the Graph
async function runGraph(input: string) {
    console.log(`\n--- Running Graph for Input: "${input}" ---`);

    // The initial state for the invoke call
    const initialState: Partial<AgentStateSchema> = {
        messages: [new HumanMessage(input)],
    };

    // Invoke the graph
    const finalState = await app.invoke(initialState);

    // Print the final output message
    const finalMessage = finalState.messages.slice(-1)[0];
    console.log('\n✅ Final Agent Response:');
    if (finalMessage) {
        console.log(finalMessage.content);
    } else {
        console.log('No final message found.');
    }
}

// Hello World Execution
(async () => {
    await runGraph('My name is Alex and I am learning LangGraph.');
})();