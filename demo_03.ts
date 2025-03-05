import { StateGraph, START, END, Annotation } from '@langchain/langgraph';

// Define the state structure
const StateObject = Annotation.Root({
  name: Annotation<string>,
  greetings: Annotation<string>,
});

// Define nodes
const node1 = async (state: typeof StateObject.State) => {
  // Write to StateObject
  return { greetings: "Good " };
};

const node2 = async (state: typeof StateObject.State) => {
  // Write to StateObject
  return { greetings: state.greetings + "morning " };
};

const node3 = async (state: typeof StateObject.State) => {
  // Write to StateObject
  return { greetings: state.greetings + "afternoon " };
};

const node4 = async (state: typeof StateObject.State) => {
  // Write to StateObject
  return { greetings: state.greetings + "evening " };
};

const node5 = async (state: typeof StateObject.State) => {
  // Write to StateObject
  return { greetings: state.greetings + state.name + "!" };
};

const router = () => {
  // Check the time of the day and return the next node
  const time = new Date().getHours();
  if (time < 12) { 
    return 'node2';
  } else if (time < 18) {
    return 'node3';
  }
  return 'node4';
}

// Create a new StateGraph
const graph = new StateGraph(StateObject);

// Add nodes to the graph
graph.addNode('node1', node1);
graph.addNode('node2', node2);
graph.addNode('node3', node3);
graph.addNode('node4', node4);
graph.addNode('node5', node5);

// Define the graph structure (add edges)
graph.addEdge(START, 'node1');
graph.addConditionalEdges('node1', router);
graph.addEdge('node2', 'node5');
graph.addEdge('node3', 'node5');
graph.addEdge('node4', 'node5');
graph.addEdge('node5', END);

// Compile the graph (and export it for LangGraph Studio)
export const agent = graph.compile();
agent.name = "Demo 3";

// Execute the graph
const result = await agent.invoke({ name: "Ali" });

// Print the result
console.log(result.greetings);
