'use client'
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
  Zap,
  Plus,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Upload,
  FileMusic,
  UserPlus,
  Star,
  TrendingUp,
  Calendar,
  Volume2,
  Radio,
  Play,
  Flame,
  User,
  Briefcase
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SettingsPage() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNav, setSelectedNav] = useState('create');
  const [googleAccount, setGoogleAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [userRole, setUserRole] = useState('buyer');
  const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    music: '',
    artistName: '',
    artistBio: '',
    content: [],
    selectedAccounts: [], // Array of objects: [{channel_id, post_count}, ...]
  });
  const router = useRouter();

  // Fetch connected Google account from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchGoogleAccount = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_google_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setGoogleAccount(data);
        }
      } catch (error) {
        console.error('Error fetching Google account:', error);
        setError('Failed to load Google account information');
      } finally {
        setLoading(false);
      }
    };

    fetchGoogleAccount();
  }, [user]);

  // Fetch YouTube influencers from Supabase
  useEffect(() => {
    const fetchYoutubeInfluencers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('youtube_influencer')
          .select('*');

        if (error) throw error;

        setYoutubeInfluencers(data || []);
      } catch (error) {
        console.error('Error fetching YouTube influencers:', error);
        setError('Failed to load YouTube influencers');
      } finally {
        setLoading(false);
      }
    };

    fetchYoutubeInfluencers();
  }, []);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Navigate to appropriate page based on user role
  useEffect(() => {
    if (userRole === 'buyer') {
      setSelectedNav('profile');
      router.push('/blog');
    } else {
      setSelectedNav('create');
      router.push('/generate');
    }
  }, [userRole, router]);

  // Google OAuth login
  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError(null);
        
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`
          }
        });
        
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch Google profile');
        }
        
        const profileData = await profileResponse.json();
        
        const { data, error } = await supabase
          .from('user_google_accounts')
          .upsert({
            user_id: user.id,
            google_id: profileData.sub,
            email: profileData.email,
            name: profileData.name,
            picture: profileData.picture,
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            expires_at: Date.now() + (tokenResponse.expires_in * 1000),
            scope: tokenResponse.scope
          });

        if (error) throw error;
        
        setGoogleAccount({
          ...profileData,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: Date.now() + (tokenResponse.expires_in * 1000)
        });
        
        setSuccess('Google account connected successfully!');
        setTimeout(() => setSuccess(null), 5000);
      } catch (error) {
        console.error('Error connecting Google account:', error);
        setError(error.message || 'Failed to connect Google account');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.log('Login Failed:', error);
      setError('Google login failed. Please try again.');
    },
  });

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_google_accounts')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      googleLogout();
      
      setGoogleAccount(null);
      setSuccess('Google account disconnected successfully');
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error disconnecting Google account:', error);
      setError('Failed to disconnect Google account');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setCampaignData(prev => ({
      ...prev,
      content: [...prev.content, ...files]
    }));
  };

  const removeFile = (index) => {
    setCampaignData(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index)
    }));
  };

  const toggleAccountSelection = (channelId) => {
    setCampaignData(prev => {
      const isSelected = prev.selectedAccounts.find(acc => acc.channel_id === channelId);
      let updatedAccounts;
      
      if (isSelected) {
        updatedAccounts = prev.selectedAccounts.filter(acc => acc.channel_id !== channelId);
      } else {
        updatedAccounts = [...prev.selectedAccounts, { channel_id: channelId, post_count: 1 }];
      }
      
      return { ...prev, selectedAccounts: updatedAccounts };
    });
  };

  const handlePostCountChange = (channelId, value) => {
    const numValue = Math.max(1, parseInt(value) || 1); // Ensure at least 1 post
    setCampaignData(prev => ({
      ...prev,
      selectedAccounts: prev.selectedAccounts.map(acc => 
        acc.channel_id === channelId ? { ...acc, post_count: numValue } : acc
      )
    }));
  };

  const handleNextStep = () => {
    if (step === 1 && (!campaignData.name || !campaignData.description)) {
      setError('Please fill in all required fields');
      return;
    }
    if (step === 2 && (!campaignData.music || !campaignData.artistName || !campaignData.artistBio)) {
      setError('Please fill in all required fields');
      return;
    }
    if (step === 3 && campaignData.content.length === 0) {
      setError('Please upload at least one audio or video file');
      return;
    }
    if (step === 4 && campaignData.selectedAccounts.length > 0) {
      const invalidPostCounts = campaignData.selectedAccounts.some(acc => !acc.post_count || acc.post_count < 1);
      if (invalidPostCounts) {
        setError('Please specify a valid number of posts for each selected influencer');
        return;
      }
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleCreateCampaign = async () => {
    if (campaignData.selectedAccounts.length === 0) {
      setError('Please select at least one YouTube influencer');
      return;
    }

    // Validate post counts
    const invalidPostCounts = campaignData.selectedAccounts.some(acc => !acc.post_count || acc.post_count < 1);
    if (invalidPostCounts) {
      setError('Please specify a valid number of posts for each selected influencer');
      return;
    }

    try {
      setLoading(true);

      // Upload files to Supabase Storage and get URLs
      const mediaUrls = await Promise.all(
        campaignData.content.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, file);

          if (error) throw new Error(`Failed to upload file ${file.name}: ${error.message}`);

          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

          return {
            url: publicUrlData.publicUrl,
            type: file.type.startsWith('audio') ? 'audio' : 'video'
          };
        })
      );

      // Prepare influencer data with explicit post counts
      const influencerData = campaignData.selectedAccounts.map(acc => ({
        channel_id: acc.channel_id,
        post_count: acc.post_count
      }));

      // Insert campaign into Supabase
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert([
          {
            user_id: user.id,
            name: campaignData.name,
            description: campaignData.description,
            music: campaignData.music,
            artist_name: campaignData.artistName,
            artist_bio: campaignData.artistBio,
            selected_influencers: influencerData // Explicitly saving channel_id and post_count
          }
        ])
        .select()
        .single();

      if (campaignError) throw new Error(`Failed to create campaign: ${campaignError.message}`);

      // Insert media URLs into campaign_media table
      const mediaInserts = mediaUrls.map(media => ({
        campaign_id: campaign.id,
        file_url: media.url,
        file_type: media.type
      }));

      const { error: mediaError } = await supabase
        .from('campaign_media')
        .insert(mediaInserts);

      if (mediaError) throw new Error(`Failed to save media: ${mediaError.message}`);

      console.log('Campaign created with influencers:', influencerData); // Debugging log
      setSuccess(`Campaign created successfully with ${influencerData.length} influencer(s)!`);
      setTimeout(() => {
        setSuccess(null);
        setCampaignData({
          name: '',
          description: '',
          music: '',
          artistName: '',
          artistBio: '',
          content: [],
          selectedAccounts: []
        });
        setStep(1);
      }, 3000);
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError(error.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
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
                    label="Manage Campaign" 
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col z-10">
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
            {/* Campaign Header with Background */}
            <div className="relative overflow-hidden rounded-3xl mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-blue-900/40 z-0"></div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-32 -left-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
              
              {/* Content */}
              <div className="relative z-10 px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="mb-6 md:mb-0">
                    <div className="inline-flex items-center px-4 py-2 bg-purple-900/40 border border-purple-500/30 rounded-full text-sm text-purple-300 mb-4">
                      <Radio size={14} className="mr-2 animate-pulse" />
                      <span>Music Promotion</span>
                    </div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                      Create New Campaign
                    </h1>
                    <p className="text-gray-300 max-w-xl">
                      Launch your music across multiple YouTube channels with customized content and track performance in real-time.
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <div className="flex flex-col items-center justify-center h-20 w-20 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                      <TrendingUp size={20} className="text-purple-400 mb-1" />
                      <span className="text-xs text-gray-400">Step</span>
                      <span className="text-lg font-bold text-white">{step}/4</span>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center h-20 w-20 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                      <Calendar size={20} className="text-blue-400 mb-1" />
                      <span className="text-xs text-gray-400">Launch</span>
                      <span className="text-lg font-bold text-white">24h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                {/* Progress Bar Container */}
                <div className="absolute top-8 left-16 right-16 h-1 bg-gray-800 z-0">
                  {/* Progress Bar Fill - Dynamically sized based on current step */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-blue-600 z-10 transition-all duration-500"
                    style={{ width: `${(step - 1) * 33.33}%` }}
                  ></div>
                </div>
                
                {[
                  { num: 1, label: 'Campaign Details', icon: <Star size={16} /> },
                  { num: 2, label: 'Music Info', icon: <Volume2 size={16} /> },
                  { num: 3, label: 'Content', icon: <FileMusic size={16} /> },
                  { num: 4, label: 'YouTube Influencers', icon: <Users size={16} /> }
                ].map((item, index) => (
                  <div key={item.num} className="flex flex-col items-center z-20">
                    <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-medium transition-all duration-500 mb-2
                      ${step >= item.num 
                        ? 'bg-gradient-to-br from-purple-600/80 to-blue-600/80 text-white shadow-lg shadow-purple-900/30' 
                        : 'bg-gray-800/80 text-gray-400'}`}>
                      <div className="absolute inset-0 backdrop-blur-sm rounded-2xl"></div>
                      <div className="relative z-10">{item.icon}</div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs
                        ${step >= item.num 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-700 text-gray-400'}`}>
                        {item.num}
                      </div>
                    </div>
                    
                    <span className={`text-xs ${step >= item.num ? 'text-purple-300' : 'text-gray-500'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 backdrop-blur-sm border border-red-800 rounded-lg flex items-start animate-fadeIn">
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

            {success && (
              <div className="mb-6 p-4 bg-green-900/30 backdrop-blur-sm border border-green-800 rounded-lg flex items-start animate-fadeIn">
                <CheckCircle className="text-green-400 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-green-300">Success</h4>
                  <p className="text-sm text-green-400 mt-1">{success}</p>
                </div>
                <button 
                  onClick={() => setSuccess(null)}
                  className="ml-auto text-green-400 hover:text-green-300"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800/50 rounded-2xl p-8 shadow-xl shadow-purple-900/5 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Campaign Details</h2>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-gray-300 mb-2 block">Campaign Name <span className="text-purple-400">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      value={campaignData.name}
                      onChange={handleInputChange}
                      placeholder="Enter a name for your campaign"
                      className="bg-gray-800/60 border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500/20 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-gray-300 mb-2 block">Campaign Description <span className="text-purple-400">*</span></Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={campaignData.description}
                      onChange={handleInputChange}
                      placeholder="Describe what this campaign is about"
                      className="bg-gray-800/60 border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500/20 text-white placeholder-gray-500 min-h-32"
                    />
                  </div>
                </div>
              </div>
            )}
        
            {step === 2 && (
              <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800/50 rounded-2xl p-8 shadow-xl shadow-purple-900/5 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Music Information</h2>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="music" className="text-gray-300 mb-2 block">Track Title <span className="text-purple-400">*</span></Label>
                    <Input
                      id="music"
                      name="music"
                      value={campaignData.music}
                      onChange={handleInputChange}
                      placeholder="Enter your track title"
                      className="bg-gray-800/60 border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500/20 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="artistName" className="text-gray-300 mb-2 block">Artist Name <span className="text-purple-400">*</span></Label>
                    <Input
                      id="artistName"
                      name="artistName"
                      value={campaignData.artistName}
                      onChange={handleInputChange}
                      placeholder="Enter artist name"
                      className="bg-gray-800/60 border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500/20 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="artistBio" className="text-gray-300 mb-2 block">Artist Bio <span className="text-purple-400">*</span></Label>
                    <Textarea
                      id="artistBio"
                      name="artistBio"
                      value={campaignData.artistBio}
                      onChange={handleInputChange}
                      placeholder="Brief description about the artist"
                      className="bg-gray-800/60 border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500/20 text-white placeholder-gray-500 min-h-32"
                    />
                  </div>
                </div>
              </div>
            )}
           
            {step === 3 && (
              <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800/50 rounded-2xl p-8 shadow-xl shadow-purple-900/5 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Content Upload</h2>
                <div className="space-y-8">
                  <div className="border-2 border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-800/40 transition-all hover:border-purple-500/50 hover:bg-gray-800/60">
                    <Upload size={48} className="text-gray-500 mb-4" />
                    <h3 className="text-xl font-medium text-gray-300 mb-2">Upload Your Media</h3>
                    <p className="text-gray-400 text-center mb-6 max-w-md">
                      Drag and drop your audio or video files here or click to browse. We support MP3, WAV, MP4 formats up to 50MB each.
                    </p>
                    
                    <input
                      type="file"
                      id="content"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="audio/*,video/*"
                      multiple
                    />
                    <label 
                      htmlFor="content"
                      className="py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl cursor-pointer hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/20 flex items-center"
                    >
                      <FileMusic size={18} className="mr-2" />
                      Browse Files
                    </label>
                    
                    {campaignData.content.length > 0 && (
                      <div className="mt-6 w-full space-y-4">
                        {campaignData.content.map((file, index) => (
                          <div key={index} className="bg-gray-800/80 p-4 rounded-xl border border-gray-700">
                            <div className="flex items-center">
                              <FileMusic size={24} className="text-purple-400 mr-3" />
                              <div className="flex-1">
                                <p className="text-gray-300 font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                              </div>
                              <button 
                                className="text-gray-400 hover:text-red-400"
                                onClick={() => removeFile(index)}
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-900/30 rounded-xl border border-purple-500/30">
                      <Play size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Media will be optimized for YouTube</h4>
                      <p className="text-gray-400 text-sm">Our AI will ensure your content performs well on YouTube</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-900/30 rounded-xl border border-blue-500/ Gif30">
                      <Flame size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Trending effects included</h4>
                      <p className="text-gray-400 text-sm">We'll enhance your content with viral elements</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        
            {step === 4 && (
              <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800/50 rounded-2xl p-8 shadow-xl shadow-purple-900/5 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Select YouTube Influencers</h2>
                <p className="text-gray-300 mb-6">Choose the YouTube channels that will promote your music and specify the number of posts for each.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {youtubeInfluencers.map(influencer => (
                    <div 
                      key={influencer.channel_id}
                      onClick={() => toggleAccountSelection(influencer.channel_id)}
                      className={`relative p-4 rounded-xl border transition-all cursor-pointer
                        ${campaignData.selectedAccounts.some(acc => acc.channel_id === influencer.channel_id)
                          ? 'bg-purple-900/20 border-purple-500/40 shadow-lg shadow-purple-900/10'
                          : 'bg-gray-800/60 border-gray-700/60 hover:bg-gray-800/80 hover:border-gray-600'}`}
                    >
                      <div className="absolute top-3 right-3">
                        {campaignData.selectedAccounts.some(acc => acc.channel_id === influencer.channel_id) ? (
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-600 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-16 h-16 rounded-xl bg-gray-700 mr-4 overflow-hidden relative">
                          {influencer.thumbnail_url ? (
                            <img src={influencer.thumbnail_url} alt={influencer.channel_title} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 to-blue-600/40"></div>
                              <UserPlus size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/70" />
                            </>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-white">{influencer.channel_title}</h3>
                          <p className="text-gray-400 text-sm">{influencer.custom_url || influencer.channel_id}</p>
                          <div className="flex items-center mt-1">
                            <Users size={12} className="text-purple-400 mr-1" />
                            <span className="text-xs text-gray-400">{influencer.subscriber_count.toLocaleString()} subscribers</span>
                            <span className="mx-2 text-gray-600">•</span>
                            <TrendingUp size={12} className="text-blue-400 mr-1" />
                            <span className="text-xs text-gray-400">{influencer.view_count.toLocaleString()} views</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="mt-4 text-sm text-gray-400 line-clamp-2">{influencer.description}</p>
                      
                      {campaignData.selectedAccounts.some(acc => acc.channel_id === influencer.channel_id) && (
                        <div className="mt-4">
                          <Label htmlFor={`posts-${influencer.channel_id}`} className="text-gray-300 mb-2 block">Number of Posts <span className="text-purple-400">*</span></Label>
                          <Input
                            id={`posts-${influencer.channel_id}`}
                            type="number"
                            min="1"
                            value={campaignData.selectedAccounts.find(acc => acc.channel_id === influencer.channel_id)?.post_count || 1}
                            onChange={(e) => handlePostCountChange(influencer.channel_id, e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Prevent toggling selection when changing post count
                            className="bg-gray-800/60 border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500/20 text-white placeholder-gray-500 w-24"
                            required
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center text-sm text-purple-400 hover:text-purple-300 mb-8"
                >
                  {showPreview ? (
                    <>
                      <ChevronDown size={16} className="mr-1" />
                      Hide Campaign Preview
                    </>
                  ) : (
                    <>
                      <ChevronRight size={16} className="mr-1" />
                      Show Campaign Preview
                    </>
                  )}
                </button>
                
                {showPreview && (
                  <div className="bg-gray-800/40 border border-gray-700/60 rounded-xl p-6 mb-8 animate-fadeIn">
                    <h3 className="text-lg font-medium text-white mb-4">Campaign Preview</h3>
                    
                    <div className="space-y-4">
                      <div className="flex">
                        <span className="w-32 text-gray-400">Campaign:</span>
                        <span className="text-white font-medium">{campaignData.name || 'Not set'}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="w-32 text-gray-400">Track:</span>
                        <span className="text-white font-medium">{campaignData.music || 'Not set'}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="w-32 text-gray-400">Artist:</span>
                        <span className="text-white font-medium">{campaignData.artistName || 'Not set'}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="w-32 text-gray-400">Content:</span>
                        <span className="text-white font-medium">
                          {campaignData.content.length > 0 
                            ? campaignData.content.map(file => file.name).join(', ')
                            : 'Not uploaded'}
                        </span>
                      </div>
                      
                      <div className="flex">
                        <span className="w-32 text-gray-400">Influencers:</span>
                        <span className="text-white font-medium">
                          {campaignData.selectedAccounts.length > 0 
                            ? campaignData.selectedAccounts.map(acc => {
                                const influencer = youtubeInfluencers.find(inf => inf.channel_id === acc.channel_id);
                                return `${influencer?.channel_title} (${acc.post_count} post${acc.post_count > 1 ? 's' : ''})`;
                              }).join(', ')
                            : 'None selected'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <Button
                  onClick={handlePrevStep}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
                >
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button
                  onClick={handleNextStep}
                  className="ml-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleCreateCampaign}
                  className="ml-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Create Campaign'}
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}