
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Settings.css';
import {
  FiUser,
  FiLock,
  FiEye,
  FiLogOut,
  FiCheck
} from 'react-icons/fi';
import { prefetchCache } from "../../utils/prefetchCache";

// Canonical default settings shape
const DEFAULT_SETTINGS = {
  displayName: "",
  username: "",
  email: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  profileVisibility: "FOLLOWERS",
  showEmail: false,
  allowMessages: true,
};

const Settings = () => {
  const cachedSettings = prefetchCache.get("settings") || null;

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...(cachedSettings || {}),
  }));

  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchSettings(true); // background refresh always, no blocking render
  }, []);

  const fetchSettings = async (background = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      const token = session.access_token;
      const response = await fetch('http://localhost:5051/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      const nextSettings = {
        ...DEFAULT_SETTINGS,
        displayName: data.name || "",
        username: data.username || "",
        email: data.email || "",
        profileVisibility: data.profileVisibility || "FOLLOWERS",
        showEmail: Boolean(data.showEmail),
        allowMessages: Boolean(data.allowMessages),
      };

      setSettings(prev => ({ ...prev, ...nextSettings }));
      prefetchCache.set("settings", nextSettings);
      return;
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAccount = async () => {
    setSaveStatus('Saving...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const token = session.access_token;
      const response = await fetch('http://localhost:5051/settings/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: settings.displayName,
          username: settings.username,
          email: settings.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update account');
      }

      const updatedData = await response.json();
      setSettings(prev => ({
        ...prev,
        displayName: updatedData.name,
        email: updatedData.email,
      }));

      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error updating account:', error);
      setSaveStatus('');
      alert(error.message);
    }
  };

  const handleChangePassword = async () => {
    if (!settings.currentPassword) {
      alert('Please enter your current password.');
      return;
    }
    if (settings.newPassword !== settings.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (settings.newPassword.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }
    
    setSaveStatus('Updating password...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const token = session.access_token;
      const response = await fetch('http://localhost:5051/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: settings.currentPassword,
          newPassword: settings.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update password');
      }

      setSaveStatus('Password updated successfully!');
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setSaveStatus('');
      alert(error.message);
    }
  };

  const handleSavePrivacy = async () => {
    setSaveStatus('Saving...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const token = session.access_token;
      const response = await fetch('http://localhost:5051/settings/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileVisibility: settings.profileVisibility,
          showEmail: settings.showEmail,
          allowMessages: settings.allowMessages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update privacy settings');
      }

      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error updating privacy:', error);
      setSaveStatus('');
      alert(error.message);
    }
  };

  async function handleLogout() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    // If there is no session, you're already "logged out" locally.
    if (!session) {
      // optional: clear your app auth state here
      window.location.href = "/login";
      return;
    }

    // Prefer local to avoid global token revocation weirdness
    const { error } = await supabase.auth.signOut({ scope: "local" });

    // If Supabase returns 403 or session-missing, treat it as success
    if (error) {
      const msg = String(error.message || "");
      const name = String(error.name || "");

      if (name.includes("AuthSessionMissingError") || msg.includes("403")) {
        window.location.href = "/login";
        return;
      }

      throw error;
    }

    window.location.href = "/login";
  } catch (e) {
    console.error("Logout failed:", e);
    // final fallback: still redirect / clear UI
    window.location.href = "/login";
  }
}

  // const handleLogout = async () => {
  //   const confirmed = window.confirm('Are you sure you want to log out?');
  //   if (!confirmed) return;

  //   try {
  //     const { error } = await supabase.auth.signOut();
      
  //     if (error) {
  //       throw error;
  //     }

  //     navigate('/login');
  //   } catch (error) {
  //     console.error('Error logging out:', error);
  //     alert('Failed to log out. Please try again.');
  //   }
  // };

  const tabs = [
    { id: 'account', label: 'Account', icon: <FiUser /> },
    { id: 'security', label: 'Security', icon: <FiLock /> },
    { id: 'privacy', label: 'Privacy', icon: <FiEye /> },
  ];


  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          {saveStatus && (
            <div className="save-status">
              <FiCheck /> {saveStatus}
            </div>
          )}
        </div>

        <div className="settings-content">
          {/* Sidebar Tabs */}
          <div className="settings-sidebar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
            
            <div className="sidebar-divider"></div>
            
            <button className="settings-tab logout-btn" onClick={handleLogout}>
              <span className="tab-icon"><FiLogOut /></span>
              <span className="tab-label">Log Out</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="settings-main">
            
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="settings-section">
                <h2 className="section-title">Account Information</h2>
                
                <div className="setting-group">
                  <label className="setting-label">Display Name</label>
                  <input
                    type="text"
                    className="setting-input"
                    value={settings.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                <div className="setting-group">
                  <label className="setting-label">Username</label>
                  <input
                    type="text"
                    className="setting-input"
                    value={settings.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="your_username"
                  />
                </div>


                <div className="setting-group">
                  <label className="setting-label">Email Address</label>
                  <input
                    type="email"
                    className="setting-input"
                    value={settings.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                  <p className="setting-hint">We'll send verification to your new email</p>
                </div>

                <button className="save-btn" onClick={handleSaveAccount}>
                  Save Changes
                </button>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2 className="section-title">Security</h2>
                
                <div className="security-card">
                  <div className="card-header">
                    <FiLock className="card-icon" />
                    <h3>Change Password</h3>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Current Password</label>
                    <input
                      type="password"
                      className="setting-input"
                      value={settings.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">New Password</label>
                    <input
                      type="password"
                      className="setting-input"
                      value={settings.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="setting-input"
                      value={settings.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button className="save-btn" onClick={handleChangePassword}>
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h2 className="section-title">Privacy Settings</h2>
                
                <div className="toggle-group">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>Show Email Address</h4>
                      <p>Display your email on your public profile</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.showEmail}
                        onChange={(e) => handleInputChange('showEmail', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>Allow Messages</h4>
                      <p>Let other users send you direct messages</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.allowMessages}
                        onChange={(e) => handleInputChange('allowMessages', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <button className="save-btn" onClick={handleSavePrivacy}>
                  Save Privacy Settings
                </button>
              </div>
            )}

          </div>
        </div>
      </div>


      <div className='settings-beta-box' aria-live='polite'>
        This is a beta version. Some changes may not be reflected on your profile
      </div>
    </div>
  );
};

export default Settings;