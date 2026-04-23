# EEAP Positioning

## Why This Document Exists

EEAP is easy to misunderstand if it is described too broadly.

It is not trying to replace the Web, device protocols, industrial middleware, or agent coordination systems. It is trying to standardize one narrower and harder boundary:

> how an agent runtime asks the external world to do something, observes what happened, records evidence, and eventually ties that result to a settlement or accounting consequence.

That boundary is where "tool call" semantics stop being enough. Once an action leaves the runtime and crosses into SaaS, robots, devices, humans, logistics, or finance, the system needs more than a function return value. It needs durable execution truth.

## The Problem EEAP Is Actually Solving

EEAP should be read as a thin southbound contract for agent runtimes.

The core questions are:

- What capability was exposed?
- What execution intent was submitted?
- What immutable lifecycle facts were observed?
- What evidence justifies a claimed outcome?
- What settlement or accounting consequence should be attached to the execution?

That problem framing is broader than the current v0 schema set. Today this repository standardizes capability description, requests, lifecycle events, and evidence first. Settlement belongs to the same southbound boundary, but it is intentionally not forced into the v0 object model before the execution core is stable.

## What EEAP Is Not

EEAP is not:

- a general discovery protocol
- a federation protocol
- a multi-agent channel or pub/sub protocol
- a marketplace format
- a vendor-specific adapter SDK
- a replacement for device-native or industrial-native transports

Those layers may sit above or below EEAP. The point of EEAP is to keep the execution boundary small enough to survive contact with many transports and many external systems.

## Why Existing Standards Do Not Eliminate The Need

The honest answer to "does anything like EEAP already exist?" is yes and no.

Yes, because multiple mature standards solve large slices of the problem already.

No, because there is still no dominant, agent-first, generic contract that unifies `execution + observation + evidence + settlement` as one deliberately small southbound protocol for runtime-to-executor interaction.

EEAP should therefore be judged less as a claim of total novelty and more as a deliberate recombination of already-proven ideas around a stricter boundary.

## Comparison Matrix

| Standard | What it gets right | Why it is not EEAP | What EEAP should borrow |
| --- | --- | --- | --- |
| `oneM2M` | Resource tree, CRUD+N, discovery, subscriptions, grouping, charging/accounting | Much broader and heavier IoT service layer than a thin runtime contract | Durable resource semantics and event subscription discipline |
| `Web of Things` | Strong capability description through Properties, Actions, Events plus discovery | Excellent for thing modeling and discovery, thinner on execution truth and evidence policy | Capability description vocabulary and cross-transport abstraction |
| `LwM2M` | `Execute`, `Observe`, `Notify`, device management lifecycle | Optimized for managed devices rather than generic external execution | Clear observe/notify semantics and remote state convergence |
| `OPC UA` | Rich industrial information modeling plus methods, events, subscriptions | Industrial middleware stack, not a small agent-runtime edge contract | Object/event rigor for plant-floor integrations |
| `CloudEvents` | Portable event envelope | Only an event carriage format, not execution truth semantics | Event metadata normalization |
| `AsyncAPI` | Async interface description, channels, correlation | Describes message APIs but does not define outcome truth or evidence | Message and channel documentation patterns |
| `ROS 2 Actions` | Clean `goal / feedback / result / cancel` lifecycle for long-running actions | Robot middleware abstraction, not general internet-facing execution contract | Long-running execution lifecycle design |
| `EPCIS` | Traceability, provenance, real-world event capture | Excellent for post-fact evidence, not for command submission or executor admission | Evidence and provenance modeling |
| `ISO 20022` | Formal settlement messaging | Financial settlement domain only | Settlement vocabulary when money actually moves |

## Adjacent Standards In More Detail

### oneM2M

`oneM2M` is architecturally one of the closest relatives.

It already treats the world as a structured resource space with CRUD+N, subscriptions, groups, discovery, and even accounting concepts. If the goal were to define a universal IoT middleware layer, it would be hard to justify ignoring it.

But EEAP should stay narrower than `oneM2M`.

`oneM2M` is trying to be a full service layer for heterogeneous devices and applications. EEAP should instead assume that a lower layer or adapter already knows how to talk to the target system. Its job is only to normalize what the agent runtime needs to know about execution intent, lifecycle truth, evidence, and eventual settlement.

### Web of Things

The W3C `Web of Things` stack is extremely relevant because it answers the capability-description problem well. A `Thing Description` can express Properties, Actions, and Events in a transport-agnostic way, and `Web of Things` Discovery adds a standard story for finding available Things.

This is precisely why EEAP should not try to absorb discovery into its core.

`Web of Things` is better read as a complement. It can describe what is available and how it can be addressed. EEAP can then govern what happens when an agent runtime actually submits an execution attempt and needs durable facts about the result.

### LwM2M

`LwM2M` shows that `Execute` plus observation is a real and valuable pattern. It is a strong precedent for the idea that remote actions and state observation belong in the same design space.

The reason it is not enough is scope. `LwM2M` is optimized for managed device fleets. EEAP needs to survive a wider executor set: SaaS connectors, robotic workers, human-in-the-loop systems, industrial control surfaces, logistics services, and future physical-world adapters.

### OPC UA

`OPC UA` demonstrates how far rigorous information modeling can go in the industrial world. Its model of objects, methods, variables, events, and subscriptions is valuable evidence that serious external systems benefit from explicit structure.

EEAP should still resist becoming an `OPC UA` clone.

The industrial stack carries far more domain model and deployment assumptions than a generic agent runtime can afford. The useful lesson is not "copy OPC UA wholesale." The useful lesson is that external execution semantics need durable structure and explicit state transitions.

### CloudEvents

`CloudEvents` is a good answer to the question "how should events be wrapped so they can move across systems cleanly?"

It is not an answer to:

- when an execution is considered acknowledged
- when a completion claim is justified
- when evidence is required
- how retries and idempotency map to one logical action

EEAP can absolutely use `CloudEvents` as a transport envelope for `ExecutionEvent`, but that would still leave the protocol semantics to EEAP.

### AsyncAPI

`AsyncAPI` is useful when documenting channels, payloads, and correlation for asynchronous systems. It helps explain message surfaces.

It does not settle the semantic boundary that matters here. A beautifully documented channel is still silent on whether a given external effect really happened or what evidence supports the claim.

EEAP can borrow documentation patterns from `AsyncAPI` without turning itself into a full async topology language.

### ROS 2 Actions

`ROS 2 Actions` are important because they model long-running work cleanly: `goal`, `feedback`, `result`, and `cancel`. That maps closely to the execution-lifecycle instincts behind EEAP.

The gap is ecosystem scope. `ROS 2 Actions` are designed for robot software graphs, not for a generic agent runtime coordinating SaaS, devices, physical adapters, and settlement-bearing workflows.

EEAP should borrow the lifecycle clarity, not the middleware assumptions.

### EPCIS

`EPCIS` matters because it makes evidence concrete. It captures traceability events about what happened to physical goods, where, when, and under what business step.

That is close to EEAP's evidence ambition, but the center of gravity is different.

`EPCIS` is strongest as a provenance and traceability layer after events occur. EEAP also needs to represent the earlier moment when an agent submits intent and waits for an executor to accept, progress, and justify the claimed outcome.

### Other Relevant References

- `Matter` and `CoAP Observe` reinforce the value of structured interaction plus subscriptions in constrained or smart-home environments.
- `ISO 20022` shows that settlement semantics become their own deep protocol world once money, reconciliation, and institutional messaging enter the picture.

EEAP should learn from both, but it should not import either complexity profile into the v0 core.

## Design Consequence

The comparison above implies a strict design posture.

EEAP should:

- stay thin
- keep execution truth more important than invocation convenience
- treat evidence as a first-class fact
- define idempotent execution attempts explicitly
- allow transport bindings without hard-coding them
- leave discovery, federation, and channel collaboration to adjacent layers

EEAP should not:

- become a generic RPC protocol
- become a discovery marketplace
- become a full digital-twin ontology
- become a chat/collaboration protocol
- force settlement details into the core before the execution boundary is stable

## Relationship To The Rest Of This Repository

Read this document together with:

- [core.md](core.md) for the current canonical object model
- [lifecycle.md](lifecycle.md) for event and evidence semantics

The practical reading is:

- `core.md` says what the current v0 objects are
- `lifecycle.md` says what execution facts are allowed to mean
- this document says why that boundary is worth keeping small, and why adjacent standards still matter

## Bottom Line

EEAP should not market itself as "the first protocol to ever touch this problem."

A more defensible claim is:

> EEAP is a thin, agent-runtime southbound contract that deliberately unifies execution intent, lifecycle observation, evidence, and eventual settlement concerns without trying to also become discovery, federation, or collaboration infrastructure.

That is a smaller claim than "agent internet protocol."

It is also the kind of claim that has a chance of surviving contact with real systems.
