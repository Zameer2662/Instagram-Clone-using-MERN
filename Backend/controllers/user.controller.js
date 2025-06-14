import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { response } from "express";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";

//register functionality here
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(401).json({
        message: "Something is missing, Please Check!",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: "Try Different Email",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account Created Successfully",
      success: true,
    });
  } catch (error) {}
};

//login functionality here
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email or password is missing!",
        success: false,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect Email or Password",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect Email or Password",
        success: false,
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    // Agar `posts` ka reference nahi hai, to empty array set karein
    const populatedPosts = user.posts
      ? await Promise.all(
          user.posts.map(async (postId) => {
            const post = await Post.findById(postId);
            return post?.author.equals(user._id) ? post : null;
          })
        )
      : [];

    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: populatedPosts,
    };

    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "Strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .json({
        message: `Welcome Back ${user.username}`,
        success: true,
        user,
      });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
};


//logout functionality here
export const logout = async (_, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logout Successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .populate({ path: 'posts', options: { sort: { createdAt: -1 } } })
      .populate('bookmarks');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const editProfile = async (req, res) => {
  try {
    // 1. Get user ID from authenticated request
    const userId = req.id; // Changed from req.id
    const { bio, gender } = req.body;
    
    // 2. Initialize update object
    const updateData = {};
    if (bio) updateData.bio = bio;
    if (gender) updateData.gender = gender;

    // 3. Handle file upload if exists
    if (req.file) {
      try {
        const fileUri = getDataUri(req.file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        updateData.profilePicture = cloudResponse.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Profile picture upload failed"
        });
      }
    }

    // 4. Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 5. Return success response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
        gender: updatedUser.gender
      }
    });

  } catch (error) {
    console.error("Edit profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
//getsuggesteduser functionality here
export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      "username bio profilePicture _id"
    );

    if (!suggestedUsers || suggestedUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Currently do not have any users",
      });
    }

    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

//follow unfollow wala logic
export const followOrUnfollow = async (req, res) => {
  try {
    const followKrneWala = req.id;
    const jiskoFollowKrunga = req.params.id;
    if (followKrneWala == jiskoFollowKrunga) {
      return res.status(400).json({
        message: "You cannot follow or unfoloow yourself",
        success: false,
      });
    }

    const user = await User.findById(followKrneWala);
    const targetUser = await User.findById(jiskoFollowKrunga);

    if (!user || !targetUser) {
      return res.status(400).json({
        message: "User not Found",
        success: false,
      });
    }

    //main check krun ga k follow krna hai k unfollow
    const isFollowing = user.following.includes(jiskoFollowKrunga);
    if (isFollowing) {
      //unfollow logic idr ayga
      await Promise.all([
        User.updateOne(
          { _id: followKrneWala },
          { $pull: { following: jiskoFollowKrunga } }
        ),
        User.updateOne(
          { _id: jiskoFollowKrunga },
          { $pull: { followers: followKrneWala } }
        ),
      ]);

      return res
        .status(200)
        .json({ message: `Unfollow Succesfully`, success: true });
    } else {
      //follow logic
      await Promise.all([
        User.updateOne(
          { _id: followKrneWala },
          { $push: { following: jiskoFollowKrunga } }
        ),
        User.updateOne(
          { _id: jiskoFollowKrunga },
          { $push: { followers: followKrneWala } }
        ),
      ]);
      return res
        .status(200)
        .json({ message: ` followed Succesfully`, success: true });
    }
  } catch (error) {
    console.log(error);
  }


};

//Search Function
export const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username || username.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters"
      });
    }

    // Search for users with username matching the query (case insensitive)
    const users = await User.find({
      username: { $regex: username, $options: 'i' }
    }).select('username profilePicture _id bio');

    return res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
