import {
  StateGraph,
  START,
  END,
  Annotation,
  StateType,
  UpdateType,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { OPENAI_API_KEY } from "./env";

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  maxTokens: undefined,
  timeout: undefined,
  maxRetries: 2,
  apiKey: OPENAI_API_KEY,
  // other params...
});

// Define the state structure
const InputStateObject = Annotation.Root({
  name: Annotation<string>,
});

// Define the state structure
const OutputStateObject = Annotation.Root({
  greetings: Annotation<string>,
});

// Define the state structure
const GraphStateObject = Annotation.Root({
  name: Annotation<string>,
  greetings: Annotation<string>,
});

// Define a node
const node = async (state: typeof InputStateObject.State) => {
  // Write to StateObject
  const inputText = `You are a warm, friendly AI with a charming Southern flair.
Say greeting to ${state.name}.`;

  const completion = await llm.invoke(inputText);

  return { greetings: completion.content };
};

// Create a new StateGraph
const graph = new StateGraph<
  (typeof GraphStateObject)["spec"],
  StateType<(typeof GraphStateObject)["spec"]>,
  UpdateType<(typeof GraphStateObject)["spec"]>,
  typeof START,
  (typeof InputStateObject)["spec"],
  (typeof OutputStateObject)["spec"]
>({
  input: InputStateObject,
  output: OutputStateObject,
  stateSchema: GraphStateObject,
});

// Add nodes to the graph
graph.addNode("node", node);

// Define the graph structure (add edges)
graph.addEdge(START, "node");
graph.addEdge("node", END);

// Compile the graph (and export it for LangGraph Studio)
export const agent = graph.compile();
agent.name = "Demo 4";

// Execute the graph
const result = await agent.invoke({ name: "Ali" });

// Print the result
console.log(result.greetings);
