import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

export type SessionUser = {
  id: string;
  email: string;
  roles: string[];
};

export type AuthRequest = Request & {
  user?: SessionUser;
};

const rolePermissions: Record<string, string[]> = {
  Admin: ["*"],
  "Procurement Head": ["dashboard", "vendors", "requirements", "prs", "rfqs", "qcs", "pos", "contracts", "catalogue", "reports", "grn:read", "asn:read", "invoice:read", "payment:read", "matching:read", "materials", "manufacturers", "supply-network", "data-connectors"],
  "Procurement Manager": ["dashboard", "vendors", "requirements", "prs", "rfqs", "qcs", "pos", "contracts", "catalogue", "reports", "grn:read", "asn:read", "invoice:read", "payment:read", "matching:read", "materials", "manufacturers", "supply-network", "data-connectors"],
  Buyer: ["dashboard", "vendors:read", "requirements", "prs", "rfqs", "catalogue", "reports", "pos:read", "contracts:read", "materials:read", "manufacturers:read", "supply-network:read"],
  Vendor: ["dashboard", "requirements:read", "rfqs:read", "pos:read", "contracts:read", "catalogue:read", "asn", "invoice:read", "payment:read", "materials:read", "manufacturers:read", "supply-network:read"],
  "Finance Approver": ["dashboard", "pos:read", "reports", "qcs:read", "invoice", "payment", "matching:read"],
  "Legal Approver": ["dashboard", "contracts", "reports:read"],
  "QCS Approver": ["dashboard", "qcs", "requirements:read", "rfqs:read", "reports"],
  "Warehouse User": ["dashboard", "pos:read", "grn", "asn", "invoice:read", "matching:read"],
  Viewer: ["dashboard", "vendors:read", "requirements:read", "prs:read", "rfqs:read", "pos:read", "contracts:read", "catalogue:read", "reports:read", "grn:read", "asn:read", "invoice:read", "payment:read", "matching:read", "materials:read", "manufacturers:read", "supply-network:read", "data-connectors:read"]
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32 || /^(?:replace|change)[-_ ]/i.test(secret.trim())) {
    throw new Error("Set JWT_SECRET to a unique random value of at least 32 characters.");
  }
  return secret;
}

function canUseAccount(user: Pick<SessionUser, "email">) {
  return process.env.VYNQ_ALLOW_DEMO_ACCOUNTS === "true" || !user.email.toLowerCase().endsWith("@demo.com");
}

export function signToken(user: SessionUser) {
  if (!canUseAccount(user)) throw Object.assign(new Error("Demo accounts are disabled"), { status: 403 });
  return jwt.sign(user, getJwtSecret(), { algorithm: "HS256", expiresIn: "8h" });
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as SessionUser;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { roles: { include: { role: true } } }
    });
    if (!user?.isActive || !canUseAccount(user)) return res.status(401).json({ message: "User is inactive" });
    req.user = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((entry) => entry.role.name)
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const roles = req.user?.roles || [];
    const allowed = roles.some((role) => {
      const permissions = rolePermissions[role] || [];
      return permissions.includes("*") || permissions.includes(permission) || permissions.includes(permission.split(":")[0]);
    });
    if (!allowed) return res.status(403).json({ message: "You do not have permission for this action" });
    next();
  };
}

export function permissionsForRoles(roles: string[]) {
  return Array.from(
    new Set(
      roles.flatMap((role) => rolePermissions[role] || [])
    )
  );
}
