import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../lib/supabase';
import './browsepage.css';
import { parseImages } from '../../lib/utils'; 

const BrowsePage = ({ params, onNavigate }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(params?.search || '');
  const [selectedTag, setSelectedTag] = useState(null);

  const POPULAR_TAGS = ['vintage', 'streetwear', 'y2k', 'denim', 'shoes', 'hoodie'];

  // optimize image urls with automatic sizing and format conversion
  const optImg = (url) => {
    if (!url) return 'https://via.placeholder.com/400';
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&q=80&output=webp`;
  };

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

  return (
    <div className="browse-page">
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
          listings.map(item => (
            <div key={item.id} 
            className="browse-card"
            onClick={() => onNavigate && onNavigate('listing', { item: item })}>
              <div className="image-wrapper">
                <img 
                    src={optImg(getFirstImage(item))} 
                    alt={`${item.name} - thumbnail`}
                    loading="lazy" 
                />
                <span className="price-tag">${item.price}</span>
              </div>
              <div className="card-details">
                <h3>{item.name}</h3>
                <div className="card-tags">
                   {item.tags && item.tags.slice(0,2).map(t => (
                     <span key={t} className="tiny-tag">#{t}</span>
                   ))}
                </div>
              </div>
            </div>
          ))
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