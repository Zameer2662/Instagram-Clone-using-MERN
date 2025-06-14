import React, { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { useSelector, useDispatch } from 'react-redux'
import useGetAllMessage from '@/hooks/useGetAllMessage'
import { addMessage } from '@/redux/chatSlice'
import axios from 'axios'
import { Input } from './ui/input' // Make sure you have this component

const Messages = ({ selectedUser }) => {
    const dispatch = useDispatch()
    const [messageText, setMessageText] = useState('')
    useGetAllMessage()
    const { user, socket } = useSelector(store => store.auth)
    const { messages } = useSelector(store => store.chat)

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedUser?._id) return

        try {
            const res = await axios.post(
                `http://localhost:8000/api/v1/message/send/${selectedUser._id}`,
                { textMessage: messageText },
                { withCredentials: true }
            )

            if (res.data.success) {
                // Immediately add to local state
                dispatch(addMessage({
                    ...res.data.message,
                    senderId: user,
                    receiverId: selectedUser
                }))
                setMessageText('') // Clear input after sending
            }
        } catch (error) {
            console.error("Error sending message:", error)
        }
    }

    // Listen for incoming messages
    useEffect(() => {
        if (!socket) return

        const handleNewMessage = (newMessage) => {
            if (
                (newMessage.senderId._id === selectedUser?._id && newMessage.receiverId._id === user?._id) ||
                (newMessage.senderId._id === user?._id && newMessage.receiverId._id === selectedUser?._id)
            ) {
                dispatch(addMessage(newMessage))
            }
        }

        socket.on('newMessage', handleNewMessage)

        return () => {
            socket.off('newMessage', handleNewMessage)
        }
    }, [socket, dispatch, selectedUser, user])





    return (
        <div className='flex flex-col h-full'>
            {/* Header with user info */}
            <div className='p-4 border-b'>
                <div className='flex flex-col items-center justify-center'>
                    <Avatar className='h-20 w-20'>
                        <AvatarImage src={selectedUser?.profilePicture} alt="profilePhoto" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <span className='mt-2'>{selectedUser?.username}</span>
                    <Link to={`/profile/${selectedUser?._id}`}>
                        <Button variant="secondary" className="h-8 my-2">View Profile</Button>
                    </Link>
                </div>
            </div>

            {/* Messages area */}
            <div className='flex-1 overflow-y-auto p-4'>
                {messages?.map((msg) => {
                    const isSentByCurrentUser =
                        msg.senderId === user?._id || msg.senderId?._id === user?._id;

                    return (
                        <div key={msg._id} className={`flex mb-3 ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-xs break-words ${isSentByCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                                }`}>
                                {msg.message}
                            </div>
                        </div>
                    );
                })}

            </div>

            {/* Single message input */}
            <div className='p-4 border-t bg-white sticky bottom-0'>
                <div className='flex gap-2'>
                    <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && messageText.trim()) {
                                handleSendMessage()
                            }
                        }}
                        className='flex-1'
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className='px-6'
                    >
                        Send
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Messages