
"use client";

import { useActionState, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/page-header";
import { extractEmailsAction } from "@/lib/actions";
import { 
  Loader2, 
  Copy, 
  Save, 
  History, 
  Trash2, 
  Send, 
  ExternalLink, 
  Download, 
  FileSpreadsheet,
  Search,
  Filter,
  Upload,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/hooks/use-global-loading";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, addDoc, deleteDoc, query, orderBy, serverTimestamp, writeBatch } from "firebase/firestore";
import type { Contact } from "@/lib/types";
import { formatDistanceToNow, isToday, isWithinInterval, subDays, subMonths } from "date-fns";

type ExtractedState = {
  contacts?: Omit<Contact, "id">[];
  error?: string;
} | null;

export default function ExtractPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [text, setText] = useState("");
  const [snapshotTitle, setSnapshotTitle] = useState("");
  const { setIsLoading } = useGlobalLoading();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const parsesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "parses"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: parses, loading: parsesLoading } = useCollection(parsesQuery);

  const [state, formAction, isPending] = useActionState<
    ExtractedState,
    FormData
  >(async (previousState, formData) => {
    const textValue = formData.get("text") as string;
    if (!textValue.trim()) {
      return { error: "Text block cannot be empty." };
    }
    
    setIsLoading(true);
    try {
      const result = await extractEmailsAction({ text: textValue });
      setIsLoading(false);
      return { contacts: result.contacts };
    } catch (e: any) {
      setIsLoading(false);
      return { error: e.message || "An unknown error occurred." };
    }
  }, null);

  const filteredSnapshots = useMemo(() => {
    if (!parses) return [];
    return parses.filter((snapshot) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (snapshot.title?.toLowerCase() || "").includes(searchLower) ||
        (snapshot.text?.toLowerCase() || "").includes(searchLower);

      if (!matchesSearch) return false;
      if (dateFilter === "all") return true;
      
      const createdAt = snapshot.createdAt?.toDate ? snapshot.createdAt.toDate() : new Date(snapshot.createdAt);
      const now = new Date();

      if (dateFilter === "today") return isToday(createdAt);
      if (dateFilter === "week") return isWithinInterval(createdAt, { start: subDays(now, 7), end: now });
      if (dateFilter === "month") return isWithinInterval(createdAt, { start: subMonths(now, 1), end: now });

      return true;
    });
  }, [parses, searchQuery, dateFilter]);

  const handleCopy = () => {
    if (state?.contacts && state.contacts.length > 0) {
      const emailList = state.contacts.map(c => c.email).join("\n");
      navigator.clipboard.writeText(emailList);
      toast({ title: "Copied!", description: `${state.contacts.length} emails copied.` });
    }
  };

  const handleExportCSV = () => {
    if (!state?.contacts || state.contacts.length === 0) return;
    const headers = "Email,First Name,Last Name,Company,Position\n";
    const rows = state.contacts.map(c => 
      `"${c.email}","${c.firstName || ""}","${c.lastName || ""}","${c.company || ""}","${c.position || ""}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extracted_contacts_${Date.now()}.csv`);
    link.click();
  };

  const handleSaveSnapshot = () => {
    if (!state?.contacts || state.contacts.length === 0 || !db || !user) return;
    
    const parseData = {
      title: snapshotTitle || `Extraction ${new Date().toLocaleString()}`,
      text: text,
      emails: state.contacts.map(c => c.email),
      contacts: state.contacts,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "users", user.uid, "parses"), parseData);
    setSnapshotTitle("");
    toast({ title: "Snapshot Saved" });
  };

  const handleLoadSnapshot = (snapshot: any) => {
    setText(snapshot.text);
    toast({ title: "Snapshot Loaded" });
  };

  const handleDeleteSnapshot = (id: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, "users", user.uid, "parses", id));
    toast({ title: "Snapshot Deleted" });
  };

  const handleCreateCampaign = async () => {
    if (!state?.contacts || state.contacts.length === 0 || !db || !user) return;

    setIsLoading(true);
    try {
      // 1. Create a new Contact List in Firestore
      const listName = `Extracted List - ${new Date().toLocaleDateString()}`;
      const batch = writeBatch(db);
      
      const newContactIds: string[] = [];
      for (const c of state.contacts) {
        const contactRef = doc(collection(db, "users", user.uid, "contacts"));
        batch.set(contactRef, {
          ...c,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isValid: true,
        });
        newContactIds.push(contactRef.id);
      }

      const listRef = doc(collection(db, "users", user.uid, "contactLists"));
      batch.set(listRef, {
        name: listName,
        userId: user.uid,
        contactIds: newContactIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();

      toast({ title: "Contact List Created", description: `"${listName}" added to library.` });
      router.push("/campaigns/new");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to initialize campaign." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileText = await file.text();
      setText(fileText);
      toast({ title: "File Loaded", description: `Ready to process ${file.name}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-8">
      <PageHeader
        title="Extract Intelligence"
        description="Paste raw data or upload files to identify unique leads."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
              <input id="file-upload" type="file" accept=".txt,.csv" className="sr-only" onChange={handleFileUpload} />
            </label>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Source Data</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={formAction}>
                <div className="grid w-full gap-4">
                  <Textarea
                    name="text"
                    placeholder="Paste email signatures, LinkedIn profiles, or mixed text here..."
                    className="min-h-[300px] resize-y"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button type="submit" disabled={isPending || !text.trim()} className="w-full">
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isPending ? "Processing with AI..." : "Intelligent Extraction"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <CardTitle>History</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search history..."
                    className="w-[180px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {parsesLoading ? (
                <div className="flex h-[150px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredSnapshots.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Snapshot Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Recipients</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSnapshots.map((snapshot: any) => (
                        <TableRow key={snapshot.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleLoadSnapshot(snapshot)}>
                          <TableCell className="font-medium truncate max-w-[200px]">{snapshot.title}</TableCell>
                          <TableCell className="hidden sm:table-cell">{snapshot.emails?.length || 0}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteSnapshot(snapshot.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground border border-dashed rounded-lg">
                  <p>No previous extractions found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Leads Found</CardTitle>
                {state?.contacts && <Badge variant="secondary">{state.contacts.length}</Badge>}
              </div>
              {state?.contacts && state.contacts.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isPending ? (
                <div className="flex h-[300px] flex-col items-center justify-center gap-4 text-center">
                  <div className="relative">
                     <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                     <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">Analyzing Context</p>
                    <p className="text-xs text-muted-foreground">Extracting names, companies, and roles...</p>
                  </div>
                </div>
              ) : state?.contacts ? (
                <>
                  <div className="h-[400px] overflow-auto rounded-md border bg-muted/30">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="text-[10px] uppercase">Identity</TableHead>
                          <TableHead className="text-[10px] uppercase">Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.contacts.map((contact, index) => (
                          <TableRow key={index} className="text-[11px]">
                            <TableCell>
                              <div className="font-bold truncate max-w-[120px]">{contact.firstName} {contact.lastName}</div>
                              <div className="text-muted-foreground truncate max-w-[120px]">{contact.email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium truncate max-w-[100px]">{contact.company}</div>
                              <div className="text-muted-foreground truncate max-w-[100px]">{contact.position}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Snapshot name..." 
                        value={snapshotTitle}
                        onChange={(e) => setSnapshotTitle(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="secondary" size="icon" onClick={handleSaveSnapshot}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button className="w-full font-bold" onClick={handleCreateCampaign}>
                      <Send className="mr-2 h-4 w-4" />
                      Start Campaign
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg opacity-40">
                  <ExternalLink className="h-8 w-8 mb-4" />
                  <p className="text-sm">Identify prospects by pasting data on the left.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
