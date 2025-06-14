import React from "react";
import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Link } from "react-router-dom";

const SuggestedUsers = () => {
  const { suggestedUsers } = useSelector((store) => store.auth);
  console.log("Suggested Users from Redux:", suggestedUsers);

  return (
    <div className="my-10">
      <div className="flex items-center justify-between text-sm">
        <h1 className="font-semibold text-gray-600">Suggested For you</h1>
        <span className="font-medium cursor-pointer pl-8"> See All</span>
      </div>
      {
      suggestedUsers.map((user) => {
        return (
          <div key={user._id}  className=" flex items-center justify-between my-5">
           <div className="flex items-center gap-2">
                   <Link to={`profile/${user?._id}`}>
                   <Avatar>
                     <AvatarImage src={user?.profilePicture} alt="post_image" />
                     <AvatarFallback>CN</AvatarFallback>
                   </Avatar>
                   </Link>
                       <div>
                     <h1 className="font-semibold text-sm "> <Link to={`profile/${user?._id}`} >{user?.username}</Link></h1>
                     <span className="text-sm text-grey-600"> {user?.bio || "Bio here...."}</span>
                   </div>
                   
                 </div>
                 <span className="text-[#3badf8] text-xs font-bold cursor-pointer hover:text-[3495d6]">Follow</span>
             
          </div>
        );
      })
      
      }
    </div>
  );
};

export default SuggestedUsers;
