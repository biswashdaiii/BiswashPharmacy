import express from 'express'
import { placeOrder, allOrders, userOrders, updateStatus } from '../controllers/orderController.js'
import { authAdmin } from '../middleware/authAdmin.js'
import { authUser } from '../middleware/authUser.js'

const orderRouter = express.Router();

// Order Routes
orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/all', authAdmin, allOrders);
orderRouter.post('/userorders', authUser, userOrders);
orderRouter.post('/status', authAdmin, updateStatus);

export default orderRouter;
