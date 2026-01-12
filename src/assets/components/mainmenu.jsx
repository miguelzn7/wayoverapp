import React from 'react';
import { MessageCircle, Plus, CameraIcon } from 'lucide-react';
import './mainmenu.css';

const MainMenu = ({ onNavigate, currentPage }) => {
        return (
                <div className="bottom-nav">
                        <div className="nav-content">
                                <button
                                        className={`nav-btn ${currentPage === 'swipe' ? 'active' : ''}`}
                                        onClick={() => onNavigate && onNavigate('swipe')}
                                >
                                        <CameraIcon size={30} />
                                </button>
                                    <button
                                        className={`nav-btn nav-btn-add ${currentPage === 'addls' ? 'active' : ''}`}
                                        onClick={() => onNavigate && onNavigate('addls')}
                                    >
                                        <Plus size={30} />
                                    </button>
                                    <button
                                        className={`nav-btn ${currentPage === 'messages' ? 'active' : ''}`}
                                        onClick={() => onNavigate && onNavigate('messages')}
                                    >
                                        <MessageCircle size={30} />
                                </button>
                        </div>
                </div>    
        );
};

export default MainMenu;