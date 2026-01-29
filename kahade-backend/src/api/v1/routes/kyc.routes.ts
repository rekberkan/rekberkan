import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "kyc" });
});

router.get("/status", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/kyc/status" });
});

router.post("/submit", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: POST /api/v1/kyc/submit" });
});

router.post("/upload-document", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: POST /api/v1/kyc/upload-document" });
});

export default router;
