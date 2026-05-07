import React, { useState, useEffect, useRef } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    // We now pull the new updateUser function from our context
    const { user: authUser, updateUser } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [imageError, setImageError] = useState("");
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        avatar_url: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/profile');
            const userData = response.data.user;
            setProfileData(userData);
            setFormData({
                name: userData.name || '',
                avatar_url: userData.avatar_url || ''
            });
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleImageClick = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 200 * 1024) {
            setImageError("File size must be under 200 KB");
            return;
        }

        setImageError("");

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, avatar_url: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.put('/api/profile', formData);
            setIsEditing(false);
            fetchProfile();

            // NEW: Instantly update the sidebar and global context with the new data!
            if (updateUser) {
                updateUser({
                    name: formData.name,
                    avatar_url: formData.avatar_url
                });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!profileData) {
        return (
            <div className="flex items-center justify-center h-full pt-20">
                <p className="text-gray-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    const onboardingDate = profileData.created_at
        ? new Date(profileData.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : 'Date not recorded';

    const formatRole = (roleStr) => {
        if (!roleStr) return 'Unknown Role';
        return roleStr.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 sm:p-10 bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold mb-8 text-gray-800">My Profile</h1>

            <div className="flex items-center space-x-6 mb-8 border-b border-gray-100 pb-8">
                <div className="flex flex-col items-center">
                    <div
                        className={`relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-blue-50 flex-shrink-0 shadow-sm transition-all ${isEditing ? 'cursor-pointer hover:border-blue-200' : ''}`}
                        onClick={handleImageClick}
                        title={isEditing ? "Click to change profile picture" : ""}
                    >
                        {formData.avatar_url ? (
                            <img
                                src={formData.avatar_url}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-blue-400 text-3xl font-bold bg-blue-50">
                                {formData.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {isEditing && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity hover:bg-opacity-50">
                                <svg className="w-8 h-8 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                    />

                    {imageError && (
                        <p className="mt-2 text-xs text-red-500 font-medium text-center">{imageError}</p>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{profileData.name}</h2>
                    <p className="text-sm font-medium text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full mt-2">
                        {formatRole(profileData.role)}
                    </p>
                    <p className="text-sm text-gray-500 font-medium mt-3">
                        On boarding date - <span className="text-gray-700">{onboardingDate}</span>
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={profileData.email || ''}
                            disabled
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">User Role</label>
                        <input
                            type="text"
                            value={formatRole(profileData.role)}
                            disabled
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end space-x-4">
                    {isEditing ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setImageError("");
                                    setFormData({ name: profileData.name, avatar_url: profileData.avatar_url || '' });
                                }}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || imageError !== ""}
                                className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="px-5 py-2.5 text-sm font-medium bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors shadow-sm"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}