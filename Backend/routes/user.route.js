import express from "express";
import {editProfile,followOrUnfollow,getProfile,getSuggestedUsers,register,login,logout, searchUsers} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route(`/register`).post(register);
router.route(`/login`).post(login);
router.route(`/logout`).get(logout);
router.route(`/:id/profile`).get(getProfile);
router.route(`/profile/edit`).post(isAuthenticated,upload.single('profilePhoto'), editProfile);
router.route(`/suggested`).get(isAuthenticated,getSuggestedUsers);
router.route(`/followorunfollow/:id`).get(isAuthenticated,followOrUnfollow);
router.route(`/search`).get(isAuthenticated, searchUsers);

export default router;
