// Routes index file - all routes are now in the main server file
import { Router } from "express";
import courseApprovalRoutes from "./courseApproval.routes";

const router = Router();

router.use("/courses", courseApprovalRoutes); // Course approval endpoints
router.use("/department-orders", courseApprovalRoutes);

export default router;
