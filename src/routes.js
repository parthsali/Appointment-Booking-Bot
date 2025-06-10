import express from "express";
import {
  createSlots,
  createSlot,
  getSlots,
  deleteSlot,
} from "./controllers/slotsController.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Bot Service API",
    status: "Running",
  });
});

router.get("/slots", getSlots);
router.post("/slot", createSlot);
router.post("/slots", createSlots);
router.delete("/slot/:slotId", deleteSlot);

export default router;
