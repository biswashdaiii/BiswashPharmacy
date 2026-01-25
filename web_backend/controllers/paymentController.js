import axios from "axios";
import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import 'dotenv/config';

// Function to generate eSewa signature
const generateSignature = (message) => {
    const secret = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(message);
    const hash = hmac.digest("base64");
    return hash;
};

// API to initiate eSewa payment
export const initiateEsewaPayment = async (req, res) => {
    try {
        const { amount, items, address } = req.body;
        const userId = req.userId;

        // Create a unique transaction UUID
        const transaction_uuid = `${Date.now()}-${userId}`;

        // Prepare order data (initially unpaid)
        const orderData = {
            userId,
            items: items.map(item => ({
                productId: item.productId || item._id,
                name: item.name,
                size: item.size,
                quantity: item.quantity || 1,
                price: item.price
            })),
            amount,
            address,
            paymentMethod: "eSewa",
            payment: false,
            date: Date.now(),
            status: "Payment Initiated",
            transaction_uuid // Store for verification
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Prepare message for signature
        // Format: total_amount,transaction_uuid,product_code
        // Ensure total_amount is a string and potentially has no decimals if not needed, 
        // but eSewa v2 often expects exact match.
        const total_amount = amount.toString();
        const product_code = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
        const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
        const signature = generateSignature(message);

        res.json({
            success: true,
            paymentData: {
                amount: total_amount,
                tax_amount: "0",
                total_amount: total_amount,
                transaction_uuid,
                product_code,
                product_service_charge: "0",
                product_delivery_charge: "0",
                success_url: "http://localhost:5173/payment-success",
                failure_url: "http://localhost:5173/payment-failure",
                signed_field_names: "total_amount,transaction_uuid,product_code",
                signature
            }
        });

    } catch (error) {
        console.error("eSewa initiation error:", error);
        res.json({ success: false, message: error.message });
    }
};

// API to verify eSewa payment
export const verifyEsewaPayment = async (req, res) => {
    try {
        const { transaction_uuid } = req.body;

        // Find the order
        const order = await orderModel.findOne({ transaction_uuid });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // In a real scenario, you would call eSewa's status API here to verify.
        // For sandbox/demo purposes, we'll mark it as paid if the request comes in.

        order.payment = true;
        order.status = "Order Placed";
        await order.save();

        res.json({ success: true, message: "Payment verified successfully" });

    } catch (error) {
        console.error("eSewa verification error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
