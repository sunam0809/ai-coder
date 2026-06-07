import { useListProjects, useCreateProject } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderKanban, MessageSquare, FileCode2, Search } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListProjectsQueryKey } from "@workspace/api-client-react";

export function Projects() {
  const [, setLocation] = useLocation();
  const { data: projects, isLoading } = useListProjects();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  const queryClient = useQueryClient();
  const createProject = useCreateProject();

  const filteredProjects = projects?.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    createProject.mutate({ data: { name, description } }, {
      onSuccess: (project) => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setLocation(`/projects/${project.id}`);
      }
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your workspaces.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Memory Analyzer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createProject.isPending || !name.trim()}>
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          className="pl-9 bg-card" 
          placeholder="Search projects..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading projects...</div>
      ) : filteredProjects?.length === 0 ? (
        <Card className="border-dashed flex-1">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground max-w-sm">Try adjusting your search or create a new project.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects?.map((project) => (
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
  );
}
