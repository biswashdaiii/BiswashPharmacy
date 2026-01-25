import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { logger, logSecurity } from "../config/logger.js";

// Placing orders using COD Method
const placeOrder = async (req, res) => {
    try {
        const { userId, items, address } = req.body;
        // Note: We intentionally DO NOT use client-submitted 'amount'

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "No items in order" });
        }

        // SERVER-SIDE PRICE RECALCULATION - prevent price tampering
        let calculatedAmount = 0;
        const verifiedItems = [];

        for (const item of items) {
            const product = await productModel.findById(item._id || item.productId);

            if (!product) {
                logSecurity('ORDER_INVALID_PRODUCT', {
                    userId,
                    invalidProductId: item._id || item.productId,
                    ip: req.ip
                });
                return res.status(400).json({
                    success: false,
                    message: `Product not found: ${item._id || item.productId}`
                });
            }

            const quantity = parseInt(item.quantity) || 1;
            const itemTotal = product.price * quantity;
            calculatedAmount += itemTotal;

            verifiedItems.push({
                productId: product._id,
                name: product.name,
                price: product.price, // Use DB price, not client price
                quantity: quantity,
                size: item.size || null
            });
        }

        // Log if client-submitted amount differs significantly (potential tampering attempt)
        if (req.body.amount && Math.abs(req.body.amount - calculatedAmount) > 1) {
            logSecurity('ORDER_PRICE_TAMPERING_ATTEMPT', {
                userId,
                clientAmount: req.body.amount,
                calculatedAmount,
                difference: req.body.amount - calculatedAmount,
                ip: req.ip
            });
        }

        const orderData = {
            userId,
            items: verifiedItems,
            address,
            amount: calculatedAmount, // Use server-calculated amount
            paymentMethod: "COD",
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        logger.info('ORDER_PLACED', {
            orderId: newOrder._id,
            userId,
            amount: calculatedAmount,
            itemCount: verifiedItems.length,
            ip: req.ip
        });

        res.json({ success: true, message: "Order Placed", orderId: newOrder._id, amount: calculatedAmount })

    } catch (error) {
        logger.error('ORDER_PLACE_ERROR', { error: error.message, userId: req.body.userId });
        res.json({ success: false, message: error.message })
    }
}

// All Orders data for Admin Panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success: true, orders })
    } catch (error) {
        logger.error('ADMIN_ALL_ORDERS_ERROR', { error: error.message });
        res.json({ success: false, message: error.message })
    }
}

// User Order Data for For Frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        const orders = await orderModel.find({ userId })
        res.json({ success: true, orders })
    } catch (error) {
        logger.error('USER_ORDERS_ERROR', { error: error.message, userId: req.body.userId });
        res.json({ success: false, message: error.message })
    }
}

// update order status from Admin Panel
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await orderModel.findByIdAndUpdate(orderId, { status })

        logger.info('ORDER_STATUS_UPDATED', {
            orderId,
            status,
            adminId: req.userId || 'system'
        });

        res.json({ success: true, message: "Status Updated" })
    } catch (error) {
        logger.error('ORDER_STATUS_UPDATE_ERROR', { error: error.message, orderId: req.body.orderId });
        res.json({ success: false, message: error.message })
    }
}

export { placeOrder, allOrders, userOrders, updateStatus }
