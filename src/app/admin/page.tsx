
"use client";

import { useEffect } from "react";
import { useCollection, useDoc, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Activity, 
  ShieldCheck, 
  UserPlus, 
  Loader2, 
  Mail, 
  AlertCircle 
} from "lucide-react";
import PageHeader from "@/components/page-header";
import { useRouter } from "next/navigation";

export default function AdminPanelPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), orderBy("email"));
  }, [db]);

  const { data: allUsers, loading: usersLoading } = useCollection(usersQuery);

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user || (profile && !profile.isAdmin)) {
        router.push("/");
      }
    }
  }, [user, profile, authLoading, profileLoading, router]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (profile && !profile.isAdmin)) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Admin Control Center"
        description="Global system management and user oversight."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">All services operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">AI processing threads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No recent threats</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>View and manage all registered user profiles.</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex py-8 justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">UID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.displayName || "N/A"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          {u.isAdmin ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 flex items-center gap-1 w-fit border-amber-200">
                              <ShieldCheck className="h-3 w-3" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-muted-foreground">
                          {u.id.substring(0, 8)}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>System Activity</CardTitle>
            </div>
            <CardDescription>Mock global activity feed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">New user registered</p>
                <p className="text-xs text-muted-foreground">Just now • user_...432</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Campaign dispatched</p>
                <p className="text-xs text-muted-foreground">12 mins ago • Q4 Outreach</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium">AI Extraction high load</p>
                <p className="text-xs text-muted-foreground">1 hour ago • 500+ emails</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
