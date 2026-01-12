import React, { useState, useEffect, useCallback, useRef } from 'react';
import ClothingCard from '../components/clothingcard';
import './swipepage.css';
import PullToRefresh from 'react-simple-pull-to-refresh'; // 1. Import Library

import { supabase } from '../../lib/supabase';

// Keep sample items for fallback
const sampleItems = [
  {
    id: 1,
    name: "big green ahh tshirt",
    price: 20,
    seller: "xxxxx",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop"
    ],
    timeRemaining: 262
  },
  {
    id: 2,
    name: "vintage denim jacket",
    price: 35,
    seller: "yyyyy",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop"
    ],    
    timeRemaining: 180
  },
  {
    id: 3,
    name: "black hoodie supreme",
    price: 45,
    seller: "zzzzz",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop"
    ],    
    timeRemaining: 420
  },
  {
    id: 4,
    name: "white sneakers nike",
    price: 60,
    seller: "aaaaa",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop"
    ],    
    timeRemaining: 300
  }
];

const SwipePage = ({ onSetCurrentSeller, onSetItems, itemsTimer, currentIndex, onSetIndex }) => {
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(null);
  const mountedRef = useRef(true);

  // Helper to find the expiry time of all items
  const addExpiryToLiveItems = (rawItems) => {
    return rawItems.map(item => ({
      ...item,
      expiryTimestamp: Date.now() + (item.timeRemaining * 1000)
    }));
  };

  const fetchListings = useCallback(async (isRefresh = false) => {
    try {
      if (mountedRef.current && !isRefresh) setLoading(true);


      const { data, error } = await supabase
        .from('livelistings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const mappedItems = data.map(item => {
          let imagesArray = [];
          try {
            imagesArray = Array.isArray(item.images) ? item.images : JSON.parse(item.images || "[]");
          } catch (e) {
            imagesArray = [item.images];
          }

          return {
            id: item.id,
            name: item.name,
            price: item.price,
            seller: item.seller,
            images: imagesArray,
            description: item.description, 
            tags: item.tags,
            timeRemaining: item.timeRemaining || 900
          };
        });

        if (mountedRef.current) {
          onSetItems(addExpiryToLiveItems(mappedItems));
          if (isRefresh && onSetIndex) onSetIndex(0);
        }
      } else {
        if (mountedRef.current) onSetItems(addExpiryToLiveItems(sampleItems));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (mountedRef.current) onSetItems(addExpiryToLiveItems(sampleItems));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [onSetItems]);

  // Update currentSeller whenever top card changes
  useEffect(() => {
    if (itemsTimer && itemsTimer.length > 0) {
      // Use modulo to loop forever safely
      const topCard = itemsTimer[currentIndex % itemsTimer.length];
      if (onSetCurrentSeller) {
        onSetCurrentSeller(topCard.seller);
      }
    }
  }, [itemsTimer, currentIndex, onSetCurrentSeller]);

  // Fetch listings on mount
  useEffect(() => {
    mountedRef.current = true;

    if (itemsTimer && itemsTimer.length > 0) {
      setLoading(false);
    } else {
      fetchListings();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [itemsTimer, fetchListings]);

  // --- REVERTED SWIPE LOGIC ---
  const handleSwipe = (dir) => {
    setDirection(dir);
    
    // Just simple increment. 
    // The render logic (currentIndex % length) handles the looping visual.
    setTimeout(() => {
      onSetIndex(prev => prev + 1);
      setDirection(null);
    }, 300);
  };

  // Determine which cards to show based on modulo math
  const visibleCards = itemsTimer && itemsTimer.length > 0
    ? [
        itemsTimer[currentIndex % itemsTimer.length],
        itemsTimer[(currentIndex + 1) % itemsTimer.length]
      ]
    : [];

  const handleRefresh = async () => {
    await fetchListings(true); // Call with isRefresh = true
  };

    return (
    <div className="swipe-page-container">
      {/* 4. Wrap EVERYTHING inside PullToRefresh */}
      <PullToRefresh onRefresh={handleRefresh} className="ptr-wrapper-custom">
        <div className="swipe-content-wrapper">
            
            <div className="instructions">
                <p>Swipe right to buy • Swipe left to skip</p>
            </div>

            {loading && (
                <div className="card-stack-container">
                <p style={{ color: '#999', textAlign: 'center' }}>Loading listings...</p>
                </div>
            )}

            {!loading && itemsTimer.length > 0 && (
                <div className="card-stack-container">
                <div className="card-stack">
                    {visibleCards.map((item, index) => (
                    <ClothingCard
                        key={`${item.id}-${currentIndex + index}`} 
                        item={item}
                        onSwipe={handleSwipe}
                        isTop={index === 0}
                    />
                    ))}
                </div>
                </div>
            )}

            {!loading && itemsTimer.length === 0 && (
                <div className="card-stack-container">
                <p style={{ color: '#999', textAlign: 'center' }}>No listings available</p>
                </div>
            )}

             
             {direction && (
                <div className="swipe-feedback">
                <div className={`feedback-text ${direction === 'right' ? 'buy' : 'skip'}`}>
                    {direction === 'right' ? '💚 BUY' : '👈 SKIP'}
                </div>
                </div>
            )}
            
        </div>
      </PullToRefresh>
    </div>
  );
};

export default SwipePage;