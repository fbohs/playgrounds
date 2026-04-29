# Playgrounds

A personal monorepo where I experiment with different technologies. Each folder is an isolated project — some are tutorials I worked through, some are real tools I built, some are just me poking at something new.

---

## What's in here

### `go/`
Go fundamentals — goroutines, mutexes, wait groups, data types, CPU core examples. Written as I was learning Go concurrency and runtime behavior.

### `grpc/`
A small gRPC server with an HTTP gateway in front of it. The idea was to understand how gRPC works end-to-end and how to expose it over REST for browser clients. Uses a `helloworld.proto` definition.

### `jmeter/`
JMeter load test plan (`test_plan_1.jmx`). Used this to benchmark an API under load.

### `langgraph/`
Experiments with [LangGraph](https://langchain-ai.github.io/langgraph/) for building multi-step AI agent workflows. Has a few agent iterations (`agent2`, `agent3`, `agent4`) showing how the approach evolved.

---

## Setup

Each project is self-contained. Navigate into the folder and follow whatever setup makes sense:

```bash
# Node projects
npm install && npm run dev

# Go projects
go run .
```
