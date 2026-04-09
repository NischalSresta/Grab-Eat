import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user.service';
import { ArrowLeft, User, Lock, Save, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    birthDate: (user as any)?.birthDate ?? '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await userService.updateProfile({
        fullName: profileForm.fullName.trim() || undefined,
        phoneNumber: profileForm.phoneNumber.trim() || undefined,
        birthDate: profileForm.birthDate || undefined,
      });
      setProfileSuccess('Profile updated successfully');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (e: any) {
      setProfileError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    setPwSaving(true);
    setPwError('');
    setPwSuccess('');
    try {
      await userService.changePassword(pwForm);
      setPwSuccess('Password changed. Please log in again.');
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 2000);
    } catch (e: any) {
      setPwError(e?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <User size={20} className="text-orange-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                value={profileForm.fullName}
                onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={user?.email ?? ''}
                disabled
                className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                value={profileForm.phoneNumber}
                onChange={e => setProfileForm(f => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="+977 9800000000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birthday <span className="text-xs text-gray-400">(for loyalty birthday bonus 🎁)</span>
              </label>
              <input
                type="date"
                value={profileForm.birthDate}
                onChange={e => setProfileForm(f => ({ ...f, birthDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          {profileError && <p className="text-red-600 text-sm mt-3">{profileError}</p>}
          {profileSuccess && <p className="text-green-600 text-sm mt-3">{profileSuccess}</p>}

          <button
            onClick={saveProfile}
            disabled={profileSaving}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60"
          >
            <Save size={16} />
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Lock size={20} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Change Password</h2>
          </div>

          <div className="space-y-4">
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm[field]}
                    onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
                  />
                  {field === 'newPassword' && (
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pwError && <p className="text-red-600 text-sm mt-3">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm mt-3">{pwSuccess}</p>}

          <button
            onClick={changePassword}
            disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60"
          >
            <Lock size={16} />
            {pwSaving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </main>
    </div>
  );
}
