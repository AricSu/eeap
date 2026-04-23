# EEAP Lifecycle v0

## Overview

EEAP lifecycle semantics standardize what a runtime may claim about an external execution. They deliberately separate invocation from truth in the external world.

## Canonical Event Types

### `requested`

The runtime or caller has submitted an `ExecutionRequest`.

This means intent has been expressed. It does not imply the external executor has accepted or observed the requested effect.

### `acknowledged`

The execution implementation has accepted responsibility for the execution attempt.

This means the request has been received and admitted into an execution path. It does not imply success or real-world effect.

### `completed`

The execution implementation asserts that the execution has reached its defined completion condition.

`completed` must not be treated as equivalent to "the underlying function returned without error" unless the capability explicitly declares `completionMode = accepted_only`.

For capabilities that interact with external systems or the physical world, `completed` should usually correspond to `readback_confirmed` or `observed_effect`.

### `failed`

The execution implementation asserts that the execution has failed, been rejected, or reached a terminal non-success outcome.

### `evidence_recorded`

An `EvidenceRecord` has been added for the execution.

This event does not imply success by itself. It only means additional observable facts are now available.

## Idempotency

- Every `ExecutionRequest` must carry an `idempotencyKey`.
- An implementation must treat retries with the same `idempotencyKey` as the same logical request unless explicitly documented otherwise.
- Duplicate request submission must not produce duplicate terminal outcomes for one logical action.

## Completion Rule

An implementation must document the capability's `completionMode`.

Suggested values:

- `accepted_only`: accepted by downstream executor is sufficient
- `readback_confirmed`: state was re-read and matched expected outcome
- `observed_effect`: a downstream event or other evidence confirms the real-world effect

## Evidence Requirement

Evidence is required when:

- the capability declares `completionMode = readback_confirmed`
- the capability declares `completionMode = observed_effect`
- the runtime marks the execution as evidence-required through `evidencePolicy`

## Conformance Profile v1

EEAP core remains intentionally transport-agnostic and leaves wire behavior outside the base specification. The v1 conformance profile tightens the lifecycle semantics above into an executable validation layer for reference SDKs and test harnesses.

The v1 profile adds the following requirements:

- every conformance trace must include at least one `ExecutionRequest`
- `requested` is optional, but when emitted it must be the first lifecycle event for that execution
- `completed` must be preceded by `acknowledged`
- `failed` may occur directly after submission without a prior `acknowledged`
- `completed` and `failed` are mutually exclusive for one execution
- once an execution reaches a terminal state, only `evidence_recorded` events may follow
- event array order is authoritative for lifecycle interpretation and `at` values must be non-decreasing
- `readback_confirmed` and `observed_effect` require supporting evidence before `completed`
- `evidence_recorded` must reference resolvable `EvidenceRecord` objects belonging to the same execution

The v1 profile also tightens idempotency semantics:

- retries reusing one `idempotencyKey` must converge on one logical execution
- all requests in the same idempotency group must keep the same `capabilityId` and equivalent `input`
- one idempotency group must not produce terminal outcomes for multiple executions

These rules are enforced by the TypeScript reference validator and golden fixtures under `conformance/`.

## Webhook Mapping Guidance

Implementations may convert vendor webhook events into EEAP lifecycle facts.

Examples:

- a vendor "job accepted" webhook may map to `acknowledged`
- a vendor state-change webhook may map to `evidence_recorded`
- a verified downstream completion webhook may map to `completed`

Webhook ingestion does not bypass EEAP semantics. The implementation still must decide which lifecycle fact the webhook justifies.
