import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Radio, Wifi, MessageSquare, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeshEvent {
  id: string;
  event_type: string;
  node_id: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface EventLogProps {
  events: MeshEvent[];
}

const EventLog = ({ events }: EventLogProps) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "alert_triggered":
        return <AlertTriangle className="w-4 h-4 text-accent" />;
      case "node_hop":
        return <Radio className="w-4 h-4 text-primary" />;
      case "gateway_received":
        return <Wifi className="w-4 h-4 text-accent" />;
      case "sms_sent":
        return <MessageSquare className="w-4 h-4 text-success" />;
      case "sms_failed":
        return <MessageSquare className="w-4 h-4 text-destructive" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "alert_triggered":
        return "border-l-accent";
      case "node_hop":
        return "border-l-primary";
      case "gateway_received":
        return "border-l-accent";
      case "sms_sent":
        return "border-l-success";
      case "sms_failed":
        return "border-l-destructive";
      default:
        return "border-l-muted";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <Card className="p-4 lg:p-6 bg-card border-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
        <h3 className="text-lg lg:text-xl font-semibold text-foreground">Live Event Log</h3>
      </div>
      
      <ScrollArea className="h-[300px] sm:h-[400px] lg:h-[600px] pr-2 lg:pr-4">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-xs sm:text-sm text-center py-6 lg:py-8">
            No events yet. Click a sensor to trigger an alert!
          </p>
        ) : (
          <div className="space-y-2 lg:space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "p-2 lg:p-3 bg-background rounded-lg border-l-4 transition-all hover:bg-secondary/30",
                  getEventColor(event.event_type)
                )}
              >
                <div className="flex items-start gap-2">
                  {getEventIcon(event.event_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground leading-tight">
                      {event.message}
                    </p>
                    {event.node_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Node: {event.node_id}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(event.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default EventLog;