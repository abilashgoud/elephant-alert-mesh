import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  contacts: Array<{
    id: string;
    name: string;
    phone: string;
    role: string;
  }>;
  message: string;
  alertId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contacts, message, alertId }: SendSMSRequest = await req.json();
    
    console.log(`📱 Sending SMS to ${contacts.length} contacts for alert ${alertId}`);
    
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = [];
    
    for (const contact of contacts) {
      try {
        console.log(`📤 Sending to ${contact.name} (${contact.phone})`);
        
        // Send SMS via Twilio
        const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: contact.phone,
              From: twilioPhoneNumber,
              Body: message,
            }),
          }
        );

        const data = await response.json();
        
        if (response.ok) {
          console.log(`✅ SMS sent to ${contact.name}: ${data.sid}`);
          
          // Log success to database
          await supabase.from('mesh_events').insert({
            event_type: 'sms_sent',
            message: `SMS sent to ${contact.name} (${contact.role})`,
            metadata: {
              contact_id: contact.id,
              contact_name: contact.name,
              phone: contact.phone,
              role: contact.role,
              alert_id: alertId,
              sms_sid: data.sid,
            },
          });
          
          results.push({
            contact: contact.name,
            phone: contact.phone,
            success: true,
            sid: data.sid,
          });
        } else {
          console.error(`❌ Failed to send SMS to ${contact.name}:`, data);
          
          // Log failure to database
          await supabase.from('mesh_events').insert({
            event_type: 'sms_failed',
            message: `SMS failed for ${contact.name} (${contact.role}): ${data.message}`,
            metadata: {
              contact_id: contact.id,
              contact_name: contact.name,
              phone: contact.phone,
              role: contact.role,
              alert_id: alertId,
              error: data.message,
            },
          });
          
          results.push({
            contact: contact.name,
            phone: contact.phone,
            success: false,
            error: data.message,
          });
        }
      } catch (error: any) {
        console.error(`❌ Error sending SMS to ${contact.name}:`, error);
        
        // Log error to database
        await supabase.from('mesh_events').insert({
          event_type: 'sms_failed',
          message: `SMS failed for ${contact.name} (${contact.role}): ${error.message}`,
          metadata: {
            contact_id: contact.id,
            contact_name: contact.name,
            phone: contact.phone,
            role: contact.role,
            alert_id: alertId,
            error: error.message,
          },
        });
        
        results.push({
          contact: contact.name,
          phone: contact.phone,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`✨ SMS batch complete: ${results.filter(r => r.success).length}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        total: results.length,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error in send-sms function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});