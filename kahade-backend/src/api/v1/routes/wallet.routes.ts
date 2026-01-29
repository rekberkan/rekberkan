import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "wallet" });
});

// Get wallet balance
router.get("/balance", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/wallet/balance" });
});

// Get wallet transactions
router.get("/transactions", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/wallet/transactions" });
});

// Get wallet summary
router.get("/summary", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/wallet/summary" });
});

export default router;
