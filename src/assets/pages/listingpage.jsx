import React, { useState } from 'react';
import './listingpage.css';
import { MessageCircle } from 'lucide-react';
import { parseImages } from '../../lib/utils';

const ListingPage = ({ params, onNavigate }) => {
    const item = params?.item;
    const [activeImgIndex, setActiveImgIndex] = useState(0);

    if (!item) return <div className="listing-page error">item not found</div>;
    
    // parse images safely using utility function
    let images = parseImages(item.images);
    // fallback to placeholder if no images
    if (!images || images.length === 0) images = ['https://via.placeholder.com/400'];

    const handleScroll = (e) => {
        const scrollLeft = e.target.scrollLeft;
        const width = e.target.offsetWidth;
        const index = Math.round(scrollLeft / width);
        setActiveImgIndex(index);

    };
    
    // generate placeholder avatar based on seller name
    const sellerAvatar = `https://api.dicebear.com/6.x/identicon/svg?seed=${item.seller}`;

     return (
    <div className="listing-page">
      
      {/* image carousel */}
      <div className="carousel-container">
        <div className="carousel-track" onScroll={handleScroll}>
          {images.map((img, idx) => (
            <img key={idx} src={img} alt={`${item.name} - Image ${idx + 1}`} className="carousel-image" />
          ))}
        </div>
        
        {/* image indicator dots */}
        {images.length > 1 && (
          <div className="image-dots">
            {images.map((_, idx) => (
              <div key={idx} className={`dot ${idx === activeImgIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* listing details section */}
      <div className="listing-details">
        <div className="title-row">
          <h1>{item.name}</h1>
          <span className="price-text">${item.price}</span>
        </div>

        {/* action buttons */}
        <div className="action-buttons">
          <button className="btn-buy">Buy Now</button>
          <button className="btn-offer">Make Offer</button>
        </div>

        {/* item description */}
        <div className="info-block">
          <h3>Description</h3>
          <p>{item.description || "No description provided."}</p>
        </div>

        {/* item tags */}
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

      {/* seller profile card */}
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
              e.stopPropagation();
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