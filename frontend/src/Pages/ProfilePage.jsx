import React from "react";
import Profile from "../Components/Profile/profile.jsx"
import Sidebar from "../Components/Sidebar/Sidebar";

export default function ProfilePage(){
    return (
        <div className="profile-root">
            <Sidebar />
            <Profile />
        </div>
    );
}