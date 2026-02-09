import React, { useState } from 'react';
import { Search, Zap, Plus, MessageCircle } from 'lucide-react';
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
            <span className="header-brand" onClick={() => onNavigate && onNavigate('swipe')}>
                wayover
            </span>

            <div className="search-container">
                <Search className="search-icon-left" size={18} />
                <input
                    type="text"
                    placeholder="Search items..."
                    className="search-input"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="desktop-nav">
                <button
                    className={`nav-link ${currentPage === 'swipe' ? 'active' : ''}`}
                    onClick={() => onNavigate && onNavigate('swipe')}
                >
                    <Zap size={18} />
                    <span>Swipe</span>
                </button>
                <button
                    className={`nav-link ${currentPage === 'addls' ? 'active' : ''}`}
                    onClick={() => onNavigate && onNavigate('addls')}
                >
                    <Plus size={18} />
                    <span>Sell</span>
                </button>
                <button
                    className={`nav-link ${currentPage === 'messages' ? 'active' : ''}`}
                    onClick={() => onNavigate && onNavigate('messages')}
                >
                    <MessageCircle size={18} />
                    <span>Messages</span>
                </button>
            </nav>
        </div>
    );
}

export default Header;