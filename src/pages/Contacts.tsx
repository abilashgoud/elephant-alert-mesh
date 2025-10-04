import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  consent: boolean;
}

const Contacts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "farmer",
    phone: "",
    consent: true,
  });

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Add contact mutation
  const addContact = useMutation({
    mutationFn: async (contact: Omit<Contact, "id">) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert(contact)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setFormData({ name: "", role: "farmer", phone: "", consent: true });
      toast({ title: "✅ Contact added successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Failed to add contact", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update contact mutation
  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setEditingId(null);
      toast({ title: "✅ Contact updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Failed to update contact", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete contact mutation
  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "✅ Contact deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Failed to delete contact", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addContact.mutate(formData);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Contact Management
          </h2>
          <p className="text-sm lg:text-base text-muted-foreground">
            Add and manage farmers and officers who will receive SMS alerts
          </p>
        </div>

        {/* Add Contact Form */}
        <Card className="p-4 lg:p-6 bg-card border-border">
          <h3 className="text-lg lg:text-xl font-semibold mb-4 text-foreground">Add New Contact</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="officer">Officer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  required
                  className="bg-background"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6 sm:pt-8">
                <Checkbox
                  id="consent"
                  checked={formData.consent}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, consent: checked as boolean })
                  }
                />
                <Label htmlFor="consent" className="cursor-pointer text-sm">
                  Consent to receive SMS alerts
                </Label>
              </div>
            </div>
            <Button type="submit" className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </form>
        </Card>

        {/* Contacts List */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Contacts ({contacts.length})
          </h3>
          {isLoading ? (
            <p className="text-muted-foreground">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-muted-foreground">No contacts yet. Add your first contact above.</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                >
                  {editingId === contact.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input
                        defaultValue={contact.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Name"
                      />
                      <Select
                        defaultValue={contact.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="farmer">Farmer</SelectItem>
                          <SelectItem value="officer">Officer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        defaultValue={contact.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Phone"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateContact.mutate({ id: contact.id, ...formData })}
                          className="bg-success hover:opacity-90"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <p className="font-medium text-foreground">{contact.name}</p>
                        </div>
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            contact.role === 'farmer' 
                              ? 'bg-success/20 text-success' 
                              : 'bg-accent/20 text-accent'
                          }`}>
                            {contact.role}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        </div>
                        <div>
                          <span className={`text-xs ${
                            contact.consent ? 'text-success' : 'text-destructive'
                          }`}>
                            {contact.consent ? '✓ Consented' : '✗ No consent'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(contact.id);
                            setFormData({
                              name: contact.name,
                              role: contact.role,
                              phone: contact.phone,
                              consent: contact.consent,
                            });
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteContact.mutate(contact.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Contacts;