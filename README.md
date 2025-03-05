# LangGraph Demo

This demo project showcases the capabilities of the LangGraph library. It includes a series of demo files that demonstrate how to use the library to build a workflow involving multiple LLMs to solve a complex problem.

## OpenAI API

This project uses the OpenAI API. You need to create an account and get an API key to use the API. Consult the [quick start guide](https://platform.openai.com/docs/quickstart) for instructions.

## Run locally

Clone the repository and install the dependencies.

```bash
cd langchain-demo
pnpm install
```

Create a `.env` file in the project root and add the following content.

```plaintext
OPENAI_API_KEY=sk-...
```

Finally, run the following command to make sure everything is working.

```bash
pnpm start
```

To run any of the demo files:

```bash
pnpm run demo-01 # or demo-02, demo-03, etc.
```

To run LangGraph Studio:

```bash
npx @langchain/langgraph-cli@latest dev
```