import React, { useState } from 'react';
import './listingpage.css';
import { MessageCircle } from 'lucide-react';

const ListingPage = ({ params, onNavigate }) => {
    const item = params?.item;
    const [activeImgIndex, setActiveImgIndex] = useState(0);

    if (!item) return <div className="listing-page error">item not found</div>;
    
    //img parse safely
    let images = [];
    try {
        if (Array.isArray(item.images)) images = item.images;
        else if (typeof item.images === 'string') images = JSON.parse(item.images);
    
    } catch (e) {
        images = [item.images];
    }
    //fallback - get placeholder image
    if (!images || images.length === 0) images = ['https://via.placeholder.com/400'];

    const handleScroll = (e) => {
        const scrollLeft = e.target.scrollLeft;
        const width = e.target.offsetWidth;
        const index = Math.round(scrollLeft / width);
        setActiveImgIndex(index);

    };
    
    //gen a placeholder avatar if needed
    const sellerAvatar = `https://api.dicebear.com/6.x/identicon/svg?seed=${item.seller}`;

     return (
    <div className="listing-page">
      
      {/* 1. Image Carousel */}
      <div className="carousel-container">
        <div className="carousel-track" onScroll={handleScroll}>
          {images.map((img, idx) => (
            <img key={idx} src={img} alt="listing" className="carousel-image" />
          ))}
        </div>
        
        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="image-dots">
            {images.map((_, idx) => (
              <div key={idx} className={`dot ${idx === activeImgIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* 2. Main Details */}
      <div className="listing-details">
        <div className="title-row">
          <h1>{item.name}</h1>
          <span className="price-text">${item.price}</span>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn-buy">Buy Now</button>
          <button className="btn-offer">Make Offer</button>
        </div>

        {/* Description */}
        <div className="info-block">
          <h3>Description</h3>
          <p>{item.description || "No description provided."}</p>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="info-block">
            <div className="tags-row">
              {item.tags.map(tag => (
                <span key={tag} className="detail-tag">#{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Seller Profile Card */}
      <div className="seller-card-container">
        <div className="seller-row" onClick={() => onNavigate('seller', { seller: item.seller })}>
          <img src={sellerAvatar} alt="seller" className="seller-pfp" />
          <div className="seller-info">
            <span className="seller-label">Sold by</span>
            <span className="seller-username">{item.seller}</span>
          </div>
          <button 
            className="btn-message"
            onClick={(e) => {
              e.stopPropagation(); // Don't trigger profile click
              onNavigate('messages');
            }}
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ListingPage;