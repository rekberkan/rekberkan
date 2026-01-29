import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "rating" });
});

router.post("/", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: POST /api/v1/ratings" });
});

router.get("/user/:userId", async (req: Request, res: Response) => {
  res
    .status(501)
    .json({ message: "Use NestJS endpoint: GET /api/v1/ratings/user/:userId" });
});

export default router;
