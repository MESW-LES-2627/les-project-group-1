import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import * as admin from "../controllers/admin.controller";
import * as charity from "../controllers/charitableOrganization.controller";
import {getAllListings} from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/users", admin.listUsers);
router.post("/users", admin.createUser);
router.get("/users/:id", admin.getUser);
router.patch("/users/:id", admin.updateUser);
router.delete("/users/:id", admin.deleteUser);
router.get("/clubs", admin.listClubs);
router.patch("/clubs/:id", admin.updateClubStatus);
router.get("/charitable-organizations", charity.listCharitableOrganizations);
router.post("/charitable-organizations", charity.createCharitableOrganization);
router.get("/charitable-organizations/:id", charity.getCharitableOrganization);
router.patch("/charitable-organizations/:id", charity.updateCharitableOrganization);
router.delete("/charitable-organizations/:id", charity.deleteCharitableOrganization);

router.get("/listings", admin.getAllListings);
router.patch("/listings/:id/status", admin.updateListingStatus);
router.post("/listings/:id/cancel", admin.cancelListing);

export default router;