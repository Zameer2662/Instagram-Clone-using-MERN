import { useEffect } from 'react'
import ChatPage from './components/ChatPage'
import EditProfile from './components/EditProfile'
import Home from './components/Home'
import Login from './components/Login'
import MainLayout from './components/MainLayout'
import Profile from './components/Profile'
import Signup from './components/Signup'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { io } from "socket.io-client"
import { useDispatch, useSelector } from 'react-redux'
import { setSocket } from './redux/socketSlice'
import { setOnlineUsers, addMessage } from './redux/chatSlice'
import { setLikeNotification } from './redux/rtnSlice'
import ProtectedRoutes from './components/ProtectedRoutes'

const browserRouter = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoutes><MainLayout /></ProtectedRoutes> ,
    children: [
      {
        path: "/",
        element: <ProtectedRoutes><Home/></ProtectedRoutes>
      },
      {
        path: "/profile/:id",
        element:<ProtectedRoutes> <Profile/></ProtectedRoutes>
      },
      {
        path: "/account/edit",
        element: <ProtectedRoutes><EditProfile /></ProtectedRoutes>
      },
      {
        path: "/chat",
        element: <ProtectedRoutes><ChatPage/></ProtectedRoutes>
      },
    ]
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <Signup />
  }
])

function App() {
  const { user } = useSelector(store => store.auth)
  const { socket } = useSelector(store => store.socketio)
  const dispatch = useDispatch()

  useEffect(() => {
    let socketio

    const connectSocket = () => {
      if (user?._id && !socket) {
        socketio = io('http://localhost:8000', {
          query: { userId: user._id },
          transports: ['websocket', 'polling'],
          withCredentials: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })

        socketio.on('connect', () => {
          console.log('Socket connected:', socketio.id)
        })

        socketio.on('connect_error', (err) => {
          console.error('Socket connection error:', err)
        })

        socketio.on('getOnlineUsers', (onlineUsers) => {
          dispatch(setOnlineUsers(onlineUsers))
        });

        socketio.on('notification' , (Notification)=> {
          dispatch(setLikeNotification(Notification));
        })


        // Add listener for new messages
        socketio.on('newMessage', (message) => {
          dispatch(addMessage(message))
        })

        dispatch(setSocket(socketio))
      }
    }

    connectSocket()

    return () => {
      if (socketio) {
        console.log('Cleaning up socket')
        socketio.off('getOnlineUsers')
        socketio.off('newMessage')
        socketio.disconnect()
        dispatch(setSocket(null))
      }
    }
  }, [user?._id, dispatch])

  // Additional effect to handle socket when user logs out
  useEffect(() => {
    if (!user?._id && socket) {
      socket.disconnect()
      dispatch(setSocket(null))
    }
  }, [user?._id, socket, dispatch])

  return (
    <>
      <RouterProvider router={browserRouter} />
    </>
  )
}

export default App