import { useListProjects, useGetStats } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderKanban, MessageSquare, FileCode2 } from "lucide-react";
import { format } from "date-fns";

export function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: projects, isLoading } = useListProjects();
  const { data: stats } = useGetStats();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back to AI Coder.</p>
        </div>
        <Button onClick={() => setLocation("/projects")} className="gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            <FolderKanban className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.projectCount || projects?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages Sent</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.messageCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Files Generated</CardTitle>
            <FileCode2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.fileCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
          <Button variant="link" onClick={() => setLocation("/projects")}>View all</Button>
        </div>
        
        {isLoading ? (
          <div className="text-muted-foreground">Loading projects...</div>
        ) : projects?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">Create your first project to start generating code.</p>
              <Button onClick={() => setLocation("/projects")}>Start your first project</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects?.slice(0, 6).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{project.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {project.messageCount}</span>
                        <span className="flex items-center gap-1"><FileCode2 className="w-3 h-3" /> {project.fileCount}</span>
                      </div>
                      <span>{format(new Date(project.updatedAt), "MMM d, yyyy")}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
