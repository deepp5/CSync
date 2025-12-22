import React from "react";
import { useNavigate } from "react-router-dom";
import "./Card.css";

export default function Card(props) {
    const navigate = useNavigate();
    const goToPost = () => {
        navigate(`/post/${props.post.id}`);
    };

    const handleKeyDown = (e) => {
        if(e.key === "Enter" || e.key === " "){
            goToPost();
        }
    };
  return (
        <div className="project-card" role="button" tabIndex={0} onClick={goToPost} onKeyDown={handleKeyDown}>
            <div className = "cardTop">
                <h3>{props.post.title}</h3>
                <p className="desc">{props.post.header}</p>
            </div>
            <div className = "cardBottom">
                <p className="skills">{props.post.techStack.join(", ")}</p>
                <p className="ownerName">Jay</p>
            </div>
        </div>
    );
}