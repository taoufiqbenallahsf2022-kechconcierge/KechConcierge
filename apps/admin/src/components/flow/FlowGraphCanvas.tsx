import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export type GraphLocation = {
  index: number;
  decisionId?: string;
  outcomeId?: string;
  loopId?: string;
};

export type GraphOutcome = {
  id: string;
  name: string;
  isDefault: boolean;
  actions: GraphAction[];
};

export type GraphAction = {
  id: string;
  type: string;
  outcomes?: GraphOutcome[];
  bodyActions?: GraphAction[];
};

type ActivityDefinition = {
  title: string;
  icon: string;
};

type CanvasProps = {
  triggerTitle: string;
  triggerSummary: string;
  triggerConfigured: boolean;
  actions: GraphAction[];
  activityDefinition: (type: any) => ActivityDefinition;
  actionSummary: (action: any) => string;
  onConfigureTrigger: () => void;
  onEditAction: (location: GraphLocation, action: any) => void;
  onDeleteAction: (location: GraphLocation) => void;
  onInsert: (location: GraphLocation) => void;
  onDropActivity: (type: string, location: GraphLocation) => void;
  onOpenExecution: (activityId: string, activityType: string) => void;
  executionByActivity?: Record<string, {
    status: "COMPLETED" | "FAILED";
    count: number;
    errors: number;
    summary: string;
  }>;
};

type GraphNodeData = {
  kind:
    | "trigger"
    | "activity"
    | "decision"
    | "loop"
    | "route"
    | "add"
    | "merge"
    | "end";
  title?: string;
  eyebrow?: string;
  summary?: string;
  icon?: string;
  configured?: boolean;
  outcomes?: Array<{ id: string; name: string }>;
  location?: GraphLocation;
  action?: GraphAction;
  onClick?: () => void;
  onDelete?: () => void;
  onInsert?: () => void;
  onDropActivity?: (type: string) => void;
  execution?: {
    status: "COMPLETED" | "FAILED";
    count: number;
    errors: number;
    summary: string;
  };
  onOpenExecution?: () => void;
};

let elkPromise:
  | Promise<InstanceType<
      typeof import("elkjs/lib/elk.bundled.js").default
    >>
  | undefined;

async function getElk() {
  if (!elkPromise)
    elkPromise = import("elkjs/lib/elk.bundled.js").then(
      ({ default: ELK }) => new ELK(),
    );
  return elkPromise;
}

function CardNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const decision = data.kind === "decision";
  const loop = data.kind === "loop";
  return (
    <div
      className={`rf-flow-card rf-${data.kind} ${
        data.configured ? "configured" : ""
      }`}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} id="input" />
      {loop && (
        <Handle
          type="target"
          position={Position.Left}
          id="loop-return"
          className="rf-loop-return"
        />
      )}
      <span className="rf-node-icon">{data.icon}</span>
      <div className="rf-node-copy">
        <small>{data.eyebrow}</small>
        <b>{data.title}</b>
        <p>{data.summary}</p>
        {data.execution && (
          <button
            type="button"
            className={`rf-execution-badge ${data.execution.errors ? "error" : "success"}`}
            title={data.execution.summary}
            onClick={(event) => {
              event.stopPropagation();
              data.onOpenExecution?.();
            }}
          >
            {data.execution.count} record{data.execution.count === 1 ? "" : "s"}
            {data.execution.errors ? ` · ${data.execution.errors} error${data.execution.errors === 1 ? "" : "s"}` : " · completed"}
          </button>
        )}
      </div>
      {data.onDelete && (
        <button
          type="button"
          className="rf-node-delete nodrag"
          onClick={(event) => {
            event.stopPropagation();
            data.onDelete?.();
          }}
        >
          ×
        </button>
      )}
      {decision ? (
        data.outcomes?.map((outcome, index) => (
          <Handle
            type="source"
            position={Position.Bottom}
            id={outcome.id}
            key={outcome.id}
            style={{
              left: `${((index + 1) / ((data.outcomes?.length ?? 0) + 1)) * 100}%`,
            }}
          />
        ))
      ) : loop ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="iteration"
            style={{ left: "35%" }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="done"
            style={{ left: "65%" }}
          />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
}

function RouteNode({ data }: NodeProps<Node<GraphNodeData>>) {
  return (
    <div className="rf-route-node">
      <Handle type="target" position={Position.Top} />
      <small>{data.eyebrow}</small>
      <b>{data.title}</b>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function AddNode({ data }: NodeProps<Node<GraphNodeData>>) {
  return (
    <div
      className="rf-add-node"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData("application/x-flow-activity");
        if (type) data.onDropActivity?.(type);
      }}
    >
      <Handle type="target" position={Position.Top} />
      <button type="button" className="nodrag" onClick={data.onInsert}>
        +
      </button>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function MergeNode() {
  return (
    <div className="rf-merge-node">
      <Handle type="target" position={Position.Top} />
      <span />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  trigger: CardNode,
  activity: CardNode,
  decision: CardNode,
  loop: CardNode,
  route: RouteNode,
  add: AddNode,
  merge: MergeNode,
  end: CardNode,
};

function StructuredEdge({
  data,
  markerEnd,
  style,
}: EdgeProps<Edge<{ routedPath?: string }>>) {
  return (
    <BaseEdge
      path={data?.routedPath ?? ""}
      markerEnd={markerEnd}
      style={style}
    />
  );
}

const edgeTypes = { structured: StructuredEdge };

function graphId(prefix: string, ...parts: string[]) {
  return `${prefix}:${parts.join(":")}`;
}

function buildGraph(props: CanvasProps) {
  const nodes: Node<GraphNodeData>[] = [];
  const edges: Edge[] = [];
  let edgeIndex = 0;

  const addNode = (
    id: string,
    type: keyof typeof nodeTypes,
    data: GraphNodeData,
    width: number,
    height: number,
  ) => {
    nodes.push({
      id,
      type,
      position: { x: 0, y: 0 },
      data,
      width,
      height,
      style: { width, height },
    });
  };
  const connect = (
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string,
  ) => {
    edges.push({
      id: `edge:${edgeIndex++}`,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: targetHandle === "loop-return" ? "default" : "smoothstep",
      animated: targetHandle === "loop-return",
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      style: {
        stroke: targetHandle === "loop-return" ? "#7c3aed" : "#718096",
        strokeWidth: targetHandle === "loop-return" ? 2.2 : 1.7,
      },
    });
  };

  const triggerId = "trigger";
  addNode(
    triggerId,
    "trigger",
    {
      kind: "trigger",
      eyebrow: "TRIGGER",
      title: props.triggerTitle,
      summary: props.triggerSummary,
      icon: "⚡",
      configured: props.triggerConfigured,
      onClick: props.onConfigureTrigger,
    },
    340,
    82,
  );

  const buildSequence = (
    actions: GraphAction[],
    incoming: string,
    parent: Pick<
      GraphLocation,
      "decisionId" | "outcomeId" | "loopId"
    > = {},
    prefix = "root",
  ): string => {
    let previous = incoming;
    actions.forEach((action, index) => {
      const location = { ...parent, index };
      const addId = graphId("add", prefix, String(index));
      addNode(
        addId,
        "add",
        {
          kind: "add",
          location,
          onInsert: () => props.onInsert(location),
          onDropActivity: (type) => props.onDropActivity(type, location),
        },
        34,
        34,
      );
      connect(previous, addId);

      const actionId = graphId("action", action.id);
      const definition = props.activityDefinition(action.type);
      const isDecision = action.type === "DECISION";
      const isLoop = action.type === "LOOP";
      addNode(
        actionId,
        isDecision ? "decision" : isLoop ? "loop" : "activity",
        {
          kind: isDecision ? "decision" : isLoop ? "loop" : "activity",
          eyebrow: `ACTIVITY ${index + 1}`,
          title: definition.title,
          summary: props.actionSummary(action),
          icon: definition.icon,
          action,
          execution: props.executionByActivity?.[action.id],
          onOpenExecution: () => props.onOpenExecution(action.id, action.type),
          outcomes: action.outcomes?.map((outcome) => ({
            id: outcome.id,
            name: outcome.name,
          })),
          onClick: () => props.onEditAction(location, action),
          onDelete: () => props.onDeleteAction(location),
        },
        340,
        82,
      );
      connect(addId, actionId);

      if (isDecision && action.outcomes?.length) {
        const branchTails: string[] = [];
        action.outcomes.forEach((outcome) => {
          const routeId = graphId("route", action.id, outcome.id);
          addNode(
            routeId,
            "route",
            {
              kind: "route",
              eyebrow: outcome.isDefault ? "DEFAULT" : "OUTCOME",
              title: outcome.name,
            },
            150,
            48,
          );
          connect(actionId, routeId, outcome.id);
          branchTails.push(
            buildSequence(
              outcome.actions,
              routeId,
              { decisionId: action.id, outcomeId: outcome.id },
              `${prefix}:${action.id}:${outcome.id}`,
            ),
          );
        });
        const mergeId = graphId("merge", action.id);
        addNode(
          mergeId,
          "merge",
          { kind: "merge" },
          26,
          26,
        );
        branchTails.forEach((tail) => connect(tail, mergeId));
        previous = mergeId;
      } else if (isLoop) {
        const iterationRouteId = graphId("loop-iteration", action.id);
        addNode(
          iterationRouteId,
          "route",
          {
            kind: "route",
            eyebrow: "ITERATION",
            title: "For each record",
          },
          150,
          48,
        );
        connect(actionId, iterationRouteId, "iteration");
        const bodyTail = buildSequence(
          action.bodyActions ?? [],
          iterationRouteId,
          { loopId: action.id },
          `${prefix}:${action.id}:body`,
        );
        connect(bodyTail, actionId, undefined, "loop-return");

        const afterLoopId = graphId("loop-done", action.id);
        addNode(
          afterLoopId,
          "route",
          {
            kind: "route",
            eyebrow: "AFTER LOOP",
            title: "Collection complete",
          },
          150,
          48,
        );
        connect(actionId, afterLoopId, "done");
        previous = afterLoopId;
      } else {
        previous = actionId;
      }
    });

    const finalLocation = { ...parent, index: actions.length };
    const finalAddId = graphId("add", prefix, "end");
    addNode(
      finalAddId,
      "add",
      {
        kind: "add",
        location: finalLocation,
        onInsert: () => props.onInsert(finalLocation),
        onDropActivity: (type) =>
          props.onDropActivity(type, finalLocation),
      },
      34,
      34,
    );
    connect(previous, finalAddId);
    return finalAddId;
  };

  const tail = buildSequence(props.actions, triggerId);
  addNode(
    "end",
    "end",
    {
      kind: "end",
      eyebrow: "END",
      title: "Flow Complete",
      summary: "The flow continues here after the selected path.",
      icon: "■",
    },
    340,
    82,
  );
  connect(tail, "end");
  return { nodes, edges };
}

async function layoutGraph(
  nodes: Node<GraphNodeData>[],
  edges: Edge[],
) {
  const elk = await getElk();
  const result = await elk.layout({
    id: "flow-root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "48",
      "elk.spacing.edgeNode": "28",
      "elk.spacing.edgeEdge": "18",
      "elk.layered.spacing.nodeNodeBetweenLayers": "54",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.crossingMinimization.semiInteractive": "true",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.nodePlacement.favorStraightEdges": "true",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.considerModelOrder.components": "MODEL_ORDER",
      "elk.layered.thoroughness": "30",
      "elk.layered.compaction.postCompaction.strategy": "EDGE_LENGTH",
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: Number(node.style?.width ?? 340),
      height: Number(node.style?.height ?? 82),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });
  const positions = new Map(
    result.children?.map((child) => [
      child.id,
      { x: child.x ?? 0, y: child.y ?? 0 },
    ]),
  );
  const positionedNodes = nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
  const routedPaths = new Map(
    (result.edges as Array<{
      id: string;
      sections?: Array<{
        startPoint: { x: number; y: number };
        bendPoints?: Array<{ x: number; y: number }>;
        endPoint: { x: number; y: number };
      }>;
    }> | undefined)?.map((edge) => {
      const section = edge.sections?.[0];
      if (!section) return [edge.id, ""] as const;
      const points = [
        section.startPoint,
        ...(section.bendPoints ?? []),
        section.endPoint,
      ];
      return [
        edge.id,
        points
          .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
          )
          .join(" "),
      ] as const;
    }) ?? [],
  );
  const routedEdges = edges.map((edge) => ({
    ...edge,
    type: "structured",
    data: { ...edge.data, routedPath: routedPaths.get(edge.id) ?? "" },
  }));
  return { nodes: positionedNodes, edges: routedEdges };
}

function FlowGraphInner(props: CanvasProps) {
  const graph = useMemo(() => buildGraph(props), [
    props.actions,
    props.triggerTitle,
    props.triggerSummary,
    props.triggerConfigured,
  ]);
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);
  const [layouting, setLayouting] = useState(true);
  const { fitView } = useReactFlow();

  const applyLayout = useCallback(async () => {
    setLayouting(true);
    const positioned = await layoutGraph(graph.nodes, graph.edges);
    setNodes(positioned.nodes);
    setEdges(positioned.edges);
    setLayouting(false);
    requestAnimationFrame(() =>
      void fitView({ padding: 0.18, duration: 280 }),
    );
  }, [fitView, graph, setEdges, setNodes]);

  useEffect(() => {
    void applyLayout();
  }, [applyLayout]);

  return (
    <div className="rf-flow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesConnectable={false}
        nodesDraggable={false}
        deleteKeyCode={null}
        minZoom={0.25}
        maxZoom={1.6}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={22}
          size={1}
          color="#dbe4ee"
        />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          maskColor="rgba(238, 243, 248, .72)"
        />
      </ReactFlow>
      <button
        type="button"
        className="rf-layout-button"
        onClick={() => void applyLayout()}
        disabled={layouting}
      >
        {layouting ? "Arranging…" : "Auto layout"}
      </button>
    </div>
  );
}

export function FlowGraphCanvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowGraphInner {...props} />
    </ReactFlowProvider>
  );
}
