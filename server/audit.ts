import type { Request } from "express";
import type { AuthRequest } from "./auth";
import { prisma } from "./prisma";

export async function audit(req: Request, action: string, entity: string, entityId: string, metadata?: unknown) {
  const authReq = req as AuthRequest;
  await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      userId: authReq.user?.id,
      ipAddress: req.ip,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    }
  });
}
