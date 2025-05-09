'use client'
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
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
  Zap,
  Plus,
  X,
  User,
  Briefcase,
  Star,
  BarChart,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Link as LinkIcon,
  ChevronUp,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data for view trends (replace with YouTube Analytics API data if available)
const generateMockTrendData = () => [
  { day: 'Day 1', views: 100 },
  { day: 'Day 2', views: 150 },
  { day: 'Day 3', views: 200 },
  { day: 'Day 4', views: 300 },
  { day: 'Day 5', views: 250 },
  { day: 'Day 6', views: 400 },
  { day: 'Day 7', views: 350 }
];

export default function YouTubeAnalyticsPage() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNav, setSelectedNav] = useState('analytics');
  const [campaigns, setCampaigns] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('seller');
  const [isAnimating, setIsAnimating] = useState(false);
  const [userChannelId, setUserChannelId] = useState(null);
  const [influencers, setInfluencers] = useState({});
  const [expandedCampaigns, setExpandedCampaigns] = useState({});

  // Fetch user's YouTube channel ID, campaigns, and analytics
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user's YouTube channel ID
        const { data: influencerData, error: influencerError } = await supabase
          .from('youtube_influencer')
          .select('channel_id')
          .eq('user_id', user.id)
          .single();

        if (influencerError) throw new Error(`Failed to fetch influencer data: ${influencerError.message}`);

        const channelId = influencerData?.channel_id;
        setUserChannelId(channelId);

        if (!channelId) {
          setError('No YouTube channel associated with this account');
          setCampaigns([]);
          return;
        }

        // Fetch campaigns where the user is an influencer
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select(`
            id,
            name,
            description,
            music,
            artist_name,
            created_at,
            youtube_videos,
            selected_influencers
          `)
          .contains('selected_influencers', [channelId]);

        if (campaignError) throw new Error(`Failed to fetch campaigns: ${campaignError.message}`);

        // Fetch influencer details for selected influencers
        const influencerIds = campaignData.flatMap(c => c.selected_influencers);
        if (influencerIds.length > 0) {
          const { data: influencerData, error: influencerFetchError } = await supabase
            .from('youtube_influencer')
            .select('channel_id, channel_title, custom_url, subscriber_count, view_count, thumbnail_url')
            .in('channel_id', [...new Set(influencerIds)]);

          if (influencerFetchError) throw new Error(`Failed to fetch influencers: ${influencerFetchError.message}`);

          const influencerMap = influencerData.reduce((acc, influencer) => ({
            ...acc,
            [influencer.channel_id]: influencer
          }), {});
          setInfluencers(influencerMap);
        }

        setCampaigns(campaignData || []);

        // Initialize expanded state for campaigns
        setExpandedCampaigns(
          campaignData.reduce((acc, campaign) => ({
            ...acc,
            [campaign.id]: true
          }), {})
        );

        // Fetch analytics for videos uploaded by this influencer
        const videoIds = campaignData
          .flatMap(campaign =>
            (campaign.youtube_videos || []).filter(video => video.influencer_id === channelId)
              .map(video => video.video_id)
          )
          .join(',');

        if (videoIds) {
          // Fetch Google access token
          const { data: googleAccount, error: googleError } = await supabase
            .from('user_google_accounts')
            .select('access_token')
            .eq('user_id', user.id)
            .single();

          if (googleError || !googleAccount?.access_token) {
            throw new Error('No Google account connected. Please connect your Google account in settings.');
          }

          // Fetch YouTube analytics
          const response = await fetch(`/api/youtube/stats?videoIds=${videoIds}`, {
            headers: {
              Authorization: `Bearer ${googleAccount.access_token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch YouTube analytics');
          }

          const data = await response.json();
          const analytics = data.items.reduce((acc, item) => ({
            ...acc,
            [item.id]: {
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.medium?.url || '',
              views: parseInt(item.statistics.viewCount || 0),
              likes: parseInt(item.statistics.likeCount || 0),
              comments: parseInt(item.statistics.commentCount || 0),
              trendData: generateMockTrendData()
            }
          }), {});
          setAnalyticsData(analytics);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCampaign = (campaignId) => {
    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  // Calculate total stats
  const totalStats = Object.values(analyticsData).reduce(
    (acc, data) => ({
      views: acc.views + data.views,
      likes: acc.likes + data.likes,
      comments: acc.comments + data.comments
    }),
    { views: 0, likes: 0, comments: 0 }
  );

  const NavItem = ({ icon, label, active, onClick, href }) => {
    return (
      <li>
        <Link href={href} passHref>
          <button 
            onClick={onClick}
            className={`w-full flex items-center py-3 px-4 rounded-xl transition-all duration-300 group
            ${active 
              ? 'bg-gradient-to-r from-purple-900/60 to-blue-900/40 text-white shadow-md shadow-purple-900/20' 
              : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:shadow-sm hover:shadow-purple-900/10'}`}
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
              ${active 
                ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-purple-300' 
                : 'text-gray-400 group-hover:text-purple-300'}`}>
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
  };

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
                        ? 'bg-gradient-to-r from-purple-700 to-blue-700 text-white shadow-md'
                        : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700'}`}
                  >
                    <User size={16} className="mr-2" />
                    Buyer
                  </Button>
                  <Button
                    onClick={() => setUserRole('seller')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                      ${userRole === 'seller'
                        ? 'bg-gradient-to-r from-purple-700 to-blue-700 text-white shadow-md'
                        : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700'}`}
                  >
                    <Briefcase size={16} className="mr-2" />
                    Seller
                  </Button>
                </div>
              </div>
            )}
            {sidebarOpen && (
              <div className="flex items-center justify-between px-4 mb-4">
                <h3 className="text-xs uppercase text-gray-400 font-semibold tracking-wider">{userRole === 'buyer' ? 'Main Menu' : 'Seller Dashboard'}</h3>
                <div className="w-8 h-0.5 bg-gray-800/70 rounded-full"></div>
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
                    icon={<Video size={20} />} 
                    label="Create Campaign" 
                    active={selectedNav === 'create'} 
                    onClick={() => setSelectedNav('create')}
                    href="/create"
                  />
                  <NavItem 
                    icon={<BookOpen size={20} />} 
                    label="Video Library" 
                    active={selectedNav === 'library'} 
                    onClick={() => setSelectedNav('library')}
                    href="/videolibrary"
                  />
                  <NavItem 
                    icon={<Music size={20} />} 
                    label="Your Stats" 
                    active={selectedNav === 'stats'} 
                    onClick={() => setSelectedNav('stats')}
                    href="/stats"
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
                    active={selectedNav === 'campaigns'} 
                    onClick={() => setSelectedNav('campaigns')}
                    href="/campaigns"
                  />
                  <NavItem 
                    icon={<BarChart size={20} />} 
                    label="Analytics" 
                    active={selectedNav === 'analytics'} 
                    onClick={() => setSelectedNav('analytics')}
                    href="/analytics"
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
                  <h3 className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Workspace</h3>
                  <div className="w-8 h-0.5 bg-gray-800/70 rounded-full"></div>
                </div>
              )}
              <ul className="space-y-2">
                <NavItem 
                  icon={<Users size={20} />} 
                  label="Pricing" 
                  active={selectedNav === 'pricing'} 
                  onClick={() => setSelectedNav('pricing')}
                  href="/pricing"
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
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50 z-0 pointer-events-none"></div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/30 rounded-full blur-xl z-0 pointer-events-none"></div>
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-500/30 rounded-full blur-xl z-0 pointer-events-none"></div>
                
                <div className="relative p-6 backdrop-blur-sm border border-purple-500/30 rounded-2xl z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500/40 to-blue-500/40 rounded-xl border border-purple-500/30 shadow-inner shadow-purple-500/20">
                      <Sparkles size={20} className="text-purple-200" />
                    </div>
                    <h4 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">Pro Features</h4>
                  </div>
                  <p className="text-sm text-gray-200 mb-4 leading-relaxed">
                    Unlock advanced analytics, AI enhancements, and premium support.
                  </p>
                  <div className="w-full h-1.5 bg-gray-800/70 rounded-full mb-2 overflow-hidden">
                    <div className="h-full w-4/5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-300 mb-4">
                    <span>80% complete</span>
                    <span>5 days left</span>
                  </div>
                  <button className="w-full py-3 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 flex items-center justify-center group z-50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
            {/* Hero Section with Tilt Effect */}
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} glareEnable={true} glareMaxOpacity={0.3} glareColor="#ffffff" glarePosition="all">
              <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-purple-900/40 to-blue-900/40 shadow-2xl shadow-purple-900/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-700/20 to-blue-700/20 filter blur-3xl"></div>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s' }}></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '20s' }}></div>
                
                <div className="relative z-10 px-8 py-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-6 md:mb-0">
                      <div className="inline-flex items-center px-4 py-2 bg-purple-900/50 border border-purple-500/40 rounded-full text-sm text-purple-200 mb-4 shadow-inner">
                        <BarChart size={14} className="mr-2 animate-pulse" />
                        <span>Performance Insights</span>
                      </div>
                      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-2">
                        YouTube Analytics Dashboard
                      </h1>
                      <p className="text-lg text-gray-200 max-w-xl">
                        Dive into the performance metrics of your campaign videos with stunning visuals.
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
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-300 hover:text-red-200 transition"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center text-gray-300 py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                <p className="mt-4">Loading analytics...</p>
              </div>
            )}

            {/* No Campaigns */}
            {!loading && campaigns.length === 0 && (
              <div className="text-center text-gray-300 py-12">
                <BarChart size={48} className="mx-auto mb-4 animate-pulse" />
                <p>No campaigns found for your YouTube channel.</p>
                <Link href="/campaigns" passHref>
                  <Button className="mt-4 bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-purple-900/50">
                    View Campaigns
                  </Button>
                </Link>
              </div>
            )}

            {/* Summary Stats */}
            {!loading && campaigns.length > 0 && Object.keys(analyticsData).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-6 border border-purple-500/40 shadow-lg hover:shadow-purple-500/50 transition-all">
                  <div className="flex items-center mb-2">
                    <Eye size={24} className="text-blue-400 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-200">Total Views</h3>
                  </div>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                    {totalStats.views.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-6 border border-purple-500/40 shadow-lg hover:shadow-purple-500/50 transition-all">
                  <div className="flex items-center mb-2">
                    <Heart size={24} className="text-purple-400 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-200">Total Likes</h3>
                  </div>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                    {totalStats.likes.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-6 border border-purple-500/40 shadow-lg hover:shadow-purple-500/50 transition-all">
                  <div className="flex items-center mb-2">
                    <MessageCircle size={24} className="text-blue-400 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-200">Total Comments</h3>
                  </div>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                    {totalStats.comments.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Analytics Dashboard */}
            {!loading && campaigns.length > 0 && (
              <div className="space-y-6">
                {campaigns.map(campaign => {
                  const videos = (campaign.youtube_videos || []).filter(video => video.influencer_id === userChannelId);
                  if (videos.length === 0) return null;

                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-800/70 shadow-xl shadow-purple-900/20"
                    >
                      <div
                        className="flex items-center justify-between p-6 cursor-pointer"
                        onClick={() => toggleCampaign(campaign.id)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-900/50 rounded-lg border border-purple-500/40 mr-4 shadow-inner">
                            <Video size={24} className="text-purple-300" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                              {campaign.name}
                            </h2>
                            <p className="text-sm text-gray-300">{campaign.description}</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedCampaigns[campaign.id] ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDownIcon size={24} className="text-gray-300" />
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {expandedCampaigns[campaign.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {videos.map(video => {
                                const analytics = analyticsData[video.video_id] || {};
                                return (
                                  <motion.div
                                    key={video.video_id}
                                    whileHover={{ scale: 1.05, rotate: 1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/50 shadow-lg hover:shadow-purple-500/60 transition-all overflow-hidden"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 z-0"></div>
                                    <div className="relative z-10">
                                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-4 shadow-md">
                                        {analytics.thumbnail ? (
                                          <img
                                            src={analytics.thumbnail}
                                            alt={analytics.title}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gray-800/70 flex items-center justify-center">
                                            <Video size={32} className="text-gray-300" />
                                          </div>
                                        )}
                                        <a
                                          href={`https://youtu.be/${video.video_id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300"
                                        >
                                          <div className="relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-700 to-blue-700 rounded-full text-white font-medium shadow-lg hover:shadow-purple-900/50 group">
                                            <LinkIcon size={16} className="mr-2 group-hover:scale-110 transition-transform" />
                                            Watch on YouTube
                                            <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full animate-ripple"></div>
                                          </div>
                                        </a>
                                      </div>
                                      <h3 className="text-lg font-semibold text-white truncate mb-3">
                                        {analytics.title || 'Untitled Video'}
                                      </h3>
                                      <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                                        <div className="flex items-center bg-gray-900/50 rounded-lg p-2">
                                          <Eye size={16} className="text-blue-400 mr-2 animate-pulse" />
                                          <span className="text-gray-200">{(analytics.views || 0).toLocaleString()} views</span>
                                        </div>
                                        <div className="flex items-center bg-gray-900/50 rounded-lg p-2">
                                          <Heart size={16} className="text-purple-400 mr-2 animate-pulse" />
                                          <span className="text-gray-200">{(analytics.likes || 0).toLocaleString()} likes</span>
                                        </div>
                                        <div className="flex items-center bg-gray-900/50 rounded-lg p-2">
                                          <MessageCircle size={16} className="text-blue-400 mr-2 animate-pulse" />
                                          <span className="text-gray-200">{(analytics.comments || 0).toLocaleString()} comments</span>
                                        </div>
                                      </div>
                                      <div className="h-32">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={analytics.trendData || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                                            <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                                            <Tooltip
                                              contentStyle={{
                                                backgroundColor: '#1F2937',
                                                border: '1px solid #4B5563',
                                                borderRadius: '8px',
                                                color: '#F3F4F6'
                                              }}
                                            />
                                            <Line
                                              type="monotone"
                                              dataKey="views"
                                              stroke="#8B5CF6"
                                              strokeWidth={2}
                                              dot={false}
                                              activeDot={{ r: 6, fill: '#8B5CF6' }}
                                            />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}