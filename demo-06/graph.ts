import {
  StateGraph,
  START,
  END,
  Annotation,
  StateType,
  UpdateType,
} from "@langchain/langgraph";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { OPENAI_API_KEY } from "../env";

const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
  compatibility: "strict",
});

// Define state structure
const InputState = Annotation.Root({
  topic: Annotation<string>,
  context: Annotation<string>,
});

const OutputState = Annotation.Root({
  combinedOutcomes: Annotation<string>,
});

const GraphState = Annotation.Root({
  topic: Annotation<string>,
  context: Annotation<string>,
  remembering: Annotation<string[]>,
  understanding: Annotation<string[]>,
  applying: Annotation<string[]>,
  analyzing: Annotation<string[]>,
  evaluating: Annotation<string[]>,
  creating: Annotation<string[]>,
  combinedOutcomes: Annotation<string>,
});

// Node 1: Initial processing of the topic and context
const processInput = async (state: typeof InputState.State) => {
  return {
    topic: state.topic,
    context: state.context,
  };
};

// Node 2: Generate Remembering level outcomes
const generateRemembering = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      outcomes: z.array(z.string()).min(2).max(3),
    }),
    prompt: `Generate 2-3 student learning outcomes for the REMEMBERING level of Bloom's taxonomy for the following topic:
    
    Topic: ${state.topic}
    Context: ${state.context}
    
    Each outcome should:
    1. Start with an action verb appropriate for the REMEMBERING level (e.g., define, list, recall, identify, name, recognize)
    2. Be specific, measurable, and observable
    3. Focus on recalling or remembering information
    
    Format each outcome as a complete sentence starting with "Students will be able to..."`,
  });
  
  return { remembering: object.outcomes };
};

// Node 3: Generate Understanding level outcomes
const generateUnderstanding = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      outcomes: z.array(z.string()).min(2).max(3),
    }),
    prompt: `Generate 2-3 student learning outcomes for the UNDERSTANDING level of Bloom's taxonomy for the following topic:
    
    Topic: ${state.topic}
    Context: ${state.context}
    
    Each outcome should:
    1. Start with an action verb appropriate for the UNDERSTANDING level (e.g., explain, describe, interpret, summarize, classify, compare)
    2. Be specific, measurable, and observable
    3. Focus on demonstrating understanding of information
    
    Format each outcome as a complete sentence starting with "Students will be able to..."`,
  });
  
  return { understanding: object.outcomes };
};

// Node 4: Generate Applying level outcomes
const generateApplying = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      outcomes: z.array(z.string()).min(2).max(3),
    }),
    prompt: `Generate 2-3 student learning outcomes for the APPLYING level of Bloom's taxonomy for the following topic:
    
    Topic: ${state.topic}
    Context: ${state.context}
    
    Each outcome should:
    1. Start with an action verb appropriate for the APPLYING level (e.g., apply, implement, use, execute, solve, demonstrate)
    2. Be specific, measurable, and observable
    3. Focus on applying knowledge in new situations
    
    Format each outcome as a complete sentence starting with "Students will be able to..."`,
  });
  
  return { applying: object.outcomes };
};

// Node 5: Generate Analyzing level outcomes
const generateAnalyzing = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      outcomes: z.array(z.string()).min(2).max(3),
    }),
    prompt: `Generate 2-3 student learning outcomes for the ANALYZING level of Bloom's taxonomy for the following topic:
    
    Topic: ${state.topic}
    Context: ${state.context}
    
    Each outcome should:
    1. Start with an action verb appropriate for the ANALYZING level (e.g., analyze, differentiate, organize, compare, deconstruct, examine)
    2. Be specific, measurable, and observable
    3. Focus on breaking down concepts into parts and understanding relationships
    
    Format each outcome as a complete sentence starting with "Students will be able to..."`,
  });
  
  return { analyzing: object.outcomes };
};

// Node 6: Generate Evaluating level outcomes
const generateEvaluating = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      outcomes: z.array(z.string()).min(2).max(3),
    }),
    prompt: `Generate 2-3 student learning outcomes for the EVALUATING level of Bloom's taxonomy for the following topic:
    
    Topic: ${state.topic}
    Context: ${state.context}
    
    Each outcome should:
    1. Start with an action verb appropriate for the EVALUATING level (e.g., evaluate, assess, critique, judge, defend, justify)
    2. Be specific, measurable, and observable
    3. Focus on making judgments based on criteria
    
    Format each outcome as a complete sentence starting with "Students will be able to..."`,
  });
  
  return { evaluating: object.outcomes };
};

// Node 7: Generate Creating level outcomes
const generateCreating = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      outcomes: z.array(z.string()).min(2).max(3),
    }),
    prompt: `Generate 2-3 student learning outcomes for the CREATING level of Bloom's taxonomy for the following topic:
    
    Topic: ${state.topic}
    Context: ${state.context}
    
    Each outcome should:
    1. Start with an action verb appropriate for the CREATING level (e.g., create, design, develop, formulate, construct, produce)
    2. Be specific, measurable, and observable
    3. Focus on creating new products, ideas, or ways of viewing things
    
    Format each outcome as a complete sentence starting with "Students will be able to..."`,
  });
  
  return { creating: object.outcomes };
};

// Node 8: Combine all outcomes
const combineOutcomes = async (state: typeof GraphState.State) => {
  const combinedOutcomes = `# Learning Outcomes for: ${state.topic}

## Remembering
${state.remembering.map((outcome, index) => `${index + 1}. ${outcome}`).join('\n')}

## Understanding
${state.understanding.map((outcome, index) => `${index + 1}. ${outcome}`).join('\n')}

## Applying
${state.applying.map((outcome, index) => `${index + 1}. ${outcome}`).join('\n')}

## Analyzing
${state.analyzing.map((outcome, index) => `${index + 1}. ${outcome}`).join('\n')}

## Evaluating
${state.evaluating.map((outcome, index) => `${index + 1}. ${outcome}`).join('\n')}

## Creating
${state.creating.map((outcome, index) => `${index + 1}. ${outcome}`).join('\n')}
`;

  return { combinedOutcomes };
};

// Create the StateGraph
const graph = new StateGraph<
  (typeof GraphState)["spec"],
  StateType<(typeof GraphState)["spec"]>,
  UpdateType<(typeof GraphState)["spec"]>,
  typeof START,
  (typeof InputState)["spec"],
  (typeof OutputState)["spec"]
>({
  input: InputState,
  output: OutputState,
  stateSchema: GraphState,
});

// Add nodes to the graph
graph.addNode("processInput", processInput);
graph.addNode("generateRemembering", generateRemembering);
graph.addNode("generateUnderstanding", generateUnderstanding);
graph.addNode("generateApplying", generateApplying);
graph.addNode("generateAnalyzing", generateAnalyzing);
graph.addNode("generateEvaluating", generateEvaluating);
graph.addNode("generateCreating", generateCreating);
graph.addNode("combineOutcomes", combineOutcomes);

// Define the flow with parallelization
graph.addEdge(START, "processInput");

// Parallel execution of outcome generation for different Bloom's levels
graph.addEdge("processInput", "generateRemembering");
graph.addEdge("processInput", "generateUnderstanding");
graph.addEdge("processInput", "generateApplying");
graph.addEdge("processInput", "generateAnalyzing");
graph.addEdge("processInput", "generateEvaluating");
graph.addEdge("processInput", "generateCreating");

// All parallel nodes feed into the combiner
graph.addEdge("generateRemembering", "combineOutcomes");
graph.addEdge("generateUnderstanding", "combineOutcomes");
graph.addEdge("generateApplying", "combineOutcomes");
graph.addEdge("generateAnalyzing", "combineOutcomes");
graph.addEdge("generateEvaluating", "combineOutcomes");
graph.addEdge("generateCreating", "combineOutcomes");

graph.addEdge("combineOutcomes", END);

// Compile the graph
export const agent = graph.compile();
agent.name = "Learning Outcomes Generator"; 