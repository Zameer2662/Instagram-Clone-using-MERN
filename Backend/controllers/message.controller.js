import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const { textMessage: message } = req.body;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: []
            });
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        });

        // Populate before saving to conversation
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('senderId', 'username profilePicture')
            .populate('receiverId', 'username profilePicture');

        conversation.messages.push(newMessage._id);
        await conversation.save();

        // Socket.io implementation - emit to both users
        const receiverSocketId = getReceiverSocketId(receiverId);
        const senderSocketId = getReceiverSocketId(senderId);

        // Emit to both parties
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', populatedMessage);
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit('newMessage', populatedMessage);
        }

        return res.status(201).json({
            success: true,
            message: populatedMessage
        });

    } catch (error) {
        console.error("Error in sendMessage:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}

export const getMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('messages');

        if (!conversation) {
            return res.status(200).json({
                success: true,
                messages:[]
            });
        }

        return res.status(200).json({
            success: true,
            messages: conversation?.messages // Fixed the typo here
        });

    } catch (error) {
        console.error("Error in getMessage:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}