import React from 'react';
import PropTypes from 'prop-types';
import { Home, Zap, User } from 'lucide-react';
import './tabbar.css';

const TabBar = ({ onNavigate, currentPage }) => {
    const tabs = [
        { id: 'browse', label: 'Browse', icon: Home },
        { id: 'swipe', label: 'Swipe', icon: Zap },
        { id: 'seller', label: 'Profile', icon: User },
    ];

    const handleClick = (tabId) => {
        if (tabId === 'seller') {
            onNavigate('seller');
        } else {
            onNavigate(tabId);
        }
    };

    const isActive = (tabId) => {
        if (tabId === 'seller') return currentPage === 'seller';
        if (tabId === 'browse') return currentPage === 'browse' || currentPage === 'listing';
        return currentPage === tabId;
    };

    return (
        <div className="bottom-nav">
            <div className="tab-bar-content">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        className={`tab-btn ${isActive(id) ? 'active' : ''}`}
                        onClick={() => handleClick(id)}
                    >
                        <div className="tab-icon-wrap">
                            <Icon size={22} strokeWidth={isActive(id) ? 2.5 : 2} />
                        </div>
                        <span className="tab-label">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

TabBar.propTypes = {
    onNavigate: PropTypes.func.isRequired,
    currentPage: PropTypes.string.isRequired,
};

export default TabBar;

