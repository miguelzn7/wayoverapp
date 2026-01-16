import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './lib/supabase'; 
import ClothingCard from './assets/components/clothingcard';
import Header from './assets/components/header';
import TabBar from './assets/components/tabbar';
import SwipePage from './assets/pages/swipepage';
import BrowsePage from './assets/pages/browsepage';
import MessagesPage from './assets/pages/messagespage';
import SellerPage from './assets/pages/sellerpage';
import MainMenu from './assets/components/mainmenu';
import AddListing from './assets/pages/addlisting';
import WelcomePage from './assets/pages/welcome';
import Onboarding from './assets/pages/onboarding';
import ListingPage from './assets/pages/listingpage';
import InstagramImport from './assets/pages/instagramimport';
import ImportEditor from './assets/pages/importeditor';



// Sample clothing data
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

export default function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [session, setSession] = useState(null);
  const [currentSeller, setCurrentSeller] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const [pageParams, setPageParams] = useState(null);
  const [itemsTimer, setItemsTimer] = useState([]);
  const [swipeIndex, setSwipeIndex] = useState(0);

  useEffect(() => {
    // 1. Get Session on Load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Only redirect if we are currently on the 'welcome' screen
      if (session) {
        setCurrentPage(curr => (curr === 'welcome' ? 'swipe' : curr));
      }
    });

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_OUT') {
        setCurrentPage('welcome');
      } 
      // CRITICAL CHANGE: Only redirect on explicit SIGN_IN, and only if we aren't already deep in the app
      else if (event === 'SIGNED_IN') {
        setCurrentPage(curr => (curr === 'welcome' ? 'swipe' : curr));
      }
      // We IGNORE 'TOKEN_REFRESHED' events completely now.
    });

    return () => subscription.unsubscribe();
  }, []);
  


  const goTo = (pageName, params = null) => {
    setCurrentPage(pageName);
    setPageParams(params);
  }

  const pages = {
    welcome: <WelcomePage onLoginSuccess={() => goTo('swipe')} />,
    swipe: <SwipePage 
              itemsTimer={itemsTimer} 
              onSetItems={setItemsTimer} 
              onSetCurrentSeller={setCurrentSeller}
              currentIndex={swipeIndex}
              onSetIndex={setSwipeIndex}
            />,
    browse: <BrowsePage params={pageParams} onNavigate={goTo} />,
    messages: <MessagesPage />,
    seller: <SellerPage params={pageParams} onNavigate={goTo} />,
    addls: <AddListing onNavigate={goTo} />,
    'insta-import': <InstagramImport onNavigate={goTo} />,
    'import-editor': <ImportEditor params={pageParams} onNavigate={goTo} />,
    onboarding: <Onboarding onComplete={() => goTo('swipe')} />,
    listing: <ListingPage params={pageParams} onNavigate={goTo} />,
  };


 return (
  
  
  <div className="desktop-notice">

  <div className="app">
    {/* Header stays at the top (flex item) */}
    {currentPage !== 'welcome' && <Header onNavigate={goTo} />}
    
    {/* The Page fills the middle (flex: 1) and scrolls internally */}
    <div className="page-container">
       {pages[currentPage] || pages.welcome}
    </div>

    {/* Footer stays at the bottom (flex item) */}
    {currentPage !== 'welcome' && (
      currentPage === 'swipe'
        ? <TabBar onNavigate={goTo} currentPage={currentPage} currentSeller={currentSeller} />
        : <MainMenu onNavigate={goTo} currentPage={currentPage} />
    )}
  </div>
  </div>
);

}
