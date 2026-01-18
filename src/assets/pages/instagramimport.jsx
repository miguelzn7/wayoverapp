import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Loader2, PlusCircle } from 'lucide-react';
import './instagramimport.css';

const InstagramImport = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  // posts currently displayed
  const [posts, setPosts] = useState([]);
  
  // posts downloaded but not yet shown
  const [buffer, setBuffer] = useState([]); 

  const [selectedIds, setSelectedIds] = useState([]);

  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_SCRAPER_URL;
  const N8N_PARSE_URL = import.meta.env.VITE_N8N_PARSER_URL;

  // batch fetch logic for smart preloading
  const handleFetch = async (e) => {
    if (e) e.preventDefault();
    if (!username) return;
    
    // if buffer has items, use those first
    if (buffer.length > 0) {
        const nextBatch = buffer.slice(0, 4);
        const remainingBuffer = buffer.slice(4);
        
        setPosts(prev => [...prev, ...nextBatch]);
        setBuffer(remainingBuffer);
        return;
    }

    // buffer is empty, fetch from server
    setLoading(true);
    
    // fresh search clears posts, load more keeps them
    const isLoadMore = posts.length > 0;
    if (!isLoadMore) {
        setPosts([]);
        setBuffer([]);
    }
    
    try {
      // fetch batch of posts and preload buffer for smooth scrolling
      const BATCH_SIZE = 12;
      const currentTotal = posts.length;
      const limit = currentTotal + BATCH_SIZE;

      const response = await fetch(`${N8N_WEBHOOK_URL}?username=${username}&limit=${limit}`);
      const data = await response.json();
      
      let incomingPosts = [];
      if (Array.isArray(data)) incomingPosts = data;
      else if (data.data && Array.isArray(data.data)) incomingPosts = data.data;
      else if (data.displayUrl) incomingPosts = [data];

      if (incomingPosts.length > 0) {
        // remove duplicate posts already on screen
        const brandNewPosts = incomingPosts.filter(
            newPost => !posts.some(existingPost => existingPost.url === newPost.url)
        );

        if (brandNewPosts.length === 0) {
            alert("No new posts found.");
        } else {
            // show first batch to user
            const toShow = brandNewPosts.slice(0, 4);
            
            // save remaining posts for preloading
            const toBuffer = brandNewPosts.slice(4);

            if (isLoadMore) {
                setPosts(prev => [...prev, ...toShow]);
            } else {
                setPosts(toShow);
            }
            setBuffer(toBuffer);
        }
      } else {
        alert("No posts found.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Error connecting to n8n.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (post) => {
    if (selectedIds.some(p => p.url === post.url)) {
      setSelectedIds(selectedIds.filter(p => p.url !== post.url));
    } else {
      setSelectedIds([...selectedIds, post]);
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      let exchangeRate = 0.000065; 
      try {
        const rateRes = await fetch('https://api.frankfurter.app/latest?from=IDR&to=USD');
        const rateData = await rateRes.json();
        if (rateData.rates?.USD) exchangeRate = rateData.rates.USD;
      } catch (e) { console.warn("Using fallback rate"); }

      const processedItems = await Promise.all(
        selectedIds.map(async (post) => {
          let allImages = [];
          if (post.images && Array.isArray(post.images) && post.images.length > 0) {
            allImages = post.images;
          } else if (post.displayUrl) {
            allImages = [post.displayUrl];
          }

          let enhancedData = {
            name: 'Untitled Item',
            price: 0,
            currency: 'USD',
            description: post.caption || '',
            tags: []
          };

          if (post.caption && post.caption.trim()) {
            try {
              const response = await fetch(N8N_PARSE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caption: post.caption })
              });
              
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const text = await response.text();
              let result;
              try { result = JSON.parse(text); } 
              catch (e) { 
                  const jsonMatch = text.match(/\{[\s\S]*\}/);
                  if (jsonMatch) result = JSON.parse(jsonMatch[0]);
                  else throw new Error('No JSON');
              }
              
              const aiResult = result.success ? result.data : result;
              
              if (aiResult && aiResult.name) {
                let finalPrice = parseFloat(aiResult.price) || 0;
                if (aiResult.currency === 'IDR' && finalPrice > 0) {
                  finalPrice = parseFloat((finalPrice * exchangeRate).toFixed(2));
                }
                enhancedData = {
                  name: aiResult.name,
                  price: finalPrice,
                  currency: 'USD',
                  description: aiResult.description || post.caption,
                  tags: Array.isArray(aiResult.tags) ? aiResult.tags : []
                };
              }
            } catch (e) { console.error("Caption parsing failed:", e); }
          }
          return { ...post, ...enhancedData, images: allImages };
        })
      );
      onNavigate('import-editor', { items: processedItems });
    } catch (err) {
      console.error("Processing error:", err);
      alert("Error processing items: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFastGridImage = (url) => {
      return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=250&h=250&fit=cover&q=65&output=webp`;
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '160px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => onNavigate('addls')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}><ArrowLeft size={24} /></button>
        <h2 style={{ margin: 0 }}>Import from Instagram</h2>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'center' }}>
        <span style={{ fontSize: '1.2rem' }}>@</span>
        <input 
          type="text" 
          placeholder="username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch(e)}
          style={{ flex: 1, padding: '12px', fontSize: '1rem', border: '2px solid #e5e7eb', borderRadius: '8px' }}
        />
        <button 
          onClick={handleFetch}
          disabled={loading}
          style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          {loading && posts.length === 0 ? <Loader2 size={20} className="spin" /> : 'Fetch'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {posts.map((post, idx) => {
          const isSelected = selectedIds.some(p => p.url === post.url);
          return (
            <div 
              key={post.id || idx} 
              onClick={() => toggleSelection(post)}
              style={{
                position: 'relative', cursor: 'pointer',
                border: isSelected ? '3px solid #10b981' : '1px solid #e5e7eb',
                borderRadius: '8px', overflow: 'hidden', aspectRatio: '1'
              }}
            >
              <img 
                src={getFastGridImage(post.displayUrl)} 
                alt="post" 
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }}
              />
              {isSelected && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={48} color="white" fill="#10b981" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(posts.length > 0 || buffer.length > 0) && (
        <div style={{ textAlign: 'center', marginBottom: '-25px' }}>
           <button
             onClick={(e) => handleFetch(e)}
             disabled={loading}
             style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '12px 24px', borderRadius: '24px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
           >
             {loading ? <Loader2 size={18} className="spin" /> : <PlusCircle size={18} />}
             Load Next 4
           </button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div style={{ position: 'fixed', bottom: '230px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100, padding: '0 20px', pointerEvents: 'none' }}>
          <button 
            onClick={handleNext}
            disabled={loading}
            style={{
              background: '#10b981', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, pointerEvents: 'auto'
            }}
          >
            {loading ? 'Processing...' : `Import ${selectedIds.length} Items`}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
};

export default InstagramImport;