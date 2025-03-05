import { agent } from "./graph";

// Execute the graph
const result = await agent.invoke({ name: "Ali" });

// Print the result
console.log(result.greetings);