import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import './header.css';

const Header = ({ onNavigate }) => {
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
            {/* ROUTES TO SELLER (Me) */}
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
        </div>
    );
}

export default Header;