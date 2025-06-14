import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';

export const useFollowUser = () => {
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();

    const followUser = async (userId) => {
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/user/followorunfollow/${userId}`, {
                withCredentials: true
            });
            
            if (res.data.success) {
                toast.success(res.data.message);
                return true; // success
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to follow user");
        }
        return false; // failure
    };

    return { followUser, currentUserId: user?._id };
};