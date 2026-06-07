import { Router } from "express";
import { db, projectsTable, messagesTable, generatedFilesTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { CreateProjectBody, UpdateProjectBody } from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/projects/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, req.userId!));
    const projectIds = projects.map(p => p.id);
    let messageCount = 0;
    let fileCount = 0;
    if (projectIds.length > 0) {
      const msgCounts = await db.select({ count: count() }).from(messagesTable).where(
        eq(messagesTable.projectId, projectIds[0])
      );
      // count across all projects
      for (const pid of projectIds) {
        const [mc] = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.projectId, pid));
        const [fc] = await db.select({ count: count() }).from(generatedFilesTable).where(eq(generatedFilesTable.projectId, pid));
        messageCount += Number(mc.count);
        fileCount += Number(fc.count);
      }
    }
    res.json({ projectCount: projects.length, messageCount, fileCount });
  } catch (err) {
    req.log.error({ err }, "Get stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const projects = await db.select().from(projectsTable)
      .where(eq(projectsTable.userId, req.userId!))
      .orderBy(desc(projectsTable.updatedAt));

    const result = await Promise.all(projects.map(async (p) => {
      const [mc] = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.projectId, p.id));
      const [fc] = await db.select({ count: count() }).from(generatedFilesTable).where(eq(generatedFilesTable.projectId, p.id));
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        userId: p.userId,
        messageCount: Number(mc.count),
        fileCount: Number(fc.count),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "List projects error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const [project] = await db.insert(projectsTable).values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      userId: req.userId!,
    }).returning();
    res.status(201).json({
      id: project.id,
      name: project.name,
      description: project.description,
      userId: project.userId,
      messageCount: 0,
      fileCount: 0,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create project error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/:id", authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId!)));
    if (!project) { res.status(404).json({ error: "Not found" }); return; }
    const [mc] = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.projectId, id));
    const [fc] = await db.select({ count: count() }).from(generatedFilesTable).where(eq(generatedFilesTable.projectId, id));
    res.json({
      id: project.id, name: project.name, description: project.description,
      userId: project.userId, messageCount: Number(mc.count), fileCount: Number(fc.count),
      createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get project error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/projects/:id", authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  try {
    const [existing] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId!)));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const [project] = await db.update(projectsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(projectsTable.id, id)).returning();
    const [mc] = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.projectId, id));
    const [fc] = await db.select({ count: count() }).from(generatedFilesTable).where(eq(generatedFilesTable.projectId, id));
    res.json({
      id: project.id, name: project.name, description: project.description,
      userId: project.userId, messageCount: Number(mc.count), fileCount: Number(fc.count),
      createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update project error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/projects/:id", authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [existing] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId!)));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Delete project error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
