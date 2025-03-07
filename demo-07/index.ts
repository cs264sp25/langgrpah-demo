import { agent } from "./graph";

// Sample learning outcomes to test
const learningOutcomes = [
  "Students will be able to write a function that implements a binary search algorithm.",
  "Students will be able to explain the difference between procedural and object-oriented programming paradigms.",
  "Students will be able to identify common syntax errors in JavaScript code.",
  "Students will be able to analyze a given algorithm and determine its time complexity."
];

// Execute the graph for each learning outcome
for (const outcome of learningOutcomes) {
  console.log("\n===== LEARNING OUTCOME =====");
  console.log(outcome);
  
  const result = await agent.invoke({ learningOutcome: outcome });
  
  console.log("\n===== ASSESSMENT TYPE =====");
  console.log(result.assessmentType);
  
  console.log("\n===== ASSESSMENT DESCRIPTION =====");
  console.log(result.assessmentDescription);
  
  console.log("\n" + "=".repeat(50) + "\n");
} 