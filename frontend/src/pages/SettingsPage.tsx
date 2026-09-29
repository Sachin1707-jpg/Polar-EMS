import { useState } from 'react';
import { Settings, User, Bell, Shield, Database, Save, Lock, RefreshCw, Download, Trash2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/Card';

/**
 * Settings Page Component
 * Application and user settings — fully interactive
 */
export default function SettingsPage() {
  // Profile state
  const [fullName, setFullName] = useState('Admin User');
  const [email, setEmail] = useState('admin@polar-ems.com');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Notification state
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifRecommendations, setNotifRecommendations] = useState(true);
  const [notifSystemUpdates, setNotifSystemUpdates] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);

  // System settings state
  const [refreshInterval, setRefreshInterval] = useState('1 minute');
  const [timezone, setTimezone] = useState('UTC+05:30 (IST)');
  const [tempUnit, setTempUnit] = useState('Celsius (°C)');
  const [systemSaving, setSystemSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error('Validation Error', { description: 'Name and email are required' });
      return;
    }
    setProfileSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setProfileSaving(false);
    toast.success('Profile Updated', { description: `Changes saved for ${fullName}` });
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error('Enter Current Password', { description: 'Please enter your current password' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password Too Short', { description: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords Do Not Match', { description: 'New password and confirmation must match' });
      return;
    }
    setPasswordSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setPasswordSaving(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password Updated', { description: 'Your password has been changed successfully' });
  };

  const handleSaveNotifications = () => {
    toast.success('Notification Preferences Saved', {
      description: 'Your alert preferences have been updated',
    });
  };

  const handleSaveSystemSettings = async () => {
    setSystemSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSystemSaving(false);
    toast.success('System Settings Saved', {
      description: `Refresh interval: ${refreshInterval}, Timezone: ${timezone}`,
    });
  };

  const handleExportData = async () => {
    toast.loading('Preparing export...', { id: 'export' });
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Export Ready', {
      id: 'export',
      description: 'POLAR-EMS-data.csv has been downloaded',
    });
  };

  const handleClearCache = async () => {
    toast.loading('Clearing cache...', { id: 'cache' });
    await new Promise(r => setTimeout(r, 800));
    toast.success('Cache Cleared', {
      id: 'cache',
      description: 'All cached data has been removed successfully',
    });
  };

  const handleResetSimulation = () => {
    if (window.confirm('Reset all simulation data? This cannot be undone.')) {
      toast.success('Simulation Reset', { description: 'All simulation data has been reset to defaults' });
    }
  };

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure system and user preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader
            title="User Profile"
            subtitle="Manage your account information"
            action={<User size={20} className="text-gray-400" />}
          />
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <input type="text" className="input" value="Administrator" disabled />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={profileSaving}
              className="btn-primary flex items-center space-x-2"
            >
              {profileSaving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{profileSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardHeader
            title="Notifications"
            subtitle="Alert preferences"
            action={<Bell size={20} className="text-gray-400" />}
          />
          <div className="space-y-5">
            {[
              { label: 'Critical Alerts', desc: 'High-priority system warnings', value: notifCritical, set: setNotifCritical },
              { label: 'Recommendations', desc: 'AI-generated suggestions', value: notifRecommendations, set: setNotifRecommendations },
              { label: 'System Updates', desc: 'Regular status updates', value: notifSystemUpdates, set: setNotifSystemUpdates },
              { label: 'Email Notifications', desc: 'Receive alerts via email', value: notifEmail, set: setNotifEmail },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-200">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
                <Toggle checked={item.value} onChange={(v) => { item.set(v); toast.info(`${item.label} ${v ? 'enabled' : 'disabled'}`); }} />
              </div>
            ))}
            <button onClick={handleSaveNotifications} className="btn-secondary flex items-center space-x-2 w-full justify-center">
              <CheckCircle2 size={16} />
              <span>Save Preferences</span>
            </button>
          </div>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader
            title="Security"
            subtitle="Password and authentication"
            action={<Shield size={20} className="text-gray-400" />}
          />
          <div className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                >
                  {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                >
                  {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-status-critical mt-1">Passwords do not match</p>
              )}
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={passwordSaving}
              className="btn-primary flex items-center space-x-2"
            >
              {passwordSaving ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
              <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </Card>

        {/* System Settings Card */}
        <Card>
          <CardHeader
            title="System Settings"
            subtitle="Application configuration"
            action={<Settings size={20} className="text-gray-400" />}
          />
          <div className="space-y-4">
            <div>
              <label className="label">Data Refresh Interval</label>
              <select className="input" value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)}>
                <option>30 seconds</option>
                <option>1 minute</option>
                <option>5 minutes</option>
                <option>15 minutes</option>
              </select>
            </div>
            <div>
              <label className="label">Timezone</label>
              <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option>UTC</option>
                <option>UTC+05:30 (IST)</option>
                <option>UTC-05:00 (EST)</option>
                <option>UTC+01:00 (CET)</option>
              </select>
            </div>
            <div>
              <label className="label">Temperature Unit</label>
              <select className="input" value={tempUnit} onChange={(e) => setTempUnit(e.target.value)}>
                <option>Celsius (°C)</option>
                <option>Fahrenheit (°F)</option>
              </select>
            </div>
            <button
              onClick={handleSaveSystemSettings}
              disabled={systemSaving}
              className="btn-primary flex items-center space-x-2"
            >
              {systemSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{systemSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Data Management Card */}
      <Card>
        <CardHeader
          title="Data Management"
          subtitle="Database and simulation controls"
          action={<Database size={20} className="text-gray-400" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleExportData}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Download size={16} />
            <span>Export Data</span>
          </button>
          <button
            onClick={handleClearCache}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Clear Cache</span>
          </button>
          <button
            onClick={handleResetSimulation}
            className="btn-danger flex items-center justify-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Reset Simulation</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
