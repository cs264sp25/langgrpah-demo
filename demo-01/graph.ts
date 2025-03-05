import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

// Define the state structure
const StateObject = Annotation.Root({
  name: Annotation<string>,
  greetings: Annotation<string>,
});

// Define a node
const node = async (state: typeof StateObject.State) => {
  // Write to StateObject
  return { greetings: "Hello " + state.name + "!" };
};

// Create a new StateGraph
const graph = new StateGraph(StateObject);

// Add nodes to the graph
graph.addNode("node", node);

// Define the graph structure (add edges)
graph.addEdge(START, "node");
graph.addEdge("node", END);

// Compile the graph (and export it for LangGraph Studio)
export const agent = graph.compile();
agent.name = "Demo 1";
