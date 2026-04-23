# EEAP

EEAP is a platform-agnostic external execution contract for agent runtimes.

This repository starts spec-first. The first goal is to define the smallest stable core for external execution semantics before introducing transport bindings, authentication profiles, or vendor-specific adapters.

The broader EEAP problem boundary is `execution + observation + evidence + settlement`. The current v0 core intentionally standardizes capability description, requests, lifecycle events, and evidence first, then leaves settlement profiles for a later layer once the core contract is stable.

## Scope

EEAP v0 core defines:

- canonical objects for execution-oriented integrations
- lifecycle semantics for external execution
- evidence as a first-class runtime fact
- JSON Schema artifacts for the core object model
- a TypeScript reference validator SDK for core objects and conformance traces

## Positioning

EEAP is not trying to become a full discovery, federation, or multi-agent coordination protocol.

It is a thin southbound contract for the moment when an agent runtime touches the external world and needs a durable answer to four questions:

- what intent was submitted
- what execution lifecycle facts were observed
- what evidence supports the claimed outcome
- what settlement or accounting consequence follows

Read [EEAP Positioning](spec/positioning.md) for the detailed argument and adjacent protocol comparison against `oneM2M`, `Web of Things`, `LwM2M`, `OPC UA`, `CloudEvents`, `AsyncAPI`, `ROS 2 Actions`, `EPCIS`, and related standards.

For the system boundary and flow diagrams, read [EEAP Architecture](spec/architecture.md).

## Non-Goals

This repository does not currently define:

- HTTP transport bindings
- OAuth or connector authorization profiles
- discovery or marketplace flows
- Shopify, Slack, Xiaomi, or any other vendor-specific adapter logic
- runtime UI, deployment, or hosting concerns

## Repository Layout

- `spec/`: normative specification documents
- `schemas/`: JSON Schema for v0 core objects
- `sdk/ts/`: TypeScript reference validator SDK
- `conformance/`: conformance goals and future test vectors
- `website/`: static React Router + Fumadocs docs site for GitHub Pages

## Design Principles

- Keep the core thin and platform-agnostic.
- Define execution truth, not vendor transport details.
- Treat evidence as a first-class fact, not just tool output.
- Separate protocol semantics from SDK ergonomics.

## V0 Core Objects

- `CapabilityDescriptor`
- `ExecutionRequest`
- `ExecutionEvent`
- `EvidenceRecord`

## V0 Lifecycle Events

- `requested`
- `acknowledged`
- `completed`
- `failed`
- `evidence_recorded`

## TypeScript SDK

The TypeScript package under `sdk/ts/` is the current reference validator SDK.

It is meant for:

- validating single EEAP objects
- validating a full `ExecutionTrace`
- enforcing the EEAP v1 conformance profile in tests and CI

It does not yet provide:

- transport bindings
- runtime/client APIs
- adapter server scaffolding

Typical usage:

```ts
import {
  assertExecutionTrace,
  validateExecutionTrace,
  formatConformanceIssues,
} from "@eeap/sdk-ts";

const result = validateExecutionTrace(trace);

if (!result.ok) {
  console.error(formatConformanceIssues(result.issues));
}

assertExecutionTrace(trace);
```

For a fuller walkthrough, see [sdk/ts/README.md](sdk/ts/README.md).

If you want a real scenario instead of a placeholder trace, the repo now includes:

- a warehouse door unlock validation example with `readback_confirmed` evidence under [sdk/ts/examples/validate-trace.mjs](sdk/ts/examples/validate-trace.mjs)
- an adapter-style webhook assembly example under [sdk/ts/examples/assemble-trace-from-webhook.mjs](sdk/ts/examples/assemble-trace-from-webhook.mjs)
