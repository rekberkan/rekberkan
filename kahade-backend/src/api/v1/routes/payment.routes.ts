import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "payment" });
});

// Create payment
router.post("/", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: POST /api/v1/payments" });
});

// Get payments
router.get("/", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/payments" });
});

// Get payment by ID
router.get("/:id", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/payments/:id" });
});

// Get available payment methods
router.get("/methods/available", async (req: Request, res: Response) => {
  res.status(501).json({
    message: "Use NestJS endpoint: GET /api/v1/payments/methods/available",
  });
});

export default router;
