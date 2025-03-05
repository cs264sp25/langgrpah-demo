import { StateGraph, START, END, Annotation } from '@langchain/langgraph';

// Define the state structure
const StateObject = Annotation.Root({
  name: Annotation<string>,
  greetings: Annotation<string>,
});

// Define nodes
const node1 = async (state: typeof StateObject.State) => {
  // Write to StateObject
  return { greetings: "Hello " };
};

const node2 = async (state: typeof StateObject.State) => {
  // Write to StateObject
  return { greetings: state.greetings + state.name };
};

const node3 = async (state: typeof StateObject.State) => {
  // Write to StateObject
  return { greetings: state.greetings + "!" };
};

// Create a new StateGraph
const graph = new StateGraph(StateObject);

// Add nodes to the graph
graph.addNode('node1', node1);
graph.addNode('node2', node2);
graph.addNode('node3', node3);

// Define the graph structure (add edges)
graph.addEdge(START, 'node1');
graph.addEdge('node1', 'node2');
graph.addEdge('node2', 'node3');
graph.addEdge('node3', END);

// Compile the graph (and export it for LangGraph Studio)
export const agent = graph.compile();
agent.name = "Demo 2";
