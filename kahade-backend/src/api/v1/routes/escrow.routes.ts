import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "escrow" });
});

// Get escrows
router.get("/", async (req: Request, res: Response) => {
  res.status(501).json({ message: "Use NestJS endpoint: GET /api/v1/escrow" });
});

// Get escrow by ID
router.get("/:id", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/escrow/:id" });
});

// Release escrow
router.post("/:id/release", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: POST /api/v1/escrow/:id/release" });
});

// Refund escrow
router.post("/:id/refund", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: POST /api/v1/escrow/:id/refund" });
});

export default router;
