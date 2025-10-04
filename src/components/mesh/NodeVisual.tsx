import { Radio, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface Node {
  id: string;
  type: "sensor" | "gateway";
  x: number;
  y: number;
}

interface NodeVisualProps {
  node: Node;
  onClick: () => void;
  disabled: boolean;
  status?: string;
}

const NodeVisual = ({ node, onClick, disabled, status }: NodeVisualProps) => {
  const isActive = status === "node_hop" || status === "alert_triggered" || status === "gateway_received";
  const isSensor = node.type === "sensor";

  return (
    <div
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
        isSensor && !disabled && "cursor-pointer hover:scale-110",
        disabled && "opacity-60"
      )}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      onClick={onClick}
    >
      {/* Pulse animation when active */}
      {isActive && (
        <div className="absolute inset-0 animate-ping">
          <div className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full",
            isSensor ? "bg-primary/30" : "bg-accent/30"
          )} />
        </div>
      )}

      {/* Node circle */}
      <div
        className={cn(
          "relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shadow-node transition-all",
          isSensor
            ? isActive
              ? "bg-gradient-primary shadow-glow"
              : "bg-primary/80"
            : isActive
              ? "bg-gradient-alert shadow-glow"
              : "bg-accent/80"
        )}
      >
        {isSensor ? (
          <Radio className={cn(
            "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6",
            isActive ? "text-primary-foreground animate-pulse" : "text-primary-foreground"
          )} />
        ) : (
          <Wifi className={cn(
            "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6",
            isActive ? "text-accent-foreground animate-pulse" : "text-accent-foreground"
          )} />
        )}
      </div>

      {/* Label */}
      <div className="absolute top-full mt-1 sm:mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-medium text-foreground bg-card/80 px-1 sm:px-2 py-1 rounded backdrop-blur-sm">
          {node.id}
        </span>
      </div>
    </div>
  );
};

export default NodeVisual;