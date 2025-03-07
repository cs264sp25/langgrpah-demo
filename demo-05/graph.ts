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
  completeEssay: Annotation<string>,
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
  introductionParagraph: Annotation<string>,
  bodyParagraph1: Annotation<string>,
  bodyParagraph2: Annotation<string>,
  bodyParagraph3: Annotation<string>,
  conclusionParagraph: Annotation<string>,
  completeEssay: Annotation<string>,
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

// Node 5: Format the essay plan (keeping this for backward compatibility)
const formatPlan = async (state: typeof EssayState.State) => {
  const formattedEssayPlan = `${state.essayOutline.introduction.topicSentence} [...]
${state.essayOutline.bodyParagraphs[0].topicSentence} [...]
${state.essayOutline.bodyParagraphs[1].topicSentence} [...]
${state.essayOutline.bodyParagraphs[2].topicSentence} [...]
${state.essayOutline.conclusion.topicSentence} [...]`;

  return { formattedEssayPlan };
};

// Node 6: Write the introduction paragraph
const writeIntroduction = async (state: typeof EssayState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      paragraph: z.string(),
    }),
    prompt: `Write a complete introduction paragraph for an essay based on the following outline:
    
    Topic Sentence: ${state.essayOutline.introduction.topicSentence}
    Background Information: ${state.essayOutline.introduction.backgroundInfo}
    Thesis Statement: ${state.essayOutline.introduction.thesis}
    
    The introduction should:
    1. Begin with an engaging hook that captures the reader's attention
    2. Provide necessary background information on the topic
    3. End with the thesis statement that clearly states the main argument
    4. Be approximately 4-6 sentences in length
    
    Write a cohesive, well-structured paragraph that flows naturally from one idea to the next.`,
  });
  
  return { introductionParagraph: object.paragraph };
};

// Node 7: Write the first body paragraph
const writeBodyParagraph1 = async (state: typeof EssayState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      paragraph: z.string(),
    }),
    prompt: `Write a complete body paragraph for an essay based on the following information:
    
    Thesis Statement: ${state.thesisStatement}
    
    Topic Sentence: ${state.essayOutline.bodyParagraphs[0].topicSentence}
    Supporting Points:
    ${state.essayOutline.bodyParagraphs[0].points.map((point, i) => `${i + 1}. ${point}`).join('\n')}
    
    Next Paragraph's Topic: ${state.essayOutline.bodyParagraphs[1].topicSentence}
    
    The paragraph should:
    1. Begin with a clear topic sentence that states the main point
    2. Include supporting sentences with specific details and examples
    3. Develop logically from one sentence to the next
    4. End with a transition to the next paragraph
    5. Be approximately 5-7 sentences in length
    
    Write a cohesive, well-structured paragraph that thoroughly develops the main point.`,
  });
  
  return { bodyParagraph1: object.paragraph };
};

// Node 8: Write the second body paragraph
const writeBodyParagraph2 = async (state: typeof EssayState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      paragraph: z.string(),
    }),
    prompt: `Write a complete body paragraph for an essay based on the following information:
    
    Thesis Statement: ${state.thesisStatement}
    
    Previous Paragraph: ${state.bodyParagraph1}
    
    Topic Sentence: ${state.essayOutline.bodyParagraphs[1].topicSentence}
    Supporting Points:
    ${state.essayOutline.bodyParagraphs[1].points.map((point, i) => `${i + 1}. ${point}`).join('\n')}
    
    Next Paragraph's Topic: ${state.essayOutline.bodyParagraphs[2].topicSentence}
    
    The paragraph should:
    1. Begin with a clear topic sentence that states the main point
    2. Include supporting sentences with specific details and examples
    3. Develop logically from one sentence to the next
    4. End with a transition to the next paragraph
    5. Be approximately 5-7 sentences in length
    
    Write a cohesive, well-structured paragraph that thoroughly develops the main point.`,
  });
  
  return { bodyParagraph2: object.paragraph };
};

// Node 9: Write the third body paragraph
const writeBodyParagraph3 = async (state: typeof EssayState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      paragraph: z.string(),
    }),
    prompt: `Write a complete body paragraph for an essay based on the following information:
    
    Thesis Statement: ${state.thesisStatement}
    
    Previous Paragraph: ${state.bodyParagraph2}
    
    Topic Sentence: ${state.essayOutline.bodyParagraphs[2].topicSentence}
    Supporting Points:
    ${state.essayOutline.bodyParagraphs[2].points.map((point, i) => `${i + 1}. ${point}`).join('\n')}
    
    Conclusion's Topic: ${state.essayOutline.conclusion.topicSentence}
    
    The paragraph should:
    1. Begin with a clear topic sentence that states the main point
    2. Include supporting sentences with specific details and examples
    3. Develop logically from one sentence to the next
    4. End with a transition to the conclusion
    5. Be approximately 5-7 sentences in length
    
    Write a cohesive, well-structured paragraph that thoroughly develops the main point.`,
  });
  
  return { bodyParagraph3: object.paragraph };
};

// Node 10: Write the conclusion paragraph
const writeConclusion = async (state: typeof EssayState.State) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      paragraph: z.string(),
    }),
    prompt: `Write a complete conclusion paragraph for an essay based on the following information:
    
    Thesis Statement: ${state.thesisStatement}
    
    Previous Paragraph: ${state.bodyParagraph3}
    
    Conclusion Outline:
    Topic Sentence: ${state.essayOutline.conclusion.topicSentence}
    Summary Points: ${state.essayOutline.conclusion.summaryPoints}
    Final Thought: ${state.essayOutline.conclusion.finalThought}
    
    The conclusion should:
    1. Begin by restating the thesis in different words
    2. Summarize the main points from the body paragraphs
    3. End with a thought-provoking final statement that provides closure
    4. Be approximately 4-6 sentences in length
    
    Write a cohesive, well-structured paragraph that effectively concludes the essay.`,
  });
  
  return { conclusionParagraph: object.paragraph };
};

// Node 11: Assemble the complete essay
const assembleEssay = async (state: typeof EssayState.State) => {
  const completeEssay = `# ${state.claim}

${state.introductionParagraph}

${state.bodyParagraph1}

${state.bodyParagraph2}

${state.bodyParagraph3}

${state.conclusionParagraph}`;

  return { completeEssay };
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
graph.addNode("writeIntroduction", writeIntroduction);
graph.addNode("writeBodyParagraph1", writeBodyParagraph1);
graph.addNode("writeBodyParagraph2", writeBodyParagraph2);
graph.addNode("writeBodyParagraph3", writeBodyParagraph3);
graph.addNode("writeConclusion", writeConclusion);
graph.addNode("assembleEssay", assembleEssay);

// Define the flow
graph.addEdge(START, "analyzePrompt");
graph.addEdge("analyzePrompt", "generateReasons");
graph.addEdge("generateReasons", "createThesis");
graph.addEdge("createThesis", "generateOutline");
graph.addEdge("generateOutline", "formatPlan");
graph.addEdge("formatPlan", "writeIntroduction");
graph.addEdge("writeIntroduction", "writeBodyParagraph1");
graph.addEdge("writeBodyParagraph1", "writeBodyParagraph2");
graph.addEdge("writeBodyParagraph2", "writeBodyParagraph3");
graph.addEdge("writeBodyParagraph3", "writeConclusion");
graph.addEdge("writeConclusion", "assembleEssay");
graph.addEdge("assembleEssay", END);

// Compile the graph
export const agent = graph.compile();
agent.name = "LangGraph Essay Writer";