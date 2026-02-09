import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../lib/supabase';
import './browsepage.css';
import { parseImages } from '../lib/utils';
import OptimizedImage from '../components/OptimizedImage';
import { Heart, Search } from 'lucide-react';

const BrowsePage = ({ params, onNavigate }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(params?.search || '');
  const [selectedTag, setSelectedTag] = useState(null);

  const POPULAR_TAGS = ['vintage', 'streetwear', 'y2k', 'denim', 'shoes', 'hoodie'];

  useEffect(() => {
    if (params?.search !== undefined) {
      setSearchTerm(params.search);
    }
  }, [params]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (selectedTag) query = query.contains('tags', [selectedTag]);
        if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);

        const { data, error } = await query;
        if (error) throw error;
        setListings(data || []);
      } catch (err) {
        // Error loading browse - continue with empty state
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [selectedTag, searchTerm]);

  const getFirstImage = (item) => {
    const images = parseImages(item.images);
    return images.length > 0 ? images[0] : null;
  };

  const getDiscount = (item) => {
    if (item.original_price && item.original_price > item.price) {
      return Math.round((1 - item.price / item.original_price) * 100);
    }
    return null;
  };

  return (
    <div className="browse-page">
      {/* Search bar */}
      <div className="browse-search-wrap">
        <div className="browse-search-box">
          <Search size={18} className="browse-search-icon" />
          <input
            type="text"
            className="browse-search-input"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="browse-header">
        <div className="tags-scroller">
          <button
            className={`tag-chip ${selectedTag === null ? 'active' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            All
          </button>

          {POPULAR_TAGS.map(tag => (
            <button
              key={tag}
              className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="browse-grid">
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="empty-text">No items found.</p>
        ) : (
          listings.map(item => {
            const discount = getDiscount(item);
            return (
              <div key={item.id}
                className="browse-card"
                onClick={() => onNavigate && onNavigate('listing', { item: item })}>
                <div className="image-wrapper">
                  <OptimizedImage
                    src={getFirstImage(item)}
                    alt={`${item.name} - thumbnail`}
                    size="card"
                    loading="lazy"
                  />
                  {discount && (
                    <span className="discount-badge">{discount}% OFF</span>
                  )}
                  <button className="like-btn" onClick={(e) => { e.stopPropagation(); }}>
                    <Heart size={18} />
                  </button>
                </div>
                <div className="card-details">
                  <h3>{item.name}</h3>
                  <div className="card-price-row">
                    <span className="card-price">${item.price}</span>
                    {item.original_price && item.original_price > item.price && (
                      <span className="card-original-price">${item.original_price}</span>
                    )}
                  </div>
                  {item.seller && <span className="card-seller">{item.seller}</span>}
                  <div className="card-tags">
                    {item.size && <span className="tiny-tag">{item.size}</span>}
                    {item.condition && <span className="tiny-tag">{item.condition}</span>}
                    {(!item.size && !item.condition) && item.tags && item.tags.slice(0, 2).map(t => (
                      <span key={t} className="tiny-tag">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

BrowsePage.propTypes = {
  params: PropTypes.shape({
    search: PropTypes.string,
  }),
  onNavigate: PropTypes.func,
};

BrowsePage.defaultProps = {
  params: null,
  onNavigate: null,
};

export default BrowsePage;
