import { fetchchatMessages,chatRoom } from "../Service/chatService.js";

export const getMessages = async (req, res) => {
    const { senderId,receiverId,pageId,limit } = req.query ;

    try {
        const messages = await fetchchatMessages({
            currentUserId: req.userId,
            senderId,
            receiverId,
            page: parseInt(pageId, 10) || 1,
            limit: parseInt(limit, 10) || 20,
    });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
}

export const getChatRoom = async (req, res) => {
    
    try {
       const rooms=await chatRoom(
        req.userId
       );
       res.status(200).json(rooms);
    }
   
    catch (error) {
        res.status(500).json({ error: "Error fetching rooms" });
    
}};
