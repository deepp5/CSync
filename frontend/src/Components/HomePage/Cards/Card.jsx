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

    const getDifficultyLabel = (difficulty) => {
        const labels = {
            BEGINNER: "Beginner",
            INTERMEDIATE: "Intermediate",
            ADVANCED: "Advanced"
        };
        return labels[difficulty] || difficulty;
    };

    const getDifficultyClass = (difficulty) => {
        const classes = {
            BEGINNER: "difficulty-easy",
            INTERMEDIATE: "difficulty-medium",
            ADVANCED: "difficulty-hard"
        };
        return classes[difficulty] || "difficulty-medium";
    };

    const getCategoryLabel = (category) => {
        const labels = {
            WEB_DEVELOPMENT: "Web Development",
            MOBILE: "Mobile",
            AI_ML: "AI/ML",
            GAME_DEV: "Game Dev",
            SYSTEMS: "Systems",
            OTHER: "Other"
        };
        return labels[category] || category;
    };

    return (
        <div className="project-card" role="button" tabIndex={0} onClick={goToPost} onKeyDown={handleKeyDown}>
            <div className="cardTop">
                <h3>{props.post.title}</h3>
                
                {/* Category and Difficulty under title */}
                <div className="card-meta-badges">
                    <span className="category-badge">{getCategoryLabel(props.post.category)}</span>
                    <span className={`difficulty-badge ${getDifficultyClass(props.post.difficulty)}`}>
                        {getDifficultyLabel(props.post.difficulty)}
                    </span>
                </div>

                <p className="desc">{props.post.header}</p>
            </div>

            <div className="cardBottom">
                {/* Tech stack - max 2 items */}
                <div className="card-skills">
                    {props.post.techStack.slice(0, 2).map((skill, index) => (
                        <span key={index} className="skill-badge">{skill}</span>
                    ))}
                    {props.post.techStack.length > 2 && (
                        <span className="skill-badge more">+{props.post.techStack.length - 2}</span>
                    )}
                </div>
                <p className="ownerName">{props.post.User?.username || props.post.User?.name || "Unknown"}</p>
            </div>
        </div>
    );
}