import Message from "../models/message.js";
import { getRoomId } from "../config/chatHelper.js";
import mongoose, { mongo } from "mongoose";

// chatService.js
export const createMessage = async (messageData) => {
    try {
        const message = new Message({
            chatRoomId: messageData.roomId,
            messageId: messageData.messageId,
            sender: messageData.sender,
            receiver: messageData.receiver,
            message: messageData.message,
            status: messageData.status || 'sent',
        });
        await message.save();
        return message;
    } catch (error) {
        console.error("Error creating message:", error);
        throw error;
    }
}

export const fetchchatMessages = async ({ currentUserId, senderId, receiverId, page = 1, limit = 20, }) => {
    const roomId = getRoomId(currentUserId, senderId);
    const query = { chatroomId: roomId }
    try {
        if (currentUserId === receiverId) {
            const undeliveryQuery = {
                chatRoomId: roomId,
                receiver: mongoose.Types.ObjectId(currentUserId),
                sender: mongoose.Types.ObjectId(senderId),
                status: 'sent'
            };
            const undeliveredUpdate = await Message.updateMany(undeliveryQuery, { $set: { status: 'delivered' } });
            if (undeliveredUpdate.modifiedCount > 0) {
                console.log(`Updated ${undeliveredUpdate.modifiedCount} undelivered messages to delivered.`);
            }
        }
        const messages = await Message.aggregate(
            {
                $match: query
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            },
            {
                $addFields: {
                    isMine: {
                        $eq: ['$sender', mongoose.Types.ObjectId(currentUserId)]

                    }
                }
            },
            // {
            //     $unwind: '$senderInfo'
            // },
            // {
            //     $project: {
            //         _id: 1,
            //         chatRoomId: 1,
            //         messageId: 1,
            //         sender: '$senderInfo.username',
            //         receiver: 1,
            //         content: 1,
            //         status: 1,
            //         createdAt: 1
            //     }
            // }
        );
        return messages.reverse();

    } catch (error) {
        console.error("Error fetching chat messages:", error);
        throw error;

    }
}


export const updateMessageStatus = async (messageId, status) => {
    try {
        const message = await Message.findOneAndUpdate(
            { messageId: messageId },
            { status: status },
            { new: true }
        );
        return message;
    } catch (error) {
        console.error("Error updating message status:", error);
        throw error;
    }
};

export const undeliveredMessages = async (userId, partnerId) => {
    try {
        const messages = await Message.find({
            receiver: userId,
            sender: partnerId,
            status: 'sent'
        }).sort({
            createdAt: -1
        });
        return messages;
    } catch (error) {
        console.error("Error fetching undelivered messages:", error);
        throw error;
    }
}

export const updateUserLastSeen = async (userId, lastSeen) => {
    try {
        const user = await Message.findOneAndUpdate(
            { lastSeen: lastSeen },
            { new: true }
        );
        return user;
    } catch (error) {

        throw error;
    }
};

export const markMessageAsDelivered = async (userId, partnerId) => {
    try {
        const result = await Message.updateMany(
            {
                receiver: ObjectId(userId),
                sender: ObjectId(partnerId),
                status: 'sent'
            },
            { $set: { status: 'delivered' } }
        );
        return result.modifiedCount;
    } catch (error) {

        throw error;
    }
};


export const markMessageAsRead = async (userId, partnerId) => {
    try {
        const result = await Message.updateMany(
            {
                receiver: ObjectId(userId),
                sender: ObjectId(partnerId),
                status: ['sent', 'delivered']
            },
            { $set: { status: 'read' } }
        );
        return result.modifiedCount;
    } catch (error) {

        throw error;
    }
};

export const getUserLastSeen = async (userId) => {
    try {
        const user = await user.findById(userId).select('lastSeen');
        if (!user) {
            return null;
        }
        return user.lastSeen ? user.lastSeen.toISOString() : null;
    } catch (error) {
        throw error;
    }
};

export const getUserOnlineStatus = async (userId) => {
    try {
        const user = await user.findById(userId).select('isOnline', 'lastSeen');
        if (!user) {
            return { isOnline: false, lastSeen: null };
        }
        return {
            isOnline: user.isOnline,
            lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null
        };
    } catch (error) {
        throw error;
    }
};

export const chatRoom = async (userId) => {
    try {
        const userObjectId = new ObjectId(userId);
        const privateChatQuery = {
            $or: [
                { sender: userObjectId },
                { receiver: userObjectId }
            ]
        };
        const privateChats = await Message.aggregate([
            { $match: privateChatQuery },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $ne: ['$sender', userObjectId] },
                            '$sender',
                            '$receiver'
                        ]
                    },
                    latestMessageTime: { "$first": "$createdAt" },
                    latestMessage: { "$first": "$message" },
                    sender: { "$first": "$sender" },
                    messages: {
                        $push: {
                            sender: "$sender",
                            receiver: "$receiver",
                            status: "$status",

                        }
                    }
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    _id: 0,
                    chatType: 'private',
                    messageId: "$latestMessageId",
                    username: "$userDetails.name",
                    userId: "$userDetails._id",
                    latestMEssageTime: 1,
                    latestMessage: 1,
                    senderId: 1,
                    unreadCount: {
                        $size: {
                            $filter: {
                                input: "$message",
                                as: "msg",
                                cond: {
                                    $and: [
                                        { $eq: ["$$msg.receiver", userObjectId] },
                                        { $in: ["$$msg.status", ["sent", "delivered"]] }
                                    ]
                                }
                            }
                        }
                    },
                    latestMessageStatus: {
                        $cond: [
                            { $eq: ["$sender", userObjectId] },
                            {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: "$messages",
                                                    as: "msg",
                                                    cond: { $eq: ["$$msg.sender", userObjectId] }
                                                }
                                            },
                                            as: "msg",
                                            in: "$$msg.status"
                                        }
                                    },
                                    0
                                ]
                            }
                        ]
                    }
                }
            }
        ]);
        return privateChats.sort((a, b) => new Date(b.latestMessageTime) - new Date(a.latestMessageTime));

    } catch (error) {
        console.error("Error fetching chat room:", error);
        throw error;

    }
}