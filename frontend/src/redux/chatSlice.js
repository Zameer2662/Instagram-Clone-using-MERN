import { createSlice } from "@reduxjs/toolkit"

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        onlineUsers: [],
        messages: [],
        currentConversation: null
    },
    reducers: {
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload
        },
        setMessages: (state, action) => {
            state.messages = action.payload
        },
        addMessage: (state, action) => {
            // Prevent duplicates
            if (!state.messages.some(msg => msg._id === action.payload._id)) {
                state.messages.push(action.payload)
            }
        },
        setCurrentConversation: (state, action) => {
            state.currentConversation = action.payload
        }
    }
})

export const { setOnlineUsers, setMessages, addMessage, setCurrentConversation } = chatSlice.actions
export default chatSlice.reducer