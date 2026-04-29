import * as fs from 'fs';
import {
  StateGraph,
  START,
  END,
  Annotation,
  messagesStateReducer,
  Command,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
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
  before: number = 5,
  after: number = 5
): string {
  try {
    const lines = fs.readFileSync(fileName, 'utf-8').split('\n');
    const start = Math.max(0, lineNumber - before - 1);
    const end = Math.min(lines.length, lineNumber + after);
    const contextLines = lines.slice(start, end);
    
    return contextLines
      .map((line, idx) => {
        const lineNum = start + idx + 1;
        const marker = lineNum === lineNumber ? '→' : ' ';
        return `${marker} ${lineNum.toString().padStart(4)}: ${line}`;
      })
      .join('\n');
  } catch (error: any) {
    return `❌ Error reading ${fileName}: ${error.message}`;
  }
}

const getContextLinesTool = tool(
  async ({ fileName, lineNumber, before = 5, after = 5 }) => {
    return getContextLines(fileName, lineNumber, before, after);
  },
  {
    name: "get_context_lines",
    description: "Read specific lines from a file with surrounding context. Use when error messages mention specific files and line numbers.",
    schema: z.object({
      fileName: z.string().describe("Path to the file (e.g., 'index.tsx', 'src/utils.ts')"),
      lineNumber: z.number().describe("Line number to focus on (1-based)"),
      before: z.number().optional().describe("Lines to show before (default: 5)"),
      after: z.number().optional().describe("Lines to show after (default: 5)")
    })
  }
);

const readFileTool = tool(
  async ({ fileName }) => {
    try {
      const content = fs.readFileSync(fileName, 'utf-8');
      return content;
    } catch (error: any) {
      return `❌ Error reading ${fileName}: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description: "Read the complete contents of a file. Use for small files or when you need to see the entire structure.",
    schema: z.object({
      fileName: z.string().describe("Path to the file")
    })
  }
);

const listFilesTool = tool(
  async ({ directory = ".", pattern }) => {
    try {
      let files = fs.readdirSync(directory);
      files = files.filter(f => !f.startsWith('.') && f !== 'node_modules');
      if (pattern) {
        const regex = new RegExp(pattern);
        files = files.filter(f => regex.test(f));
      }
      return files.length > 0 ? files.join('\n') : 'No files found';
    } catch (error: any) {
      return `❌ Error listing directory: ${error.message}`;
    }
  },
  {
    name: "list_files",
    description: "List files in a directory. Useful for exploring project structure.",
    schema: z.object({
      directory: z.string().optional().describe("Directory to list (default: current directory)"),
      pattern: z.string().optional().describe("Optional regex pattern to filter files (e.g., '.tsx$' for TypeScript files)")
    })
  }
);
  
const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  logs: Annotation<string>({
    value: (_prev, next) => (typeof next === "string" ? next : _prev),
    default: () => "",
  }),
  userInput: Annotation<string | undefined>({
    value: (_prev, next) => (typeof next === "string" || next === undefined ? next : _prev),
    default: () => undefined,
  }),
  intent: Annotation<string | undefined>({
    value: (_prev, next) => (typeof next === "string" || next === undefined ? next : _prev),
    default: () => undefined,
  }),
  contextFindings: Annotation<string | undefined>({
    value: (_prev, next) => (typeof next === "string" || next === undefined ? next : _prev),
    default: () => undefined,
  }),
  proposedFix: Annotation<string | undefined>({
    value: (_prev, next) => (typeof next === "string" || next === undefined ? next : _prev),
    default: () => undefined,
  }),
  verificationSteps: Annotation<string | undefined>({
    value: (_prev, next) => (typeof next === "string" || next === undefined ? next : _prev),
    default: () => undefined,
  }),
  targetFile: Annotation<string | undefined>({
    value: (_prev, next) => (typeof next === "string" || next === undefined ? next : _prev),
    default: () => undefined,
  }),
  targetLine: Annotation<number | undefined>({
    value: (_prev, next) => (typeof next === "number" || next === undefined ? next : _prev),
    default: () => undefined,
  }),
  targetConfidence: Annotation<number | undefined>({
    value: (_prev, next) => (typeof next === "number" || next === undefined ? next : _prev),
    default: () => undefined,
  }),
  awaitingTarget: Annotation<boolean>({
    value: (_prev, next) => (typeof next === "boolean" ? next : _prev),
    default: () => false,
  }),
  needsFileInspection: Annotation<boolean>({
    value: (_prev, next) => (typeof next === "boolean" ? next : _prev),
    default: () => false,
  }),
  useDeepDive: Annotation<boolean>({
    value: (_prev, next) => (typeof next === "boolean" ? next : _prev),
    default: () => false,
  }),
  steps: Annotation<number>({
    value: (_prev, next) => (typeof next === "number" ? next : _prev),
    default: () => 0,
  }),
});

type GS = typeof GraphState.State;

const MAX_STEPS = 8;

const masterNode = async (state: GS) => {
  if (state.steps >= MAX_STEPS) {
    return new Command({ goto: "consolidate" });
  }

  if (!state.intent) {
    return new Command({ goto: "classifyIntent" });
  }
  
  if (!state.contextFindings) {
    return new Command({ goto: "gatherContext" });
  }
  
  if (!state.targetFile && !state.awaitingTarget) {
    return new Command({ goto: "locateTarget" });
  }
  if (state.awaitingTarget) {
    return new Command({ goto: "receiveTarget" });
  }

  if (state.needsFileInspection) {
    return new Command({ goto: "inspectFiles" });
  }
  
  if (!state.proposedFix) {
    return new Command({ goto: "proposeFix" });
  }
  
  if (!state.verificationSteps) {
    return new Command({ goto: "verifyFix" });
  }

  return new Command({ goto: "consolidate" });
};

const classifyIntent = async (state: GS) => {
  
  const systemPrompt = `You are analyzing a debugging request. Extract the core issue in 2-3 concise sentences:

1. What type of issue is this? (error, crash, unexpected behavior, performance, etc.)
2. What is the key symptom or error message?
3. What component/feature is affected?

Be specific and factual. Avoid speculation.`;

  const lastUserMessage = state.messages[state.messages.length - 1];
  const userContent = typeof lastUserMessage.content === 'string' 
    ? lastUserMessage.content 
    : JSON.stringify(lastUserMessage.content);

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`User Query: ${userContent}\n\nRecent Logs (last 1000 chars):\n${state.logs.slice(-1000)}`)
  ];

  try {
    const res = await llm.invoke(messages);
    let intent = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    if (!intent || intent.trim() === "") intent = undefined as unknown as string;
    return new Command({ goto: "master", update: { intent, steps: state.steps + 1 } });
  } catch (e: any) {
    return new Command({ goto: "consolidate", update: { intent: `Intent classification failed: ${e?.message || e}` } });
  }
};

const gatherContext = async (state: GS) => {
  
  const systemPrompt = `Analyze the logs and extract structured debugging context.

Output format:
**Error Type:** [Syntax Error / Runtime Error / Logic Bug / Build Error / etc.]
**Error Message:** [Exact error message if present]
**Files Mentioned:** [List files with line numbers if available]
**Stack Trace:** [Key frames if present]
**Patterns:** [Any recurring issues or suspicious patterns]
**Needs Code Inspection:** [YES/NO]

Say YES to code inspection if:
- Error mentions specific files/line numbers
- Need to see actual implementation
- Stack trace points to code
- Logic bug suspected

Be thorough but concise.`;

  const contextMessage = state.intent 
    ? `\n**Identified Intent:**\n${state.intent}\n\n` 
    : "";

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`${contextMessage}**Full Logs:**\n${state.logs}`)
  ];

  try {
    const res = await llm.invoke(messages);
    let contextFindings = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    if (!contextFindings || contextFindings.trim() === "") contextFindings = undefined as unknown as string;
    const needsFileInspection = !!contextFindings && /needs?\s+(code|file)\s+inspection:\s*yes/i.test(contextFindings);
    return new Command({ goto: "master", update: { contextFindings, needsFileInspection, steps: state.steps + 1 } });
  } catch (e: any) {
    return new Command({ goto: "consolidate", update: { contextFindings: `Context gathering failed: ${e?.message || e}` } });
  }
};

const inspectFiles = async (state: GS) => {
  
  const systemPrompt = `You are inspecting code files to understand the bug. 

Available tools:
- get_context_lines: Read specific lines with context (use for errors with line numbers)
- read_file: Read entire file (use for small files or full structure)
- list_files: Explore project structure

Based on the context findings, use tools strategically to:
1. Read the files mentioned in errors
2. Check surrounding code for issues
3. Look for obvious bugs (missing imports, typos, logic errors)

After using tools, provide a brief summary of what you found in the code.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`**Context:**\n${state.contextFindings}\n\n**Task:** Inspect the relevant files and report findings.`)
  ];
  try {
    const resWithTools = await llm.bindTools([
      getContextLinesTool,
      readFileTool,
      listFilesTool,
    ]).invoke(messages);

    let fileInspectionResult = "";

    const toolCalls: any[] = (resWithTools as any).tool_calls || [];
    if (toolCalls.length > 0) {
      const toolResults: string[] = [];
      for (const toolCall of toolCalls) {
        let result = "";
        if (toolCall.name === "get_context_lines") {
          const args = toolCall.args as { fileName: string; lineNumber: number; before?: number; after?: number };
          const out = await getContextLinesTool.invoke(args as any);
          result = typeof out === "string" ? out : String(out);
          toolResults.push(`\n**${args.fileName}:${args.lineNumber}**\n\`\`\`\n${result}\n\`\`\``);
        } else if (toolCall.name === "read_file") {
          const args = toolCall.args as { fileName: string };
          const out = await readFileTool.invoke(args as any);
          result = typeof out === "string" ? out : String(out);
          const truncated = result.length > 2000 ? result.substring(0, 2000) + "\n...[truncated]..." : result;
          toolResults.push(`\n**${args.fileName}** (full file)\n\`\`\`\n${truncated}\n\`\`\``);
        } else if (toolCall.name === "list_files") {
          const args = toolCall.args as { directory?: string; pattern?: string };
          const out = await listFilesTool.invoke(args as any);
          result = typeof out === "string" ? out : String(out);
          toolResults.push(`\n**Files in ${args.directory || '.'}:**\n${result}`);
        }
      }
      fileInspectionResult = toolResults.join("\n\n");
      const interpretMessages = [
        new SystemMessage("Based on the code you inspected, summarize your findings. What did you discover? Are there obvious bugs or issues?"),
        new HumanMessage(`**Code Inspection Results:**${fileInspectionResult}`),
      ];
      const interpretation = await llm.invoke(interpretMessages);
      fileInspectionResult += `\n\n**Analysis:**\n${interpretation.content}`;
    } else {
      fileInspectionResult = "\n*No files inspected - LLM determined inspection wasn't necessary.*";
    }

    const updatedContext = `${state.contextFindings}\n\n## 📄 Code Inspection${fileInspectionResult}`;
    return new Command({ goto: "master", update: { contextFindings: updatedContext, needsFileInspection: false, steps: state.steps + 1 } });
  } catch (e: any) {
    return new Command({ goto: "consolidate", update: { contextFindings: `${state.contextFindings || ''}\n\nInspection failed: ${e?.message || e}` } });
  }
};
const locateTarget = async (state: GS) => {
  const logMatch = state.logs.match(/[\w-/_.]+\.(ts|tsx|js|jsx)/);
  const userHint = state.userInput && state.userInput.match(/[\w-/_.]+\.(ts|tsx|js|jsx)/);
  const candidate = userHint?.[0] || logMatch?.[0];
  if (candidate) {
    return new Command({ goto: "master", update: { targetFile: candidate, targetConfidence: 0.6, steps: state.steps + 1 } });
  }
  const ask = new AIMessage("I couldn't locate the exact file. Please provide the file path and, if possible, a nearby unique line.");
  return new Command({ goto: "master", update: { messages: state.messages.concat([ask]), awaitingTarget: true, steps: state.steps + 1 } });
};

const receiveTarget = async (state: GS) => {
  const last = state.messages[state.messages.length - 1];
  const text = typeof last?.content === 'string' ? last.content : '';
  const pathMatch = text.match(/[\w-/_.]+\.(ts|tsx|js|jsx)/);
  const lineMatch = text.match(/:(\d+)/);
  const targetFile = pathMatch?.[0];
  const targetLine = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
  if (targetFile) {
    return new Command({ goto: "master", update: { targetFile, targetLine, targetConfidence: 0.95, awaitingTarget: false, steps: state.steps + 1 } });
  }
  const ask = new AIMessage("Please share the path to the file to edit (e.g., src/services/apiService.js). You can also include :<line> like src/file.js:42.");
  return new Command({ goto: "master", update: { messages: state.messages.concat([ask]), awaitingTarget: true, steps: state.steps + 1 } });
};

const proposeFix = async (state: GS) => {
  
  const systemPrompt = `Based on all the analysis, propose a specific, minimal, safe fix.

Your fix should include:
1. **What to change:** Exact file and code modification
2. **Why this fixes it:** Root cause explanation
3. **Implementation:** Code snippet or configuration change
4. **Side effects:** Any potential issues or things to watch

Be specific and actionable. Provide actual code, not pseudocode.
Keep the fix minimal - only change what's necessary.

STRICT OUTPUT FORMAT:
- File: <relative/path/to/file>
- Anchor: <a unique line to search for>
- Edit: <describe insert/replace around the Anchor>
- Why: <one short paragraph>`;

  const cumulativeContext = `
## 🎯 Issue
${state.intent}

## 📊 Analysis
${state.contextFindings}
`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(cumulativeContext + (state.targetFile ? `\n\nTarget hint: ${state.targetFile}${state.targetLine ? `:${state.targetLine}` : ''}` : ''))
  ];

  try {
    const res = await llm.invoke(messages);
    let proposedFix = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    if (!proposedFix || proposedFix.trim() === "") proposedFix = undefined as unknown as string;
    return new Command({ goto: "master", update: { proposedFix, steps: state.steps + 1 } });
  } catch (e: any) {
    return new Command({ goto: "consolidate", update: { proposedFix: `Fix proposal failed: ${e?.message || e}` } });
  }
};

const verifyFix = async (state: GS) => {
  
  const systemPrompt = `Provide concrete steps to verify the proposed fix works.

Include:
1. **Pre-verification:** What to check before applying fix
2. **How to apply:** Step-by-step instructions
3. **Testing:** Commands to run or actions to perform
4. **Expected outcome:** What should happen if fix works
5. **Rollback:** How to undo if something goes wrong

Be practical and specific with actual commands.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`**Proposed Fix:**\n${state.proposedFix}\n\n**Original Logs:**\n${state.logs.slice(-500)}`)
  ];

  try {
    const res = await llm.invoke(messages);
    let verificationSteps = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    if (!verificationSteps || verificationSteps.trim() === "") verificationSteps = undefined as unknown as string;
    return new Command({ goto: "master", update: { verificationSteps, steps: state.steps + 1 } });
  } catch (e: any) {
    return new Command({ goto: "consolidate", update: { verificationSteps: `Verification generation failed: ${e?.message || e}` } });
  }
};

const consolidate = async (state: GS) => {
  const fixOnly = (state.proposedFix && state.proposedFix.trim().length > 0)
    ? state.proposedFix
    : "No fix available. Try refining the request or provide more logs.";
  const finalMessage = new AIMessage(fixOnly);
  return new Command({ goto: END, update: { messages: state.messages.concat([finalMessage]) } });
};

export const graph = new StateGraph(GraphState)
  .addNode("master", masterNode, {
    ends: ["classifyIntent", "gatherContext", "locateTarget", "receiveTarget", "inspectFiles", "proposeFix", "verifyFix", "consolidate"]
  })
  .addNode("classifyIntent", classifyIntent, { ends: ["master"] })
  .addNode("gatherContext", gatherContext, { ends: ["master"] })
  .addNode("locateTarget", locateTarget, { ends: ["master"] })
  .addNode("receiveTarget", receiveTarget, { ends: ["master"] })
  .addNode("inspectFiles", inspectFiles, { ends: ["master"] })
  .addNode("proposeFix", proposeFix, { ends: ["master"] })
  .addNode("verifyFix", verifyFix, { ends: ["master"] })
  .addNode("consolidate", consolidate)
  .addEdge(START, "master")
  .compile();