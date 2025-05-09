'use client'
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import {
  Home, Settings, HelpCircle, ChevronRight, ChevronDown, Video, BookOpen, Music, Users,SquarePlus,ChartColumnDecreasing,
  Sparkles, Zap, Plus, X, User, Briefcase, Star, BarChart, Eye, Heart, Link as LinkIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function YouTubeMarketplacePage() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNav, setSelectedNav] = useState('pricing');
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('buyer');
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);

  // Fetch all YouTube influencer accounts
  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('youtube_influencer')
          .select('channel_id, channel_title, custom_url, subscriber_count, view_count, thumbnail_url, description, created_at');

        if (error) throw new Error(`Failed to fetch influencers: ${error.message}`);

        setInfluencers(data || []);
      } catch (error) {
        console.error('Error fetching influencers:', error);
        setError(error.message || 'Failed to load influencers');
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencers();
  }, []);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const openInfluencerModal = (influencer) => setSelectedInfluencer(influencer);
  const closeInfluencerModal = () => setSelectedInfluencer(null);

  // Filter influencers based on search query
  const filteredInfluencers = influencers.filter(influencer =>
    influencer.channel_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NavItem = ({ icon, label, active, onClick, href }) => (
    <li>
      <Link href={href} passHref>
        <button
          onClick={onClick}
          className={`w-full flex items-center py-3 px-4 rounded-xl transition-all duration-300 group
            ${active ? 'bg-gradient-to-r from-purple-900/60 to-blue-900/40 text-white shadow-md shadow-purple-900/20' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:shadow-sm hover:shadow-purple-900/10'}`}
        >
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
            ${active ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-purple-300' : 'text-gray-400 group-hover:text-purple-300'}`}>
            {icon}
          </div>
          {sidebarOpen && (
            <div className="ml-3 flex-1 flex flex-col items-start overflow-hidden">
              <span className={`font-medium transition-all ${active ? 'text-white' : ''}`}>{label}</span>
              {active && <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 mt-1 rounded-full"></div>}
            </div>
          )}
          {active && sidebarOpen && (
            <div className="w-1.5 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full mr-1"></div>
          )}
        </button>
      </Link>
    </li>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 opacity-70">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/5 left-1/5 w-3/5 h-3/5 bg-purple-900/15 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-3/5 h-3/5 bg-blue-900/15 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '18s' }}></div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-24'} bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/70 transition-all duration-500 flex flex-col z-20 shadow-2xl shadow-purple-900/10`}>
        <div className="py-6 border-b border-gray-800/70 transition-all">
          <div className={`px-6 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen ? (
              <div className="flex items-center">
                <div className="relative w-12 h-12 mr-4 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-blue-700 rounded-xl shadow-lg shadow-purple-900/40 flex items-center justify-center">
                    <Video size={24} className="text-white z-10" />
                    <div className="absolute w-16 h-16 bg-white/25 rounded-full blur-lg animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">VideoSync</h1>
                  <p className="text-xs text-gray-300">AI Video Platform</p>
                </div>
              </div>
            ) : (
              <div className="relative w-12 h-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-blue-700 rounded-xl shadow-lg shadow-purple-900/40 flex items-center justify-center">
                  <Video size={24} className="text-white z-10" />
                  <div className="absolute w-16 h-16 bg-white/25 rounded-full blur-lg animate-pulse"></div>
                </div>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-800/70 transition-all z-50"
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
                            href="/profile"
                          />
                          <NavItem 
                            icon={<Video size={20} />} 
                            label="Manage Campaign" 
                            active={selectedNav === 'manage'} 
                            onClick={() => setSelectedNav('manage')}
                            href="/manage-campaign"
                          />
                          <NavItem 
                            icon={<BookOpen size={20} />} 
                            label="Post Remixing" 
                            active={selectedNav === 'remixing'} 
                            onClick={() => setSelectedNav('remixing')}
                            href="/post-remixing"
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

        <div className="p-4 border-t border-gray-800/70">
          <Link href="/create" passHref>
            <button className="w-full flex items-center justify-center py-4 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-blue-700 text-white hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 group relative overflow-hidden z-50">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-400/0 via-white/30 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full z-0 pointer-events-none"></div>
              {sidebarOpen ? (
                <>
                  <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-medium">Create New Project</span>
                </>
              ) : (
                <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              )}
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col z-10 relative">
        {/* Navbar */}
        <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/70 p-4 shadow-lg shadow-purple-900/10">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white text-sm font-medium transition">Tutorials</a>
                <a href="#" className="text-gray-300 hover:text-white text-sm font-medium transition">Templates</a>
                <a href="#" className="text-gray-300 hover:text-white text-sm font-medium transition">Support</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-800/70 transition">
                <HelpCircle size={20} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping"></span>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              </button>
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-sm font-medium cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all shadow-md hover:shadow-purple-500/50">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <ScrollArea className="flex-1 bg-gradient-to-b from-gray-950 to-gray-900">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {/* Hero Section */}
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} glareEnable={true} glareMaxOpacity={0.3} glareColor="#ffffff" glarePosition="all">
              <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-purple-900/40 to-blue-900/40 shadow-2xl shadow-purple-900/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-700/20 to-blue-700/20 filter blur-3xl"></div>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s' }}></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '20s' }}></div>
                <div className="relative z-10 px-8 py-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-6 md:mb-0">
                      <div className="inline-flex items-center px-4 py-2 bg-purple-900/50 border border-purple-500/40 rounded-full text-sm text-purple-200 mb-4 shadow-inner">
                        <Users size={14} className="mr-2 animate-pulse" />
                        <span>YouTube Account Marketplace</span>
                      </div>
                      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-2">
                        Rent YouTube Influencer Accounts
                      </h1>
                      <p className="text-lg text-gray-200 max-w-xl">
                        Discover and rent top YouTube channels to amplify your campaigns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Tilt>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-900/40 backdrop-blur-sm border border-red-800/70 rounded-lg flex items-start animate-fadeIn shadow-lg"
              >
                <Star className="text-red-300 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-red-200">Error</h4>
                  <p className="text-sm text-red-300 mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-200 transition">
                  <X size={18} />
                </button>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center text-gray-300 py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                <p className="mt-4">Loading influencers...</p>
              </div>
            )}

            {/* Search and Filter */}
            {!loading && (
              <div className="mb-6 flex items-center space-x-4">
                <Input
                  type="text"
                  placeholder="Search influencers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 rounded-lg py-2 px-4 w-full max-w-md"
                />
                <Button className="bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-purple-900/50">
                  Filter
                </Button>
              </div>
            )}

            {/* Influencers Grid */}
            {!loading && filteredInfluencers.length === 0 && (
              <div className="text-center text-gray-300 py-12">
                <Users size={48} className="mx-auto mb-4 animate-pulse" />
                <p>No influencers found.</p>
              </div>
            )}

            {!loading && filteredInfluencers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInfluencers.map((influencer) => (
                  <motion.div
                    key={influencer.channel_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} glareEnable={true} glareMaxOpacity={0.3}>
                      <div
                        className="bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-800/70 p-6 shadow-xl shadow-purple-900/20 hover:shadow-purple-500/50 transition-all cursor-pointer"
                        onClick={(e) => {
                          // Prevent modal from opening when clicking buttons
                          if (e.target.closest('button') || e.target.closest('a')) return;
                          openInfluencerModal(influencer);
                        }}
                      >
                        <div className="flex items-center mb-4">
                          <img
                            src={influencer.thumbnail_url || '/placeholder.png'}
                            alt={influencer.channel_title}
                            className="w-16 h-16 rounded-full mr-4 object-cover border-2 border-purple-500/50"
                          />
                          <div>
                            <h3 className="text-xl font-semibold text-white truncate">{influencer.channel_title}</h3>
                            <a
                              href={influencer.custom_url || `https://youtube.com/channel/${influencer.channel_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-300 hover:underline"
                            >
                              @{influencer.channel_title}
                            </a>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center bg-gray-800/50 rounded-lg p-2">
                            <Users size={16} className="text-blue-400 mr-2 animate-pulse" />
                            <span className="text-gray-200">{influencer.subscriber_count.toLocaleString()} subscribers</span>
                          </div>
                          <div className="flex items-center bg-gray-800/50 rounded-lg p-2">
                            <Eye size={16} className="text-purple-400 mr-2 animate-pulse" />
                            <span className="text-gray-200">{influencer.view_count.toLocaleString()} views</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-300">Rental Price: <span className="font-semibold text-purple-300">Contact for Details</span></span>
                          <span className="text-sm text-green-400">Available</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            asChild
                            className="flex-1 bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-purple-900/50"
                          >
                            <Link href={`/marketplace/rent/${influencer.channel_id}`}>
                              Rent Now
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="flex-1 border-purple-500/50 text-purple-300 hover:bg-purple-900/50 hover:text-white"
                          >
                            <a href={influencer.custom_url || `https://youtube.com/channel/${influencer.channel_id}`} target="_blank" rel="noopener noreferrer">
                              <LinkIcon size={16} className="mr-2" />
                              View Channel
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Tilt>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Influencer Details Modal */}
        <AnimatePresence>
          {selectedInfluencer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={closeInfluencerModal}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/50 shadow-2xl shadow-purple-900/30 max-w-2xl w-full mx-4 p-8 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={closeInfluencerModal}
                  className="absolute top-4 right-4 text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-800/70 transition"
                >
                  <X size={24} />
                </button>
                <div className="flex items-center mb-6">
                  <img
                    src={selectedInfluencer.thumbnail_url || '/placeholder.png'}
                    alt={selectedInfluencer.channel_title}
                    className="w-20 h-20 rounded-full mr-4 object-cover border-2 border-purple-500/50"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                      {selectedInfluencer.channel_title}
                    </h2>
                    <a
                      href={selectedInfluencer.custom_url || `https://youtube.com/channel/${selectedInfluencer.channel_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-300 hover:underline"
                    >
                      @{selectedInfluencer.channel_title}
                    </a>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center bg-gray-800/50 rounded-lg p-3">
                      <Users size={18} className="text-blue-400 mr-2 animate-pulse" />
                      <span className="text-gray-200">{selectedInfluencer.subscriber_count.toLocaleString()} subscribers</span>
                    </div>
                    <div className="flex items-center bg-gray-800/50 rounded-lg p-3">
                      <Eye size={18} className="text-purple-400 mr-2 animate-pulse" />
                      <span className="text-gray-200">{selectedInfluencer.view_count.toLocaleString()} views</span>
                    </div>
                  </div>
                  {selectedInfluencer.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-200 mb-2">Channel Description</h3>
                      <p className="text-sm text-gray-300">{selectedInfluencer.description}</p>
                    </div>
                  )}
                  {selectedInfluencer.created_at && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-200 mb-2">Joined</h3>
                      <p className="text-sm text-gray-300">{new Date(selectedInfluencer.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Rental Details</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Price: <span className="font-semibold text-purple-300">Contact for Details</span></span>
                      <span className="text-sm text-green-400">Available</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4 mt-6">
                  <Button
                    asChild
                    className="flex-1 bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-purple-900/50"
                  >
                    <Link href={`/marketplace/rent/${selectedInfluencer.channel_id}`}>
                      Rent Now
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-purple-500/50 text-purple-300 hover:bg-purple-900/50 hover:text-white"
                  >
                    <a href={selectedInfluencer.custom_url || `https://youtube.com/channel/${selectedInfluencer.channel_id}`} target="_blank" rel="noopener noreferrer">
                      <LinkIcon size={16} className="mr-2" />
                      View Channel
                    </a>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}