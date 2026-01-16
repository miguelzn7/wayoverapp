import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, ChevronLeft, Upload, CheckCircle, X } from 'lucide-react';
import './importeditor.css';
import { supabase } from '../../lib/supabase'; 

const ImportEditor = ({ params, onNavigate }) => {
  const initialItems = params?.items || [];
  
  const [queue, setQueue] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [listingType, setListingType] = useState('regular');
  const [uploadStatus, setUploadStatus] = useState({});
  
  const currentItem = queue[currentIndex];

  useEffect(() => {
    if (!initialItems || initialItems.length === 0) {
      onNavigate('addls');
    }
  }, [initialItems, onNavigate]);

  useEffect(() => {
    setImageIndex(0);
    setListingType('regular');
  }, [currentIndex]);

  const updateField = (field, value) => {
    const newQueue = [...queue];
    newQueue[currentIndex] = { ...newQueue[currentIndex], [field]: value };
    setQueue(newQueue);
  };

  // tag editing
  const [currentTag, setCurrentTag] = useState('');
  const addTag = () => {
    const clean = (currentTag || '').trim().toLowerCase();
    if (!clean) return;
    const existing = Array.isArray(currentItem.tags) ? currentItem.tags : [];
    if (existing.includes(clean)) return alert('Tag already added');
    if (existing.length >= 5) return alert('Max 5 tags allowed');
    updateField('tags', [...existing, clean]);
    setCurrentTag('');
  };
  const removeTagAt = (idx) => {
    const existing = Array.isArray(currentItem.tags) ? currentItem.tags : [];
    updateField('tags', existing.filter((_, i) => i !== idx));
  };

  // image removal
  const removeImageAt = (idx) => {
    let images = currentItem.images;
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch (e) { images = []; }
    }
    if (!Array.isArray(images)) images = [];
    const newImages = images.filter((_, i) => i !== idx);
    updateField('images', newImages);
    // update image index if needed
    if (newImages.length === 0) setImageIndex(0);
    else if (imageIndex >= newImages.length) setImageIndex(Math.max(0, newImages.length - 1));
  };

  const displayImages = (() => {
    if (!currentItem) return [];
    let images = currentItem.images;
    if (typeof images === 'string') try { images = JSON.parse(images); } catch(e){}
    return Array.isArray(images) && images.length > 0 ? images : (currentItem.displayUrl ? [currentItem.displayUrl] : []);
  })();

  // fast image url generators for optimization
  const getMainImage = (url) => {
      return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=600&q=75&output=webp`;
  };

  const getThumbImage = (url) => {
      return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=80&h=80&fit=cover&q=60&output=webp`;
  };

  const uploadItemInBackground = async (item, itemId, type) => {
    setUploadStatus(prev => ({ ...prev, [itemId]: 'uploading' }));
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.user) throw new Error("Not logged in");

      const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).maybeSingle();
      const sellerName = profile?.username || session.user.email.split('@')[0] || "Unknown";

      // upload images from item
      const uploadedImageUrls = [];
      let imagesToUpload = item.images;
      
      if (typeof imagesToUpload === 'string') { try { imagesToUpload = JSON.parse(imagesToUpload); } catch (e) { imagesToUpload = []; } }
      if (!Array.isArray(imagesToUpload) || imagesToUpload.length === 0) { imagesToUpload = item.displayUrl ? [item.displayUrl] : []; }

      for (let i = 0; i < imagesToUpload.length; i++) {
        const imgUrl = imagesToUpload[i];
        try {
          // fetch image via proxy for safe cross-origin access
          const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(imgUrl)}&output=webp&q=80`;
          const res = await fetch(proxyUrl);
          if (!res.ok) continue;
          const blob = await res.blob();
          const fileName = `${session.user.id}/${Date.now()}-${i}.webp`;
          const { error: upError } = await supabase.storage.from('listing-images').upload(fileName, blob);
          if (upError) continue;
          const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
          uploadedImageUrls.push(urlData.publicUrl);
        } catch (imgError) { 
          // skip image on failure and continue with next one
        }
      }

      const table = type === 'live' ? 'livelistings' : 'listings';
      const listingData = {
        name: item.name,
        price: parseFloat(item.price),
        description: item.description || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        images: uploadedImageUrls,
        seller: sellerName,
        seller_id: session.user.id,
        created_at: new Date().toISOString(),
        ...(type === 'live' && { timeRemaining: 900 })
      };

      const { error: dbError } = await supabase.from(table).insert([listingData]);
      if (dbError) throw dbError;

      setUploadStatus(prev => ({ ...prev, [itemId]: 'success' }));
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [itemId]: 'error' }));
    }
  };

  const handleNext = () => {
    if (!currentItem.name || !currentItem.price) return alert("Title and Price are required.");
    const itemId = `item-${currentIndex}-${Date.now()}`;
    uploadItemInBackground(currentItem, itemId, listingType);
    
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setTimeout(() => {
        alert(`Done! All items are processing in background.`);
        onNavigate('browse');
      }, 500);
    }
  };

  if (!currentItem) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  const totalUploads = Object.keys(uploadStatus).length;
  const uploadingCount = Object.values(uploadStatus).filter(s => s === 'uploading').length;

  return (
    <div style={{ paddingBottom: '160px', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 40px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'white', zIndex: 50 }}>
        <button onClick={() => onNavigate('insta-import')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
        <div style={{ background: '#f3f4f6', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600' }}>Item {currentIndex + 1} of {queue.length}</div>
        <div style={{ width: 24 }}></div>
      </div>

      {totalUploads > 0 && (
        <div style={{ background: uploadingCount > 0 ? '#eff6ff' : '#f0fdf4', padding: '12px 20px', display: 'flex', gap: '12px', fontSize: '0.9rem' }}>
          {uploadingCount > 0 ? <Upload size={20} className="spin" /> : <CheckCircle size={20} color="#10b981" />}
          <span style={{ fontWeight: '600' }}>{uploadingCount > 0 ? `Uploading ${uploadingCount} items...` : 'Uploads complete'}</span>
        </div>
      )}

      {/* optimized carousel for image selection */}
      <div style={{ position: 'relative', width: '100%', background: '#f9fafb', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* main preview image */}
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img 
                src={getMainImage(displayImages[imageIndex])} 
                alt="preview" 
                style={{ maxHeight: '400px', maxWidth: '100%', objectFit: 'contain' }} 
            />
            {displayImages.length > 1 && (
                <>
                {imageIndex > 0 && <button onClick={() => setImageIndex(i => i - 1)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><ChevronLeft size={24} /></button>}
                {imageIndex < displayImages.length - 1 && <button onClick={() => setImageIndex(i => i + 1)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><ChevronRight size={24} /></button>}
                </>
            )}
        </div>

        {/* image thumbnails for selection */}
        {displayImages.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto', maxWidth: '100%' }}>
                {displayImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                        <img 
                            src={getThumbImage(img)} 
                            onClick={() => setImageIndex(idx)}
                            style={{ 
                                width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', 
                                border: idx === imageIndex ? '2px solid #10b981' : '1px solid #ddd',
                                opacity: idx === imageIndex ? 1 : 0.6,
                                cursor: 'pointer'
                            }}
                        />
                        <button onClick={(e) => { e.stopPropagation(); removeImageAt(idx); }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}><X size={12} /></button>
                    </div>
                ))}
            </div>
        )}
      </div>

      <div style={{ padding: '0 20px' }}>
        <input 
          placeholder="Item Title"
          value={currentItem.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
          style={{ width: '100%', fontSize: '1.5rem', fontWeight: 'bold', border: 'none', borderBottom: '2px solid #e5e7eb', padding: '12px 0', marginBottom: '16px', outline: 'none' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>$</span>
          <input type="number" placeholder="0" value={currentItem.price || ''} onChange={(e) => updateField('price', e.target.value)} style={{ fontSize: '1.5rem', border: 'none', borderBottom: '2px solid #e5e7eb', padding: '12px 0', width: '200px', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '24px', background: '#f9fafb', padding: '16px', borderRadius: '12px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>Listing Type</label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="radio" name="ltype" value="regular" checked={listingType === 'regular'} onChange={() => setListingType('regular')} />Regular</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="radio" name="ltype" value="live" checked={listingType === 'live'} onChange={() => setListingType('live')} />Live (15m auction)</label>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Description</label>
          <textarea value={currentItem.description || ''} onChange={(e) => updateField('description', e.target.value)} rows={6} style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px' }}>Tags</label>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input 
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="e.g. vintage, nike"
              style={{ flex: 1, padding: '8px', border: '2px solid #e5e7eb', borderRadius: '8px' }}
            />
            <button onClick={addTag} disabled={(currentItem.tags || []).length >= 5 || !currentTag.trim()} style={{ padding: '8px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(currentItem.tags || []).map((tag, idx) => (
              <span key={idx} style={{ background: '#f3f4f6', padding: '6px 12px', borderRadius: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                #{tag}
                <button type="button" onClick={() => removeTagAt(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: '#9ca3af' }}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: '170px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100, padding: '0 20px', pointerEvents: 'none' }}>
        <button 
          onClick={handleNext}
          style={{
            background: '#10b981', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '30px',
            fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px', justifyContent: 'center', pointerEvents: 'auto'
          }}
        >
          {currentIndex === queue.length - 1 ? "Queue & Finish" : "Queue & Next"} <ChevronRight size={20} />
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
};

export default ImportEditor;