import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "withdrawal" });
});

// Create withdrawal request
router.post("/", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: POST /api/v1/withdrawals" });
});

// Get withdrawal history
router.get("/", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/withdrawals" });
});

// Get withdrawal by ID
router.get("/:id", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/withdrawals/:id" });
});

// Cancel withdrawal
router.post("/:id/cancel", async (req: Request, res: Response) => {
  res.status(501).json({
    message: "Use NestJS endpoint: POST /api/v1/withdrawals/:id/cancel",
  });
});

export default router;
