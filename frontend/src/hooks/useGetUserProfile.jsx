import axios from "axios";
import { useEffect, useState } from "react";

const useGetUserProfile = (userId) => {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/v1/user/${userId}/profile`, {
          withCredentials: true
        });
        if (res.data.success) {
          setUserProfile(res.data.user);
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  return userProfile;
};

export default useGetUserProfile;
