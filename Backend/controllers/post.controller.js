import sharp from "sharp";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import cloudinary from "../utils/cloudinary.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    if (!image) return res.status(400).json({ message: "Image Required" });

    // Image processing with Sharp
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    // Cloudinary upload stream
    const cloudResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(optimizedImageBuffer);
    });

    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });

    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });
    return res.status(201).json({
      message: "New Post Added.",
      post,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

// sbb post ko get krne ka function hai neeche 
export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 })
      .populate({ path: "author", select: 'username profilePicture' })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username profilePicture",
        }
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};


//user ki post ko get krne ka function 
export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username , profilePicture",
      })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },

        populate: {
          path: "author",
          select: "username, profilePicture",
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};


//post like krne ka function 
export const likePost = async (req, res) => {
  try {
    const likeKrneWaleUserKiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });

    //like logic started
    await post.updateOne({ $addToSet: { likes: likeKrneWaleUserKiId } });
    await post.save();

    // implement socket io for real time noifications
    const user = await User.findById(likeKrneWaleUserKiId).select('username profilePicture');
    const postOwnerId = post.author.toString();
    if (postOwnerId != likeKrneWaleUserKiId) {
      //emit a notification event
      const notification = {
        type: 'like',
        userId: likeKrneWaleUserKiId,
        userDetails: user,
        postId,
        message: 'Your post was Liked '
      }

      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit('notification', notification);
    }

    return res.status(200).json({
      message: "Post Liked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};


//post ko dislike krne ka function 
export const dislikePost = async (req, res) => {
  try {
    const likeKrneWaleUserKiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });

    //like logic started
    await post.updateOne({ $pull: { likes: likeKrneWaleUserKiId } });
    await post.save();

    // implement socket io for real time noifications
    const user = await User.findById(likeKrneWaleUserKiId).select('username profilePicture');
    const postOwnerId = post.author.toString();
    if (postOwnerId != likeKrneWaleUserKiId) {
      //emit a notification event
      const notification = {
        type: 'dislike',
        userId: likeKrneWaleUserKiId,
        userDetails: user,
        postId,
        message: 'Your post was Disliked '
      }

      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit('notification', notification);
    }
    return res.status(200).json({
      message: "Post Disliked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

//comment add krne ka function 
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentKrneWalaUserKiId = req.id; // Changed from req.id to req.user._id
    const { text } = req.body;

    // Validate input
    if (!text || !text.trim()) {
      return res.status(400).json({ 
        message: "Comment text is required", 
        success: false 
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        message: "Post not found", 
        success: false 
      });
    }

    // Create comment
    const comment = await Comment.create({
      text: text.trim(), // Trim whitespace
      author: commentKrneWalaUserKiId,
      post: postId,
    });

    // Populate author info
    await comment.populate({
      path: "author",
      select: "username profilePicture",
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // Return success response (changed from 400 to 201 for created resource)
    return res.status(201).json({
      message: "Comment added successfully",
      comment,
      success: true,
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      success: false 
    });
  }
};

export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username  profilePicture"
    );

    if (!comments)
      return res
        .status(404)
        .json({ message: "No Comment found for this post ", success: false });

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.log(error);
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: "Post Not found", success: false });

    //check if the loggedd in user is the owner of the post
    if (post.author.toString() != authorId)
      return res.status(403).json({ message: "Unauthorized" });

    //delete Post

    await Post.findByIdAndDelete(postId);

    //remove the postid from the users post

    let user = await User.findById(authorId);
    user.posts = user.post.filter((id) => id.toString != postId);
    await user.save();

    //delete associated comments
    await Comment.deleteMany({ post: postId });

    return res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.log(error);
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.id; // Changed from req.id to req.user._id (standard practice)

    // 1. Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        message: "Post not found", 
        success: false 
      });
    }

    // 2. Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found", 
        success: false 
      });
    }

    // 3. Initialize bookmarks array if it doesn't exist
    if (!user.bookmarks) {
      user.bookmarks = [];
      await user.save();
    }

    // 4. Check if already bookmarked
    const isBookmarked = user.bookmarks.includes(post._id);

    if (isBookmarked) {
      // Remove bookmark
      await User.findByIdAndUpdate(
        userId,
        { $pull: { bookmarks: post._id } },
        { new: true }
      );
      return res.status(200).json({
        type: "unsaved",
        message: "Post removed from bookmarks",
        success: true
      });
    } else {
      // Add bookmark
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { bookmarks: post._id } },
        { new: true }
      );
      return res.status(200).json({
        type: "saved",
        message: "Post bookmarked",
        success: true
      });
    }
  } catch (error) {
    console.error("Bookmark error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};
