import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, X } from 'lucide-react';
import './addlisting.css';
import { supabase } from '../../lib/supabase';
import { revokeObjectURLs } from '../../lib/utils';

const AddListing = ({ onNavigate }) => {
  const [session, setSession] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState('regular');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');

  // track uploads happening in background
  const [uploadQueue, setUploadQueue] = useState([]);
  
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (!session) {
        alert('Please log in to add a listing');
        if (onNavigate) onNavigate('welcome');
      }
    });
    return () => (mounted = false);
  }, [onNavigate]);

  // clean up object urls on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      revokeObjectURLs(previews);
    };
  }, [previews]);

  const handleAddTag = (e) => {
    e.preventDefault(); 
    const cleanTag = currentTag.trim().toLowerCase();
    if (!cleanTag) return;
    if (tags.length >= 5) return alert("Max 5 tags allowed");
    if (tags.includes(cleanTag)) return alert("Tag already added");
    setTags([...tags, cleanTag]);
    setCurrentTag('');
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTag(e);
    }
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const fileArray = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...fileArray]);
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImg = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // background upload handler
  const uploadListingInBackground = async (listingData, uploadId) => {
    setUploadQueue(prev => [...prev, { id: uploadId, status: 'uploading', name: listingData.name }]);
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .maybeSingle();

      const sellerName = profile?.username || session.user.email.split('@')[0];

      // upload images
      const imageUrls = [];
      for (const file of listingData.files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);
          
        if (!data?.publicUrl) throw new Error('Failed to get public URL');
        imageUrls.push(data.publicUrl);
      }

      // insert into database
      const table = listingData.listingType === 'live' ? 'livelistings' : 'listings';
      const dbData = {
        name: listingData.name,
        price: parseFloat(listingData.price),
        seller: sellerName,
        seller_id: session.user.id,
        images: imageUrls,
        description: listingData.description,
        tags: listingData.tags,
        created_at: new Date(),
        ...(listingData.listingType === 'live' && { timeRemaining: 900 }),
      };

      const { error: dbError } = await supabase.from(table).insert([dbData]);
      if (dbError) throw dbError;

      // mark upload as successful
      setUploadQueue(prev => prev.map(item => 
        item.id === uploadId ? { ...item, status: 'success' } : item
      ));
      
    } catch (err) {
      setUploadQueue(prev => prev.map(item => 
        item.id === uploadId ? { ...item, status: 'error', error: err.message } : item
      ));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return alert('You must be logged in');
    if (files.length === 0) return alert('Please add at least one image');

    // snapshot listing data before upload
    const listingData = {
      name,
      price,
      description,
      tags: [...tags],
      files: [...files],
      listingType
    };

    // generate unique upload id
    const uploadId = `upload-${Date.now()}`;

    // start background upload process
    uploadListingInBackground(listingData, uploadId);

    // reset form for next listing
    setName('');
    setPrice('');
    setDescription('');
    setTags([]);
    setFiles([]);
    setPreviews([]);
    
    // notify user of background upload
    alert(`"${listingData.name}" is uploading in the background! You can create another listing.`);
  };

  const removeFromQueue = (uploadId) => {
    setUploadQueue(prev => prev.filter(item => item.id !== uploadId));
  };

  const uploadingCount = uploadQueue.filter(u => u.status === 'uploading').length;
  const successCount = uploadQueue.filter(u => u.status === 'success').length;
  const errorCount = uploadQueue.filter(u => u.status === 'error').length;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', paddingBottom: '120px' }}>
      <h2 style={{ marginBottom: '20px' }}>Add a listing</h2>

      {/* upload status tracker */}
      {uploadQueue.length > 0 && (
        <div style={{
          background: uploadingCount > 0 ? '#eff6ff' : successCount === uploadQueue.length ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${uploadingCount > 0 ? '#3b82f6' : successCount === uploadQueue.length ? '#10b981' : '#ef4444'}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '12px',
            fontWeight: '600'
          }}>
            {uploadingCount > 0 && <Upload size={20} className="spin" />}
            {uploadingCount === 0 && successCount === uploadQueue.length && <CheckCircle size={20} color="#10b981" />}
            {uploadingCount === 0 && errorCount > 0 && <XCircle size={20} color="#ef4444" />}
            
            <span>
              {uploadingCount > 0 && `Uploading ${uploadingCount} listing${uploadingCount > 1 ? 's' : ''}...`}
              {uploadingCount === 0 && successCount === uploadQueue.length && `✓ All ${successCount} listing${successCount > 1 ? 's' : ''} uploaded!`}
              {uploadingCount === 0 && errorCount > 0 && `${successCount} succeeded, ${errorCount} failed`}
            </span>
          </div>

          {/* Individual upload items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadQueue.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.status === 'uploading' && <Upload size={16} className="spin" />}
                  {item.status === 'success' && <CheckCircle size={16} color="#10b981" />}
                  {item.status === 'error' && <XCircle size={16} color="#ef4444" />}
                  <span>{item.name}</span>
                </div>
                
                {item.status !== 'uploading' && (
                  <button
                    onClick={() => removeFromQueue(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#9ca3af'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instagram Import Button */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          type="button" 
          onClick={() => onNavigate('insta-import')}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          📸 Import from Instagram
        </button>
      </div>

      {/* Form */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Title
          </label>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Price
          </label>
          <input 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            required 
            type="number" 
            step="0.01"
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Description
          </label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Tags (Optional, max 5)
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input 
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. vintage, nike, green"
              disabled={tags.length >= 5}
              style={{
                flex: 1,
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            <button 
              type="button"
              onClick={handleAddTag}
              disabled={tags.length >= 5 || !currentTag.trim()}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Add
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tags.map((tag, idx) => (
              <span 
                key={idx}
                style={{
                  background: '#f3f4f6',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                #{tag}
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 4px',
                    fontSize: '1.2rem',
                    color: '#9ca3af'
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Listing Type
          </label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="radio" 
                name="type" 
                value="regular" 
                checked={listingType === 'regular'} 
                onChange={() => setListingType('regular')} 
              />
              Regular
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="radio" 
                name="type" 
                value="live" 
                checked={listingType === 'live'} 
                onChange={() => setListingType('live')} 
              />
              Live
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Photos
          </label>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
        </div>

        {previews.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            {previews.map((src, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img 
                  src={src} 
                  alt={`preview-${idx}`}
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => removeImg(idx)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button 
          type="button"
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '14px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Create listing
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AddListing;