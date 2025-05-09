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
  Play,
  User,
  Briefcase,
  Star,
  Volume2,
  FileMusic,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CampaignsPage() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNav, setSelectedNav] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [userRole, setUserRole] = useState('seller');
  const [isAnimating, setIsAnimating] = useState(false);
  const [userChannelId, setUserChannelId] = useState(null);
  const [influencers, setInfluencers] = useState({});

  // Fetch user's YouTube channel ID and campaigns
  useEffect(() => {
    if (!user) return;

    const fetchUserChannelAndCampaigns = async () => {
      try {
        setLoading(true);

        // Fetch user's channel ID from youtube_influencer
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

        // Fetch campaigns where user's channel_id is in selected_influencers
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select(`
            *,
            campaign_media (
              id,
              file_url,
              file_type
            )
          `)
          .contains('selected_influencers', [channelId]);

        if (campaignError) throw new Error(`Failed to fetch campaigns: ${campaignError.message}`);

        // Fetch all influencers for campaigns
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
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchUserChannelAndCampaigns();
  }, [user]);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openCampaignDetails = (campaign) => {
    setSelectedCampaign(campaign);
  };

  const closeCampaignDetails = () => {
    setSelectedCampaign(null);
  };

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
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 opacity-50">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-900/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '15s' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-1/2 h-1/2 bg-blue-900/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '20s' }}></div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-24'} bg-gray-900/90 backdrop-blur-md border-r border-gray-800/50 transition-all duration-300 flex flex-col z-10`}>
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
                  <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">VideoSync</h1>
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
                    class nook
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
                  <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Workspace</h3>
                  <div className="w-8 h-0.5 bg-gray-800 rounded-full"></div>
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
          <Link href="/create" passHref>
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
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col z-10 relative">
        {/* Navbar */}
        <header className="bg-gray-900/70 backdrop-blur-md border-b border-gray-800/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Tutorials</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Templates</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Support</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800/50 transition">
                <HelpCircle size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-purple-500"></span>
              </button>
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-medium cursor-pointer border-2 border-transparent hover:border-white transition-all">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-6xl mx-auto p-6">
            <div className="relative overflow-hidden rounded-3xl mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-blue-900/40 z-0"></div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-32 -left-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="mb-6 md:mb-0">
                    <div className="inline-flex items-center px-4 py-2 bg-purple-900/40 border border-purple-500/30 rounded-full text-sm text-purple-300 mb-4">
                      <Star size={14} className="mr-2 animate-pulse" />
                      <span>Your Campaigns</span>
                    </div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                      Manage Your Campaigns
                    </h1>
                    <p className="text-gray-300 max-w-xl">
                      View and manage your music promotion campaigns featuring your YouTube channel.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 backdrop-blur-sm border border-red-800 rounded-lg flex items-start animate-fadeIn">
                <Star className="text-red-400 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-red-300">Error</h4>
                  <p className="text-sm text-red-400 mt-1">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center text-gray-400 py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="mt-4">Loading campaigns...</p>
              </div>
            )}

            {/* Campaigns Grid */}
            {!loading && campaigns.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <Video size={48} className="mx-auto mb-4" />
                <p>No campaigns found for your YouTube channel.</p>
                <Link href="/create" passHref>
                  <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white">
                    Create a Campaign
                  </Button>
                </Link>
              </div>
            )}

            {!loading && campaigns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(campaign => (
                  <div
                    key={campaign.id}
                    onClick={() => openCampaignDetails(campaign)}
                    className="relative bg-gray-900/60 backdrop-blur-md border border-gray-800/50 rounded-2xl p-6 shadow-xl shadow-purple-900/5 hover:shadow-purple-900/10 hover:border-purple-500/30 cursor-pointer transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-2xl z-0"></div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-500/30 mr-3">
                          <Volume2 size={20} className="text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                          {campaign.name}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{campaign.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <FileMusic size={16} className="text-blue-400 mr-2" />
                          <span className="text-sm text-gray-300">{campaign.music}</span>
                        </div>
                        <div className="flex items-center">
                          <User size={16} className="text-purple-400 mr-2" />
                          <span className="text-sm text-gray-300">{campaign.artist_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Users size={16} className="text-blue-400 mr-2" />
                          <span className="text-sm text-gray-300">
                            {campaign.selected_influencers.length} Influencer{campaign.selected_influencers.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Created: {new Date(campaign.created_at).toLocaleDateString()}
                        </span>
                        <Button
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm py-1 px-3"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Full-Screen Campaign Details Overlay */}
        {selectedCampaign && (
          <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-md z-50 overflow-y-auto">
            <div className="min-h-screen flex flex-col justify-center items-center p-6 md:p-8 lg:p-12">
              <div className="relative w-full max-w-7xl mx-auto animate-fadeIn">
                {/* Close Button */}
                <button
                  onClick={closeCampaignDetails}
                  className="absolute top-6 right-6 text-gray-400 hover:text-white bg-gray-900/60 rounded-full p-2 transition-all hover:bg-gray-800/80 z-50"
                >
                  <X size={24} />
                </button>

                {/* Hero Section */}
                <div className="relative h-64 md:h-72 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl overflow-hidden mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 filter blur-3xl"></div>
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
                  <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '15s' }}></div>
                  <div className="relative z-10 flex items-center justify-center h-full px-6 md:px-12">
                    <div className="text-center max-w-3xl">
                      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 animate-fadeIn">
                        {selectedCampaign.name}
                      </h1>
                      <p className="text-lg md:text-xl text-gray-300 mt-2 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                        {selectedCampaign.music} by {selectedCampaign.artist_name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Campaign Details */}
                  <div className="lg:col-span-1 space-y-6 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                    {/* Campaign Metadata */}
                    <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-gray-800/50 shadow-lg">
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center mb-6">
                        <Star size={24} className="mr-2" />
                        Campaign Details
                      </h2>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <FileMusic size={20} className="text-purple-400 mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <span className="text-gray-400 text-sm">Track Title:</span>
                            <p className="text-white font-medium">{selectedCampaign.music}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <User size={20} className="text-blue-400 mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <span className="text-gray-400 text-sm">Artist:</span>
                            <p className="text-white font-medium">{selectedCampaign.artist_name}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <BookOpen size={20} className="text-purple-400 mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <span className="text-gray-400 text-sm">Artist Bio:</span>
                            <p className="text-gray-300 text-sm">{selectedCampaign.artist_bio || "No artist bio provided."}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Calendar size={20} className="text-blue-400 mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <span className="text-gray-400 text-sm">Created:</span>
                            <p className="text-gray-300 text-sm">
                              {selectedCampaign.created_at ? new Date(selectedCampaign.created_at).toLocaleString() : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Campaign Description */}
                    <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-gray-800/50 shadow-lg">
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center mb-4">
                        <BookOpen size={24} className="mr-2" />
                        Description
                      </h2>
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {selectedCampaign.description || "No description available."}
                      </p>
                    </div>
                  </div>

                  {/* Right Columns: Media and Influencers */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Media Section */}
                    <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-gray-800/50 shadow-lg animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center mb-4">
                        <Play size={24} className="mr-2" />
                        Media Content
                      </h2>
                      {selectedCampaign.campaign_media?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedCampaign.campaign_media.map((media, index) => (
                            <div
                              key={index}
                              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/30 transition-all"
                            >
                              <div className="flex items-center mb-2">
                                <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-500/30 mr-2">
                                  {media.file_type === 'audio' ? (
                                    <Volume2 size={16} className="text-purple-400" />
                                  ) : (
                                    <Video size={16} className="text-blue-400" />
                                  )}
                                </div>
                                <h3 className="text-md font-medium text-white">
                                  {media.file_type === 'audio' ? 'Audio' : 'Video'} {index + 1}
                                </h3>
                              </div>
                              {media.file_type === 'audio' ? (
                                <div className="relative mt-2">
                                  <audio controls className="w-full bg-gray-800/50 rounded-lg">
                                    <source src={media.file_url} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                  </audio>
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-lg opacity-20"></div>
                                </div>
                              ) : (
                                <div className="relative aspect-video mt-2">
                                  <video controls className="w-full rounded-lg shadow-md">
                                    <source src={media.file_url} type="video/mp4" />
                                    Your browser does not support the video element.
                                  </video>
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-lg opacity-20"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-700/50 text-center">
                          <Video size={36} className="mx-auto text-gray-500 mb-3" />
                          <p className="text-gray-400">No media files available for this campaign.</p>
                        </div>
                      )}
                    </div>

                    {/* Selected Influencers */}
                    <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-gray-800/50 shadow-lg animate-fadeIn" style={{ animationDelay: '0.8s' }}>
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center mb-4">
                        <Users size={24} className="mr-2" />
                        Selected Influencers
                      </h2>
                      {selectedCampaign.selected_influencers?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedCampaign.selected_influencers.map((channelId) => {
                            const influencer = influencers[channelId];
                            return (
                              <div
                                key={channelId}
                                className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all"
                              >
                                <div className="flex items-center">
                                  {influencer?.thumbnail_url ? (
                                    <img
                                      src={influencer.thumbnail_url}
                                      alt={influencer.channel_title}
                                      className="w-12 h-12 rounded-full mr-3 object-cover border-2 border-purple-500/30"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mr-3 border-2 border-purple-500/30">
                                      <User size={20} className="text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{influencer?.channel_title || 'Unknown Channel'}</p>
                                    <a
                                      href={`https://youtube.com/${influencer?.custom_url || `channel/${channelId}`}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-400 text-sm hover:underline flex items-center"
                                    >
                                      <LinkIcon size={12} className="mr-1 flex-shrink-0" />
                                      <span className="truncate">{influencer?.custom_url || channelId}</span>
                                    </a>
                                    <div className="flex items-center mt-1 space-x-3">
                                      <div className="flex items-center">
                                        <Users size={12} className="text-purple-400 mr-1 flex-shrink-0" />
                                        <span className="text-xs text-gray-400">
                                          {influencer?.subscriber_count ? influencer.subscriber_count.toLocaleString() : 'N/A'} subs
                                        </span>
                                      </div>
                                      <div className="flex items-center">
                                        <Star size={12} className="text-blue-400 mr-1 flex-shrink-0" />
                                        <span className="text-xs text-gray-400">
                                          {influencer?.view_count ? influencer.view_count.toLocaleString() : 'N/A'} views
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-700/50 text-center">
                          <Users size={32} className="mx-auto text-gray-500 mb-2" />
                          <p className="text-gray-400">No influencers selected for this campaign.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}