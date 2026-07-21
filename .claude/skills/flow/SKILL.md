---
name: flow
description: Build AI agents and LLM workflows with Flowise, the open-source drag-and-drop agent builder. Use this skill whenever the user wants to build, prototype, deploy, or troubleshoot an AI agent visually — including RAG chatbots over their documents, tool-enabled agents (web search, calculators, APIs), or multi-agent systems — or mentions Flowise, chatflows, agentflows, or "no-code / visual agent builder". Also use it when the user invokes /flow.
---

# Flow — Build AI Agents with Flowise

Flowise is an open-source, drag-and-drop platform for constructing AI agents and LLM workflows. You drop nodes — your model, your data source, your tools — onto a board, connect them, and get a functional system without writing application code. Use this skill to help the user install Flowise, design the right flow for their use case, and deploy it safely.

## Prerequisites

Check these before anything else — most setup failures trace back to one of them:

- **Node.js 20+** — verify with `node --version`. If it's older, upgrade before installing.
- **An LLM API key** — Anthropic or OpenAI. In this repository, prefer Anthropic (`ANTHROPIC_API_KEY` is the project standard; see CLAUDE.md). Default to the latest Claude models: `claude-opus-4-7` for complex multi-step reasoning agents, `claude-haiku-4-5-20251001` for high-frequency or cost-sensitive flows.

## Quick Setup

Two commands, then the UI opens at `http://localhost:3000`:

```bash
npm install -g flowise
npx flowise start
```

Alternatives when global npm install isn't appropriate:

- **Docker**: `docker run -d --name flowise -p 3000:3000 flowiseai/flowise` (persist data by mounting a volume at `/root/.flowise`).
- **Hosted**: flowiseai.com offers a managed version — suggest it when the user doesn't want to run infrastructure.

Once running, add the API key in the UI under **Credentials**, then reference that credential from model nodes. Never paste raw keys into node fields.

## The Three Core Patterns

Match the user's goal to one of these patterns, and start from the simplest one that fits. A working simple flow beats a stalled ambitious one — you can always add nodes later.

### 1. RAG (chat with your documents)

For "answer questions from my PDFs / docs / knowledge base":

1. **Document Loader** node (PDF, text, web scraper, etc.) → loads the source material
2. **Text Splitter** → chunks it (start with defaults; tune chunk size only if answers miss context)
3. **Embeddings** node + **Vector Store** (the built-in in-memory store is fine for prototyping; Pinecone/pgvector for production)
4. **Conversational Retrieval QA Chain** wired to your **Chat Model**

Upload the documents, hit the chat panel, and verify answers cite the right material before tuning anything.

### 2. Tool-enabled agent

For "an agent that can search the web / do math / call my API":

1. Start with a **Tool Agent** (or ReAct agent) node
2. Attach a **Chat Model** — use a strong model here; tool selection quality depends on it
3. Attach **Tool** nodes: web search (SerpAPI/Brave), Calculator, Custom Tool (wraps any REST API), etc.

Test with prompts that clearly require the tool ("what's the weather in Nairobi right now?") to confirm the agent actually invokes it rather than hallucinating an answer.

### 3. Multi-agent system

For workflows where specialized agents collaborate — e.g. a researcher agent hands findings to a writer agent:

1. Use an **Agentflow** (Flowise's multi-agent canvas) with a **Supervisor** and **Worker** agents
2. Give each worker one narrow job and a system prompt that says exactly what it produces for the next agent
3. Keep the chain short (2–4 agents); each hop adds latency, cost, and drift

Reach for this only when a single tool-agent genuinely can't do the job — multi-agent is the most powerful pattern and also the easiest to over-engineer.

## Using Flows from Code

Every chatflow exposes a REST endpoint, so agents built visually can be called from this repo's scripts:

```bash
curl http://localhost:3000/api/v1/prediction/<chatflow-id> \
  -H "Content-Type: application/json" \
  -d '{"question": "Hello"}'
```

If the flow is part of this repository's automation, store the calling script in `scripts/` and note which chatflow it invokes, per this repo's conventions.

## Security — Non-negotiable for Public Deployments

If the Flowise instance is reachable beyond localhost:

- **Enable authentication** via environment variables (`FLOWISE_USERNAME` / `FLOWISE_PASSWORD`) before exposing the port. An unauthenticated public Flowise instance lets anyone run flows on your API keys.
- **Protect credentials**: keep API keys in Flowise's Credentials store or environment variables — never in screenshots, exported flow JSON shared publicly, or committed code.
- Treat exported chatflows as potentially containing secrets; review before sharing.

## Troubleshooting

- **`flowise: command not found`** → global npm bin isn't on PATH; use `npx flowise start` instead.
- **Install fails / native build errors** → almost always Node < 20. Check `node --version` first.
- **Port 3000 already in use** → `npx flowise start --PORT=3001`.
- **Agent never calls its tools** → upgrade the chat model on the agent node and sharpen tool descriptions; weak models under-use tools.
- **RAG answers are vague** → confirm documents were upserted to the vector store, then adjust chunk size/overlap and retrieval top-k.

## Resources

- Repository: https://github.com/FlowiseAI/Flowise
- Documentation: https://docs.flowiseai.com
- Hosted version: https://flowiseai.com
