import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SuggestedUser from "./SuggestedUsers";

const RightSidebar = () => {
  const { user } = useSelector((store) => store.auth);
  return (
    <div className='w-fit my-10 pr-32'>
      <div className="flex items-center gap-2">
        <Link to={`profile/${user?._id}`}>
        <Avatar>
          <AvatarImage src={user?.profilePicture} alt="post_image" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        </Link>
        
        <div>
          <h1 className="font-semibold "> <Link to={`profile/${user?._id}`} >{user?.username}</Link></h1>
          <span className="text-sm text-grey-600"> {user?.bio || "bio here...."}</span>
        </div>
      </div>
      <SuggestedUser/>
    </div>
  )
}

export default RightSidebar;
