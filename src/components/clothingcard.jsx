import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './clothingcard.css';
import { CONSTANTS } from '../lib/navigation';
import OptimizedImage from './OptimizedImage';

const ClothingCard = ({ item, onSwipe, isTop, stackPosition }) => {
    const x = useMotionValue(0);
    const [swipeDirection, setSwipeDirection] = useState(null);
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

    // calculate total slides including description slide
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

        // cycle through images and description slide
        if (clickX < cardWidth / 2) {
            setCurrentImgIndex(prev => prev > 0 ? prev - 1 : totalSlides - 1);
        } else {
            setCurrentImgIndex(prev => (prev + 1) % totalSlides);
        }
    };

    const handleDragEnd = (event, info) => {
        if (info.offset.x > 100) {
            setSwipeDirection('right');
            onSwipe('right');
        } else if (info.offset.x < -100) {
            setSwipeDirection('left');
            onSwipe('left');
        } else {
            x.set(0);
        }
    };

    return (
        <motion.div
            style={{
                x,
                rotate,
                opacity,
                cursor: 'grab',
                touchAction: 'pan-y'
            }}
            animate={
                swipeDirection === 'right'
                    ? { x: 500, opacity: 0 }
                    : swipeDirection === 'left'
                        ? { x: -500, opacity: 0 }
                        : isTop
                            ? { scale: 1, zIndex: 10 }
                            : stackPosition === 1
                                ? { scale: 0.985, zIndex: 9 }
                                : { scale: 0.97, zIndex: 8 }
            }
            transition={swipeDirection ? { duration: 0.3 } : {}}
            drag={isTop && !swipeDirection}
            dragElastic={0.2}
            dragConstraints={{ left: -200, right: 200, top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            className={`card ${!isTop ? 'card-behind' : ''}`}
        >
            <div className="card-content">
                <div className="card-image" onClick={handleImgClick}>


                    {!isInfoSlide ? (
                        item.images && item.images[currentImgIndex] ? (
                            <OptimizedImage
                                src={item.images[currentImgIndex]}
                                alt={`${item.name} - Image ${currentImgIndex + 1} of ${item.images.length}`}
                                size="listing"
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                                loading="lazy"
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                No image
                            </div>
                        )
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

                    {/* render indicator dots for each slide */}
                    {totalSlides > 1 && (
                        <div className="image-dots">
                            {Array.from({ length: totalSlides }).map((_, index) => (
                                <div
                                    key={index}
                                    className={`dot ${index === currentImgIndex ? 'active' : ''}`}
                                    style={index === totalSlides - 1 ? { opacity: 0.8 } : {}}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* hide overlay when showing description slide */}
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

ClothingCard.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        seller: PropTypes.string.isRequired,
        images: PropTypes.array.isRequired,
        description: PropTypes.string,
        tags: PropTypes.array,
        timeRemaining: PropTypes.number,
        expiryTimestamp: PropTypes.number,
    }).isRequired,
    onSwipe: PropTypes.func.isRequired,
    isTop: PropTypes.bool,
    stackPosition: PropTypes.number,
};

ClothingCard.defaultProps = {
    isTop: false,
    stackPosition: 0,
};

export default ClothingCard;
