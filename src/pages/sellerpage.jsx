import React, { useState, useEffect } from 'react';
import './sellerpage.css';
import { supabase } from '../lib/supabase';
import { Settings, Trash2, Edit3 } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';

const SellerPage = ({ params, onNavigate }) => {
  const sellerParam = params?.seller;
  const [seller, setSeller] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [liveListings, setLiveListings] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsOwner(false);

        const { data: { user } } = await supabase.auth.getUser();

        let targetUsername = sellerParam;
        let foundUser = null;

        if (!targetUsername && user) {
          const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (myProfile) {
            foundUser = myProfile;
            targetUsername = myProfile.username;
            setIsOwner(true);
          }
        }
        else if (targetUsername) {
          const { data: profileData } = await supabase.from('profiles').select('*').ilike('username', targetUsername).maybeSingle();
          if (profileData) {
            foundUser = profileData;
            if (user && profileData.id === user.id) setIsOwner(true);
          } else {
            const { data: sellerData } = await supabase.from('sellers').select('*').ilike('username', targetUsername).maybeSingle();
            foundUser = sellerData;
          }
        }

        if (!foundUser) { setError("User not found"); setLoading(false); return; }
        setSeller(foundUser);

        if (targetUsername) {
          const { data: liveData } = await supabase.from('livelistings').select('*').ilike('seller', targetUsername);
          setLiveListings(liveData || []);

          const { data: listingsData } = await supabase.from('listings').select('*').ilike('seller', targetUsername);
          setListings(listingsData || []);
        }

      } catch (err) { setError('Failed to load data'); } finally { setLoading(false); }
    };
    fetchData();
  }, [sellerParam]);

  const handleDelete = async (e, itemId, isLive) => {
    e.stopPropagation(); // Prevent navigating to the listing page

    const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
    if (!confirmDelete) return;

    try {
      const table = isLive ? 'livelistings' : 'listings';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Update UI optimistically
      if (isLive) {
        setLiveListings(prev => prev.filter(item => item.id !== itemId));
      } else {
        setListings(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (err) {
      alert("Error deleting listing: " + err.message);
    }
  };

  const handleEdit = (e, item, isLive) => {
    e.stopPropagation();
    // We send it to the import-editor as an array of 1 item
    onNavigate('import-editor', {
      items: [{ ...item, isEditing: true, table: isLive ? 'livelistings' : 'listings' }]
    });
  };

  const safeFirstImage = (item) => {
    if (!item) return null;
    const imgs = item.images;
    if (!imgs) return null;
    try {
      if (Array.isArray(imgs)) return imgs[0];
      if (typeof imgs === 'string') {
        const parsed = JSON.parse(imgs);
        return Array.isArray(parsed) ? parsed[0] : parsed;
      }
    } catch (e) { return imgs; }
    return null;
  };

  const avatarFor = (sellerObj) => {
    if (!sellerObj) return null;
    if (sellerObj.avatar_url) return sellerObj.avatar_url;
    const seed = encodeURIComponent(sellerObj.username || 'anon');
    return `https://api.dicebear.com/6.x/identicon/svg?seed=${seed}`;
  };

  if (loading) return <div className="seller-page"><p>Loading...</p></div>;
  if (error) return <div className="seller-page"><p>{error}</p></div>;
  if (!seller) return <div className="seller-page"><p>Seller not found.</p></div>;

  return (
    <div className="seller-page">
      <header className="seller-header">
        {/* seller avatar */}
        <OptimizedImage
          src={avatarFor(seller)}
          alt="avatar"
          size="avatar"
          className="seller-avatar"
        />
        <div className="seller-meta">
          <h1 className="seller-name">{seller.username}</h1>
          <div className="seller-sub">
            <span className="seller-location">
              {seller.location ? `${seller.location}, ${seller.country}` : seller.country || 'No Location'}
            </span>
            {seller.rating && <span className="seller-rating">★ {seller.rating}</span>}
          </div>
        </div>

        {isOwner && (
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => onNavigate('onboarding')}
              style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Settings size={16} /> Edit Profile
            </button>
          </div>
        )}
      </header>

      <section className="listings-section">
        <h2 className="section-title">Live Listings</h2>
        {liveListings.length === 0 ? <p className="empty">No live listings.</p> : (
          <div className="live-scroller">
            {liveListings.map((item) => (
              <div className="live-card" key={`live-${item.id}`} onClick={() => onNavigate && onNavigate('listing', { item: item })}>
                <div className="card-image-wrap">
                  {/* live listing image */}
                  <OptimizedImage src={safeFirstImage(item)} size="card" className="card-image" alt="item" />

                  {/* OWNER CONTROLS */}
                  {isOwner && (
                    <div className="owner-controls">
                      <button className="control-btn edit" onClick={(e) => handleEdit(e, item, true)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="control-btn delete" onClick={(e) => handleDelete(e, item.id, true)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  <div className="price-badge">${item.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="listings-section">
        <h2 className="section-title">All Listings</h2>
        {listings.length === 0 ? <p className="empty">No listings.</p> : (
          <div className="grid">
            {listings.map((item) => (
              <div className="grid-card" key={`listing-${item.id}`} onClick={() => onNavigate && onNavigate('listing', { item: item })}>
                <div className="grid-image-wrap">
                  {/* listing image */}
                  <OptimizedImage src={safeFirstImage(item)} size="card" className="grid-image" alt="item" />

                  {/* OWNER CONTROLS */}
                  {isOwner && (
                    <div className="owner-controls">
                      <button className="control-btn edit" onClick={(e) => handleEdit(e, item, false)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="control-btn delete" onClick={(e) => handleDelete(e, item.id, false)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  <div className="price-badge small">${item.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SellerPage;
