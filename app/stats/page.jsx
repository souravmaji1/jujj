'use client'
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import {
  Video, Home, Settings, Star, ChevronRight, HelpCircle, Plus, Upload as UploadIcon, AlertCircle, X,
  Eye, ThumbsUp, MessageSquare, Clock, PlayCircle, TrendingUp, Calendar, ArrowUpRight, BookOpen,Music, Users, Sparkles, Zap
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function YouTubeStats() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNav, setSelectedNav] = useState('stats');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleAccount, setGoogleAccount] = useState(null);
  const [stats, setStats] = useState({});
  const [selectedViewMode, setSelectedViewMode] = useState('grid');
  const [selectedMetric, setSelectedMetric] = useState('views');
  const [isAnimating, setIsAnimating] = useState(false);


  // Fetch videos, workflows, Google account, and YouTube stats
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Google account
        const { data: googleData, error: googleError } = await supabase
          .from('user_google_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (googleError && googleError.code !== 'PGRST116') throw googleError;
        setGoogleAccount(googleData || null);

        // Fetch user videos with YouTube video IDs
        const { data: videoData, error: videoError } = await supabase
          .from('user_videos')
          .select('id, user_id, video_url, created_at, duration, description, title, youtube_video_id')
          .eq('user_id', user.id)
          .not('youtube_video_id', 'is', null)
          .order('created_at', { ascending: false });

        if (videoError) throw videoError;

        // Fetch render workflows with YouTube video IDs
        const { data: workflowData, error: workflowError } = await supabase
          .from('render_workflows')
          .select('id, user_id, video_url, created_at, duration, segment_index, youtube_video_id')
          .eq('user_id', user.id)
          .not('youtube_video_id', 'is', null)
          .order('created_at', { ascending: false });

        if (workflowError) throw workflowError;

        // Combine videos and workflows
        const combinedVideos = [
          ...(videoData || []).map(video => ({
            ...video,
            name: video.title || `Untitled Video ${video.id}`,
            type: 'video'
          })),
          ...(workflowData || []).map(workflow => ({
            ...workflow,
            name: `Segment ${workflow.segment_index + 1}`,
            title: `Segment ${workflow.segment_index + 1}`,
            description: `Segment ${workflow.segment_index + 1} uploaded to YouTube`,
            type: 'workflow'
          }))
        ];

        setVideos(combinedVideos);

        // Fetch YouTube stats if there are videos
        if (combinedVideos.length > 0 && googleData?.access_token) {
          const videoIds = combinedVideos.map(v => v.youtube_video_id).join(',');
          try {
            const response = await fetch(`/api/youtube/stats?videoIds=${videoIds}`, {
              headers: {
                'Authorization': `Bearer ${googleData.access_token}`
              }
            });

            if (response.ok) {
              const statsData = await response.json();
              const statsMap = {};
              statsData.items.forEach(item => {
                statsMap[item.id] = {
                  viewCount: parseInt(item.statistics.viewCount || '0'),
                  likeCount: parseInt(item.statistics.likeCount || '0'),
                  commentCount: parseInt(item.statistics.commentCount || '0'),
                  thumbnail: item.snippet.thumbnails?.default?.url || ''
                };
              });
              setStats(statsMap);
            } else {
              throw new Error('Failed to fetch YouTube stats');
            }
          } catch (statsError) {
            console.error('Error fetching YouTube stats:', statsError);
            setError('Failed to load YouTube statistics');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
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
  // Helper function to format numbers with suffixes (K, M, etc.)
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };
  
  // Get total stats across all videos
  const getTotalStats = () => {
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    
    videos.forEach(video => {
      const videoStats = stats[video.youtube_video_id];
      if (videoStats) {
        totalViews += videoStats.viewCount || 0;
        totalLikes += videoStats.likeCount || 0;
        totalComments += videoStats.commentCount || 0;
      }
    });
    
    return { views: totalViews, likes: totalLikes, comments: totalComments };
  };
  
  const totalStats = getTotalStats();

  // Sort videos based on selected metric
  const sortedVideos = [...videos].sort((a, b) => {
    const statsA = stats[a.youtube_video_id] || { viewCount: 0, likeCount: 0, commentCount: 0 };
    const statsB = stats[b.youtube_video_id] || { viewCount: 0, likeCount: 0, commentCount: 0 };
    
    if (selectedMetric === 'views') return statsB.viewCount - statsA.viewCount;
    if (selectedMetric === 'likes') return statsB.likeCount - statsA.likeCount; 
    if (selectedMetric === 'comments') return statsB.commentCount - statsA.commentCount;
    return 0;
  });

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 opacity-50">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-900/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '15s' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-1/2 h-1/2 bg-blue-900/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '20s' }}></div>
        </div>
      </div>

    
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
                   <div className={`mb-8 transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
                     {sidebarOpen && (
                       <div className="flex items-center justify-between px-4 mb-4">
                         <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Main Menu</h3>
                         <div className="w-8 h-0.5 bg-gray-800 rounded-full"></div>
                       </div>
                     )}
                     <ul className="space-y-2">
                     <NavItem 
        icon={<Home size={20} />} 
        label="Dashboard" 
        active={selectedNav === 'dashboard'}
        onClick={() => setSelectedNav('dashboard')}
        href="/dashboard"
      />
      <NavItem 
        icon={<Video size={20} />} 
        label="Create Videos" 
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
                     </ul>
                   </div>
         
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
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                YouTube Stats
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800/50 transition">
                <HelpCircle size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-purple-500"></span>
              </button>
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-medium cursor-pointer border-2 border-transparent hover:border-white transition-all">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                  <div className="p-3 border-b border-gray-800">
                    <div className="font-medium">{user?.fullName || 'User'}</div>
                    <div className="text-sm text-gray-400">{user?.primaryEmailAddress?.emailAddress || 'user@example.com'}</div>
                  </div>
                  <div className="p-2">
                    <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm transition">Profile Settings</a>
                    <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm transition">Sign Out</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-start">
                <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
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

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading YouTube stats...</p>
              </div>
            ) : (
              <>
                {videos.length > 0 ? (
                  <>
                    {/* Stats Overview Cards */}
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-6 border border-purple-800/30 shadow-lg backdrop-blur-sm group hover:from-purple-800/40 hover:to-purple-700/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-purple-500/20 p-3 rounded-lg">
                            <Eye size={24} className="text-purple-400" />
                          </div>
                          <TrendingUp size={20} className="text-purple-400" />
                        </div>
                        <h3 className="text-gray-300 text-sm font-medium mb-1">Total Views</h3>
                        <div className="text-3xl font-bold mb-2">{formatNumber(totalStats.views)}</div>
                        <div className="text-xs text-gray-400">Across {videos.length} videos</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-6 border border-blue-800/30 shadow-lg backdrop-blur-sm group hover:from-blue-800/40 hover:to-blue-700/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-blue-500/20 p-3 rounded-lg">
                            <ThumbsUp size={24} className="text-blue-400" />
                          </div>
                          <TrendingUp size={20} className="text-blue-400" />
                        </div>
                        <h3 className="text-gray-300 text-sm font-medium mb-1">Total Likes</h3>
                        <div className="text-3xl font-bold mb-2">{formatNumber(totalStats.likes)}</div>
                        <div className="text-xs text-gray-400">Across {videos.length} videos</div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/20 rounded-xl p-6 border border-indigo-800/30 shadow-lg backdrop-blur-sm group hover:from-indigo-800/40 hover:to-indigo-700/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-indigo-500/20 p-3 rounded-lg">
                            <MessageSquare size={24} className="text-indigo-400" />
                          </div>
                          <TrendingUp size={20} className="text-indigo-400" />
                        </div>
                        <h3 className="text-gray-300 text-sm font-medium mb-1">Total Comments</h3>
                        <div className="text-3xl font-bold mb-2">{formatNumber(totalStats.comments)}</div>
                        <div className="text-xs text-gray-400">Across {videos.length} videos</div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap justify-between items-center mb-6">
                      <div className="mb-4 md:mb-0">
                        <h2 className="text-xl font-bold mb-2">Your YouTube Videos</h2>
                        <p className="text-gray-400 text-sm">Performance metrics for your {videos.length} uploaded videos</p>
                      </div>
                      <div className="flex space-x-3">
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-1 flex">
                          <button 
                            onClick={() => setSelectedViewMode('grid')}
                            className={`px-3 py-1.5 rounded-md text-sm flex items-center ${selectedViewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            <div className="grid grid-cols-2 gap-0.5 mr-2">
                              <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                              <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                              <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                              <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                            </div>
                            Grid
                          </button>
                          <button 
                            onClick={() => setSelectedViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm flex items-center ${selectedViewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            <div className="flex flex-col justify-center space-y-0.5 mr-2">
                              <div className="w-4 h-0.5 bg-current rounded-full"></div>
                              <div className="w-4 h-0.5 bg-current rounded-full"></div>
                              <div className="w-4 h-0.5 bg-current rounded-full"></div>
                            </div>
                            List
                          </button>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-1 flex">
                          <button 
                            onClick={() => setSelectedMetric('views')}
                            className={`px-3 py-1.5 rounded-md text-sm flex items-center ${selectedMetric === 'views' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            <Eye size={14} className="mr-1" /> Views
                          </button>
                          <button 
                            onClick={() => setSelectedMetric('likes')}
                            className={`px-3 py-1.5 rounded-md text-sm flex items-center ${selectedMetric === 'likes' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            <ThumbsUp size={14} className="mr-1" /> Likes
                          </button>
                          <button 
                            onClick={() => setSelectedMetric('comments')}
                            className={`px-3 py-1.5 rounded-md text-sm flex items-center ${selectedMetric === 'comments' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            <MessageSquare size={14} className="mr-1" /> Comments
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Video Grid View */}
                    {selectedViewMode === 'grid' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedVideos.map(video => {
                          const videoStats = stats[video.youtube_video_id] || { viewCount: 0, likeCount: 0, commentCount: 0 };
                          let highlightStat, highlightIcon, highlightColor;
                          
                          if (selectedMetric === 'views') {
                            highlightStat = formatNumber(videoStats.viewCount);
                            highlightIcon = <Eye size={16} />;
                            highlightColor = 'text-purple-400';
                          } else if (selectedMetric === 'likes') {
                            highlightStat = formatNumber(videoStats.likeCount);
                            highlightIcon = <ThumbsUp size={16} />;
                            highlightColor = 'text-blue-400';
                          } else {
                            highlightStat = formatNumber(videoStats.commentCount);
                            highlightIcon = <MessageSquare size={16} />;
                            highlightColor = 'text-indigo-400';
                          }
                          
                          return (
                            <div
                              key={`${video.type}:${video.id}`}
                              className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50 hover:border-gray-700 hover:shadow-lg hover:shadow-purple-900/10 transition-all group relative"
                            >
                              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                                {stats[video.youtube_video_id]?.thumbnail ? (
                                  <img
                                    src={stats[video.youtube_video_id].thumbnail}
                                    alt={video.name}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Video size={36} className="text-gray-400" />
                                  </div>
                                )}
                                
                                <div className={`absolute top-3 right-3 ${highlightColor} bg-gray-900/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center text-sm font-medium shadow-md`}>
                                  {highlightIcon}
                                  <span className="ml-1.5">{highlightStat}</span>
                                </div>
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                                  <a
                                    href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full p-3 flex justify-center items-center bg-purple-600/80 backdrop-blur-sm text-white hover:bg-purple-500/90 transition-all text-sm font-medium"
                                  >
                                    <PlayCircle size={16} className="mr-2" />
                                    Watch on YouTube
                                    <ArrowUpRight size={14} className="ml-1" />
                                  </a>
                                </div>
                              </div>
                              
                              <div className="p-4">
                                <h4 className="font-medium mb-2 text-lg">{video.name}</h4>
                                <div className="flex flex-wrap gap-4 mb-3">
                                  <div className="flex items-center text-gray-400 text-sm">
                                    <Calendar size={14} className="mr-1.5" />
                                    {new Date(video.created_at).toLocaleDateString()}
                                  </div>
                                  {video.duration && (
                                    <div className="flex items-center text-gray-400 text-sm">
                                      <Clock size={14} className="mr-1.5" />
                                      {Math.round(video.duration)}s
                                    </div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                  <div className="flex flex-col items-center justify-center p-2 bg-gray-800/50 rounded-lg">
                                    <Eye size={16} className="text-purple-400 mb-1" />
                                    <span className="font-medium text-sm">{formatNumber(videoStats.viewCount)}</span>
                                    <span className="text-xs text-gray-400">Views</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center p-2 bg-gray-800/50 rounded-lg">
                                    <ThumbsUp size={16} className="text-blue-400 mb-1" />
                                    <span className="font-medium text-sm">{formatNumber(videoStats.likeCount)}</span>
                                    <span className="text-xs text-gray-400">Likes</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center p-2 bg-gray-800/50 rounded-lg">
                                    <MessageSquare size={16} className="text-indigo-400 mb-1" />
                                    <span className="font-medium text-sm">{formatNumber(videoStats.commentCount)}</span>
                                    <span className="text-xs text-gray-400">Comments</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Video List View */}
                    {selectedViewMode === 'list' && (
                      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-gray-800/50 text-gray-400 text-sm font-medium">
                          <div className="col-span-6">Video</div>
                          <div className="col-span-2 text-center">Views</div>
                          <div className="col-span-2 text-center">Likes</div>
                          <div className="col-span-2 text-center">Comments</div>
                        </div>
                        
                        {sortedVideos.map((video, index) => {
                          const videoStats = stats[video.youtube_video_id] || { viewCount: 0, likeCount: 0, commentCount: 0 };
                          
                          return (
                            <div 
                              key={`${video.type}:${video.id}`}
                              className={`grid grid-cols-12 gap-4 py-4 px-4 items-center hover:bg-gray-800/30 transition-colors ${
                                index !== sortedVideos.length - 1 ? 'border-b border-gray-800/50' : ''
                              }`}
                            >
                              <div className="col-span-6 flex items-center">
                                <div className="w-16 h-10 rounded bg-gray-800 mr-3 overflow-hidden flex-shrink-0">
                                  {stats[video.youtube_video_id]?.thumbnail ? (
                                    <img
                                      src={stats[video.youtube_video_id].thumbnail}
                                      alt={video.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Video size={16} className="text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm truncate">{video.name}</h4>
                                  <div className="text-xs text-gray-400 mt-1 flex items-center">
                                    <Calendar size={12} className="mr-1" />
                                    {new Date(video.created_at).toLocaleDateString()}
                                    {video.duration && (
                                      <>
                                        <span className="mx-1.5">•</span>
                                        <Clock size={12} className="mr-1" />
                                        {Math.round(video.duration)}s
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="col-span-2 text-center">
                                <div className={`flex items-center justify-center font-medium ${selectedMetric === 'views' ? 'text-purple-400' : ''}`}>
                                  <Eye size={14} className="mr-1.5" />
                                  {formatNumber(videoStats.viewCount)}
                                </div>
                              </div>
                              
                              <div className="col-span-2 text-center">
                                <div className={`flex items-center justify-center font-medium ${selectedMetric === 'likes' ? 'text-blue-400' : ''}`}>
                                  <ThumbsUp size={14} className="mr-1.5" />
                                  {formatNumber(videoStats.likeCount)}
                                </div>
                              </div>
                              
                              <div className="col-span-2 text-center">
                                <div className={`flex items-center justify-center font-medium ${selectedMetric === 'comments' ? 'text-indigo-400' : ''}`}>
                                  <MessageSquare size={14} className="mr-1.5" />
                                  {formatNumber(videoStats.commentCount)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : !googleAccount ? (
                  <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-2xl shadow-lg">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-purple-900/20">
                      <UploadIcon size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mt-6 mb-3">Connect YouTube Account</h2>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                      Connect your Google account to view your YouTube video statistics.
                    </p>
                    <Button className="py-2.5 px-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transition-all">
                      Connect Google Account
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-2xl shadow-lg">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-purple-900/20">
                      <UploadIcon size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mt-6 mb-3">No YouTube Videos</h2>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                      You haven't uploaded any videos to YouTube yet. Upload videos to start tracking their performance.
                    </p>
                    <Link href="/video-upload">
                      <Button className="py-2.5 px-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transition-all">
                        <Plus size={20} className="mr-2" />
                        Upload New Video
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <footer className="bg-gray-900/70 backdrop-blur-md border-t border-gray-800/50 p-4 text-center">
          <p className="text-gray-400 text-sm">© 2025 VideoSync. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}