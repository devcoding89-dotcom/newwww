
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Upload, Loader2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import type { ContactList, Contact } from "@/lib/types";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, query, orderBy, doc, addDoc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

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

  const listsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "contactLists"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: contactLists, isLoading: listsLoading } = useCollection<any>(listsQuery);

  const contactsQuery = useMemo(() => {
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
      // Remove from list associations first
      const listRef = doc(db, "users", user.uid, "contactLists", selectedListId);
      const list = contactLists?.find(l => l.id === selectedListId);
      if (list) {
        await updateDoc(listRef, {
          contactIds: list.contactIds.filter((id: string) => id !== contactId),
          updatedAt: new Date().toISOString(),
        });
      }
      // Note: We keep the contact document in the master collection unless explicitly removed globally
      toast({ title: "Contact Removed from List" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove contact." });
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!db || !user || !selectedListId) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const { id: toastId } = toast({
        title: "Importing...",
        description: "Validating contacts...",
      });

      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) throw new Error("File is empty.");

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const emailIdx = headers.indexOf('email');
        if (emailIdx === -1) throw new Error("No 'email' column found.");

        const batch = writeBatch(db);
        const newContactIds: string[] = [];

        for (const line of lines.slice(1)) {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const email = values[emailIdx];
          if (!email) continue;

          const contactRef = doc(collection(db, "users", user.uid, "contacts"));
          batch.set(contactRef, {
            email,
            firstName: values[headers.indexOf('firstname')] || values[headers.indexOf('first name')] || '',
            lastName: values[headers.indexOf('lastname')] || values[headers.indexOf('last name')] || '',
            company: values[headers.indexOf('company')] || '',
            position: values[headers.indexOf('position')] || '',
            isValid: true,
            userId: user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          newContactIds.push(contactRef.id);
        }

        await batch.commit();
        
        const listRef = doc(db, "users", user.uid, "contactLists", selectedListId);
        const list = contactLists?.find(l => l.id === selectedListId);
        if (list) {
          await updateDoc(listRef, {
            contactIds: [...(list.contactIds || []), ...newContactIds],
            updatedAt: new Date().toISOString(),
          });
        }

        toast({ id: toastId, title: "Import Complete", description: `Added ${newContactIds.length} contacts.` });
      } catch (error: any) {
        toast({ id: toastId, variant: "destructive", title: "Import Failed", description: error.message });
      }
      e.target.value = "";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Contact Intelligence"
        description="Organize your recipients into high-performance segments."
      >
        <div className="flex items-center gap-2">
           <Button size="sm" variant="outline" asChild disabled={!selectedListId}>
             <label htmlFor="csv-upload" className="cursor-pointer">
               <Upload className="mr-2 h-4 w-4" />
               Import CSV
               <input id="csv-upload" type="file" accept=".csv" className="sr-only" onChange={onFileChange} />
             </label>
           </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingContact(null);
              setIsContactFormOpen(true);
            }}
            disabled={!selectedListId}
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
              <PlusCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold">No List Selected</h3>
              <p className="text-sm">Select an existing list or create a new one to manage contacts.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
