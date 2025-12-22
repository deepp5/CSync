// SettingsPage.jsx
import React, { useState } from 'react';
import './Setting.css';
import { 
  FiUser, 
  FiLock, 
  FiBell, 
  FiEye, 
  FiShield, 
  FiMail,
  FiTrash2,
  FiDownload,
  FiLogOut,
  FiCheck
} from 'react-icons/fi';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState({
    // Account Settings
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Privacy Settings
    profileVisibility: 'public',
    showEmail: false,
    showProjects: true,
    allowMessages: true,
    
    // Notification Settings
    emailNotifications: true,
    projectUpdates: true,
    newFollowers: true,
    messages: true,
    weeklyDigest: false,
    
    // Appearance
    theme: 'dark',
    language: 'en'
  });

  const [saveStatus, setSaveStatus] = useState('');

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = (section) => {
    setSaveStatus('Saving...');
    
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 1000);
  };

  const handleChangePassword = () => {
    if (settings.newPassword !== settings.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (settings.newPassword.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }
    
    setSaveStatus('Updating password...');
    
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('Password updated successfully!');
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setSaveStatus(''), 3000);
    }, 1000);
  };

  const handleExportData = () => {
    setSaveStatus('Preparing your data for download...');
    setTimeout(() => {
      setSaveStatus('Data exported successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 1500);
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      const doubleConfirm = window.confirm(
        'This will permanently delete all your data. Are you absolutely sure?'
      );
      
      if (doubleConfirm) {
        console.log('Account deletion initiated');
        // Handle account deletion
      }
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      console.log('Logging out...');
      // Handle logout
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: <FiUser /> },
    { id: 'security', label: 'Security', icon: <FiLock /> },
    { id: 'privacy', label: 'Privacy', icon: <FiEye /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'data', label: 'Data & Storage', icon: <FiDownload /> }
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

                <div className="setting-group">
                  <label className="setting-label">Language</label>
                  <select
                    className="setting-select"
                    value={settings.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>

                <button className="save-btn" onClick={() => handleSaveSettings('account')}>
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

                <div className="security-card">
                  <div className="card-header">
                    <FiShield className="card-icon" />
                    <h3>Two-Factor Authentication</h3>
                  </div>
                  <p className="card-description">
                    Add an extra layer of security to your account
                  </p>
                  <button className="secondary-btn">Enable 2FA</button>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h2 className="section-title">Privacy Settings</h2>
                
                <div className="setting-group">
                  <label className="setting-label">Profile Visibility</label>
                  <select
                    className="setting-select"
                    value={settings.profileVisibility}
                    onChange={(e) => handleInputChange('profileVisibility', e.target.value)}
                  >
                    <option value="public">Public - Anyone can view</option>
                    <option value="followers">Followers Only</option>
                    <option value="private">Private - Only you</option>
                  </select>
                </div>

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
                      <h4>Show Projects</h4>
                      <p>Allow others to view your projects</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.showProjects}
                        onChange={(e) => handleInputChange('showProjects', e.target.checked)}
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

                <button className="save-btn" onClick={() => handleSaveSettings('privacy')}>
                  Save Privacy Settings
                </button>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2 className="section-title">Notification Preferences</h2>
                
                <div className="toggle-group">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>Email Notifications</h4>
                      <p>Receive notifications via email</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>Project Updates</h4>
                      <p>Get notified when projects you follow are updated</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.projectUpdates}
                        onChange={(e) => handleInputChange('projectUpdates', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>New Followers</h4>
                      <p>Be notified when someone follows you</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.newFollowers}
                        onChange={(e) => handleInputChange('newFollowers', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>Messages</h4>
                      <p>Receive notifications for new messages</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.messages}
                        onChange={(e) => handleInputChange('messages', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>Weekly Digest</h4>
                      <p>Receive a weekly summary of activities</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.weeklyDigest}
                        onChange={(e) => handleInputChange('weeklyDigest', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <button className="save-btn" onClick={() => handleSaveSettings('notifications')}>
                  Save Notification Settings
                </button>
              </div>
            )}

            {/* Data & Storage Settings */}
            {activeTab === 'data' && (
              <div className="settings-section">
                <h2 className="section-title">Data & Storage</h2>
                
                <div className="data-card">
                  <div className="card-header">
                    <FiDownload className="card-icon" />
                    <h3>Export Your Data</h3>
                  </div>
                  <p className="card-description">
                    Download a copy of all your data including profile, projects, and messages
                  </p>
                  <button className="secondary-btn" onClick={handleExportData}>
                    Export Data
                  </button>
                </div>

                <div className="data-card danger-card">
                  <div className="card-header">
                    <FiTrash2 className="card-icon" />
                    <h3>Delete Account</h3>
                  </div>
                  <p className="card-description">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button className="danger-btn" onClick={handleDeleteAccount}>
                    Delete Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;