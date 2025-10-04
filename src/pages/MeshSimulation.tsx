import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import MeshGrid from "@/components/mesh/MeshGrid";
import EventLog from "@/components/mesh/EventLog";

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  consent: boolean;
}

interface MeshEvent {
  id: string;
  event_type: string;
  node_id: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const MeshSimulation = () => {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [events, setEvents] = useState<MeshEvent[]>([]);

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("consent", true);
      
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Fetch recent events
  const { data: recentEvents = [] } = useQuery({
    queryKey: ["mesh_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesh_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as MeshEvent[];
    },
    refetchInterval: 2000,
  });

  useEffect(() => {
    setEvents(recentEvents);
  }, [recentEvents]);

  // Subscribe to real-time events
  useEffect(() => {
    const channel = supabase
      .channel('mesh_events_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mesh_events'
        },
        (payload) => {
          const newEvent = payload.new as MeshEvent;
          setEvents(prev => [newEvent, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerAlert = async (nodeId: string) => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    
    try {
      const alertId = `alert-${Date.now()}`;
      
      // Log alert triggered
      await supabase.from("mesh_events").insert({
        event_type: "alert_triggered",
        node_id: nodeId,
        message: `Elephant detected near ${nodeId}! Alert initiated.`,
        metadata: { alert_id: alertId, trigger_node: nodeId },
      });

      toast({
        title: "🐘 Alert Triggered!",
        description: `Elephant detected at ${nodeId}. Propagating through mesh...`,
      });

      // Simulate mesh hops with delays
      const hops = ["sensor-2", "sensor-3", "sensor-4"];
      for (const hop of hops) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        await supabase.from("mesh_events").insert({
          event_type: "node_hop",
          node_id: hop,
          message: `Alert relayed through ${hop}`,
          metadata: { alert_id: alertId, from: nodeId, to: hop },
        });
      }

      // Gateway receives alert
      await new Promise(resolve => setTimeout(resolve, 800));
      await supabase.from("mesh_events").insert({
        event_type: "gateway_received",
        node_id: "gateway-1",
        message: "Gateway received alert! Sending SMS to contacts...",
        metadata: { alert_id: alertId, contact_count: contacts.length },
      });

      toast({
        title: "📡 Gateway Received!",
        description: "Sending SMS alerts to all contacts...",
      });

      // Send SMS via edge function
      if (contacts.length > 0) {
        const response = await supabase.functions.invoke('send-sms', {
          body: {
            contacts: contacts.map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              role: c.role,
            })),
            message: `🐘 ELEPHANT ALERT: Elephant detected near ${nodeId}. Please take necessary precautions. Alert ID: ${alertId}`,
            alertId,
          },
        });

        if (response.error) {
          throw response.error;
        }

        toast({
          title: "✅ SMS Sent!",
          description: `Successfully sent ${response.data?.sent || 0} SMS messages`,
        });
      } else {
        toast({
          title: "⚠️ No contacts",
          description: "Please add contacts to receive SMS alerts",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Alert simulation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "❌ Alert Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Grid Area */}
        <div className="xl:col-span-2 space-y-4 lg:space-y-6">
          <Card className="p-4 lg:p-6 bg-card border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                  Mesh Network Visualization
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Click on a sensor node to trigger an elephant alert
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary shadow-glow"></div>
                  <span className="text-muted-foreground">Sensor</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-accent"></div>
                  <span className="text-muted-foreground">Gateway</span>
                </div>
              </div>
            </div>
            
            <MeshGrid 
              onNodeClick={triggerAlert} 
              isSimulating={isSimulating}
              events={events}
            />
          </Card>

          <Card className="p-4 lg:p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
              <h3 className="text-lg lg:text-xl font-semibold text-foreground">
                How It Works
              </h3>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="text-primary font-bold flex-shrink-0">1.</span>
                <p>A sensor node detects elephant movement and triggers an alert</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold flex-shrink-0">2.</span>
                <p>The alert hops through nearby mesh nodes until it reaches a gateway</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold flex-shrink-0">3.</span>
                <p>The gateway sends real SMS messages via Twilio to all consenting contacts</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold flex-shrink-0">4.</span>
                <p>Farmers and officers receive instant alerts to take precautions</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Event Log Sidebar */}
        <div className="xl:col-span-1">
          <EventLog events={events} />
        </div>
      </div>
    </Layout>
  );
};

export default MeshSimulation;