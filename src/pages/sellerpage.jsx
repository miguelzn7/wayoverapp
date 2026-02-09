import React, { useState, useEffect } from 'react';
import './sellerpage.css';
import { supabase } from '../lib/supabase';
import { Settings, Trash2, Edit3, Heart, ShoppingBag, Package, LogOut } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';

const SellerPage = ({ params, onNavigate }) => {
  const sellerParam = params?.seller;
  const [seller, setSeller] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [liveListings, setLiveListings] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('listings');
  const [likedItems, setLikedItems] = useState([]);

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
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
    if (!confirmDelete) return;

    try {
      const table = isLive ? 'livelistings' : 'listings';
      const { error } = await supabase.from(table).delete().eq('id', itemId);
      if (error) throw error;

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
    onNavigate('import-editor', {
      items: [{ ...item, isEditing: true, table: isLive ? 'livelistings' : 'listings' }]
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  const allListings = [...liveListings, ...listings];

  if (loading) return <div className="sp-page"><div className="sp-loading">Loading...</div></div>;
  if (error) return <div className="sp-page"><div className="sp-loading">{error}</div></div>;
  if (!seller) return <div className="sp-page"><div className="sp-loading">Seller not found.</div></div>;

  const tabs = isOwner
    ? [
        { id: 'liked', label: 'Liked Items' },
        { id: 'listings', label: 'Listings' },
        { id: 'purchases', label: 'Purchases' },
        { id: 'settings', label: 'Settings' },
      ]
    : [
        { id: 'listings', label: 'Listings' },
      ];

  return (
    <div className="sp-page">
      {/* ===== Profile Header ===== */}
      <div className="sp-header-card">
        <div className="sp-header-top">
          <OptimizedImage
            src={avatarFor(seller)}
            alt="avatar"
            size="avatar"
            className="sp-avatar"
          />
          <div className="sp-header-info">
            <div className="sp-name-row">
              <h1 className="sp-name">{seller.full_name || seller.username}</h1>
              {isOwner && (
                <button className="sp-edit-btn" onClick={() => onNavigate('onboarding')}>
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
              )}
            </div>
            <p className="sp-username">@{seller.username}</p>
            {seller.location && (
              <p className="sp-location">
                <span className="sp-location-dot">&#9678;</span>
                {seller.location}{seller.country ? `, ${seller.country}` : ''}
              </p>
            )}
          </div>
        </div>

        {seller.bio && <p className="sp-bio">{seller.bio}</p>}

        {/* Stats Row */}
        <div className="sp-stats-row">
          <div className="sp-stat-card">
            <Package size={20} />
            <span className="sp-stat-num">{allListings.length}</span>
            <span className="sp-stat-label">Listings</span>
          </div>
          <div className="sp-stat-card">
            <ShoppingBag size={20} />
            <span className="sp-stat-num">0</span>
            <span className="sp-stat-label">Sold</span>
          </div>
          <div className="sp-stat-card">
            <Heart size={20} />
            <span className="sp-stat-num">{likedItems.length}</span>
            <span className="sp-stat-label">Likes</span>
          </div>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="sp-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sp-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Tab Content ===== */}
      <div className="sp-tab-content">
        {/* Liked Items */}
        {activeTab === 'liked' && (
          <div className="sp-empty-state">
            <Heart size={48} strokeWidth={1.5} />
            <h3>No liked items yet</h3>
            <p>Start browsing and like items to save them here</p>
          </div>
        )}

        {/* Listings */}
        {activeTab === 'listings' && (
          allListings.length === 0 ? (
            <div className="sp-empty-state">
              <Package size={48} strokeWidth={1.5} />
              <h3>No listings yet</h3>
              <p>Start selling to see your listings here</p>
            </div>
          ) : (
            <div className="sp-grid">
              {allListings.map((item) => {
                const isLive = liveListings.some(l => l.id === item.id);
                return (
                  <div className="sp-grid-card" key={`item-${item.id}`} onClick={() => onNavigate && onNavigate('listing', { item })}>
                    <div className="sp-card-img-wrap">
                      <OptimizedImage src={safeFirstImage(item)} size="card" className="sp-card-img" alt="item" />
                      {isOwner && (
                        <div className="sp-owner-controls">
                          <button className="sp-ctrl-btn sp-ctrl-edit" onClick={(e) => handleEdit(e, item, isLive)}>
                            <Edit3 size={14} />
                          </button>
                          <button className="sp-ctrl-btn sp-ctrl-del" onClick={(e) => handleDelete(e, item.id, isLive)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      {isLive && <span className="sp-live-badge">LIVE</span>}
                      <div className="sp-price-badge">${item.price}</div>
                    </div>
                    <div className="sp-card-info">
                      <span className="sp-card-title">{item.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Purchases */}
        {activeTab === 'purchases' && (
          <div className="sp-empty-state">
            <ShoppingBag size={48} strokeWidth={1.5} />
            <h3>No purchases yet</h3>
            <p>Items you buy will show up here</p>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="sp-settings">
            <button className="sp-settings-btn" onClick={() => onNavigate('onboarding')}>
              <Settings size={20} />
              <span>Edit Profile</span>
            </button>
            <button className="sp-settings-btn sp-logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerPage;
