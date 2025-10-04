import { useEffect, useRef, useMemo } from "react";
import NodeVisual from "./NodeVisual";

interface Node {
  id: string;
  type: "sensor" | "gateway";
  x: number;
  y: number;
}

interface MeshEvent {
  id: string;
  event_type: string;
  node_id: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface MeshGridProps {
  onNodeClick: (nodeId: string) => void;
  isSimulating: boolean;
  events: MeshEvent[];
}

const MeshGrid = ({ onNodeClick, isSimulating, events }: MeshGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Responsive node positions - using percentages for better mobile support
  const nodes: Node[] = useMemo(() => [
    { id: "sensor-1", type: "sensor", x: 15, y: 25 },      // Percentages
    { id: "sensor-2", type: "sensor", x: 40, y: 35 },
    { id: "sensor-3", type: "sensor", x: 65, y: 25 },
    { id: "sensor-4", type: "sensor", x: 50, y: 60 },
    { id: "gateway-1", type: "gateway", x: 85, y: 50 },
  ], []);

  const connections = useMemo(() => [
    ["sensor-1", "sensor-2"],
    ["sensor-2", "sensor-3"],
    ["sensor-2", "sensor-4"],
    ["sensor-3", "gateway-1"],
    ["sensor-4", "gateway-1"],
  ], []);

  // Draw connections on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Convert percentage coordinates to actual pixel coordinates
    const getPixelCoords = (node: Node) => ({
      x: (node.x / 100) * canvas.width,
      y: (node.y / 100) * canvas.height
    });

    // Draw connections
    connections.forEach(([from, to]) => {
      const fromNode = nodes.find(n => n.id === from);
      const toNode = nodes.find(n => n.id === to);
      
      if (!fromNode || !toNode) return;

      const fromCoords = getPixelCoords(fromNode);
      const toCoords = getPixelCoords(toNode);

      ctx.beginPath();
      ctx.moveTo(fromCoords.x, fromCoords.y);
      ctx.lineTo(toCoords.x, toCoords.y);
      ctx.strokeStyle = "hsl(217 25% 20%)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Highlight active paths during simulation
    const recentHops = events
      .filter(e => e.event_type === "node_hop" && 
        new Date(e.created_at).getTime() > Date.now() - 3000)
      .slice(0, 3);

    recentHops.forEach((hop) => {
      const fromId = hop.metadata?.from as string;
      const toId = hop.metadata?.to as string;
      
      if (!fromId || !toId) return;

      const fromNode = nodes.find(n => n.id === fromId);
      const toNode = nodes.find(n => n.id === toId);
      
      if (!fromNode || !toNode) return;

      const fromCoords = getPixelCoords(fromNode);
      const toCoords = getPixelCoords(toNode);

      ctx.beginPath();
      ctx.moveTo(fromCoords.x, fromCoords.y);
      ctx.lineTo(toCoords.x, toCoords.y);
      ctx.strokeStyle = "hsl(188 95% 55%)";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "hsl(188 95% 55%)";
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }, [events, connections, nodes]);

  const getNodeStatus = (nodeId: string) => {
    const recentEvent = events.find(
      e => e.node_id === nodeId && 
      new Date(e.created_at).getTime() > Date.now() - 2000
    );
    return recentEvent?.event_type;
  };

  return (
    <div className="relative w-full h-[280px] sm:h-[350px] lg:h-[400px] bg-gradient-to-br from-background to-secondary/20 rounded-lg overflow-hidden">
      {/* Canvas for connections */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Nodes */}
      {nodes.map((node) => (
        <NodeVisual
          key={node.id}
          node={node}
          onClick={() => !isSimulating && node.type === "sensor" && onNodeClick(node.id)}
          disabled={isSimulating}
          status={getNodeStatus(node.id)}
        />
      ))}
    </div>
  );
};

export default MeshGrid;