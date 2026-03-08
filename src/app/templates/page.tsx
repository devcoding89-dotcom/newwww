
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, FileText, Trash2, Edit, Copy } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, deleteDoc, addDoc } from "firebase/firestore";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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

export default function TemplatesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const templatesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "templates"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: templates, loading } = useCollection<any>(templatesQuery);

  const handleDelete = async (id: string) => {
    if (!db || !user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "templates", id));
      toast({ title: "Template Deleted" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete template." });
    }
  };

  const handleDuplicate = async (template: any) => {
    if (!db || !user) return;
    const { id, ...data } = template;
    try {
      await addDoc(collection(db, "users", user.uid, "templates"), {
        ...data,
        name: `${data.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "Template Duplicated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not duplicate template." });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Email Templates"
        description="Craft reusable content strategies for high-volume outreach."
      >
        <Button asChild size="sm">
          <Link href="/templates/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.category || "General Outreach"}</CardDescription>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground opacity-20" />
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm font-medium line-clamp-1 mb-1">
                  <strong>Sub:</strong> {template.subject}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-3 italic">
                  "{template.body.replace(/<[^>]*>?/gm, '').substring(0, 150)}..."
                </p>
              </CardContent>
              <CardFooter className="grid grid-cols-3 gap-2 border-t pt-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/templates/${template.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Clone
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove this template from your library.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(template.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center bg-card">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold">No Templates Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            Build reusable content blocks with personalization tags to accelerate your campaign workflow.
          </p>
          <Button asChild className="mt-6">
            <Link href="/templates/new">Create First Template</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
