'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import {
  Home, Settings, HelpCircle, ChevronRight, ChevronDown, Video, BookOpen, Users, Sparkles, User, Briefcase,
  Zap, SquarePlus, ChartColumnDecreasing, Plus, Check, X, AlertCircle, CheckCircle, Film, List, Heart
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define available genres and categories
const videoGenres = [
  'Vlog', 'Tutorial', 'Review', 'Gaming', 'Comedy', 'Music', 'Animation', 'Documentary', 'Travel', 'Lifestyle'
];
const videoCategories = [
  'Film & Animation', 'Autos & Vehicles', 'Music', 'Pets & Animals', 'Sports', 'Gaming', 'People & Blogs',
  'Comedy', 'Entertainment', 'News & Politics', 'Howto & Style', 'Education', 'Science & Technology'
];
const interestCategories = videoCategories;

export default function ProfileSetting() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNav, setSelectedNav] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userRole, setUserRole] = useState('seller');
  const [formData, setFormData] = useState({
    video_genres: [],
    video_categories: [],
    interest_categories: []
  });

  // Fetch existing influencer data from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchInfluencerData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('youtube_influencer')
          .select('video_genres, video_categories, interest_categories')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Supabase error:', error);
          throw new Error('Failed to load influencer profile');
        }

        if (data) {
          setFormData({
            video_genres: data.video_genres || [],
            video_categories: data.video_categories || [],
            interest_categories: data.interest_categories || []
          });
        } else {
          setFormData({
            video_genres: [],
            video_categories: [],
            interest_categories: []
          });
        }
      } catch (error) {
        console.error('Error fetching influencer data:', error);
        setError(error.message || 'Failed to load influencer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencerData();
  }, [user]);

  // Animation effect
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle checkbox changes
  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => {
      const currentField = Array.isArray(prev[field]) ? prev[field] : [];
      const updatedField = currentField.includes(value)
        ? currentField.filter((item) => item !== value)
        : [...currentField, value];
      return { ...prev, [field]: updatedField };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('youtube_influencer')
        .update({
          video_genres: formData.video_genres,
          video_categories: formData.video_categories,
          interest_categories: formData.interest_categories,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error('Failed to update influencer profile');
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update influencer profile');
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
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient">
                Influencer Profile
              </h1>
              <p className="text-gray-300 mt-2 text-lg">Showcase your unique style and interests</p>
            </div>

            <div className="bg-gray-900/30 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-8 shadow-xl shadow-purple-900/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 pointer-events-none"></div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>

              <form onSubmit={handleSubmit} className="relative z-10">
                <div className="space-y-10">
                  <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-y-6' : 'opacity-100 transform translate-y-0'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <Film size={24} className="text-purple-400" />
                      <h2 className="text-2xl font-semibold text-white">Video Genres</h2>
                    </div>
                    <p className="text-gray-300 mb-6">Select the genres that define your content</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videoGenres.map((genre, index) => (
                        <label
                          key={genre}
                          className={`flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group transform hover:scale-105 ${
                            formData.video_genres?.includes(genre) ? 'border-purple-500 bg-purple-900/20' : ''
                          }`}
                          style={{ transitionDelay: `${index * 50}ms` }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.video_genres?.includes(genre) || false}
                            onChange={() => handleCheckboxChange('video_genres', genre)}
                            className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 h-5 w-5 transition-all duration-200"
                          />
                          <span className="text-gray-200 group-hover:text-white transition-colors">{genre}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={`transition-all duration-500 delay-100 ${isAnimating ? 'opacity-0 transform translate-y-6' : 'opacity-100 transform translate-y-0'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <List size={24} className="text-blue-400" />
                      <h2 className="text-2xl font-semibold text-white">Video Categories</h2>
                    </div>
                    <p className="text-gray-300 mb-6">Choose categories your videos typically cover</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videoCategories.map((category, index) => (
                        <label
                          key={category}
                          className={`flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group transform hover:scale-105 ${
                            formData.video_categories?.includes(category) ? 'border-blue-500 bg-blue-900/20' : ''
                          }`}
                          style={{ transitionDelay: `${index * 50}ms` }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.video_categories?.includes(category) || false}
                            onChange={() => handleCheckboxChange('video_categories', category)}
                            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 h-5 w-5 transition-all duration-200"
                          />
                          <span className="text-gray-200 group-hover:text-white transition-colors">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={`transition-all duration-500 delay-200 ${isAnimating ? 'opacity-0 transform translate-y-6' : 'opacity-100 transform translate-y-0'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <Heart size={24} className="text-pink-400" />
                      <h2 className="text-2xl font-semibold text-white">Interest Categories</h2>
                    </div>
                    <p className="text-gray-300 mb-6">Select categories you're passionate about for collaborations</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {interestCategories.map((category, index) => (
                        <label
                          key={category}
                          className={`flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group transform hover:scale-105 ${
                            formData.interest_categories?.includes(category) ? 'border-pink-500 bg-pink-900/20' : ''
                          }`}
                          style={{ transitionDelay: `${index * 50}ms` }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.interest_categories?.includes(category) || false}
                            onChange={() => handleCheckboxChange('interest_categories', category)}
                            className="rounded border-gray-600 bg-gray-700 text-pink-500 focus:ring-pink-500 h-5 w-5 transition-all duration-200"
                          />
                          <span className="text-gray-200 group-hover:text-white transition-colors">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-start animate-slide-in">
                      <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
                      <div>
                        <h4 className="font-medium text-red-300">Error</h4>
                        <p className="text-sm text-red-400 mt-1">{error}</p>
                      </div>
                      <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {success && (
                    <div className="p-4 bg-green-900/30 border border-green-800 rounded-lg flex items-start animate-slide-in">
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

                  <div className="pt-6 border-t border-gray-800/50 flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white py-3 px-6 rounded-xl shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/40 transition-all duration-300 group animate-pulse-slow"
                    >
                      <span className="relative z-10 flex items-center">
                        <Check size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                        {loading ? 'Saving...' : 'Save Profile'}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Inline CSS for animations */}
        <style jsx>{`
          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 6s ease infinite;
          }
          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
          @keyframes pulse-slow {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.03);
            }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}