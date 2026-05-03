"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Upload, Loader2, FileCheck, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/page-header";
import type { Contact, ContactList } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { validateEmailAction } from "@/lib/actions";

import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/provider";

import { useCollection } from "@/hooks/use-supabase-collection";
import { useDoc } from "@/hooks/use-supabase-doc";
import { useMemoSupabaseCollection, useMemoSupabaseDoc } from "@/hooks/use-memo-supabase";

import { ContactListControls } from "./components/contact-list-controls";
import { ContactsTable } from "./components/contacts-table";
import { ContactForm } from "./components/contact-form";

import type { Database } from "@/lib/supabase/types";

type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type ContactListRow = Database["public"]["Tables"]["contact_lists"]["Row"];
type ContactListItemRow = Database["public"]["Tables"]["contact_list_items"]["Row"];

type ContactListItem = Pick<ContactListItemRow, "contact_id">;

export default function ContactsPage() {
  const { user } = useUser();

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const contactListsQuery = useMemoSupabaseCollection(
    user
      ? {
          tableName: "contact_lists",
          filters: [{ column: "user_id", operator: "eq", value: user.id }],
          orderBy: { column: "created_at", ascending: false },
        }
      : null,
    [user?.id]
  );

  const { data: contactListsRows, isLoading: listsLoading } = useCollection<ContactListRow>(
    contactListsQuery
  );

  // List items for the currently selected list
  const listItemsQuery = useMemoSupabaseCollection(
    selectedListId
      ? {
          tableName: "contact_list_items",
          filters: [{ column: "contact_list_id", operator: "eq", value: selectedListId }],
        }
      : null,
    [selectedListId]
  );

  const { data: listItemsRows } = useCollection<ContactListItemRow>(listItemsQuery);

  const contactIds = useMemo(() => {
    const items = listItemsRows as ContactListItem[] | null;
    if (!items) return [];
    return items.map((it) => it.contact_id);
  }, [listItemsRows]);

  const contactIdsKey = useMemo(() => [...contactIds].sort().join(","), [contactIds]);

  const contactsQuery = useMemoSupabaseCollection(
    user && selectedListId && contactIds.length > 0
      ? {
          tableName: "contacts",
          filters: [
            { column: "user_id", operator: "eq", value: user.id },
            { column: "id", operator: "in", value: contactIds },
          ],
          orderBy: { column: "created_at", ascending: false },
        }
      : null,
    [user?.id, selectedListId, contactIdsKey]
  );

  const { data: contactsRows, isLoading: contactsLoading } = useCollection<ContactRow>(contactsQuery);

  const contactLists: ContactList[] = useMemo(() => {
    const rows = contactListsRows ?? [];
    return rows.map((l) => ({
      id: l.id,
      name: l.name,
      contactIds: [],
      createdAt: l.created_at,
      updatedAt: l.created_at,
    }));
  }, [contactListsRows]);

  const selectedListContacts: Contact[] = useMemo(() => {
    const rows = contactsRows ?? [];
    return rows.map((c) => ({
      id: c.id,
      firstName: c.first_name ?? "",
      lastName: c.last_name ?? "",
      email: c.email,
      company: c.company ?? "",
      position: c.position ?? "",
      isValid: c.is_valid ?? false,
    }));
  }, [contactsRows]);

  const handleCreateList = async (name: string) => {
    if (!user) return;
    const nowIso = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("contact_lists")
        .insert({
          user_id: user.id,
          name,
          created_at: nowIso,
        })
        .select("*")
        .single();

      if (error) throw error;
      if (!data) throw new Error("No row returned");

      setSelectedListId(data.id);
      toast({ title: "List Created", description: `"${name}" is ready.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to create list." });
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!user) return;

    try {
      // Remove mapping rows first
      const { error: itemsError } = await supabase
        .from("contact_list_items")
        .delete()
        .eq("contact_list_id", id);

      if (itemsError) throw itemsError;

      // Remove the list
      const { error: listError } = await supabase.from("contact_lists").delete().eq("id", id);
      if (listError) throw listError;

      setSelectedListId(null);
      toast({ title: "List Deleted" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete list." });
    }
  };

  const handleAddContact = async (contact: Omit<Contact, "id">) => {
    if (!user || !selectedListId) return;
    const nowIso = new Date().toISOString();

    const contactInsert = {
      user_id: user.id,
      first_name: contact.firstName ?? null,
      last_name: contact.lastName ?? null,
      email: contact.email,
      company: contact.company ?? null,
      position: contact.position ?? null,
      is_valid: contact.isValid ?? false,
      created_at: nowIso,
    };

    try {
      const { data: inserted, error: insertError } = await supabase
        .from("contacts")
        .insert(contactInsert)
        .select("*")
        .single();

      if (insertError) throw insertError;
      if (!inserted) throw new Error("No contact returned");

      const { error: linkError } = await supabase.from("contact_list_items").insert({
        contact_list_id: selectedListId,
        contact_id: inserted.id,
      });

      if (linkError) throw linkError;

      setIsContactFormOpen(false);
      toast({ title: "Contact Added" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add contact." });
    }
  };

  const handleUpdateContact = async (
    updatedContact: Contact | Omit<Contact, "id">
  ) => {
    if (!user) return;

    if (!("id" in updatedContact)) return;

    const { id, ...data } = updatedContact;

    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          first_name: data.firstName ?? null,
          last_name: data.lastName ?? null,
          email: data.email,
          company: data.company ?? null,
          position: data.position ?? null,
          is_valid: data.isValid ?? false,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setEditingContact(null);
      setIsContactFormOpen(false);
      toast({ title: "Contact Updated" });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update contact.",
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!user || !selectedListId) return;

    try {
      // Remove from list only (do not delete the contact row)
      const { error } = await supabase
        .from("contact_list_items")
        .delete()
        .eq("contact_list_id", selectedListId)
        .eq("contact_id", contactId);

      if (error) throw error;

      toast({ title: "Contact Removed from List" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove contact." });
    }
  };

  const handleBulkVerify = async () => {
    if (!user || selectedListContacts.length === 0) return;

    setIsVerifying(true);
    const toastHandle = toast({
      title: "Verifying List",
      description: "Initializing validation sequence...",
    });

    try {
      let successCount = 0;
      let failCount = 0;

      for (const contact of selectedListContacts) {
        const validation = await validateEmailAction(contact.email);

        const isValid = validation.isValid;
        const { error } = await supabase
          .from("contacts")
          .update({ is_valid: isValid })
          .eq("id", contact.id)
          .eq("user_id", user.id);

        if (error) throw error;

        if (isValid) successCount++;
        else failCount++;
      }

      toastHandle.update({
        title: "Verification Complete",
        description: `Verified ${successCount} leads. ${failCount} failed deliverability check.`,
      });
    } catch {
      toastHandle.update({
        variant: "destructive",
        title: "Verification Failed",
        description: "Could not complete bulk check.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !selectedListId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastHandle = toast({
      title: "Importing...",
      description: "Mapping headers and validating data...",
    });

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

      if (lines.length <= 1) throw new Error("File is empty or missing headers.");

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const emailIdx = headers.findIndex((h) => h.includes("email"));
      if (emailIdx === -1) throw new Error("No 'email' column found in headers.");

      const fnIdx = headers.findIndex((h) => h.includes("first") || h === "name");
      const lnIdx = headers.findIndex((h) => h.includes("last"));
      const coIdx = headers.findIndex((h) => h.includes("company") || h.includes("org"));
      const posIdx = headers.findIndex(
        (h) => h.includes("position") || h.includes("title") || h.includes("role")
      );

      const clean = (val?: string) => val?.trim().replace(/^"|"$/g, "") ?? "";

      const existingEmails = new Set(selectedListContacts.map((c) => c.email.toLowerCase()));

      const parsedContacts: Array<{
        email: string;
        first_name: string | null;
        last_name: string | null;
        company: string | null;
        position: string | null;
      }> = [];

      for (const line of lines.slice(1)) {
        if (parsedContacts.length >= 450) break;

        const values = line.split(",").map((v) => v.trim());
        const email = clean(values[emailIdx]).toLowerCase();

        if (!email || !email.includes("@") || existingEmails.has(email)) continue;

        existingEmails.add(email);

        parsedContacts.push({
          email,
          first_name: fnIdx !== -1 ? clean(values[fnIdx]) : null,
          last_name: lnIdx !== -1 ? clean(values[lnIdx]) : null,
          company: coIdx !== -1 ? clean(values[coIdx]) : null,
          position: posIdx !== -1 ? clean(values[posIdx]) : null,
        });
      }

      if (parsedContacts.length === 0) {
        toastHandle.update({
          variant: "destructive",
          title: "No New Contacts",
          description: "All contacts in file are already in this list.",
        });
        return;
      }

      const nowIso = new Date().toISOString();

      // Insert contacts
      const { data: insertedContacts, error: insertError } = await supabase
        .from("contacts")
        .insert(
          parsedContacts.map((c) => ({
            user_id: user.id,
            email: c.email,
            first_name: c.first_name,
            last_name: c.last_name,
            company: c.company,
            position: c.position,
            is_valid: false,
            created_at: nowIso,
          }))
        )
        .select("id")
        .throwOnError();

      const insertedIds = (insertedContacts ?? []).map((r) => r.id);

      // Link them to this list
      const { error: linkError } = await supabase.from("contact_list_items").insert(
        insertedIds.map((id) => ({
          contact_list_id: selectedListId,
          contact_id: id,
        }))
      );

      if (linkError) throw linkError;

      toastHandle.update({
        title: "Import Successful",
        description: `Added ${insertedIds.length} new leads. Click "Verify All" to clean the list.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import Failed";
      toastHandle.update({
        variant: "destructive",
        title: "Import Failed",
        description: message,
      });
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Contact Intelligence"
        description="Verify, organize, and segment your leads for maximum deliverability."
      >
        <div className="flex items-center gap-2">
          {selectedListId && selectedListContacts.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleBulkVerify} disabled={isVerifying}>
              {isVerifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Verify All
            </Button>
          )}

          <Button size="sm" variant="outline" asChild disabled={!selectedListId || isImporting}>
            <label htmlFor="csv-upload" className="cursor-pointer">
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import CSV
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={onFileChange}
                disabled={isImporting}
              />
            </label>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingContact(null);
              setIsContactFormOpen(true);
            }}
            disabled={!selectedListId || isImporting}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </PageHeader>

      <ContactForm
        isOpen={isContactFormOpen}
        onOpenChange={setIsContactFormOpen}
        onSave={editingContact ? handleUpdateContact : handleAddContact}
        contact={editingContact}
      />

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            {listsLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading lists...</span>
              </div>
            ) : (
              <ContactListControls
                lists={contactLists}
                selectedListId={selectedListId}
                onSelectList={setSelectedListId}
                onCreateList={handleCreateList}
                onDeleteList={handleDeleteList}
              />
            )}
          </div>

          {contactsLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedListId ? (
            <ContactsTable
              contacts={selectedListContacts}
              onEdit={(contact) => {
                setEditingContact(contact);
                setIsContactFormOpen(true);
              }}
              onDelete={handleDeleteContact}
            />
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-20 text-primary" />
              <h3 className="text-lg font-semibold">Audience Segmentation</h3>
              <p className="text-sm">Select a contact list or create one to start verified outreach.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
