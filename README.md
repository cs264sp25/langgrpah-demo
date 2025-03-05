# LangGraph Demo

This demo program uses the OpenAI Assistants APIs to generate "assistants" powered by large language models like GPT-4, that are capable of performing tasks for users including file search (vector search), code interpretation, and function calling.

## OpenAI API

This project uses the OpenAI API. You need to create an account and get an API key to use the API. Consult the [quick start guide](https://platform.openai.com/docs/quickstart) for instructions.

## Run locally

Clone the repository and install the dependencies.

```bash
cd openai-assistants
pnpm install
```

Create a `.env` file in the project root and add the following content.

```plaintext
OPENAI_API_KEY=sk-...
```

Finally, run the following command to make sure everything is working.

```bash
npm run start
```

To run any of the demo files:

```bash
npx tsx path/to/demo.ts
```
