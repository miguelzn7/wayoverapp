import React from 'react';
import PropTypes from 'prop-types';
import { MessageCircle, Home, Sparkles } from 'lucide-react';
import './tabbar.css';

const TabBar = ({ onNavigate, currentPage, currentSeller }) => {
    
    const handleSellerClick = () => {
        if (currentSeller) {
            onNavigate('seller', { seller: currentSeller });
        }
    };

    return (
        <div className="bottom-nav">
            <div className="nav-content">
            {/* browse listings button */}
            <button
                className={`nav-btn ${currentPage === 'browse' ? 'active' : ''}`}
                onClick={() => onNavigate('browse')}
            >  
                <Sparkles size={30} />
            </button>

            {/* current seller profile button */}
            <button 
                   className={`nav-btn nav-btn-home ${currentPage === 'seller' ? 'active' : ''}`}
                   onClick={handleSellerClick}
                   disabled={!currentSeller}
                   style={{ opacity: currentSeller ? 1 : 0.5 }}
            >
                   <Home size={40} />
            </button>

            {/* messages button */}
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

TabBar.propTypes = {
    onNavigate: PropTypes.func.isRequired,
    currentPage: PropTypes.string.isRequired,
    currentSeller: PropTypes.string,
};

TabBar.defaultProps = {
    currentSeller: null,
};

export default TabBar;

