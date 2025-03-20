import React, { useState, useRef, useEffect } from 'react';
import './HomePage.css';
// Import the image directly
import teamSkillImage from '../assets/Team skill.jpg';

function HomePage() {
  const [isHovering, setIsHovering] = useState(false);
  const titleRef = useRef(null);
  const originalText = "What's your lore?";
  
  // More refined character set - primarily letters for a cleaner look
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  useEffect(() => {
    let interval;
    
    if (isHovering && titleRef.current) {
      let iteration = 0;
      const maxIterations = 8; // Fewer iterations for a quicker effect
      
      clearInterval(interval);
      
      interval = setInterval(() => {
        // Create scrambled text with more subtle animation
        const newText = originalText
          .split("")
          .map((char, index) => {
            // Keep spaces and punctuation
            if (char === " " || char === "'" || char === "?") return char;
            
            // More controlled randomness - fewer characters change
            const progress = iteration / maxIterations;
            const charProgress = index / originalText.length;
            
            // Create a narrower window where characters change
            // This makes fewer characters change at once
            const shouldScramble = Math.abs(progress - charProgress) < 0.15 && Math.random() > 0.6;
            
            if (shouldScramble) {
              return characters[Math.floor(Math.random() * characters.length)];
            }
            
            return originalText[index];
          })
          .join("");
        
        titleRef.current.innerText = newText;
        
        if (iteration >= maxIterations) {
          clearInterval(interval);
          titleRef.current.innerText = originalText;
        }
        
        iteration += 0.4; // Slightly faster increment
      }, 60); // Slower interval for fewer changes
    } else if (titleRef.current) {
      // Simplified exit - just return to original quickly
      clearInterval(interval);
      titleRef.current.innerText = originalText;
    }
    
    return () => {
      clearInterval(interval);
    };
  }, [isHovering]);
  
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 
            className="hero-title"
            ref={titleRef}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            What's your lore?
          </h1>
          <p 
            className="hero-description"
            style={{ 
              fontSize: '4rem',
              fontWeight: 400,
              color: '#333333',
              marginBottom: '25px',
              lineHeight: 1.2,
              textAlign: 'left',
              maxWidth: '100%',
              display: 'block',
              width: '100%',
              wordBreak: 'break-word'
            }}
          >
            Discover the accumulated and individual skill lore of your product team.
          </p>
        </div>
        
        {/* Image showcase with rounded corners */}
        <div className="video-container">
          <img 
            src={teamSkillImage} 
            alt="Team collaboration" 
            className="showcase-video"
          />
          
          {/* Remove or comment out the video-overlay div */}
          {/* <div className="video-overlay">
            <div className="video-caption">See how teams collaborate effectively</div>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default HomePage; 