import express from 'express';
import { getChatRoom, getMessages } from '../controllers/chat_controller.js';
import { authUser } from '../middleware/authUser.js';

const router = express.Router();

router.get('/messages', authUser, getMessages);
router.get('/chat-rooms', authUser, getChatRoom);

export default router;
