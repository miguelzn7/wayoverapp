import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import ClothingCard from '../components/clothingcard';
import './swipepage.css';
import PullToRefresh from 'react-simple-pull-to-refresh';

import { supabase } from '../lib/supabase';
import { CONSTANTS } from '../lib/navigation';
import { parseImages } from '../lib/utils';
import { createInvoice } from '../lib/payments';

// fallback items for when database is not available
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
          const imagesArray = parseImages(item.images);

          return {
            id: item.id,
            name: item.name,
            price: item.price,
            seller: item.seller,
            images: imagesArray,
            description: item.description,
            tags: item.tags,
            timeRemaining: item.timeRemaining || CONSTANTS.DEFAULT_TIME_REMAINING
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

  // update current seller when top card changes
  useEffect(() => {
    if (itemsTimer && itemsTimer.length > 0) {
      const topCard = itemsTimer[currentIndex % itemsTimer.length];
      if (onSetCurrentSeller) {
        onSetCurrentSeller(topCard.seller);
      }
    }
  }, [itemsTimer, currentIndex, onSetCurrentSeller]);

  // fetch listings on mount
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

  // handle card swipes with modulo logic for infinite looping
  const handleSwipe = async (dir) => {
    setDirection(dir);

    // trigger payment on right swipe (buy)
    if (dir === 'right') {
      const currentItem = itemsTimer[currentIndex % itemsTimer.length];
      try {
        const invoiceUrl = await createInvoice({
          amount: currentItem.price,
          email: 'test@wayover.app', // Placeholder email for testing
          itemName: currentItem.name
        });
        // redirect to Xendit invoice
        window.location.href = invoiceUrl;
        return;
      } catch (error) {
        console.error('Payment creation failed:', error);
        // Fallback: continue with swipe animation if payment fails or just alert
        alert('Could not initiate payment. Please try again.');
      }
    }

    setTimeout(() => {
      onSetIndex(prev => {
        const nextIndex = prev + 1;
        // prevent integer overflow after many swipes by resetting at max safe integer
        return nextIndex % Number.MAX_SAFE_INTEGER === 0 ? 0 : nextIndex;
      });
      setDirection(null);
    }, CONSTANTS.SWIPE_ANIMATION_DURATION);
  };

  // get visible cards based on current index with modulo wrapping
  const visibleCards = itemsTimer && itemsTimer.length > 0
    ? [
      itemsTimer[currentIndex % itemsTimer.length],
      itemsTimer[(currentIndex + 1) % itemsTimer.length],
      itemsTimer[(currentIndex + 2) % itemsTimer.length]
    ].slice(0, Math.min(3, itemsTimer.length))
    : [];

  const handleRefresh = async () => {
    await fetchListings(true);
  };

  return (
    <div className="swipe-page-container">
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
                    stackPosition={index}
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

SwipePage.propTypes = {
  onSetCurrentSeller: PropTypes.func,
  onSetItems: PropTypes.func.isRequired,
  itemsTimer: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    price: PropTypes.number,
    seller: PropTypes.string,
    images: PropTypes.array,
    description: PropTypes.string,
    tags: PropTypes.array,
    timeRemaining: PropTypes.number,
    expiryTimestamp: PropTypes.number,
  })),
  currentIndex: PropTypes.number,
  onSetIndex: PropTypes.func,
};

SwipePage.defaultProps = {
  itemsTimer: [],
  currentIndex: 0,
};

export default SwipePage;
