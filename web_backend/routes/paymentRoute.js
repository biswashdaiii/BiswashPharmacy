import express from "express";
import { initiateEsewaPayment, verifyEsewaPayment } from "../controllers/paymentController.js";
import { authUser } from "../middleware/authUser.js";

const paymentRouter = express.Router();

paymentRouter.post("/esewa-initiate", authUser, initiateEsewaPayment);
paymentRouter.post("/verify-esewa", verifyEsewaPayment);

export default paymentRouter;
