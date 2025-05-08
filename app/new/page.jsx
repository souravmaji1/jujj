'use client'
import { useState, useEffect, useRef } from 'react';
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
  Link as LinkIcon,
  Upload,
  Film,
  PlayCircle,
  PauseCircle,
  GripVertical
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Player } from '@remotion/player';
import { Video as RemotionVideo, Audio, Sequence, AbsoluteFill } from 'remotion';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey);

// Remotion Video Composition Component
const FPS = 30;

const VideoComposition = ({ clips, audioTrack, audioVolume, totalDurationInFrames }) => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#111827' }}>
      {clips && clips.length > 0 ? (
        clips.map((clip, index) => {
          const startFrame = currentFrame;
          const durationInSeconds = Math.max((clip.end - clip.start), 1 / FPS);
          const durationInFrames = Math.round(durationInSeconds * FPS);
          currentFrame += durationInFrames;

          return (
            <Sequence key={index} from={startFrame} durationInFrames={durationInFrames}>
              <RemotionVideo
                src={clip.src}
                startFrom={Math.round(clip.start * FPS)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => console.error(`Error loading video ${clip.src}:`, e)}
              />
            </Sequence>
          );
        })
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
          }}
        >
          No clips selected
        </div>
      )}
      {audioTrack && (
        <Audio
          src={audioTrack}
          volume={audioVolume}
          loop
          onError={(e) => console.error(`Error loading audio ${audioTrack}:`, e)}
        />
      )}
    </AbsoluteFill>
  );
};

export default function VideoCreatorPage() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNav, setSelectedNav] = useState('video-creator');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [userRole, setUserRole] = useState('seller');
  const [isAnimating, setIsAnimating] = useState(false);
  const [userChannelId, setUserChannelId] = useState(null);
  const [influencers, setInfluencers] = useState({});
  const [selectedClips, setSelectedClips] = useState([]);
  const [backgroundAudio, setBackgroundAudio] = useState(null);
  const [uploadedClips, setUploadedClips] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [clipDurations, setClipDurations] = useState({});
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const fileInputRef = useRef(null);
  const playerRef = useRef(null);
  const dragControls = useDragControls();

  // Calculate total duration based on selected clips
  const totalDurationInSeconds = selectedClips.reduce((sum, clip) => {
    const duration = clip.end - clip.start;
    return sum + (isNaN(duration) ? 0 : duration);
  }, 0);
  const totalDurationInFrames = Math.max(Math.round(totalDurationInSeconds * FPS), 600);

  // Fetch user's YouTube channel ID and campaigns
  useEffect(() => {
    if (!user) return;

    const fetchUserChannelAndCampaigns = async () => {
      try {
        setLoading(true);

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

  // Function to fetch clip duration
  const fetchClipDuration = async (clip) => {
    try {
      const video = document.createElement('video');
      video.src = clip.file_url;
      const duration = await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = () => reject(new Error(`Failed to load metadata for ${clip.file_url}`));
      });
      return duration;
    } catch (err) {
      console.error(err);
      return 10; // Fallback duration
    }
  };

  // Function to handle video rendering
  const handleRenderVideo = async () => {
    if (selectedClips.length === 0 && !backgroundAudio) {
      setRenderError('Please select at least one clip or audio track to render.');
      return;
    }

    setRendering(true);
    setRenderError(null);

    try {
      const videoUrls = selectedClips.map(clip => ({
        src: clip.file_url,
        start: clip.start,
        end: clip.end
      }));

      const payload = {
        videoUrls,
        audioUrl: backgroundAudio?.file_url || '',
        duration: totalDurationInSeconds
      };

      console.log(payload)

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to render video');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reel_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error rendering video:', error);
      setRenderError(error.message || 'Failed to render video');
    } finally {
      setRendering(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openCampaignDetails = (campaign) => {
    setSelectedCampaign(campaign);
    setSelectedClips([]);
    setBackgroundAudio(null);
    setUploadedClips([]);
    setIsPlaying(false);
    setClipDurations({});
  };

  const closeCampaignDetails = () => {
    setSelectedCampaign(null);
  };

  const handleClipSelect = async (media) => {
    if (selectedClips.some((clip) => clip.id === media.id)) {
      setSelectedClips(selectedClips.filter((clip) => clip.id !== media.id));
    } else {
      const duration = await fetchClipDuration(media);
      setClipDurations(prev => ({ ...prev, [media.id]: duration }));
      setSelectedClips([
        ...selectedClips,
        { ...media, start: 0, end: duration }
      ]);
    }
  };

  const handleAudioSelect = (media) => {
    setBackgroundAudio(backgroundAudio?.id === media.id ? null : media);
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files) return;

    try {
      const uploaded = [];
      const newDurations = { ...clipDurations };
      for (const file of files) {
        if (file.type.startsWith('video/')) {
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(`${user.id}/${Date.now()}_${file.name}`, file);

          if (error) throw error;

          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.path);

          const video = document.createElement('video');
          video.src = URL.createObjectURL(file);
          const duration = await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => resolve(video.duration);
            video.onerror = () => reject(new Error(`Failed to load metadata for ${file.name}`));
          });

          const clip = {
            id: `uploaded_${Date.now()}_${file.name}`,
            file_url: publicUrlData.publicUrl,
            file_type: 'video',
            name: file.name,
            start: 0,
            end: duration
          };
          uploaded.push(clip);
          newDurations[clip.id] = duration;
        }
      }
      setUploadedClips([...uploadedClips, ...uploaded]);
      setClipDurations(newDurations);
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload clips');
    }
  };

  const handleUploadedClipSelect = async (clip) => {
    if (selectedClips.some((c) => c.id === clip.id)) {
      setSelectedClips(selectedClips.filter((c) => c.id !== clip.id));
    } else {
      const duration = clipDurations[clip.id] || await fetchClipDuration(clip);
      if (!clipDurations[clip.id]) {
        setClipDurations(prev => ({ ...prev, [clip.id]: duration }));
      }
      setSelectedClips([
        ...selectedClips,
        { ...clip, start: 0, end: duration }
      ]);
    }
  };

  const reorderClips = (fromIndex, toIndex) => {
    const newClips = [...selectedClips];
    const [movedClip] = newClips.splice(fromIndex, 1);
    newClips.splice(toIndex, 0, movedClip);
    setSelectedClips(newClips);
  };

  const updateClipTiming = (clipId, field, value) => {
    setSelectedClips(clips =>
      clips.map((clip) => {
        if (clip.id !== clipId) return clip;

        const maxDuration = clipDurations[clipId] || 10;
        let newStart = clip.start || 0;
        let newEnd = clip.end || maxDuration;
        const newValue = Math.max(0, parseFloat(value) || 0);

        if (field === 'start') {
          newStart = Math.min(newValue, maxDuration - 0.1);
          newEnd = Math.max(newStart + 0.1, Math.min(newEnd, maxDuration));
        } else if (field === 'end') {
          newEnd = Math.min(newValue, maxDuration);
          newStart = Math.min(newStart, newEnd - 0.1);
        }

        return { ...clip, start: newStart, end: newEnd };
      })
    );
  };

  const togglePlay = () => {
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.pause();
        } else {
          playerRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (err) {
        console.error('Error controlling player:', err);
        setError('Failed to control video playback');
      }
    } else {
      console.warn('Player ref is not initialized');
      setError('Video player is not ready');
    }
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
                    icon={<Film size={20} />} 
                    label="Video Creator" 
                    active={selectedNav === 'video-creator'} 
                    onClick={() => setSelectedNav('video-creator')}
                    href="/video-creator"
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
                        <span>Create Reels</span>
                      </div>
                      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                        Reel Creator
                      </h1>
                      <p className="text-gray-300 max-w-xl">
                        Craft viral reels with campaign content and your own clips.
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

              {/* Render Error Message */}
              {renderError && (
                <div className="mb-6 p-4 bg-red-900/30 backdrop-blur-sm border border-red-800 rounded-lg flex items-start animate-fadeIn">
                  <Star className="text-red-400 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-red-300">Render Error</h4>
                    <p className="text-sm text-red-400 mt-1">{renderError}</p>
                  </div>
                  <button 
                    onClick={() => setRenderError(null)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap- declaraciones6">
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
                            Create Reel
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

                    {/* Right Columns: Video Editor */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Video Preview */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-purple-500/50 shadow-2xl shadow-purple-900/30 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 z-0"></div>
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s' }}></div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center mb-4 relative z-10">
                          <Play size={24} className="mr-2 animate-pulse" />
                          Reel Preview
                        </h2>
                        <div className="relative w-[360px] h-[640px] mx-auto bg-gray-950 rounded-3xl overflow-hidden ring-4 ring-purple-500/30 shadow-xl">
                          {selectedClips.length === 0 && !backgroundAudio ? (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-900/80">
                              <Video size={48} className="mr-2 animate-bounce" />
                              <span className="text-center">Select clips or audio to start creating your reel</span>
                            </div>
                          ) : (
                            <Player
                              ref={playerRef}
                              component={VideoComposition}
                              durationInFrames={totalDurationInFrames}
                              compositionWidth={1080}
                              compositionHeight={1920}
                              fps={FPS}
                              style={{ width: '100%', height: '100%' }}
                              inputProps={{
                                clips: selectedClips.map(clip => ({
                                  src: clip.file_url,
                                  start: clip.start,
                                  end: clip.end
                                })),
                                audioTrack: backgroundAudio?.file_url,
                                audioVolume,
                                totalDurationInFrames
                              }}
                              loop={true}
                              autoPlay={false}
                            />
                          )}
                          <motion.div
                            className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-gray-900/70 backdrop-blur-md rounded-full p-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                          >
                            <Button
                              onClick={togglePlay}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full p-3 hover:scale-110 transition-transform"
                              disabled={!selectedClips.length && !backgroundAudio}
                            >
                              {isPlaying ? <PauseCircle size={28} /> : <PlayCircle size={28} />}
                            </Button>
                            <div className="flex items-center space-x-2 bg-gray-800/50 rounded-full px-3 py-1">
                              <Volume2 size={20} className="text-purple-400" />
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={audioVolume}
                                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                                className="w-32 h-1 bg-gray-700 rounded-full accent-purple-500 cursor-pointer"
                                disabled={!backgroundAudio}
                              />
                            </div>
                           
                          </motion.div>

                          
                        </div>

                       <div style={{display: 'flex',justifyContent:'center',margin:'54px 0 0',position:'relative'}}>
                        <Button
                              onClick={handleRenderVideo}
                              className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full p-3 hover:scale-110 transition-transform flex items-center ${rendering ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={rendering || (!selectedClips.length && !backgroundAudio)}
                            >
                              {rendering ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mr-2"></div>
                              ) : (
                                <Film size={28} className="mr-2" />
                              )}
                              {rendering ? 'Rendering...' : 'Render Video'}
                            </Button>
                            </div>
                      </motion.div>

                      {/* Timeline */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-purple-500/50 shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 z-0"></div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center mb-4 relative z-10">
                          <Film size={24} className="mr-2 animate-pulse" />
                          Reel Timeline
                        </h2>
                        {selectedClips.length > 0 ? (
                          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-800 relative z-10">
                            <AnimatePresence>
                              {selectedClips.map((clip, index) => (
                                <motion.div
                                  key={clip.id}
                                  drag="x"
                                  dragControls={dragControls}
                                  dragConstraints={{ left: 0, right: 0 }}
                                  onDragEnd={(e, info) => {
                                    const newIndex = Math.round((index + info.offset.x / 200));
                                    if (newIndex !== index && newIndex >= 0 && newIndex < selectedClips.length) {
                                      reorderClips(index, newIndex);
                                    }
                                  }}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex-shrink-0 w-56 bg-gray-800/70 rounded-xl p-4 border border-purple-500/40 hover:border-purple-400 transition-all shadow-md hover:shadow-purple-500/30 cursor-move"
                                >
                                  <div className="relative aspect-[9/16] mb-3 rounded-lg overflow-hidden">
                                    <video
                                      src={clip.file_url}
                                      className="w-full h-full object-cover"
                                      muted
                                      onError={(e) => console.error(`Error loading timeline video ${clip.file_url}:`, e)}
                                    />
                                    <button
                                      onClick={() => setSelectedClips(selectedClips.filter(c => c.id !== clip.id))}
                                      className="absolute top-2 right-2 bg-red-600 rounded-full p-1.5 hover:bg-red-500 transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                    <div className="absolute top-2 left-2 bg-gray-900/80 rounded-full p-1.5">
                                      <GripVertical size={16} className="text-gray-300" />
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-200 font-medium truncate mb-2">{clip.name || `Clip ${index + 1}`}</div>
                                  <div className="flex space-x-2">
                                    <input
                                      type="number"
                                      value={clip.start.toFixed(2)}
                                      onChange={(e) => updateClipTiming(clip.id, 'start', parseFloat(e.target.value))}
                                      className="w-20 bg-gray-700/50 text-white rounded-lg px-2 py-1 text-sm border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                      placeholder="Start (s)"
                                      min="0"
                                      max={(clipDurations[clip.id] || 10) - 0.1}
                                      step="0.1"
                                    />
                                    <input
                                      type="number"
                                      value={clip.end.toFixed(2)}
                                      onChange={(e) => updateClipTiming(clip.id, 'end', parseFloat(e.target.value))}
                                      className="w-20 bg-gray-700/50 text-white rounded-lg px-2 py-1 text-sm border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                      placeholder="End (s)"
                                      min={(clip.start || 0) + 0.1}
                                      max={clipDurations[clip.id] || 10}
                                      step="0.1"
                                    />
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-6">
                            <Film size={36} className="mx-auto mb-3 animate-pulse" />
                            <p>Add clips to the timeline to craft your reel</p>
                          </div>
                        )}
                      </motion.div>

                      {/* Media Selection */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-purple-500/50 shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to ladrillos-to-br from-purple-900/10 to-blue-900/10 z-0"></div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center mb-4 relative z-10">
                          <Video size={24} className="mr-2 animate-pulse" />
                          Campaign Media
                        </h2>
                        {selectedCampaign.campaign_media?.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedCampaign.campaign_media.map((media, index) => (
                              <motion.div
                                key={index}
                                whileHover={{ scale: 1.05, rotate: 1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`bg-gray-800/70 rounded-xl p-4 border ${selectedClips.some(clip => clip.id === media.id) || backgroundAudio?.id === media.id ? 'border-purple-500/50 shadow-purple-500/30' : 'border-gray-700/50'} transition-all shadow-md hover:shadow-lg relative z-10`}
                              >
                                <div className="flex items-center mb-3">
                                  <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-500/30 mr-2">
                                    {media.file_type === 'audio' ? (
                                      <Volume2 size={18} className="text-purple-400" />
                                    ) : (
                                      <Video size={18} className="text-blue-400" />
                                    )}
                                  </div>
                                  <h3 className="text-md font-semibold text-white truncate">
                                    {media.file_type === 'audio' ? 'Audio Track' : 'Video Clip'} {index + 1}
                                  </h3>
                                </div>
                                {media.file_type === 'audio' ? (
                                  <div className="space-y-3">
                                    <audio
                                      controls
                                      className="w-full bg-gray-800/50 rounded-lg h-10"
                                      onError={(e) => console.error(`Error loading audio ${media.file_url}:`, e)}
                                    >
                                      <source src={media.file_url} type="audio/mpeg" />
                                    </audio>
                                    <Button
                                      onClick={() => handleAudioSelect(media)}
                                      className={`w-full text-sm font-medium ${backgroundAudio?.id === media.id ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'} rounded-lg py-2 transition-all`}
                                    >
                                      {backgroundAudio?.id === media.id ? 'Selected' : 'Use as Background Audio'}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="relative aspect-[9/16] rounded-lg overflow-hidden">
                                    <video
                                      src={media.file_url}
                                      className="w-full h-full object-cover"
                                      muted
                                      onError={(e) => console.error(`Error loading video ${media.file_url}:`, e)}
                                    />
                                    <Button
                                      onClick={() => handleClipSelect(media)}
                                      className={`absolute bottom-2 right-2 text-sm font-medium ${selectedClips.some(clip => clip.id === media.id) ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'} rounded-lg px-3 py-1.5 transition-all`}
                                    >
                                      {selectedClips.some(clip => clip.id === media.id) ? 'Selected' : 'Add to Reel'}
                                    </Button>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-700/50 text-center">
                            <Video size={36} className="mx-auto text-gray-500 mb-3 animate-pulse" />
                            <p className="text-gray-400">No media files available for this campaign.</p>
                          </div>
                        )}
                      </motion.div>

                      {/* Upload Clips */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-purple-500/50 shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 z-0"></div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center mb-4 relative z-10">
                          <Upload size={24} className="mr-2 animate-pulse" />
                          Upload Your Clips
                        </h2>
                        <div className="bg-gray-800/40 rounded-xl p-6 border-2 border-dashed border-purple-500/50 text-center relative z-10">
                          <input
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            ref={fileInputRef}
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg px-6 py-3 font-medium shadow-md hover:shadow-lg transition-all"
                          >
                            <Upload size={20} className="mr-2" />
                            Upload Reel Clips
                          </Button>
                        </div>
                        {uploadedClips.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {uploadedClips.map((clip, index) => (
                              <motion.div
                                key={clip.id}
                                whileHover={{ scale: 1.05, rotate: 1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`bg-gray-800/70 rounded-xl p-4 border ${selectedClips.some(c => c.id === clip.id) ? 'border-purple-500/50 shadow-purple-500/30' : 'border-gray-700/50'} transition-all shadow-md hover:shadow-lg relative z-10`}
                              >
                                <div className="flex items-center mb-3">
                                  <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-500/30 mr-2">
                                    <Video size={18} className="text-blue-400" />
                                  </div>
                                  <h3 className="text-md font-semibold text-white truncate">{clip.name}</h3>
                                </div>
                                <div className="relative aspect-[9/16] rounded-lg overflow-hidden">
                                  <video
                                    src={clip.file_url}
                                    className="w-full h-full object-cover"
                                    muted
                                    onError={(e) => console.error(`Error loading uploaded video ${clip.file_url}:`, e)}
                                  />
                                  <Button
                                    onClick={() => handleUploadedClipSelect(clip)}
                                    className={`absolute bottom-2 right-2 text-sm font-medium ${selectedClips.some(c => c.id === clip.id) ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'} rounded-lg px-3 py-1.5 transition-all`}
                                  >
                                    {selectedClips.some(c => c.id === clip.id) ? 'Selected' : 'Add to Reel'}
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>

                      {/* Selected Influencers */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.4 }}
                        className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-purple-500/50 shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 z-0"></div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center mb-4 relative z-10">
                          <Users size={24} className="mr-2 animate-pulse" />
                          Selected Influencers
                        </h2>
                        {selectedCampaign.selected_influencers?.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedCampaign.selected_influencers.map((channelId) => {
                              const influencer = influencers[channelId];
                              return (
                                <motion.div
                                  key={channelId}
                                  whileHover={{ scale: 1.02 }}
                                  className="bg-gray-800/70 p-4 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all shadow-md hover:shadow-lg relative z-10"
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
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-700/50 text-center">
                            <Users size={32} className="mx-auto text-gray-500 mb-2 animate-pulse" />
                            <p className="text-gray-400">No influencers selected for this campaign.</p>
                          </div>
                        )}
                      </motion.div>
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