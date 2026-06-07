import { useGetProject, useListMessages, useSendMessage, useListFiles, getListMessagesQueryKey, getListFilesQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Download, FileCode2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

function FileIcon({ type }: { type: string }) {
  const ext = type.toLowerCase();
  if (ext === 'exe') return <span className="text-red-500 font-mono text-[10px] font-bold border border-red-500/30 bg-red-500/10 px-1 rounded">EXE</span>;
  if (ext === 'dll') return <span className="text-orange-500 font-mono text-[10px] font-bold border border-orange-500/30 bg-orange-500/10 px-1 rounded">DLL</span>;
  if (ext === 'sys') return <span className="text-purple-500 font-mono text-[10px] font-bold border border-purple-500/30 bg-purple-500/10 px-1 rounded">SYS</span>;
  if (ext === 'py') return <span className="text-blue-500 font-mono text-[10px] font-bold border border-blue-500/30 bg-blue-500/10 px-1 rounded">PY</span>;
  return <FileCode2 className="w-4 h-4 text-muted-foreground" />;
}

export function ProjectDetail() {
  const params = useParams();
  const projectId = parseInt(params.id || "0", 10);
  
  const { data: project } = useGetProject(projectId, { query: { enabled: !!projectId } });
  const { data: messages } = useListMessages(projectId, { query: { enabled: !!projectId } });
  const { data: files } = useListFiles(projectId, { query: { enabled: !!projectId } });
  
  const [input, setInput] = useState("");
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const content = input;
    setInput("");
    
    sendMessage.mutate({ data: { content } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(projectId) });
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!project) return null;

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        <div className="p-4 border-b border-border bg-card">
          <h1 className="text-xl font-bold truncate">{project.name}</h1>
          <p className="text-sm text-muted-foreground truncate">{project.description}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages?.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 shrink-0 rounded bg-primary/20 flex items-center justify-center border border-primary/30 mt-1">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              
              <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <span className="font-medium">{msg.role === 'user' ? 'You' : 'AI Coder'}</span>
                  <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
                </div>
                <div className={`p-4 rounded-xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border rounded-tl-sm'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="bg-[#0d1117] p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border/50">
                        <code>{msg.content}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 shrink-0 rounded bg-secondary flex items-center justify-center border border-border mt-1">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {sendMessage.isPending && (
            <div className="flex gap-4 max-w-4xl mx-auto">
               <div className="w-8 h-8 shrink-0 rounded bg-primary/20 flex items-center justify-center border border-primary/30 mt-1">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center">
                  <div className="animate-pulse flex space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animation-delay-200"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animation-delay-400"></div>
                  </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-card border-t border-border">
          <div className="max-w-4xl mx-auto relative flex items-end gap-2">
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI to build something... (Shift+Enter for newline)"
              className="min-h-[60px] max-h-48 resize-none bg-background pr-12 text-sm py-4"
            />
            <Button 
              size="icon" 
              className="absolute right-2 bottom-2 h-8 w-8"
              onClick={handleSend}
              disabled={sendMessage.isPending || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="w-80 shrink-0 bg-card flex flex-col">
        <div className="p-4 border-b border-border font-medium">Generated Files</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {files?.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No files generated yet.
            </div>
          ) : (
            files?.map(file => (
              <div key={file.id} className="p-3 rounded-lg border border-border bg-background flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <FileIcon type={file.fileType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.filename}>{file.filename}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <a 
                  href={`/api/files/${file.id}/download`} 
                  download 
                  className="w-full"
                >
                  <Button variant="secondary" size="sm" className="w-full gap-2 text-xs h-7">
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
