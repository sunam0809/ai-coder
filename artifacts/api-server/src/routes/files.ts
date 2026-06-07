import { Router } from "express";
import { db, projectsTable, generatedFilesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/projects/:id/files", authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId!)));
    if (!project) { res.status(404).json({ error: "Not found" }); return; }
    const files = await db.select().from(generatedFilesTable)
      .where(eq(generatedFilesTable.projectId, id))
      .orderBy(desc(generatedFilesTable.createdAt));
    res.json(files.map(f => ({
      id: f.id, projectId: f.projectId, messageId: f.messageId,
      filename: f.filename, fileType: f.fileType, size: f.size,
      createdAt: f.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "List files error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/files/:fileId/download", authMiddleware, async (req: AuthRequest, res) => {
  const fileId = parseInt(req.params["fileId"] as string);
  if (isNaN(fileId)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [file] = await db.select().from(generatedFilesTable)
      .where(eq(generatedFilesTable.id, fileId));
    if (!file) { res.status(404).json({ error: "Not found" }); return; }

    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, file.projectId), eq(projectsTable.userId, req.userId!)));
    if (!project) { res.status(403).json({ error: "Forbidden" }); return; }

    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(Buffer.from(file.content, "utf8"));
  } catch (err) {
    req.log.error({ err }, "Download file error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
