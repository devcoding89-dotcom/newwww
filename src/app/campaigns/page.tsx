
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { CampaignCard } from "./components/campaign-card";
import type { Campaign } from "@/lib/types";

export default function CampaignsPage() {
  const { user } = useUser();
  const db = useFirestore();

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "campaigns"), 
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: campaigns, loading } = useCollection<Campaign>(campaignsQuery);

  const handleDelete = (id: string) => {
    if (!db || !user) return;
    const docRef = doc(db, "users", user.uid, "campaigns", id);
    
    deleteDoc(docRef).catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: "delete",
      });
      errorEmitter.emit("permission-error", permissionError);
    });
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Campaigns"
        description="Manage your professional email outreach campaigns."
      >
        <Button asChild size="sm">
          <Link href="/campaigns/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-8 text-center">
          <h3 className="text-xl font-semibold tracking-tight">
            No Campaigns Yet
          </h3>
          <p className="text-muted-foreground">
            Get started by creating a new high-performance campaign.
          </p>
          <Button asChild className="mt-4">
            <Link href="/campaigns/new">Create Campaign</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
