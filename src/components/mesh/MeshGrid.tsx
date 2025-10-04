import { useEffect, useRef } from "react";
import NodeVisual from "./NodeVisual";

interface Node {
  id: string;
  type: "sensor" | "gateway";
  x: number;
  y: number;
}

interface MeshGridProps {
  onNodeClick: (nodeId: string) => void;
  isSimulating: boolean;
  events: any[];
}

const MeshGrid = ({ onNodeClick, isSimulating, events }: MeshGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const nodes: Node[] = [
    { id: "sensor-1", type: "sensor", x: 100, y: 100 },
    { id: "sensor-2", type: "sensor", x: 250, y: 150 },
    { id: "sensor-3", type: "sensor", x: 400, y: 100 },
    { id: "sensor-4", type: "sensor", x: 300, y: 250 },
    { id: "gateway-1", type: "gateway", x: 550, y: 200 },
  ];

  const connections = [
    ["sensor-1", "sensor-2"],
    ["sensor-2", "sensor-3"],
    ["sensor-2", "sensor-4"],
    ["sensor-3", "gateway-1"],
    ["sensor-4", "gateway-1"],
  ];

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

    // Draw connections
    connections.forEach(([from, to]) => {
      const fromNode = nodes.find(n => n.id === from);
      const toNode = nodes.find(n => n.id === to);
      
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
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
      const fromId = hop.metadata?.from;
      const toId = hop.metadata?.to;
      
      if (!fromId || !toId) return;

      const fromNode = nodes.find(n => n.id === fromId);
      const toNode = nodes.find(n => n.id === toId);
      
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = "hsl(188 95% 55%)";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "hsl(188 95% 55%)";
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }, [events]);

  const getNodeStatus = (nodeId: string) => {
    const recentEvent = events.find(
      e => e.node_id === nodeId && 
      new Date(e.created_at).getTime() > Date.now() - 2000
    );
    return recentEvent?.event_type;
  };

  return (
    <div className="relative w-full h-[400px] bg-gradient-to-br from-background to-secondary/20 rounded-lg overflow-hidden">
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