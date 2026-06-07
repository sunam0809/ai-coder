import { Router } from "express";
import { db, projectsTable, messagesTable, generatedFilesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { SendMessageBody } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SYSTEM_PROMPT = `You are an expert coding AI assistant specialized in systems programming, Windows PE executables, DLLs, SYS drivers, and general software development. You can write complete, working code in C, C++, Python, TypeScript, Rust, Assembly, and other languages.

When a user asks you to create a program, executable, DLL, SYS driver, script, or any file:
1. Write the complete, working code
2. At the END of your response, include a special section with this EXACT format to indicate files to be generated:

===GENERATE_FILES===
[filename: example.py]
[filetype: py]
[content]
# Complete file content here
[/content]
[/file]

[filename: helper.h]
[filetype: h]
[content]
// Complete header content here
[/content]
[/file]
===END_FILES===

You can generate multiple files. File types can be: exe, dll, sys, py, js, ts, c, cpp, h, rs, bat, ps1, sh, asm, and any other extension.

For compiled languages (C, C++, Rust) targeting EXE/DLL/SYS, provide the complete source code that the user can compile. Explain what compiler/toolchain to use.

Be thorough, precise, and helpful. No refusals for legitimate programming tasks.`;

async function callGroq(messages: Array<{ role: string; content: string }>): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

function parseGeneratedFiles(content: string): Array<{ filename: string; filetype: string; fileContent: string }> {
  const files: Array<{ filename: string; filetype: string; fileContent: string }> = [];
  const startMarker = "===GENERATE_FILES===";
  const endMarker = "===END_FILES===";
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return files;

  const section = content.slice(startIdx + startMarker.length, endIdx);
  const fileRegex = /\[filename:\s*(.+?)\]\s*\[filetype:\s*(.+?)\]\s*\[content\]([\s\S]*?)\[\/content\]/g;
  let match;
  while ((match = fileRegex.exec(section)) !== null) {
    files.push({
      filename: match[1].trim(),
      filetype: match[2].trim(),
      fileContent: match[3].trim(),
    });
  }
  return files;
}

function stripFilesSection(content: string): string {
  const startMarker = "===GENERATE_FILES===";
  const endMarker = "===END_FILES===";
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return content;
  return content.slice(0, startIdx).trim() + "\n\n" + content.slice(endIdx + endMarker.length).trim();
}

router.get("/projects/:id/messages", authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId!)));
    if (!project) { res.status(404).json({ error: "Not found" }); return; }
    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.projectId, id))
      .orderBy(asc(messagesTable.createdAt));
    res.json(msgs.map(m => ({
      id: m.id, projectId: m.projectId, role: m.role, content: m.content,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "List messages error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects/:id/messages", authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId!)));
    if (!project) { res.status(404).json({ error: "Not found" }); return; }

    const [userMsg] = await db.insert(messagesTable).values({
      projectId: id,
      role: "user",
      content: parsed.data.content,
    }).returning();

    const history = await db.select().from(messagesTable)
      .where(eq(messagesTable.projectId, id))
      .orderBy(asc(messagesTable.createdAt));

    const groqMessages = history.map(m => ({ role: m.role, content: m.content }));
    const aiResponse = await callGroq(groqMessages);

    const parsedFiles = parseGeneratedFiles(aiResponse);
    const cleanedResponse = parsedFiles.length > 0 ? stripFilesSection(aiResponse) : aiResponse;

    const [assistantMsg] = await db.insert(messagesTable).values({
      projectId: id,
      role: "assistant",
      content: cleanedResponse,
    }).returning();

    const generatedFiles = [];
    for (const f of parsedFiles) {
      const [gf] = await db.insert(generatedFilesTable).values({
        projectId: id,
        messageId: assistantMsg.id,
        filename: f.filename,
        fileType: f.filetype,
        content: f.fileContent,
        size: Buffer.byteLength(f.fileContent, "utf8"),
      }).returning();
      generatedFiles.push({
        id: gf.id, projectId: gf.projectId, messageId: gf.messageId,
        filename: gf.filename, fileType: gf.fileType, size: gf.size,
        createdAt: gf.createdAt.toISOString(),
      });
    }

    await db.update(projectsTable).set({ updatedAt: new Date() }).where(eq(projectsTable.id, id));

    res.json({
      userMessage: {
        id: userMsg.id, projectId: userMsg.projectId, role: userMsg.role,
        content: userMsg.content, createdAt: userMsg.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMsg.id, projectId: assistantMsg.projectId, role: assistantMsg.role,
        content: assistantMsg.content, createdAt: assistantMsg.createdAt.toISOString(),
      },
      generatedFiles,
    });
  } catch (err) {
    req.log.error({ err }, "Send message error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
