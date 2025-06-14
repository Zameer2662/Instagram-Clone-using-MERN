import { setMessages } from '@/redux/chatSlice';
import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const useGetAllMessage = () => {
    const { selectedUser } = useSelector(store => store.auth)
    const dispatch = useDispatch()

    useEffect(() => {
        const fetchAllMessage = async () => {
            try {
                if (!selectedUser?._id) return
                
                const res = await axios.get(
                    `http://localhost:8000/api/v1/message/all/${selectedUser._id}`,
                    { withCredentials: true }
                )
                
                if (res.data.success) {
                    // Normalize message structure
                    const normalizedMessages = res.data.messages.map(msg => ({
                        ...msg,
                        senderId: typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId,
                        receiverId: typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId,
                    }))

                    dispatch(setMessages(normalizedMessages))
                }
            } catch (error) {
                console.log(error)
            }
        }

        fetchAllMessage()
    }, [selectedUser?._id, dispatch])
}


export default useGetAllMessage;