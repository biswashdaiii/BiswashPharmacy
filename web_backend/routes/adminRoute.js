import express from 'express'
import { loginAdmin, getSecurityLogs } from '../controllers/admin_controller.js'
import { authAdmin } from '../middleware/authAdmin.js'
import { loginLimiter } from '../middleware/rateLimiter.js'

const adminRouter = express.Router()
adminRouter.post('/login', loginLimiter, loginAdmin)
adminRouter.get('/security-logs', authAdmin, getSecurityLogs)

export default adminRouter