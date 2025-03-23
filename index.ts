import { createOpenAI } from "@ai-sdk/openai";
import { OPENAI_API_KEY } from "./env";
import { streamText } from "ai";

const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
  compatibility: "strict", // strict mode, enable when using the OpenAI API
});

const model = openai("gpt-4o-mini");

const { textStream } = streamText({
  model,
  messages: [
    {
      role: "system",
      content:
        "You are a tweet generator. You will generate a tweet about user's question.",
    },
    {
      role: "user",
      content: "What is a LangGraph?",
    },
  ],
});

for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
