import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import './onboarding.css';
import { Country, State, City } from 'country-state-city';
import OptimizedImage from '../components/OptimizedImage';

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const fileInputRef = useRef(null);

  // user profile form state
  const [formData, setFormData] = useState({
    username: '',
    country: '',
    location: '',
    avatar_url: null // url string for uploaded avatar
  });


  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');

  // holds actual file to upload later
  const [avatarFile, setAvatarFile] = useState(null);
  // holds preview image (google photo or local file)
  const [previewUrl, setPreviewUrl] = useState("https://via.placeholder.com/150");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // prefill form with data from google login
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
    setSelectedStateCode('');
    setFormData({
      ...formData,
      country: countryData.name,
      location: ''
    });
  };

  const handleStateChange = (e) => {
    setSelectedStateCode(e.target.value);
  };

  const handleCityChange = (e) => {
    setFormData({ ...formData, location: e.target.value });
  };

  // image upload handling
  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setAvatarFile(file);

    // create local preview for immediate visual feedback
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // profile submission handler
  const handleFinish = async () => {
    if (!session) return;
    setLoading(true);

    try {
      let finalAvatarUrl = formData.avatar_url;

      // upload new avatar if user selected one
      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          // upload to avatars storage bucket
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile);

          if (uploadError) throw uploadError;

          // get public url for uploaded avatar
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          finalAvatarUrl = publicUrl;
        } catch (uploadErr) {
          console.error('Avatar upload failed:', uploadErr);
          alert('Failed to upload avatar. Profile saved without new image.');
        }
      }

      // update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          country: formData.country,
          location: formData.location,
          avatar_url: finalAvatarUrl,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      onComplete();

    } catch (error) {
      console.error(error);
      alert("Error saving profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // render different steps based on state

  // step 1: username
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

  // step 2: avatar
  const renderStep2 = () => (
    <div className="onboarding-step fade-in">
      <h2>Pick a look.</h2>
      <p>Tap to change your photo.</p>

      <div className="avatar-upload-container" onClick={handleImageClick}>
        <OptimizedImage src={previewUrl} alt="Avatar Preview" size="avatar" className="avatar-preview" />
        <div className="avatar-overlay">📷</div>
      </div>

      {/* hidden file input */}
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

  // step 3: location
  const renderStep3 = () => {
    // get allowed countries
    const allowedCodes = ['US', 'CA', 'ID'];
    const countries = Country.getAllCountries().filter(c => allowedCodes.includes(c.isoCode));

    // get states for selected country
    const states = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [];

    // get cities for selected state
    const cities = selectedStateCode ? City.getCitiesOfState(selectedCountryCode, selectedStateCode) : [];

    return (
      <div className="onboarding-step fade-in">
        <h2>Where are you?</h2>
        <p>Set your shipping origin.</p>

        {/* country selector */}
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

        {/* state/province selector (appears after country selected) */}
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

        {/* city selector (appears after state selected) */}
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
