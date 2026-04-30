import * as fs from 'fs';
import {
    StateGraph,
    START,
    END,
    Annotation,
    messagesStateReducer,
    AnnotationRoot,
    Command,
} from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { ToolNode } from "@langchain/langgraph/prebuilt";

import * as dotenv from "dotenv";
dotenv.config();

const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

function getContextLines(
    fileName: string,
    lineNumber: number,
    before: number = 3,
    after: number = 3
): string {
    const lines = fs.readFileSync(fileName, 'utf-8').split('\n');
    const start = Math.max(0, lineNumber - before - 1);
    const end = Math.min(lines.length, lineNumber + after);
    return lines.slice(start, end).join('\n');
}

const getContextLinesTool = tool(
    async ({ fileName, lineNumber, before = 3, after = 3 }) => {
        console.log("Reading files:", fileName, lineNumber);

        return getContextLines(`${fileName}`, lineNumber, before, after);
    },
    {
        name: "get_context_lines",
        description: "Get a few lines before and after a line number in a file.",
        schema: z.object({
            fileName: z.string().describe("Path to the file"),
            lineNumber: z.number().describe("Line number (1-based)"),
            before: z.number().optional().describe("Lines before"),
            after: z.number().optional().describe("Lines after")
        })
    }
);

const agent = createReactAgent({
    llm: llm,
    tools: [getContextLinesTool]
})

const webSearchTool = new TavilySearchResults({
    maxResults: 4,
    apiKey: process.env.TAVILY_API_KEY,
});

const tools = [getContextLinesTool, webSearchTool];

const toolNode = new ToolNode(tools);

const GraphState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),
    userInput: Annotation<string>,
    logs: Annotation<string>
});

type GS = {
    logs: string,
    messages: BaseMessage[],
    userInput: string
}

const shouldContinue = (state: GS): string => {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return "toolNode";
    }
    return END;
};

const primaryNode = async (state: GS) => {
    const systemMessage = new SystemMessage(`
		You are an expert software developer. You need to help my user with debugging. Attaching some of the logs below. study it and help the user.
		You have access to tool calls that can help you read lines from the files used in the project you are debugging. Feel free to use them.
		
		Make sure you do as much of the work as possible. Call the tools if you think it'll help reduce steps for the user.
		No need to ask permission before calling tools.
		
		Expected output is a specfic fix.


		Logs:
		${state.logs}


        You are an expert software debugger. You need to help my user with debugging. Attaching some of the logs below. study it and help the user.
	`);
    console.log(`------- State messages count: ${state.messages.length} --------`);

    const messages = [systemMessage].concat(state.messages);
    const res = await agent.invoke({ messages: [systemMessage].concat(messages) });
    const newAIMessage = res.messages[res.messages.length - 1]

    return new Command({
        goto: END,
        update: {
            messages: [newAIMessage]
        }
    })
}
const actionsNode = () => {
    return {}
}


export const graph = new StateGraph(GraphState)
    .addNode("primaryNode", primaryNode)
    .addNode("toolNode", toolNode)
    .addEdge(START, "primaryNode")
    .addConditionalEdges(
        "primaryNode",
        shouldContinue,
        {
            toolNode: "toolNode",
            [END]: END,
        }
    )
    .addEdge("toolNode", "primaryNode")
    .compile();

// export const graph = new StateGraph(GraphState)
//   .addNode("primaryNode", primaryNode, { ends: ["actionsNode"] })
//   .addNode("actionsNode", actionsNode)
//   .addEdge(START, "primaryNode")
//   .addEdge("primaryNode", END)
//   .compile()
