import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './clothingcard.css';

const ClothingCard = ({ item, onSwipe, isTop }) => {
    const x = useMotionValue(0);
    const y = useTransform(x, [-200, -150, 0, 150, 200], [-150, -100, 0, -100, -150]);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

    const calculateTimeLeft = () => {
        if (!item.expiryTimestamp) return item.timeRemaining || 0;
        const now = Date.now();
        const difference = item.expiryTimestamp - now;
        return Math.max(0, Math.floor(difference / 1000));
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    // 1. Calculate Total Slides (Images + 1 for Description)
    const totalSlides = (item.images?.length || 0) + 1;
    const isInfoSlide = currentImgIndex === (item.images?.length || 0);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [item.expiryTimestamp]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleImgClick = (e) => {
        e.stopPropagation();
        const cardWidth = e.currentTarget.offsetWidth;
        const clickX = e.nativeEvent.offsetX;

        // Loop including the Info Slide
        if (clickX < cardWidth / 2) {
            setCurrentImgIndex(prev => prev > 0 ? prev - 1 : totalSlides - 1);
        } else {
            setCurrentImgIndex(prev => (prev + 1) % totalSlides);
        }
    };

    const handleDragEnd = (event, info) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    return (
        <motion.div
            style={{
                x,
                y,
                rotate,
                opacity,
                cursor: 'grab',
                touchAction: 'pan-y'
            }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: -1110, right: 1110, top: 500, bottom: -500 }}
            onDragEnd={handleDragEnd}
            animate={isTop ? { scale: 1 } : { scale: 0.985 }}
            className={`card ${!isTop ? 'card-behind' : ''}`}
        >
            <div className="card-content">
                <div className="card-image" onClick={handleImgClick}>
                    
                    {/* 2. Render Image OR Info Slide */}
                    {!isInfoSlide ? (
                        <img
                            src={item.images[currentImgIndex]}
                            alt={item.name}
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                        />
                    ) : (
                        <div className="info-slide">
                            <h3>Description</h3>
                            <p>{item.description || "No description provided."}</p>
                            
                            {item.tags && item.tags.length > 0 && (
                                <>
                                    <h3>Tags</h3>
                                    <div className="tags-container">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="tag-pill">#{tag}</span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* 3. Render Dots (Looping based on totalSlides) */}
                    {totalSlides > 1 && (
                        <div className="image-dots">
                            {Array.from({ length: totalSlides }).map((_, index) => (
                                <div
                                    key={index}
                                    className={`dot ${index === currentImgIndex ? 'active' : ''}`}
                                    // Optional: Make the last dot (info) look slightly different?
                                    style={index === totalSlides - 1 ? { opacity: 0.8 } : {}}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Hide Overlay when on Info Slide */}
                <div className={`card-info-overlay ${isInfoSlide ? 'hidden' : ''}`}>
                    <div className="timer-overlay">{formatTime(timeLeft)}</div>
                    <div className="listing-info">
                        <h3>{item.name}</h3>
                        <span className="price">${item.price}</span>
                        <p className="seller">sold by {item.seller}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ClothingCard;