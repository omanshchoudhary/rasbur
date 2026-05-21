import { useEffect, useState } from 'react';
import type { User } from '@rasbur/shared';
import { api } from '@/services/api.js';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadProfile() {
            try {
                const res = await api.getUserProfile();
                if (isMounted && res.ok && res.user) {
                    setUser(res.user);
                    setName(res.user.name);
                }
            } catch (err) {
                if (isMounted) {
                    setMessage({
                        type: 'error',
                        text: err instanceof Error ? err.message : 'Failed to load profile details.',
                    });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setMessage({ type: 'error', text: 'Name field cannot be left blank.' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const res = await api.updateUserProfile({ name: name.trim() });
            if (res.ok && res.user) {
                setUser(res.user);
                setName(res.user.name);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to update profile.' });
            }
        } catch (err) {
            setMessage({
                type: 'error',
                text: err instanceof Error ? err.message : 'An error occurred while saving.',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                {/* Skeleton Loader */}
                <div className="bg-surface-900/60 border border-white/5 backdrop-blur-xl rounded-panel p-8 shadow-panel animate-pulse space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-surface-800 rounded-full" />
                        <div className="space-y-3 flex-1">
                            <div className="h-6 bg-surface-800 rounded w-1/3" />
                            <div className="h-4 bg-surface-800 rounded w-1/4" />
                        </div>
                    </div>
                    <div className="h-[1px] bg-white/5 my-6" />
                    <div className="space-y-4">
                        <div className="h-4 bg-surface-800 rounded w-1/6" />
                        <div className="h-12 bg-surface-800 rounded w-full" />
                        <div className="h-4 bg-surface-800 rounded w-1/6" />
                        <div className="h-12 bg-surface-800 rounded w-full" />
                    </div>
                </div>
            </div>
        );
    }

    const initials = name
        ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const isPro = user?.tier === 'pro';

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            {/* Header Title */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-text-50">Settings</h1>
                <p className="text-text-300 mt-1">Manage your account credentials and personal preferences.</p>
            </div>

            {/* Profile Card */}
            <div className="bg-surface-900/60 border border-white/5 backdrop-blur-xl rounded-panel p-8 shadow-panel relative overflow-hidden">
                {/* Decorative Subtle Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                {/* Profile Overview Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 relative z-10">
                    <div className="relative group">
                        {/* Glow Gradient Outline Ring */}
                        <div className="absolute -inset-1 bg-gradient-to-tr from-accent-blue via-accent-teal to-accent-blue rounded-full opacity-75 group-hover:opacity-100 transition duration-500 blur-[2px]" />
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="relative w-20 h-20 rounded-full object-cover border border-surface-950"
                            />
                        ) : (
                            <div className="relative w-20 h-20 rounded-full bg-surface-800 border border-surface-950 flex items-center justify-center text-text-50 font-bold text-2xl">
                                {initials}
                            </div>
                        )}
                    </div>

                    <div className="text-center sm:text-left flex-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                            <h2 className="text-2xl font-bold text-text-50">{user?.name}</h2>

                            {/* Tier Badge */}
                            {isPro ? (
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-surface-950 shadow-md shadow-amber-500/10">
                                    ★ PRO
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-surface-800 border border-white/10 text-text-300">
                                    FREE TIER
                                </span>
                            )}
                        </div>
                        <p className="text-text-300 text-sm mt-1">{user?.email}</p>

                        {user?.oauthProvider && (
                            <p className="text-xs text-text-300/60 mt-2 font-mono flex items-center justify-center sm:justify-start gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-teal inline-block animate-pulse" />
                                Signed in via {user.oauthProvider.charAt(0).toUpperCase() + user.oauthProvider.slice(1)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="h-[1px] bg-white/5 my-6" />

                {/* Notifications & Status Banner */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-xl text-sm border flex items-center gap-3 transition-all duration-300 ${message.type === 'success'
                                ? 'bg-accent-teal/10 border-accent-teal/20 text-accent-teal'
                                : 'bg-danger-400/10 border-danger-400/20 text-danger-400'
                            }`}
                    >
                        {message.type === 'success' ? (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Form Settings */}
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-semibold text-text-300">
                            Email Address (Read-only)
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full bg-surface-950/80 border border-white/5 rounded-xl px-4 py-3 text-text-300/50 cursor-not-allowed focus:outline-none"
                        />
                        <p className="text-xs text-text-300/40 font-medium">To modify your registered email address, please contact support.</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-semibold text-text-300">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            maxLength={80}
                            placeholder="Enter your name"
                            className="w-full bg-surface-950 border border-white/10 rounded-xl px-4 py-3 text-text-50 placeholder-text-300/30 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/30 transition-all duration-200"
                        />
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full sm:w-auto min-w-[140px] px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-accent-blue to-accent-teal text-surface-950 shadow-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-surface-950" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}