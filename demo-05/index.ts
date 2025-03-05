import { agent } from "./graph";

// Execute the graph
const essayPrompt =
  "Discuss whether social media has a positive or negative impact on society.";
const result = await agent.invoke({ prompt: essayPrompt });
console.log("\n===== Essay Plan =====\n", result.formattedEssayPlan);