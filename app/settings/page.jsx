'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import {
  Home,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Video,
  BookOpen,
  Music,
  Users,
  Sparkles,
  User,Briefcase,
  Zap,
  SquarePlus,
  ChartColumnDecreasing,
  Plus,
  Check,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SettingsPage() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNav, setSelectedNav] = useState('settings');
  const [googleAccount, setGoogleAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userRole, setUserRole] = useState('seller');
  // Fetch connected Google account from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchGoogleAccount = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('user_google_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Supabase error:', error);
          throw new Error('Failed to load Google account information');
        }

        if (data) {
          setGoogleAccount(data);
        }
      } catch (error) {
        console.error('Error fetching Google account:', error);
        setError(error.message || 'Failed to load Google account information');
      } finally {
        setLoading(false);
      }
    };

    fetchGoogleAccount();
  }, [user]);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Google OAuth login
  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError(null);

        // Get user profile info
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch Google profile');
        }

        const profileData = await profileResponse.json();
        console.log(tokenResponse)

        // Save Google account to Supabase
        const { data: googleAccountData, error: googleAccountError } = await supabase
          .from('user_google_accounts')
          .upsert({
            user_id: user.id,
            google_id: profileData.sub,
            email: profileData.email,
            name: profileData.name,
            picture: profileData.picture,
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token || null,
            expires_at: Date.now() + tokenResponse.expires_in * 1000,
            scope: tokenResponse.scope,
          });

        if (googleAccountError) {
          console.error('Supabase upsert error:', googleAccountError);
          throw new Error('Failed to save Google account to Supabase');
        }

        // Fetch YouTube channel details
        const channelResponse = await fetch('/api/youtube/channel', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            'X-Clerk-User-ID': user.id, // Pass Clerk user ID
          },
        });

        if (!channelResponse.ok) {
          const errorData = await channelResponse.json();
          throw new Error(errorData.error || 'Failed to fetch YouTube channel details');
        }

        const channelData = await channelResponse.json();

        // Save YouTube channel details to youtube_influencer table
        const { error: influencerError } = await supabase
          .from('youtube_influencer')
          .upsert({
            user_id: user.id,
            channel_id: channelData.id,
            channel_title: channelData.snippet.title,
            description: channelData.snippet.description,
            thumbnail_url: channelData.snippet.thumbnails?.default?.url || null,
            subscriber_count: parseInt(channelData.statistics.subscriberCount) || 0,
            video_count: parseInt(channelData.statistics.videoCount) || 0,
            view_count: parseInt(channelData.statistics.viewCount) || 0,
            created_at: channelData.snippet.publishedAt,
            updated_at: new Date().toISOString(),
          });

        if (influencerError) {
          console.error('Supabase influencer upsert error:', influencerError);
          throw new Error('Failed to save YouTube channel data');
        }

        setGoogleAccount({
          ...profileData,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: Date.now() + tokenResponse.expires_in * 1000,
        });

        setSuccess('Google account and YouTube channel connected successfully!');
        setTimeout(() => setSuccess(null), 5000);
      } catch (error) {
        console.error('Error connecting Google account:', error);
        setError(error.message || 'Failed to connect Google account or fetch YouTube channel');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login failed:', error);
      setError('Google login failed. Please try again.');
      setLoading(false);
    },
  });

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      setError(null);

      // Remove Google account from Supabase
      const { error: googleAccountError } = await supabase
        .from('user_google_accounts')
        .delete()
        .eq('user_id', user.id);

      if (googleAccountError) {
        console.error('Error deleting Google account:', googleAccountError);
        throw new Error('Failed to disconnect Google account');
      }

      // Remove YouTube influencer data from Supabase
      const { error: influencerError } = await supabase
        .from('youtube_influencer')
        .delete()
        .eq('user_id', user.id);

      if (influencerError) {
        console.error('Error deleting YouTube influencer data:', influencerError);
        throw new Error('Failed to disconnect YouTube channel data');
      }

      // Logout from Google
      googleLogout();

      // Clear local state
      setGoogleAccount(null);
      setSuccess('Google account disconnected successfully');
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error disconnecting Google account:', error);
      setError(error.message || 'Failed to disconnect Google account');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const NavItem = ({ icon, label, active, onClick, href }) => {
    return (
      <li>
        <Link href={href} passHref>
          <button
            onClick={onClick}
            className={`w-full flex items-center py-3 px-4 rounded-xl transition-all duration-300 group
            ${
              active
                ? 'bg-gradient-to-r from-purple-900/60 to-blue-900/40 text-white shadow-md shadow-purple-900/20'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:shadow-sm hover:shadow-purple-900/10'
            }`}
          >
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
              ${
                active
                  ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-purple-300'
                  : 'text-gray-400 group-hover:text-purple-300'
              }`}
            >
              {icon}
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1 flex flex-col items-start overflow-hidden">
                <span className={`font-medium transition-all ${active ? 'text-white' : ''}`}>{label}</span>
                {active && (
                  <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 mt-1 rounded-full"></div>
                )}
              </div>
            )}
            {active && sidebarOpen && (
              <div className="w-1.5 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full mr-1"></div>
            )}
          </button>
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 opacity-50">
        <div className="absolute top-0 left-0 w-full h-full">
          <div
            className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-900/10 rounded-full filter blur-3xl animate-pulse"
            style={{ animationDuration: '15s' }}
          ></div>
          <div
            className="absolute bottom-1/3 right-1/3 w-1/2 h-1/2 bg-blue-900/10 rounded-full filter blur-3xl animate-pulse"
            style={{ animationDuration: '20s' }}
          ></div>
        </div>
      </div>

      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-24'
        } bg-gray-900/90 backdrop-blur-md border-r border-gray-800/50 transition-all duration-300 flex flex-col z-10`}
      >
        <div className="py-6 border-b border-gray-800/50 transition-all">
          <div className={`px-6 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen ? (
              <div className="flex items-center">
                <div className="relative w-12 h-12 mr-4 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center">
                    <Video size={24} className="text-white z-10" />
                    <div className="absolute w-12 h-12 bg-white/20 rounded-full blur-lg animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/40"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                    VideoSync
                  </h1>
                  <p className="text-xs text-gray-400">AI Video Platform</p>
                </div>
              </div>
            ) : (
              <div className="relative w-12 h-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center">
                  <Video size={24} className="text-white z-10" />
                  <div className="absolute w-12 h-12 bg-white/20 rounded-full blur-lg animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/40"></div>
                </div>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800/50 transition-all z-50 relative"
            >
              {sidebarOpen ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

         <ScrollArea className="flex-1 py-6 px-4">
                  <div className="mb-8">
                    {sidebarOpen && (
                      <div className="px-4 mb-4">
                        <div className="flex space-x-2 mb-4">
                          <Button
                            onClick={() => setUserRole('buyer')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                              ${userRole === 'buyer'
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                          >
                            <User size={16} className="mr-2" />
                            Buyer
                          </Button>
                          <Button
                            onClick={() => setUserRole('seller')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                              ${userRole === 'seller'
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                          >
                            <Briefcase size={16} className="mr-2" />
                            Seller
                          </Button>
                        </div>
                      </div>
                    )}
                    {sidebarOpen && (
                      <div className="flex items-center justify-between px-4 mb-4">
                        <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">{userRole === 'buyer' ? 'Main Menu' : 'Seller Dashboard'}</h3>
                        <div className="w-8 h-0.5 bg-gray-800 rounded-full"></div>
                      </div>
                    )}
                    <ul className="space-y-2">
                      {userRole === 'buyer' ? (
                        <>
                         <NavItem
                            icon={<Home size={20} />}
                            label="Dashboard"
                            active={selectedNav === 'dashboard'}
                            onClick={() => setSelectedNav('dashboard')}
                            href="/dashboard"
                          />
                          <NavItem
                            icon={<SquarePlus size={20} />}
                            label="Create Campaign"
                            active={selectedNav === 'create'}
                            onClick={() => setSelectedNav('create')}
                            href="/createcampaign"
                          />
                          <NavItem
                            icon={<BookOpen size={20} />}
                            label="Manage Campaign"
                            active={selectedNav === 'library'}
                            onClick={() => setSelectedNav('library')}
                            href="/managecampaign"
                          />
                          <NavItem
                            icon={<ChartColumnDecreasing size={20} />}
                            label="Your Stats"
                            active={selectedNav === 'stats'}
                            onClick={() => setSelectedNav('stats')}
                            href="/campaignstats"
                          />
                        </>
                      ) : (
                        <>
                          <NavItem 
                            icon={<User size={20} />} 
                            label="Profile Settings" 
                            active={selectedNav === 'profile'}
                            onClick={() => setSelectedNav('profile')}
                            href="/profilesetting"
                          />
                          <NavItem 
                            icon={<Video size={20} />} 
                            label="Manage Campaign" 
                            active={selectedNav === 'manage'} 
                            onClick={() => setSelectedNav('manage')}
                            href="/createcollab"
                          />
                         
                          <NavItem 
                            icon={<Sparkles size={20} />} 
                            label="AI Post Generate" 
                            active={selectedNav === 'ai-generate'} 
                            onClick={() => setSelectedNav('ai-generate')}
                            href="/ai-post-generate"
                          />
                          <NavItem 
                            icon={<Settings size={20} />} 
                            label="Settings" 
                            active={selectedNav === 'settings'} 
                            onClick={() => setSelectedNav('settings')}
                            href="/settings"
                          />
                        </>
                      )}
                    </ul>
                  </div>
        
                  {userRole === 'buyer' && (
                    <div className={`mb-8 transition-all duration-500 delay-100 ${isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
                      {sidebarOpen && (
                        <div className="flex items-center justify-between px-4 mb-4">
                          <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Marketplace</h3>
                          <div className="w-8 h-0.5 bg-gray-800 rounded-full"></div>
                        </div>
                      )}
                      <ul className="space-y-2">
                        <NavItem 
                          icon={<Users size={20} />} 
                          label="Accounts" 
                          active={selectedNav === 'pricing'} 
                          onClick={() => setSelectedNav('pricing')}
                          href="/rentaccounts"
                        />
                        <NavItem 
                          icon={<Settings size={20} />} 
                          label="Settings" 
                          active={selectedNav === 'settings'} 
                          onClick={() => setSelectedNav('settings')}
                          href="/settings"
                        />
                      </ul>
                    </div>
                  )}
        
                  {sidebarOpen && (
                    <div className={`mt-8 transition-all duration-500 delay-200 ${isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
                      <div className="relative overflow-hidden rounded-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-blue-900/40 z-0 pointer-events-none"></div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/20 rounded-full blur-xl z-0 pointer-events-none"></div>
                        <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl z-0 pointer-events-none"></div>
                        
                        <div className="relative p-6 backdrop-blur-sm border border-purple-500/20 rounded-2xl z-10">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl border border-purple-500/20 shadow-inner shadow-purple-500/10">
                              <Sparkles size={20} className="text-purple-300" />
                            </div>
                            <h4 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Pro Features</h4>
                          </div>
                          <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                            Unlock AI video enhancements, unlimited storage, and team collaboration.
                          </p>
                          <div className="w-full h-1.5 bg-gray-800/60 rounded-full mb-2 overflow-hidden">
                            <div className="h-full w-3/4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                            <span>75% complete</span>
                            <span>7 days left</span>
                          </div>
                          <button className="w-full py-3 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 flex items-center justify-center group z-50 relative">
                            <Zap size={16} className="mr-2 group-hover:animate-pulse" />
                            Upgrade Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>

        <div className="p-4 border-t border-gray-800/50">
          <button className="w-full flex items-center justify-center py-4 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 group relative overflow-hidden z-50">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-400/0 via-white/20 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full z-0 pointer-events-none"></div>

            {sidebarOpen ? (
              <>
                <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-medium">Create New Project</span>
              </>
            ) : (
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col z-10">
        <header className="bg-gray-900/70 backdrop-blur-md border-b border-gray-800/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">
                  Tutorials
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">
                  Templates
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">
                  Support
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800/50 transition">
                <HelpCircle size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-purple-500"></span>
              </button>
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-medium cursor-pointer border-2 border-transparent hover:border-white transition-all">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Account Settings
              </h1>
              <p className="text-gray-400 mt-2">Manage your connected accounts and integration settings</p>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">YouTube Integration</h2>
                    <p className="text-gray-400 mt-1">
                      Connect your Google account to upload videos directly to YouTube
                    </p>
                  </div>
                  {googleAccount ? (
                    <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
                      {loading ? 'Processing...' : 'Disconnect'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => login()}
                      disabled={loading}
                      className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                    >
                      {loading ? 'Connecting...' : 'Connect Google Account'}
                    </Button>
                  )}
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-start">
                    <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-medium text-red-300">Connection Error</h4>
                      <p className="text-sm text-red-400 mt-1">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                      <X size={18} />
                    </button>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-900/30 border border-green-800 rounded-lg flex items-start">
                    <CheckCircle className="text-green-400 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-medium text-green-300">Success</h4>
                      <p className="text-sm text-green-400 mt-1">{success}</p>
                    </div>
                    <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-300">
                      <X size={18} />
                    </button>
                  </div>
                )}

                {googleAccount ? (
                  <div className="border-t border-gray-800 pt-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={googleAccount.picture}
                        alt="Google profile"
                        className="w-12 h-12 rounded-full border-2 border-purple-500/50"
                      />
                      <div>
                        <h3 className="font-medium text-white">{googleAccount.name}</h3>
                        <p className="text-sm text-gray-400">{googleAccount.email}</p>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
                            <Check className="mr-1" size={12} />
                            Connected
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Permissions</h4>
                        <ul className="space-y-2">
                          <li className="flex items-center text-sm text-gray-400">
                            <Check className="text-green-400 mr-2" size={14} />
                            Upload videos to YouTube
                          </li>
                          <li className="flex items-center text-sm text-gray-400">
                            <Check className="text-green-400 mr-2" size={14} />
                            View your YouTube channel info
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Connection Details</h4>
                        <div className="space-y-2 text-sm text-gray-400">
                          <div>
                            <span className="font-medium">Connected on:</span>{' '}
                            {new Date().toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Expires:</span>{' '}
                            {new Date(googleAccount.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-800 pt-6">
                    <div className="bg-gray-800/20 rounded-xl p-6 border border-dashed border-gray-700 text-center">
                      <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                          alt="Google logo"
                          className="w-8 h-8"
                        />
                      </div>
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No Google Account Connected</h3>
                      <p className="text-gray-500 mb-4 max-w-md mx-auto">
                        Connect your Google account to enable direct YouTube uploads from your video library.
                      </p>
                      <Button
                        onClick={() => login()}
                        disabled={loading}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                      >
                        {loading ? 'Connecting...' : 'Connect Google Account'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Video Upload Settings</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-300 mb-3">Default Upload Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-400">Default Privacy Setting</label>
                        <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm">
                          <option>Public</option>
                          <option>Unlisted</option>
                          <option>Private</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-gray-400">Default Category</label>
                        <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm">
                          <option>Film & Animation</option>
                          <option>Autos & Vehicles</option>
                          <option>Music</option>
                          <option>Pets & Animals</option>
                          <option>Sports</option>
                          <option>Gaming</option>
                          <option>People & Blogs</option>
                          <option>Comedy</option>
                          <option>Entertainment</option>
                          <option>News & Politics</option>
                          <option>Howto & Style</option>
                          <option>Education</option>
                          <option>Science & Technology</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-300 mb-3">Default Metadata</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-400 mb-2">Default Description Template</label>
                        <textarea
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[100px] text-sm"
                          placeholder="Add your default video description template..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          You can use variables like {`{title}`}, {`{date}`}, etc.
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="block text-gray-400 mb-2">Default Tags</label>
                          <input
                            type="text"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-2">Max Tags</label>
                          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm">
                            {[5, 10, 15, 20].map((num) => (
                              <option key={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800 flex justify-end">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
                      Save Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}