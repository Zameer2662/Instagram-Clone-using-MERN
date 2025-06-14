import { Avatar } from "@radix-ui/react-avatar";
import {
    Heart,
    Home,
    LogOut,
    MessageCircle,
    PlusSquare,
    Search,
    TrendingUp,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "@/redux/authSlice";
import CreatePost from "./CreatePost";
import { setPosts, setSelectedPost } from "@/redux/postSlice";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const LeftSidebar = () => {
    const navigate = useNavigate();
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { likeNotification } = useSelector(store => store.realTimeNotification);

    const logoutHandler = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/v1/user/logout", { withCredentials: true });
            if (res.data.success) {
                dispatch(setAuthUser(null));
                dispatch(setSelectedPost(null));
                dispatch(setPosts([]));
                navigate("/login");
                toast.success(res.data.message);
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    };

    const searchUsers = async (query) => {
        try {
            setIsLoading(true);
            const res = await axios.get(`http://localhost:8000/api/v1/user/search?username=${query}`, {
                withCredentials: true
            });
            if (res.data.success) {
                setSearchResults(res.data.users);
            }
        } catch (error) {
            toast.error("Error searching users");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery.length > 1) {
            const debounceTimer = setTimeout(() => {
                searchUsers(searchQuery);
            }, 300);

            return () => clearTimeout(debounceTimer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const sidebarHandler = (textType) => {
        if (textType == "Logout") {
            logoutHandler();
        } else if (textType == "Create") {
            setOpen(true);
        } else if (textType == "Profile") {
            navigate(`/profile/${user?._id}`);
        } else if (textType == "Home") {
            navigate("/")
        } else if (textType == "Messages") {
            navigate("/chat")
        } else if (textType == "Search") {
            setSearchOpen(true); // Added this case for Search
        }
    };

    const sidebarItems = [
        { icons: <Home />, text: "Home" },
        { icons: <Search />, text: "Search" }, // Removed isSearch flag
        { icons: <TrendingUp />, text: "Explore" },
        { icons: <MessageCircle />, text: "Messages" },
        { icons: <Heart />, text: "Notifications" },
        { icons: <PlusSquare />, text: "Create" },
        {
            icons: (
                <Avatar className="w-6 h-6">
                    <AvatarImage className="rounded-2xl" src={user?.profilePicture} />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
            ),
            text: "Profile",
        },
        { icons: <LogOut />, text: "Logout" },
    ];

    return (
        <div className="fixed top-0 z-10 left-0 px-4 border-r border-gray-300 w-[16%] h-screen">
            <div className="flex flex-col">
                <h1 className="my-8 pl-3 font-bold text-xl">LOGO</h1>
                <div>
                    {sidebarItems.map((item, index) => (
                        <div
                            onClick={() => sidebarHandler(item.text)} // Removed !item.isSearch condition
                            key={index}
                            className="flex items-center gap-4 relative hover:bg-gray-100 cursor-pointer rounded-lg p-3 my-4"
                        >
                            {item.icons}
                            <span>{item.text}</span>

                            {item.text == 'Notifications' && likeNotification.length > 0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button size='icon' className="bg-red-600 hover:bg-red-600 rounded-full h-5 w-5 left-6 bottom-6 absolute">
                                            {likeNotification.length}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <div>
                                            {likeNotification.length == 0 ? (
                                                <p>No New Notification</p>
                                            ) : (
                                                likeNotification.map((notification) => (
                                                    <div key={notification.userId} className="flex items-center gap-2 my-2">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={notification.userDetails?.profilePicture} />
                                                            <AvatarFallback>CN</AvatarFallback>
                                                        </Avatar>
                                                        <p className="text-sm"><span className="font-bold">{notification.userDetails?.username}</span> Liked your Post</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Search Dialog - Moved outside the sidebar items loop */}
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Search Users</DialogTitle>
                    </DialogHeader>
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-4"
                    />
                    <div className="max-h-[300px] overflow-y-auto">
                        {isLoading ? (
                            <div className="py-6 text-center text-sm">Searching...</div>
                        ) : searchResults.length === 0 ? (
                            <div className="py-6 text-center text-sm">
                                {searchQuery.length > 1 ? "No users found" : "Type at least 2 characters"}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {searchResults.map((user) => (
                                    <div
                                        key={user._id}
                                        onClick={() => {
                                            navigate(`/profile/${user._id}`);
                                            setSearchOpen(false);
                                            setSearchQuery("");
                                        }}
                                        className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                                    >
                                        <Avatar className="h-8 w-8 mr-3">
                                            <AvatarImage src={user.profilePicture} />
                                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{user.username}</p>
                                            {user.bio && <p className="text-xs text-gray-500">{user.bio}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <CreatePost open={open} setOpen={setOpen} />
        </div>
    );
};

export default LeftSidebar;