
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Upload, Loader2, FileCheck, ShieldCheck, Trash2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import type { Contact } from "@/lib/types";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, addDoc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";

import { ContactListControls } from "./components/contact-list-controls";
import { ContactsTable } from "./components/contacts-table";
import { ContactForm } from "./components/contact-form";
import { useToast } from "@/hooks/use-toast";
import { validateEmailAction } from "@/lib/actions";

export default function ContactsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const listsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "contactLists"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: contactLists, isLoading: listsLoading } = useCollection<any>(listsQuery);

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user || !selectedListId) return null;
    return query(
      collection(db, "users", user.uid, "contacts"),
      orderBy("createdAt", "desc")
    );
  }, [db, user, selectedListId]);

  const { data: allContacts, isLoading: contactsLoading } = useCollection<Contact>(contactsQuery);

  // Filter contacts by list ID
  const selectedListContacts = useMemo(() => {
    if (!selectedListId || !allContacts) return [];
    const list = contactLists?.find(l => l.id === selectedListId);
    if (!list) return [];
    return allContacts.filter(c => list.contactIds?.includes(c.id));
  }, [allContacts, selectedListId, contactLists]);

  const handleCreateList = async (name: string) => {
    if (!db || !user) return;
    const listData = {
      userId: user.uid,
      name,
      contactIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const docRef = await addDoc(collection(db, "users", user.uid, "contactLists"), listData);
      setSelectedListId(docRef.id);
      toast({ title: "List Created", description: `"${name}" is ready.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create list." });
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!db || !user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "contactLists", id));
      setSelectedListId(null);
      toast({ title: "List Deleted" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete list." });
    }
  };
  
  const handleAddContact = async (contact: Omit<Contact, "id">) => {
    if (!db || !user || !selectedListId) return;
    
    const contactData = {
      ...contact,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const contactRef = await addDoc(collection(db, "users", user.uid, "contacts"), contactData);
      const listRef = doc(db, "users", user.uid, "contactLists", selectedListId);
      const list = contactLists?.find(l => l.id === selectedListId);
      if (list) {
        await updateDoc(listRef, {
          contactIds: [...(list.contactIds || []), contactRef.id],
          updatedAt: new Date().toISOString(),
        });
      }
      setIsContactFormOpen(false);
      toast({ title: "Contact Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add contact." });
    }
  };

  const handleUpdateContact = async (updatedContact: Contact) => {
    if (!db || !user) return;
    const { id, ...data } = updatedContact;
    try {
      await updateDoc(doc(db, "users", user.uid, "contacts", id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setEditingContact(null);
      setIsContactFormOpen(false);
      toast({ title: "Contact Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update contact." });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!db || !user || !selectedListId) return;
    try {
      const listRef = doc(db, "users", user.uid, "contactLists", selectedListId);
      const list = contactLists?.find(l => l.id === selectedListId);
      if (list) {
        await updateDoc(listRef, {
          contactIds: list.contactIds.filter((id: string) => id !== contactId),
          updatedAt: new Date().toISOString(),
        });
      }
      toast({ title: "Contact Removed from List" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove contact." });
    }
  };

  const handleBulkVerify = async () => {
    if (!db || !user || selectedListContacts.length === 0) return;
    setIsVerifying(true);
    const { id: toastId } = toast({ title: "Verifying List", description: "Checking MX records..." });

    try {
      const batch = writeBatch(db);
      let count = 0;
      
      for (const contact of selectedListContacts) {
        if (contact.isValid) continue;
        const validation = await validateEmailAction(contact.email);
        if (validation.isValid) {
          const contactRef = doc(db, "users", user.uid, "contacts", contact.id);
          batch.update(contactRef, { isValid: true, updatedAt: new Date().toISOString() });
          count++;
        }
      }

      await batch.commit();
      toast({ id: toastId, title: "Verification Complete", description: `Successfully verified ${count} contacts.` });
    } catch (e) {
      toast({ id: toastId, variant: "destructive", title: "Verification Failed" });
    } finally {
      setIsVerifying(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!db || !user || !selectedListId) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsImporting(true);
      const { id: toastId } = toast({
        title: "Importing...",
        description: "Mapping headers and validating data...",
      });

      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) throw new Error("File is empty or missing headers.");

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const emailIdx = headers.findIndex(h => h.includes('email'));
        if (emailIdx === -1) throw new Error("No 'email' column found in headers.");

        const fnIdx = headers.findIndex(h => h.includes('first') || h === 'name');
        const lnIdx = headers.findIndex(h => h.includes('last'));
        const coIdx = headers.findIndex(h => h.includes('company') || h.includes('org'));
        const posIdx = headers.findIndex(h => h.includes('position') || h.includes('title') || h.includes('role'));

        const clean = (val?: string) => val?.trim().replace(/^"|"$/g, '') || '';

        const batch = writeBatch(db);
        const newContactIds: string[] = [];
        const existingEmails = new Set(selectedListContacts.map(c => c.email.toLowerCase()));

        for (const line of lines.slice(1)) {
          const values = line.split(',').map(v => v.trim());
          const email = clean(values[emailIdx]).toLowerCase();
          
          if (!email || !email.includes('@') || existingEmails.has(email)) continue;

          const contactRef = doc(collection(db, "users", user.uid, "contacts"));
          const contactData = {
            email,
            firstName: fnIdx !== -1 ? clean(values[fnIdx]) : "",
            lastName: lnIdx !== -1 ? clean(values[lnIdx]) : "",
            company: coIdx !== -1 ? clean(values[coIdx]) : "",
            position: posIdx !== -1 ? clean(values[posIdx]) : "",
            isValid: true, // Auto-mark valid for clean imports, usually verified on dispatch
            userId: user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          batch.set(contactRef, contactData);
          newContactIds.push(contactRef.id);
          existingEmails.add(email);

          if (newContactIds.length >= 450) break; 
        }

        if (newContactIds.length === 0) {
          toast({ id: toastId, variant: "destructive", title: "No New Contacts", description: "All contacts in file are already in this list." });
        } else {
          await batch.commit();
          const listRef = doc(db, "users", user.uid, "contactLists", selectedListId);
          const list = contactLists?.find(l => l.id === selectedListId);
          if (list) {
            await updateDoc(listRef, {
              contactIds: [...(list.contactIds || []), ...newContactIds],
              updatedAt: new Date().toISOString(),
            });
          }
          toast({ id: toastId, title: "Import Successful", description: `Added ${newContactIds.length} new contacts.` });
        }
      } catch (error: any) {
        toast({ id: toastId, variant: "destructive", title: "Import Failed", description: error.message });
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
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
              {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Verify All
            </Button>
          )}
           <Button size="sm" variant="outline" asChild disabled={!selectedListId || isImporting}>
             <label htmlFor="csv-upload" className="cursor-pointer">
               {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
               Import CSV
               <input id="csv-upload" type="file" accept=".csv" className="sr-only" onChange={onFileChange} disabled={isImporting} />
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
                lists={contactLists || []}
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
