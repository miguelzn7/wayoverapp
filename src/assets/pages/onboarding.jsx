import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import './onboarding.css';
import { Country, State, City } from 'country-state-city';

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const fileInputRef = useRef(null); // Reference to the hidden file input

  // Form Data State
  const [formData, setFormData] = useState({
    username: '',
    country: '',
    location: '',
    avatar_url: null // This will hold the URL string
  });
  

  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');


  // This holds the actual file file to upload later
  const [avatarFile, setAvatarFile] = useState(null);
  // This holds the preview (either the google photo or the local file blob)
  const [previewUrl, setPreviewUrl] = useState("https://via.placeholder.com/150");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // 1. Prefill default data from Google login if available
        const meta = session.user.user_metadata;
        const initialAvatar = meta.avatar_url || "https://via.placeholder.com/150";
        
        setFormData(prev => ({
          ...prev,
          username: meta.full_name?.replace(/\s/g, '').toLowerCase() || '',
          avatar_url: meta.avatar_url || null
        }));
        setPreviewUrl(initialAvatar);
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const countryData = Country.getCountryByCode(countryCode);

    setSelectedCountryCode(countryCode);
    setSelectedStateCode(''); //reset when country change
    setFormData({
        ...formData,
        country: countryData.name,
        location: '' //reset city
    });
  };

  const handleStateChange = (e) => {
    setSelectedStateCode(e.target.value);
    // dont save state we just need it as a city finder
  };

  const handleCityChange = (e) => {
    setFormData({ ...formData, location: e.target.value });
  };

  // --- IMAGE HANDLING ---
  const handleImageClick = () => {
    fileInputRef.current.click(); // Trigger the hidden input
  };

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setAvatarFile(file);
    
    // Create a local preview immediately so it feels snappy
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // --- SUBMIT LOGIC ---
  const handleFinish = async () => {
    if (!session) return;
    setLoading(true);

    try {
      let finalAvatarUrl = formData.avatar_url;

      // 1. If user selected a NEW file, upload it first
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to 'avatars' bucket
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        finalAvatarUrl = publicUrl;
      }

      // 2. Update the Profile Table
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          country: formData.country,
          location: formData.location,
          avatar_url: finalAvatarUrl, // Save the new URL
        })
        .eq('id', session.user.id);

      if (error) throw error;
      
      onComplete(); // Go to Swipe Page

    } catch (error) {
      console.error(error);
      alert("Error saving profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* --- RENDER STEPS --- */

  // STEP 1: Username
  const renderStep1 = () => (
    <div className="onboarding-step fade-in">
      <h2>Let's get setup.</h2>
      <p>Pick a username.</p>
      <input 
        type="text" 
        name="username"
        placeholder="@username"
        value={formData.username}
        onChange={handleChange}
        className="onboarding-input"
        autoComplete="off"
      />
      <button 
        className="next-btn" 
        disabled={!formData.username}
        onClick={() => setStep(2)}
      >
        Next
      </button>
    </div>
  );

  // STEP 2: Avatar (New Step)
  const renderStep2 = () => (
    <div className="onboarding-step fade-in">
      <h2>Pick a look.</h2>
      <p>Tap to change your photo.</p>
      
      <div className="avatar-upload-container" onClick={handleImageClick}>
        <img src={previewUrl} alt="Avatar Preview" className="avatar-preview" />
        <div className="avatar-overlay">📷</div>
      </div>

      {/* Hidden Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      <div className="button-row">
        <button className="back-btn" onClick={() => setStep(1)}>Back</button>
        <button className="next-btn" onClick={() => setStep(3)}>Looks Good</button>
      </div>
    </div>
  );

  // STEP 3: Location
  const renderStep3 = () => {
    // 1. Get our 3 allowed countries
    const allowedCodes = ['US', 'CA', 'ID'];
    const countries = Country.getAllCountries().filter(c => allowedCodes.includes(c.isoCode));
    
    // 2. Get States based on selected country
    const states = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [];
    
    // 3. Get Cities based on selected state
    const cities = selectedStateCode ? City.getCitiesOfState(selectedCountryCode, selectedStateCode) : [];

    return (
      <div className="onboarding-step fade-in">
        <h2>Where are you?</h2>
        <p>Set your shipping origin.</p>

        {/* COUNTRY SELECTOR */}
        <select 
          className="onboarding-input" 
          onChange={handleCountryChange}
          value={selectedCountryCode}
        >
          <option value="">Select Country</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
          ))}
        </select>

        {/* STATE SELECTOR (Hidden until Country picked) */}
        {selectedCountryCode && (
          <select 
            className="onboarding-input" 
            style={{ marginTop: '10px' }}
            onChange={handleStateChange}
            value={selectedStateCode}
          >
            <option value="">Select State/Province</option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
            ))}
          </select>
        )}

        {/* CITY SELECTOR (Hidden until State picked) */}
        {selectedStateCode && (
          <select 
            className="onboarding-input" 
            style={{ marginTop: '10px' }}
            onChange={handleCityChange}
            value={formData.location}
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        )}

        <div className="button-row">
          <button className="back-btn" onClick={() => setStep(2)}>Back</button>
          <button 
            className="next-btn" 
            disabled={!formData.country || !formData.location}
            onClick={handleFinish}
          >
            {loading ? "Saving..." : "Finish"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="onboarding-container">
      <div className="progress-bar">
        <div className="fill" style={{ width: `${(step / 3) * 100}%` }}></div>
      </div>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

export default Onboarding;