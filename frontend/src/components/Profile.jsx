import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import useGetUserProfile from '@/hooks/useGetUserProfile';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AtSign, Heart, MessageCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedUser } from '@/redux/authSlice';
import { toast } from 'sonner';
import { useFollowUser } from '@/redux/useFollowUser';

const Profile = () => {
    const { id: userId } = useParams();
    const userProfile = useGetUserProfile(userId);
    const [activeTab, setActiveTab] = useState('posts');
    const { user } = useSelector(store => store.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { followUser, currentUserId } = useFollowUser();

    const [isFollowing, setIsFollowing] = useState(
        userProfile?.followers?.includes(currentUserId)
    );

    const handleMessageClick = () => {
        dispatch(setSelectedUser({
            _id: userProfile._id,
            username: userProfile.username,
            profilePicture: userProfile.profilePicture
        }));
        navigate('/chat');
    };

    const handleFollowClick = async () => {
        if (!currentUserId) {
            toast.error("Please login to follow users");
            return;
        }

        const success = await followUser(userProfile._id);
        if (success) {
            setIsFollowing(!isFollowing);
            // Update local state to reflect changes immediately
            if (isFollowing) {
                userProfile.followers = userProfile.followers.filter(id => id !== currentUserId);
            } else {
                userProfile.followers.push(currentUserId);
            }
        }
    };

    if (!userProfile) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    const isLoggedInUserProfile = currentUserId === userProfile?._id;
    const followersCount = userProfile?.followers?.length || 0;

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const displayedPost = activeTab === 'posts' ? userProfile?.posts : userProfile?.bookmarks;

    return (
        <div className="flex max-w-5xl justify-center mx-auto mt-7 pl-10">
            <div className="flex flex-col gap-20 p-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="flex justify-center md:justify-start">
                        <Avatar className="h-40 w-40 md:h-55 md:w-55">
                            <AvatarImage src={userProfile?.profilePicture} alt="profile" />
                            <AvatarFallback>
                                {userProfile?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </section>
                    
                    <section className="space-y-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold mr-4">{userProfile?.username}</h1>
                            
                            {isLoggedInUserProfile ? (
                                <>
                                    <Link to="/account/edit">
                                        <Button variant="secondary" size="sm">
                                            Edit profile
                                        </Button>
                                    </Link>
                                    <Button variant="secondary" size="sm">
                                        View Archive
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        variant={isFollowing ? "secondary" : "default"}
                                        size="sm"
                                        onClick={handleFollowClick}
                                        className={isFollowing ? "" : "bg-blue-500 hover:bg-blue-600 text-white"}
                                    >
                                        {isFollowing ? "Following" : "Follow"}
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={handleMessageClick}
                                    >
                                        Message
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="flex gap-5">
                            <p><span className="font-bold">{userProfile?.posts?.length || 0}</span> posts</p>
                            <p><span className="font-bold">{followersCount}</span> followers</p>
                            <p><span className="font-bold">{userProfile?.following?.length || 0}</span> following</p>
                        </div>

                        <div className="space-y-1">
                            <p className="font-semibold">{userProfile?.fullName}</p>
                            <p>{userProfile?.bio || "No bio yet"}</p>
                            <Badge variant="secondary" className="inline-flex items-center">
                                <AtSign className="h-3 w-3 mr-1" />
                                {userProfile?.username}
                            </Badge>
                        </div>
                    </section>
                </div>

                <div className="border-t border-gray-200 pt-5">
                    <div className="flex justify-center gap-10 text-sm">
                        <button
                            className={`py-3 ${activeTab === "posts" ? "font-bold border-t border-black" : ""}`}
                            onClick={() => handleTabChange("posts")}
                        >
                            POSTS
                        </button>
                        <button
                            className={`py-3 ${activeTab === "saved" ? "font-bold border-t border-black" : ""}`}
                            onClick={() => handleTabChange("saved")}
                        >
                            SAVED
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1 mt-5">
                        {displayedPost?.map((post) => (
                            <div key={post?._id} className="relative group aspect-square">
                                <img
                                    src={post.image}
                                    alt="Post"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <div className="flex text-white gap-5">
                                        <span className="flex items-center gap-1">
                                            <Heart className="w-4 h-4" />
                                            {post?.likes?.length || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="w-4 h-4" />
                                            {post?.comments?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;