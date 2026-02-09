import React, { useState } from 'react';
import { Search, User, CameraIcon, Plus, MessageCircle } from 'lucide-react';
import './header.css';

const Header = ({ onNavigate, currentPage }) => {
    const [searchText, setSearchText] = useState('');

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter') {
            if (onNavigate) {
                onNavigate('browse', { search: searchText });
            }
            e.target.blur();
        }
    };

    return (
        <div className="header">
            {/* go to seller profile */}
            <button className="icon-btn" onClick={() => onNavigate && onNavigate('seller')}>
                <User size={34} />
            </button>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search items..."
                    className="search-input"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                />
                <Search className="search-icon" size={20} />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="desktop-nav">
                <button
                    className={`nav-link ${currentPage === 'swipe' ? 'active' : ''}`}
                    onClick={() => onNavigate && onNavigate('swipe')}
                >
                    <CameraIcon size={20} />
                    <span>Swipe</span>
                </button>
                <button
                    className={`nav-link ${currentPage === 'addls' ? 'active' : ''}`}
                    onClick={() => onNavigate && onNavigate('addls')}
                >
                    <Plus size={20} />
                    <span>Sell</span>
                </button>
                <button
                    className={`nav-link ${currentPage === 'messages' ? 'active' : ''}`}
                    onClick={() => onNavigate && onNavigate('messages')}
                >
                    <MessageCircle size={20} />
                    <span>Messages</span>
                </button>
            </nav>
        </div>
    );
}

export default Header;