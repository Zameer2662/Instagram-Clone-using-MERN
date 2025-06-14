import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import React from "react";

const Comment = ({ comment }) => {
  // Check if comment or its properties exist
  if (!comment || !comment.author) {
    return null; // or return a loading state/placeholder
  }

  return (
    <div className="my-2">
      <div className="flex gap-3 items-center">
        <Avatar>
          <AvatarImage 
            src={comment.author.profilePicture || undefined} 
            className="w-8 h-8 rounded-full"
          />
          <AvatarFallback>
            {comment.author.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>

        <h1 className="font-bold text-sm">
          {comment.author.username || 'Unknown user'} 
          <span className="font-normal pl-1">
            {comment.text || ''}
          </span>
        </h1>
      </div>
    </div>
  );
};

export default Comment;