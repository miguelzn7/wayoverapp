import React from 'react';
import { MessageCircle, Home, Sparkles } from 'lucide-react';
import './tabbar.css';

const TabBar = ({ onNavigate, currentPage, currentSeller }) => {
    
    const handleSellerClick = () => {
        if (currentSeller) {
            onNavigate('seller', { seller: currentSeller });
        } else {
            console.log("No seller loaded yet");
        }
    };

    return (
        <div className="bottom-nav">
            <div className="nav-content">
                {/* Left Button - Browse/Grid View */}
                <button
                    className={`nav-btn ${currentPage === 'browse' ? 'active' : ''}`}
                    onClick={() => onNavigate('browse')}
                >  
                    <Sparkles size={30} />
                </button>

                {/* Middle Button - Go to Current Swipe's Seller Profile */}
                <button 
                       className={`nav-btn nav-btn-home ${currentPage === 'seller' ? 'active' : ''}`}
                       onClick={handleSellerClick}
                       disabled={!currentSeller} // Optional: prevents clicking if loading
                       style={{ opacity: currentSeller ? 1 : 0.5 }} // Visual cue
                >
                       <Home size={40} />
                </button>

                {/* Right Button - Messages */}
                <button
                    className={`nav-btn ${currentPage === 'messages' ? 'active' : ''}`}
                    onClick={() => onNavigate('messages')}
                > 
                    <MessageCircle size={30} />
                </button>
            </div>
        </div>    
    );
};

export default TabBar;

