import { useAuth } from "@/components/AuthProvider";

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Username</label>
          <div className="p-3 rounded-md bg-card border border-border">{user?.username}</div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <div className="p-3 rounded-md bg-card border border-border">{user?.email}</div>
        </div>
      </div>
    </div>
  );
}
