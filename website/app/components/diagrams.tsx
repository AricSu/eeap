type DiagramFigureProps = {
  title: string;
  caption: string;
  viewBox: string;
  children: React.ReactNode;
};

type Tone = 'blue' | 'slate' | 'green' | 'amber' | 'rose' | 'violet';

type DiagramBoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines: string[];
  tone?: Tone;
  dashed?: boolean;
};

type ArrowProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  labelX?: number;
  labelY?: number;
  labelMaxChars?: number;
  dashed?: boolean;
};

const tones: Record<Tone, { fill: string; stroke: string }> = {
  blue: { fill: '#eff6ff', stroke: '#60a5fa' },
  slate: { fill: '#f8fafc', stroke: '#94a3b8' },
  green: { fill: '#ecfdf5', stroke: '#34d399' },
  amber: { fill: '#fffbeb', stroke: '#f59e0b' },
  rose: { fill: '#fff1f2', stroke: '#fb7185' },
  violet: { fill: '#f5f3ff', stroke: '#a78bfa' },
};

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current.length === 0 ? word : `${current} ${word}`;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current.length > 0) {
      lines.push(current);
    }

    if (word.length <= maxChars) {
      current = word;
      continue;
    }

    const chunks = word.match(new RegExp(`.{1,${maxChars}}`, 'g')) ?? [word];
    lines.push(...chunks.slice(0, -1));
    current = chunks[chunks.length - 1] ?? '';
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

function DiagramFigure({ title, caption, viewBox, children }: DiagramFigureProps) {
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-2xl border bg-fd-card shadow-sm">
      <div className="border-b px-4 py-3 text-sm font-medium">{title}</div>
      <div className="overflow-x-auto p-4">
        <svg viewBox={viewBox} className="h-auto min-w-[720px] w-full" role="img">
          <defs>
            <marker
              id="diagram-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <figcaption className="border-t px-4 py-3 text-sm leading-6 text-fd-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

function DiagramLabel({
  text,
  x,
  y,
  maxChars = 18,
}: {
  text: string;
  x: number;
  y: number;
  maxChars?: number;
}) {
  const lines = wrapText(text, maxChars);
  const fontSize = 12;
  const lineHeight = 14;
  const paddingX = 8;
  const paddingY = 6;
  const textWidth = Math.max(...lines.map((line) => line.length), 0) * 6.2;
  const width = textWidth + paddingX * 2;
  const height = lines.length * lineHeight + paddingY * 2;
  const rectX = x - width / 2;
  const rectY = y - height / 2;
  const textStartY = y - ((lines.length - 1) * lineHeight) / 2 + 4;

  return (
    <g>
      <rect
        x={rectX}
        y={rectY}
        width={width}
        height={height}
        rx="10"
        fill="rgba(255,255,255,0.96)"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      <text x={x} y={textStartY} fontSize={fontSize} textAnchor="middle" fill="#334155">
        {lines.map((line, index) => (
          <tspan key={`${text}-${line}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function DiagramBox({
  x,
  y,
  w,
  h,
  title,
  lines,
  tone = 'slate',
  dashed = false,
}: DiagramBoxProps) {
  const palette = tones[tone];
  const titleLines = wrapText(title, Math.max(12, Math.floor((w - 36) / 10)));
  const bodyLines = lines.flatMap((line) =>
    wrapText(line, Math.max(12, Math.floor((w - 36) / 9))),
  );
  const titleLineHeight = 17;
  const bodyLineHeight = 15;
  const bodyStartY = y + 34 + titleLines.length * titleLineHeight;
  const contentBottom =
    bodyLines.length > 0
      ? bodyStartY + (bodyLines.length - 1) * bodyLineHeight
      : y + 26 + (titleLines.length - 1) * titleLineHeight;
  const requiredHeight = contentBottom - y + 22;
  const actualHeight = Math.max(h, requiredHeight);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={actualHeight}
        rx="18"
        fill={palette.fill}
        stroke={palette.stroke}
        strokeWidth="2"
        strokeDasharray={dashed ? '7 7' : undefined}
      />
      <text x={x + 18} y={y + 26} fontSize="15.5" fontWeight="600" fill="#0f172a">
        {titleLines.map((line, index) => (
          <tspan key={`${title}-title-${line}`} x={x + 18} dy={index === 0 ? 0 : titleLineHeight}>
            {line}
          </tspan>
        ))}
      </text>
      {bodyLines.map((line, index) => (
        <text
          key={`${title}-body-${line}-${index}`}
          x={x + 18}
          y={bodyStartY + index * bodyLineHeight}
          fontSize="12.5"
          fill="#334155"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function TimelineState({
  cx,
  cy,
  color,
  title,
  description,
  descriptionY,
  descriptionMaxChars = 14,
}: {
  cx: number;
  cy: number;
  color: string;
  title: string;
  description: string;
  descriptionY: number;
  descriptionMaxChars?: number;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={color} />
      <text
        x={cx}
        y={cy - 52}
        fontSize="18"
        fontWeight="600"
        textAnchor="middle"
        fill="#0f172a"
      >
        {title}
      </text>
      <DiagramLabel text={description} x={cx} y={descriptionY} maxChars={descriptionMaxChars} />
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
  labelX,
  labelY,
  labelMaxChars,
  dashed = false,
}: ArrowProps) {
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#64748b"
        strokeWidth="2.5"
        strokeDasharray={dashed ? '7 7' : undefined}
        markerEnd="url(#diagram-arrow)"
      />
      {label ? (
        <DiagramLabel
          text={label}
          x={labelX ?? (x1 + x2) / 2}
          y={labelY ?? (y1 + y2) / 2 - 16}
          maxChars={labelMaxChars}
        />
      ) : null}
    </g>
  );
}

function CurvedArrow({
  d,
  label,
  labelX,
  labelY,
  labelMaxChars,
  dashed = false,
}: {
  d: string;
  label: string;
  labelX: number;
  labelY: number;
  labelMaxChars?: number;
  dashed?: boolean;
}) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="#64748b"
        strokeWidth="2.5"
        strokeDasharray={dashed ? '7 7' : undefined}
        markerEnd="url(#diagram-arrow)"
      />
      <DiagramLabel text={label} x={labelX} y={labelY} maxChars={labelMaxChars} />
    </g>
  );
}

export function SystemAtAGlanceDiagram() {
  return (
    <DiagramFigure
      title="System At A Glance"
      caption="EEAP is the narrow contract between an agent runtime and any external executor. It does not replace planning or discovery above, and it does not replace executor-native protocols below."
      viewBox="0 0 920 430"
    >
      <DiagramBox
        x={40}
        y={90}
        w={230}
        h={160}
        tone="blue"
        title="Agent Runtime"
        lines={[
          'planner / thread / memory',
          'declares intent',
          'expects durable truth',
        ]}
      />
      <DiagramBox
        x={345}
        y={55}
        w={230}
        h={230}
        tone="green"
        title="EEAP Boundary"
        lines={[
          'CapabilityDescriptor',
          'ExecutionRequest',
          'ExecutionEvent',
          'EvidenceRecord',
          'settlement profile later',
        ]}
      />
      <DiagramBox
        x={650}
        y={90}
        w={230}
        h={160}
        tone="amber"
        title="External Executor"
        lines={[
          'SaaS / device / robot',
          'human system / logistics',
          'vendor-native protocol',
        ]}
      />
      <DiagramBox
        x={315}
        y={320}
        w={290}
        h={70}
        tone="violet"
        title="Durable Runtime Truth"
        lines={['execution state, evidence,', 'and eventual settlement context']}
      />
      <Arrow
        x1={270}
        y1={170}
        x2={345}
        y2={170}
        label="1. submit intent"
        labelX={307}
        labelY={144}
        labelMaxChars={14}
      />
      <Arrow
        x1={575}
        y1={170}
        x2={650}
        y2={170}
        label="2. deliver through adapter"
        labelX={612}
        labelY={144}
        labelMaxChars={14}
      />
      <Arrow
        x1={650}
        y1={215}
        x2={575}
        y2={215}
        label="3. events + evidence"
        labelX={612}
        labelY={252}
        labelMaxChars={14}
      />
      <Arrow
        x1={460}
        y1={285}
        x2={460}
        y2={320}
        label="4. expose durable state"
        labelX={548}
        labelY={300}
        labelMaxChars={14}
      />
    </DiagramFigure>
  );
}

export function RepoStructureDiagram() {
  return (
    <DiagramFigure
      title="Repo Structure"
      caption="The repository is split between normative source documents, machine-readable schema artifacts, reference SDK code, and the static docs site."
      viewBox="0 0 920 340"
    >
      <DiagramBox
        x={315}
        y={24}
        w={290}
        h={84}
        tone="slate"
        title="eeap/"
        lines={['spec-first repository root', 'one source of truth for protocol semantics']}
      />
      <DiagramBox
        x={40}
        y={180}
        w={190}
        h={104}
        tone="blue"
        title="spec/"
        lines={['core, lifecycle, architecture, positioning', 'normative prose and diagrams']}
      />
      <DiagramBox
        x={255}
        y={180}
        w={190}
        h={104}
        tone="green"
        title="schemas/"
        lines={['JSON Schema artifacts', 'machine-readable contract']}
      />
      <DiagramBox
        x={470}
        y={180}
        w={190}
        h={104}
        tone="amber"
        title="sdk/ts/"
        lines={['reference SDK placeholder', 'mirrors core object model']}
      />
      <DiagramBox
        x={685}
        y={180}
        w={190}
        h={104}
        tone="violet"
        title="website/"
        lines={['React Router + Fumadocs site', 'static docs for GitHub Pages']}
      />
      <Arrow x1={360} y1={108} x2={135} y2={180} />
      <Arrow x1={430} y1={108} x2={350} y2={180} />
      <Arrow x1={490} y1={108} x2={565} y2={180} />
      <Arrow x1={560} y1={108} x2={780} y2={180} />
    </DiagramFigure>
  );
}

export function RuntimeBoundaryDiagram() {
  return (
    <DiagramFigure
      title="Runtime Boundary"
      caption="EEAP sits in the middle. Discovery, planning, and multi-agent collaboration stay above it; vendor transports and executor-native protocols stay below it."
      viewBox="0 0 920 420"
    >
      <DiagramBox
        x={180}
        y={28}
        w={560}
        h={86}
        tone="slate"
        title="Above EEAP"
        lines={[
          'agent planning, routing, discovery, federation, channels, policy',
          'important systems, but not part of the core execution contract',
        ]}
      />
      <DiagramBox
        x={210}
        y={160}
        w={500}
        h={112}
        tone="green"
        title="EEAP"
        lines={[
          'capability description',
          'execution request',
          'lifecycle facts',
          'evidence and settlement boundary',
        ]}
      />
      <DiagramBox
        x={40}
        y={320}
        w={250}
        h={72}
        tone="amber"
        title="Executor-side protocols"
        lines={['WoT, LwM2M, OPC UA, oneM2M']}
      />
      <DiagramBox
        x={335}
        y={320}
        w={250}
        h={72}
        tone="blue"
        title="Transport envelopes"
        lines={['HTTP, queues, webhooks, CloudEvents']}
      />
      <DiagramBox
        x={630}
        y={320}
        w={250}
        h={72}
        tone="violet"
        title="Evidence + settlement"
        lines={['EPCIS, receipts, accounting, ISO 20022']}
      />
      <Arrow
        x1={460}
        y1={114}
        x2={460}
        y2={160}
        label="keep above-core concerns out"
        labelX={618}
        labelY={138}
        labelMaxChars={16}
      />
      <Arrow x1={460} y1={272} x2={165} y2={320} label="adapt" labelX={245} labelY={294} labelMaxChars={10} />
      <Arrow x1={460} y1={272} x2={460} y2={320} label="carry" labelX={504} labelY={294} labelMaxChars={10} />
      <Arrow
        x1={460}
        y1={272}
        x2={755}
        y2={320}
        label="justify + settle"
        labelX={658}
        labelY={294}
        labelMaxChars={14}
      />
    </DiagramFigure>
  );
}

export function ExecutionPathDiagram() {
  return (
    <DiagramFigure
      title="Execution Path"
      caption="The core path is intentionally linear: capability chosen, request submitted, executor responds over time, evidence accumulates, and completion is judged against a declared rule."
      viewBox="0 0 1080 280"
    >
      <DiagramBox
        x={24}
        y={78}
        w={170}
        h={104}
        tone="blue"
        title="1. Capability"
        lines={['runtime selects', 'declared capability']}
      />
      <DiagramBox
        x={232}
        y={78}
        w={170}
        h={104}
        tone="green"
        title="2. Request"
        lines={['ExecutionRequest', 'idempotencyKey']}
      />
      <DiagramBox
        x={440}
        y={78}
        w={170}
        h={104}
        tone="amber"
        title="3. Acknowledge"
        lines={['executor accepts', 'or rejects intent']}
      />
      <DiagramBox
        x={648}
        y={78}
        w={170}
        h={104}
        tone="violet"
        title="4. Evidence"
        lines={['readback, webhook,', 'snapshot, receipt']}
      />
      <DiagramBox
        x={856}
        y={78}
        w={200}
        h={104}
        tone="rose"
        title="5. Outcome"
        lines={['completed / failed', 'settlement can attach later']}
      />
      <Arrow x1={194} y1={130} x2={232} y2={130} />
      <Arrow x1={402} y1={130} x2={440} y2={130} />
      <Arrow x1={610} y1={130} x2={648} y2={130} />
      <Arrow x1={818} y1={130} x2={856} y2={130} />
      <CurvedArrow
        d="M 695 188 C 695 236, 920 236, 920 188"
        label="completion rule evaluates evidence"
        labelX={808}
        labelY={230}
        labelMaxChars={16}
      />
    </DiagramFigure>
  );
}

export function CoreObjectDiagram() {
  return (
    <DiagramFigure
      title="Core Object Relationships"
      caption="The v0 object model is small on purpose. Requests target capabilities, events attach to executions, evidence supports claims about executions, and settlement remains an optional later attachment."
      viewBox="0 0 920 410"
    >
      <DiagramBox
        x={330}
        y={24}
        w={260}
        h={92}
        tone="blue"
        title="CapabilityDescriptor"
        lines={['declares input schema, completion mode, evidence expectations']}
      />
      <DiagramBox
        x={75}
        y={170}
        w={250}
        h={108}
        tone="green"
        title="ExecutionRequest"
        lines={['executionId', 'capabilityId', 'input', 'idempotencyKey']}
      />
      <DiagramBox
        x={360}
        y={170}
        w={220}
        h={124}
        tone="amber"
        title="ExecutionEvent"
        lines={['immutable lifecycle fact', 'requested / acknowledged /', 'completed / failed']}
      />
      <DiagramBox
        x={615}
        y={170}
        w={230}
        h={124}
        tone="violet"
        title="EvidenceRecord"
        lines={['supporting proof', 'readback / snapshot / webhook / receipt']}
      />
      <DiagramBox
        x={325}
        y={302}
        w={270}
        h={92}
        tone="slate"
        title="Settlement Attachment"
        lines={['later layer, not forced', 'into v0 core']}
        dashed
      />
      <Arrow
        x1={460}
        y1={116}
        x2={200}
        y2={170}
        label="describes target"
        labelX={292}
        labelY={144}
        labelMaxChars={14}
      />
      <Arrow x1={325} y1={224} x2={360} y2={224} label="produces" labelX={344} labelY={206} labelMaxChars={10} />
      <Arrow
        x1={580}
        y1={224}
        x2={615}
        y2={224}
        label="references"
        labelX={596}
        labelY={206}
        labelMaxChars={10}
      />
      <Arrow
        x1={470}
        y1={294}
        x2={460}
        y2={302}
        label="can attach later"
        labelX={544}
        labelY={286}
        labelMaxChars={14}
        dashed
      />
    </DiagramFigure>
  );
}

export function LifecycleTimelineDiagram() {
  return (
    <DiagramFigure
      title="Lifecycle Timeline"
      caption="Lifecycle facts are facts about an execution attempt, not UI states. `completed` only means what the capability's declared completion mode allows it to mean."
      viewBox="0 0 980 360"
    >
      <line x1={70} y1={200} x2={910} y2={200} stroke="#94a3b8" strokeWidth="4" />
      <TimelineState
        cx={120}
        cy={200}
        color="#60a5fa"
        title="requested"
        description="intent expressed"
        descriptionY={278}
        descriptionMaxChars={14}
      />
      <TimelineState
        cx={300}
        cy={200}
        color="#34d399"
        title="acknowledged"
        description="executor accepts responsibility"
        descriptionY={286}
        descriptionMaxChars={16}
      />
      <TimelineState
        cx={500}
        cy={200}
        color="#a78bfa"
        title="evidence_recorded"
        description="new proof arrives"
        descriptionY={278}
        descriptionMaxChars={14}
      />
      <TimelineState
        cx={700}
        cy={200}
        color="#f59e0b"
        title="completed"
        description="only after completion rule is satisfied"
        descriptionY={286}
        descriptionMaxChars={15}
      />
      <TimelineState
        cx={860}
        cy={200}
        color="#fb7185"
        title="failed"
        description="terminal non-success outcome"
        descriptionY={286}
        descriptionMaxChars={12}
      />

      <CurvedArrow
        d="M 502 158 C 560 84, 648 84, 700 158"
        label="readback_confirmed or observed_effect gates completion"
        labelX={646}
        labelY={38}
        labelMaxChars={18}
      />
    </DiagramFigure>
  );
}

export function ProtocolPositioningDiagram() {
  return (
    <DiagramFigure
      title="Protocol Positioning"
      caption="EEAP is narrower than general agent-network protocols and narrower than heavy external-system middleware. Its job is the execution truth boundary."
      viewBox="0 0 960 420"
    >
      <DiagramBox
        x={65}
        y={46}
        w={260}
        h={124}
        tone="slate"
        title="Too High-Level For EEAP"
        lines={[
          'discovery, federation,',
          'multi-agent channels, routing,',
          'marketplace semantics',
        ]}
      />
      <DiagramBox
        x={350}
        y={24}
        w={260}
        h={180}
        tone="green"
        title="EEAP"
        lines={[
          'capability description',
          'request submission',
          'lifecycle observation',
          'evidence collection',
          'path to settlement',
        ]}
      />
      <DiagramBox
        x={635}
        y={46}
        w={260}
        h={124}
        tone="amber"
        title="Too Low-Level Or Too Broad"
        lines={[
          'device middleware,',
          'industrial ontologies,',
          'executor-native transports',
        ]}
      />
      <DiagramBox
        x={65}
        y={250}
        w={260}
        h={112}
        tone="blue"
        title="Borrow From"
        lines={['WoT, oneM2M, LwM2M, OPC UA', 'for capability and resource semantics']}
      />
      <DiagramBox
        x={350}
        y={250}
        w={260}
        h={112}
        tone="violet"
        title="Carry Through"
        lines={['CloudEvents, AsyncAPI', 'for event carriage and channel descriptions']}
      />
      <DiagramBox
        x={635}
        y={250}
        w={260}
        h={112}
        tone="rose"
        title="Prove + Reconcile"
        lines={['EPCIS, receipts, ISO 20022', 'for evidence provenance and settlement']}
      />
      <Arrow x1={325} y1={108} x2={350} y2={108} />
      <Arrow x1={610} y1={108} x2={635} y2={108} />
      <Arrow
        x1={220}
        y1={170}
        x2={220}
        y2={250}
        label="borrow what helps"
        labelX={244}
        labelY={212}
        labelMaxChars={14}
      />
      <Arrow
        x1={480}
        y1={204}
        x2={480}
        y2={250}
        label="reuse envelopes"
        labelX={512}
        labelY={228}
        labelMaxChars={14}
      />
      <Arrow
        x1={740}
        y1={170}
        x2={740}
        y2={250}
        label="attach later"
        labelX={774}
        labelY={212}
        labelMaxChars={12}
      />
    </DiagramFigure>
  );
}
