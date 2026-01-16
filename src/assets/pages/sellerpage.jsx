import React, { useState, useEffect } from 'react';
import './sellerpage.css';
import { supabase } from '../../lib/supabase';
import { Settings } from 'lucide-react';

const SellerPage = ({ params, onNavigate }) => {
  const sellerParam = params?.seller; 
  const [seller, setSeller] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [liveListings, setLiveListings] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // image optimization with automatic resizing
  const optImg = (url, width) => {
    if (!url) return '';
    if (url.includes('dicebear')) return url;
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
  };

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
        <img
          src={optImg(avatarFor(seller), 150)}
          alt="avatar"
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
                  <img src={optImg(safeFirstImage(item), 400)} className="card-image" alt="item" />
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
                  <img src={optImg(safeFirstImage(item), 400)} className="grid-image" alt="item" />
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