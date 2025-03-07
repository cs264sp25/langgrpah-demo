import { agent } from "./graph";

// Execute the graph
const topic = "Introduction to JavaScript";
const context = "This is the first module in a web development course for beginners. Students have no prior programming experience.";

const result = await agent.invoke({ topic, context });

// Print the result
console.log(result.combinedOutcomes); 