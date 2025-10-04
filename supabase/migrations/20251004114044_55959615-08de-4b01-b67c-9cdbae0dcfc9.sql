-- Create contacts table for storing farmer/officer contact information
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'officer')),
  phone TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table for logging mesh network activity
CREATE TABLE public.mesh_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('alert_triggered', 'node_hop', 'gateway_received', 'sms_sent', 'sms_failed')),
  node_id TEXT,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesh_events ENABLE ROW LEVEL SECURITY;

-- Public access policies for demo purposes
CREATE POLICY "Anyone can view contacts" 
ON public.contacts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update contacts" 
ON public.contacts 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete contacts" 
ON public.contacts 
FOR DELETE 
USING (true);

CREATE POLICY "Anyone can view mesh events" 
ON public.mesh_events 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create mesh events" 
ON public.mesh_events 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for mesh events
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesh_events;