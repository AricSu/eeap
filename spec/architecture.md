# EEAP Architecture

## Purpose

This document makes the system boundary explicit before readers dive into object fields and lifecycle rules.

EEAP is easiest to understand when treated as a narrow execution boundary rather than a general-purpose agent protocol.

## System Boundary

```mermaid
flowchart TD
    A["Above EEAP<br/>planning, routing, discovery, federation, channels"] --> B["EEAP<br/>capability description<br/>execution request<br/>lifecycle facts<br/>evidence boundary"]
    B --> C["Below EEAP<br/>vendor transports, adapters, devices, SaaS, robots, human systems"]
    B --> D["Evidence + Settlement<br/>receipts, provenance, accounting, later settlement profiles"]
```

Interpretation:

- concerns above EEAP should stay outside the core
- concerns below EEAP should remain adapter-specific
- evidence and settlement connect to the same boundary without forcing every settlement detail into v0

## Execution Path

```mermaid
sequenceDiagram
    participant R as Agent Runtime
    participant A as Adapter
    participant E as External Executor
    participant V as Evidence Store

    R->>A: ExecutionRequest(executionId, capabilityId, idempotencyKey)
    A->>E: executor-native action
    E-->>A: accepted / rejected / webhook / readback
    A-->>R: acknowledged or failed
    A->>V: persist EvidenceRecord
    A-->>R: evidence_recorded
    A-->>R: completed when completion rule is satisfied
```

Key point:

- the adapter can speak any executor-native protocol it wants
- the runtime still receives a stable EEAP lifecycle vocabulary

## Repository Structure

```mermaid
flowchart TD
    ROOT["eeap/"] --> SPEC["spec/<br/>normative source"]
    ROOT --> SCHEMAS["schemas/<br/>machine-readable contract"]
    ROOT --> SDK["sdk/ts/<br/>reference SDK"]
    ROOT --> WEB["website/<br/>static docs site"]
```

This split keeps the protocol source of truth separate from website presentation and SDK ergonomics.
