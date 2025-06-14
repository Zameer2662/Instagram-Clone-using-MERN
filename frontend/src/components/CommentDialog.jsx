import React, { useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useDispatch, useSelector } from "react-redux";
import Comment from "./ui/Comment";
import axios from "axios";
import { setPosts } from "@/redux/postSlice";
import { toast } from "sonner";

const CommentDialog = ({ open, setOpen , post}) => {
  // comment ki input lene k liye
  const [text, setText] = useState("");
  const {selectedPost} = useSelector(store => store.post);
  const dispatch =  useDispatch();
  const { posts } = useSelector((store) => store.post);
  const [comment , setComment] =useState([]);
  const changeEventHandler = (e) => {
    const inputText = e.target.value;
    if (inputText.trim()) {
      setText(inputText);
    } else {
      setText("");
    } 
  };
  // comment send krne ka function
const sendMessageHandler = async () => {
  if (!text.trim()) {
    toast.warning("Comment cannot be empty");
    return;
  }

  try {
    // Use selectedPost._id instead of post._id
    const res = await axios.post(
      `http://localhost:8000/api/v1/post/${selectedPost._id}/comment`,
      { text: text.trim() },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    
    if (res.data.success) {
      const updatedCommentData = [...selectedPost.comments, res.data.comment];
      setComment(updatedCommentData);
      setText("");
      
      // Update Redux store
      const updatedPostData = posts.map(p => 
        p._id === selectedPost._id 
          ? { ...p, comments: updatedCommentData } 
          : p
      );
      dispatch(setPosts(updatedPostData));
      toast.success(res.data.message);
    }
  } catch (error) {
    console.error("Error posting comment:", error);
    toast.error(error.response?.data?.message || "Failed to post comment");
  }
};



  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={() => setOpen(false)}
        className='max-w-5xl p-0 flex flex-col'
      >
        <div className='flex flex-1'>
          <div className='w-1/2'>
            <img
              className='rounded-l-lg h-full w-full object-cover'
              src={selectedPost?.image}
              alt="post_img"
            />
          </div>
          <div className='w-1/2 flex flex-col justify-between'>
            <div className='flex items-center justify-between p-4'>
              <div className='flex gap-3 items-center'>
                <Link>
                  <Avatar>
                    <AvatarImage src={selectedPost?.author?.profilePicture} alt="post_image" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                </Link>

                <div>
                  <Link className="font-semibold text-xs">{selectedPost?.author?.username}</Link>
                  {/* <span className="text-gray-600 text-sm">Bio here......</span> */}
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <MoreHorizontal className="cursor-pointer" />
                </DialogTrigger>
                <DialogContent className="flex flex-col items-center text-sm text-center">
                  <div className=" cursor-pointer w-full text-[#ed4956] font-bold">
                    Unfollow
                  </div>

                  <div className=" cursor-pointer w-full ">
                    Add to Favourites
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <hr />

            {/* neeceh wala div comment show krwaye ga comment button pr click krne k bd jo dialog aayega uss main */}
            <div className=' flex-1 overflow-y-auto max-h-96 p-4'>
              {
                selectedPost?.comments.map((comment) => <Comment key={comment._id} comment = {comment}/>)
              }
            </div>
            <div className='p-4'>
            <div className="flex items-center gap-2">
              <input
                type="text"
                onChange={changeEventHandler}
                value={text}
                placeholder="Add a comment..."
                className='w-full outline-non border border-gray-300 p-2 rounded'
              ></input>
              <Button 
                disabled={!text.trim()}
                onClick={sendMessageHandler}
                variant="outline"
              >
                Send
              </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
