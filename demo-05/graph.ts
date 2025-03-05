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
const AgentInput = Annotation.Root({
  prompt: Annotation<string>,
});

const AgentOutput = Annotation.Root({
  formattedEssayPlan: Annotation<string>,
});

const EssayState = Annotation.Root({
  prompt: Annotation<string>,
  claim: Annotation<string>,
  directionWords: Annotation<string[]>,
  reasonTypes: Annotation<{
    needsTwoTypes: boolean;
    primaryType: string;
    secondaryType?: string;
  }>,
  supportingReasons: Annotation<{
    primaryReasons: { reason: string; evidence: string }[];
    secondaryReasons?: { reason: string; evidence: string }[];
  }>,
  thesisStatement: Annotation<string>,
  essayOutline: Annotation<any>,
  formattedEssayPlan: Annotation<string>,
});

// Node 1: Analyze the prompt and generate a claim
const analyzePrompt = async (state: typeof AgentInput.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      claim: z.string(),
      directionWords: z.array(z.string()),
      reasonTypes: z.object({
        needsTwoTypes: z.boolean(),
        primaryType: z.string(),
        secondaryType: z.string().optional(),
      }),
      topic: z.string(),
    }),
    prompt: `Analyze this essay prompt and convert it to a clear claim. 
    
    Essay prompt: "${state.prompt}"
    
    1. Identify the main topic of the essay
    2. Create a claim that expresses a point of view about this topic (not a question or instruction)
    3. Identify direction words in the prompt (e.g., discuss, analyze, compare)
    4. Determine if we need one type of reason (e.g., benefits, causes) or two contrasting types (e.g., pros/cons, advantages/disadvantages)
    
    Return a structured analysis with the claim, direction words, and reason types needed.`,
  });
  
  return {
    claim: object.claim,
    directionWords: object.directionWords,
    reasonTypes: object.reasonTypes,
  };
};

// Node 2: Generate supporting reasons
const generateReasons = async (state: typeof EssayState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      primaryReasons: z.array(
        z.object({
          reason: z.string(),
          evidence: z.string(),
        })
      ),
      secondaryReasons: z
        .array(
          z.object({
            reason: z.string(),
            evidence: z.string(),
          })
        )
        .optional(),
    }),
    prompt: `Generate supporting reasons for the following claim: "${
      state.claim
    }"
    
    ${
      state.reasonTypes.needsTwoTypes
        ? `We need two types of reasons: 
        - ${state.reasonTypes.primaryType} (2 reasons)
        - ${state.reasonTypes.secondaryType} (1 reason)`
        : `We need three reasons of type: ${state.reasonTypes.primaryType}`
    }
    
    For each reason, provide:
    1. A clear statement of the reason
    2. Brief supporting evidence or explanation
    
    Make these reasons compelling, specific, and relevant to the claim.`,
  });
  
  return {
    supportingReasons: {
      primaryReasons: object.primaryReasons,
      secondaryReasons: object.secondaryReasons,
    }
  };
};

// Node 3: Create a thesis statement
const createThesis = async (state: typeof EssayState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({ thesisStatement: z.string() }),
    prompt: `Create a strong thesis statement for a 5-paragraph essay based on this information:
    
    Claim: "${state.claim}"
    
    ${
      state.reasonTypes.needsTwoTypes
        ? `Primary reasons (${state.reasonTypes.primaryType}):
        1. ${state.supportingReasons.primaryReasons[0].reason}
        2. ${state.supportingReasons.primaryReasons[1].reason}
        
        Secondary reason (${state.reasonTypes.secondaryType}):
        1. ${state.supportingReasons.secondaryReasons?.[0].reason}`
        : `Reasons (${state.reasonTypes.primaryType}):
        1. ${state.supportingReasons.primaryReasons[0].reason}
        2. ${state.supportingReasons.primaryReasons[1].reason}
        3. ${state.supportingReasons.primaryReasons[2].reason}`
    }
    
    The thesis should be clear, specific, and encompass all the main points of the essay.`,
  });
  
  return { thesisStatement: object.thesisStatement };
};

// Node 4: Generate an essay outline
const generateOutline = async (state: typeof EssayState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      introduction: z.object({
        topicSentence: z.string(),
        backgroundInfo: z.string(),
        thesis: z.string(),
      }),
      bodyParagraphs: z.array(
        z.object({
          topicSentence: z.string(),
          points: z.array(z.string()),
          transition: z.string().optional(),
        })
      ),
      conclusion: z.object({
        topicSentence: z.string(),
        summaryPoints: z.string(),
        finalThought: z.string(),
      }),
    }),
    prompt: `Create a detailed outline for a 5-paragraph essay based on this thesis statement:
    
    "${state.thesisStatement}"`,
  });
  
  return { essayOutline: object };
};

// Node 5: Format the final essay plan
const formatPlan = async (state: typeof EssayState.State) => {
  const formattedEssayPlan = `${state.essayOutline.introduction.topicSentence} [...]
${state.essayOutline.bodyParagraphs[0].topicSentence} [...]
${state.essayOutline.bodyParagraphs[1].topicSentence} [...]
${state.essayOutline.bodyParagraphs[2].topicSentence} [...]
${state.essayOutline.conclusion.topicSentence} [...]`;

  return { formattedEssayPlan };
};

// Create the StateGraph
const graph = new StateGraph<
  (typeof EssayState)["spec"],
  StateType<(typeof EssayState)["spec"]>,
  UpdateType<(typeof EssayState)["spec"]>,
  typeof START,
  (typeof AgentInput)["spec"],
  (typeof AgentOutput)["spec"]
>({
  input: AgentInput,
  output: AgentOutput,
  stateSchema: EssayState,
});

// Add nodes to the graph
graph.addNode("analyzePrompt", analyzePrompt);
graph.addNode("generateReasons", generateReasons);
graph.addNode("createThesis", createThesis);
graph.addNode("generateOutline", generateOutline);
graph.addNode("formatPlan", formatPlan);

// Define the flow
graph.addEdge(START, "analyzePrompt");
graph.addEdge("analyzePrompt", "generateReasons");
graph.addEdge("generateReasons", "createThesis");
graph.addEdge("createThesis", "generateOutline");
graph.addEdge("generateOutline", "formatPlan");
graph.addEdge("formatPlan", END);

// Compile the graph
export const agent = graph.compile();
agent.name = "LangGraph Essay Planner";