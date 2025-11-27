import React from 'react';
import CardSwap, {Card} from './CardSwap';
import './Features.css'


//Do we want to keep features?

export default function FeaturesPage(){
    const featureCards = [
        {
            id: 1,
            title: "Post & Share Ideas",
            description: "Easily publish your CS project ideas and get collaborators on board.",
            features: ["Project board", "Live posting", "Tagging system"]
        },
        {
            id: 2,
            title: "Real-time Collaboration",
            description: "Work together on projects with instant updates and communication tools.",
            features: ["Team chat", "Code/document sharing", "Live notifications"]
        },
        {
            id: 3,
            title: "Skill Building",
            description: "Pick up projects to practice real-world CS skills and grow your portfolio.",
            features: ["Skill tags", "Experience points", "Portfolio tracking"]
        },
        {
            id: 4,
            title: "Secure & Reliable",
            description: "Your ideas and messages are safe with enterprise-grade security.",
            features: ["End-to-end encryption", "Two-factor authentication", "Safe project storage"]
        },
        {
            id: 5,
            title: "Community Driven",
            description: "Join a vibrant hub of students helping each other succeed in tech.",
            features: ["Community feed", "Upvotes & comments", "Peer recognition"]
        }
    ];

    const handleCardClick = (cardIndex) => {
        console.log(`Clicked card ${cardIndex}:`, featureCards[cardIndex].title);
    };

    return (
        <div className="features-page" id="features" href="features" >
        {/* Left Side - 30% */}
            <div className="features-left">
                <div className="features-content">
                    <h1 className="features-title">Features</h1>
                   
                    
                    {/* <div className="features-list">
                        <div className="feature-item">
                        <h3>Seamless Integration</h3>
                        <p>Connect with your favorite tools and platforms effortlessly.</p>
                        </div>
                        
                        <div className="feature-item">
                        <h3>Lightning Fast</h3>
                        <p>Optimized performance ensures your work never slows down.</p>
                        </div>
                        
                        <div className="feature-item">
                        <h3>User-Friendly</h3>
                        <p>Intuitive interface designed for users of all skill levels.</p>
                        </div>
                        
                        <div className="feature-item">
                        <h3>24/7 Support</h3>
                        <p>Round-the-clock assistance whenever you need help.</p>
                        </div>
                    </div>

                    <div className="card-info">
                        <p className="info-text">
                        💡 Cards automatically rotate every 5 seconds
                        </p>
                        <p className="info-text">
                        🖱️ Hover over cards to pause rotation
                        </p>
                        <p className="info-text">
                        👆 Click any card to interact
                        </p> */}
                    {/* </div> */}
                </div>
            </div>

            {/* Right Side - 70% */}
            <div className="features-right">
                <CardSwap
                width={600}
                height={600}
                cardDistance={40}
                verticalDistance={50}
                delay={5000}
                pauseOnHover={true}
                onCardClick={handleCardClick}
                skewAmount={4}
                easing="elastic"
                >
                {featureCards.map((card) => (
                    <Card key={card.id} customClass="feature-card">
                        <div className="card-header">
                            <div className="card-icon">{card.icon}</div>
                            <h2 className="card-title">{card.title}</h2>
                        </div>
                        
                        <div className="card-body">
                            <p className="card-description">{card.description}</p>
                            
                            <ul className="card-features">
                            {card.features.map((feature, idx) => (
                                <li key={idx} className="feature-point">
                                <span className="check-mark">✓</span>
                                {feature}
                                </li>
                            ))}
                            </ul>
                        </div>
                        
                        <div className="card-footer">
                            <button className="learn-more-btn">
                            Learn More →
                            </button>
                        </div>
                    </Card>
                ))}
                </CardSwap>
            </div>
        </div>
    )
    

    




}