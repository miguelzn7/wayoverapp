import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './browsepage.css'; 

const BrowsePage = ({ params, onNavigate }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(params?.search || '');
  const [selectedTag, setSelectedTag] = useState(null);

  const POPULAR_TAGS = ['vintage', 'streetwear', 'y2k', 'denim', 'shoes', 'hoodie'];

  // --- QUICK OPTIMIZER ---
  const optImg = (url) => {
    if (!url) return 'https://via.placeholder.com/400';
    // Request 400px width, 80% quality, WebP format
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
        console.error('Error loading browse:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [selectedTag, searchTerm]);

  const getFirstImage = (item) => {
    try {
      if (Array.isArray(item.images)) return item.images[0];
      return JSON.parse(item.images)[0];
    } catch (e) {
      return null;
    }
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
                {/* OPTIMIZED IMAGE SOURCE */}
                <img 
                    src={optImg(getFirstImage(item))} 
                    alt={item.name} 
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

export default BrowsePage;