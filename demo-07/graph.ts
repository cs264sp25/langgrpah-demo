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
  learningOutcome: Annotation<string>,
});

const OutputState = Annotation.Root({
  assessmentType: Annotation<string>,
  assessmentDescription: Annotation<string>,
});

const GraphState = Annotation.Root({
  learningOutcome: Annotation<string>,
  assessmentType: Annotation<string>,
  assessmentDescription: Annotation<string>,
});

// Assessment types
const ASSESSMENT_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  OPEN_ENDED: "open_ended",
  CODING: "coding",
  CODE_COMPREHENSION: "code_comprehension",
} as const;

// Node 1: Router to determine the assessment type
const routerNode = async (state: typeof InputState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      assessmentType: z.enum([
        ASSESSMENT_TYPES.MULTIPLE_CHOICE,
        ASSESSMENT_TYPES.OPEN_ENDED,
        ASSESSMENT_TYPES.CODING,
        ASSESSMENT_TYPES.CODE_COMPREHENSION,
      ]),
      reasoning: z.string(),
    }),
    prompt: `Analyze the following learning outcome for a programming course and determine the most appropriate assessment type.

Learning Outcome: "${state.learningOutcome}"

Choose the most appropriate assessment type from the following options:
1. multiple_choice: Best for testing recall, recognition, and basic understanding
2. open_ended: Best for testing explanation, description, and deeper understanding
3. coding: Best for testing ability to write code to solve problems or implement features
4. code_comprehension: Best for testing ability to read, understand, debug, or trace existing code

Provide your assessment type choice and a brief reasoning for your selection.`,
  });
  
  return { assessmentType: object.assessmentType };
};

// Conditional edge function to route to the appropriate assessment generator
const routeToAssessment = (state: typeof GraphState.State) => {
  return state.assessmentType;
};

// Node 2: Generate Multiple Choice Assessment
const generateMultipleChoice = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      assessmentDescription: z.string(),
    }),
    prompt: `Create a multiple-choice assessment for the following learning outcome in a programming course:

Learning Outcome: "${state.learningOutcome}"

Provide a detailed description of the multiple-choice assessment, including:
1. The question stem
2. 4-5 answer options (including the correct answer and plausible distractors)
3. An explanation of why the correct answer is correct
4. How this assessment aligns with the learning outcome

Format your response as a cohesive paragraph describing the assessment.`,
  });
  
  return { assessmentDescription: object.assessmentDescription };
};

// Node 3: Generate Open-Ended Assessment
const generateOpenEnded = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      assessmentDescription: z.string(),
    }),
    prompt: `Create an open-ended question assessment for the following learning outcome in a programming course:

Learning Outcome: "${state.learningOutcome}"

Provide a detailed description of the open-ended assessment, including:
1. The question prompt
2. Expected elements in a strong response
3. Suggested evaluation criteria
4. How this assessment aligns with the learning outcome

Format your response as a cohesive paragraph describing the assessment.`,
  });
  
  return { assessmentDescription: object.assessmentDescription };
};

// Node 4: Generate Coding Assessment
const generateCoding = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      assessmentDescription: z.string(),
    }),
    prompt: `Create a coding assessment for the following learning outcome in a programming course:

Learning Outcome: "${state.learningOutcome}"

Provide a detailed description of the coding assessment, including:
1. The programming task or problem to solve
2. Input/output requirements or specifications
3. Any constraints or requirements
4. Evaluation criteria
5. How this assessment aligns with the learning outcome

Format your response as a cohesive paragraph describing the assessment.`,
  });
  
  return { assessmentDescription: object.assessmentDescription };
};

// Node 5: Generate Code Comprehension Assessment
const generateCodeComprehension = async (state: typeof GraphState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      assessmentDescription: z.string(),
    }),
    prompt: `Create a code comprehension assessment for the following learning outcome in a programming course:

Learning Outcome: "${state.learningOutcome}"

Provide a detailed description of the code comprehension assessment, including:
1. A code snippet that students will analyze
2. Questions about the code (e.g., "What does this function do?", "What would be the output?", "Identify and fix the bug")
3. Expected responses
4. How this assessment aligns with the learning outcome

Format your response as a cohesive paragraph describing the assessment.`,
  });
  
  return { assessmentDescription: object.assessmentDescription };
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
graph.addNode("router", routerNode);
graph.addNode(ASSESSMENT_TYPES.MULTIPLE_CHOICE, generateMultipleChoice);
graph.addNode(ASSESSMENT_TYPES.OPEN_ENDED, generateOpenEnded);
graph.addNode(ASSESSMENT_TYPES.CODING, generateCoding);
graph.addNode(ASSESSMENT_TYPES.CODE_COMPREHENSION, generateCodeComprehension);

// Define the flow with routing
graph.addEdge(START, "router");

// Add conditional edges based on the assessment type
graph.addConditionalEdges(
  "router",
  routeToAssessment,
  {
    [ASSESSMENT_TYPES.MULTIPLE_CHOICE]: ASSESSMENT_TYPES.MULTIPLE_CHOICE,
    [ASSESSMENT_TYPES.OPEN_ENDED]: ASSESSMENT_TYPES.OPEN_ENDED,
    [ASSESSMENT_TYPES.CODING]: ASSESSMENT_TYPES.CODING,
    [ASSESSMENT_TYPES.CODE_COMPREHENSION]: ASSESSMENT_TYPES.CODE_COMPREHENSION,
  }
);

// Connect all assessment generators to END
graph.addEdge(ASSESSMENT_TYPES.MULTIPLE_CHOICE, END);
graph.addEdge(ASSESSMENT_TYPES.OPEN_ENDED, END);
graph.addEdge(ASSESSMENT_TYPES.CODING, END);
graph.addEdge(ASSESSMENT_TYPES.CODE_COMPREHENSION, END);

// Compile the graph
export const agent = graph.compile();
agent.name = "Assessment Type Selector"; 