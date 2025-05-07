'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { 
  Upload, Video, Music, CheckCircle, ChevronDown, ChevronRight, Home, Settings, Users, 
  BarChart2, HelpCircle, Plus, Sparkles, Clock, Zap, BookOpen, Trash2, Play, Download
} from 'lucide-react';
import { Player } from '@remotion/player';
import { AbsoluteFill, Audio, Sequence, Video as RemotionVideo } from 'remotion';
import { motion } from 'framer-motion';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Remotion Video Component
const CombinedVideoWithAudio = ({ videoClips, audioUrl, totalDuration }) => {
  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {videoClips.map((clip, index) => {
        const startFrame = currentFrame;
        const clipDurationInFrames = Math.ceil(clip.duration * 30); // 30 FPS
        currentFrame += clipDurationInFrames;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={clipDurationInFrames}
          >
            <RemotionVideo
              src={clip.url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Sequence>
        );
      })}
      {audioUrl && (
        <Audio
          src={audioUrl}
          startFrom={0}
          endAt={Math.ceil(totalDuration * 30)}
        />
      )}
    </AbsoluteFill>
  );
};

// Animation variants
const pulseAnimation = {
  scale: [1, 1.03, 1],
  transition: { duration: 2, repeat: Infinity, repeatType: 'reverse' }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

export default function AudioVideoSyncPage() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [videoClips, setVideoClips] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [particleStyles, setParticleStyles] = useState([]);
  const [isRendering, setIsRendering] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoPlayerRef = useRef(null);

  // Generate particle styles
  useEffect(() => {
    const styles = [...Array(20)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animation: 'float 15s infinite ease-in-out'
    }));
    setParticleStyles(styles);
  }, []);

  // Calculate total duration when videoClips change
  useEffect(() => {
    const total = videoClips.reduce((sum, clip) => sum + clip.duration, 0);
    setTotalDuration(total);
  }, [videoClips]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleAudioDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAudioUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleVideoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleVideoUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleAudioUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('audio/')) {
        setMessage('Please upload a valid audio file.');
        return;
      }
      setMessage('Uploading audio...');
      try {
        const audioEl = document.createElement('audio');
        audioEl.preload = 'metadata';
        audioEl.onloadedmetadata = async () => {
          // Upload audio to Supabase
          const audioFileName = `audio_${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(audioFileName, file);
          if (error) {
            setMessage('Error uploading audio to Supabase: ' + error.message);
            return;
          }
          // Get public URL for the uploaded audio
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(audioFileName);
          setAudioFile({
            file,
            url: publicUrlData.publicUrl, // Use Supabase URL for rendering
            name: file.name,
            duration: audioEl.duration,
            path: audioFileName // Store path for reference
          });
          setMessage(`Audio "${file.name}" uploaded successfully.`);
        };
        audioEl.src = URL.createObjectURL(file);
      } catch (error) {
        setMessage('Error analyzing audio: ' + error.message);
      }
    }
  };

  const handleVideoUpload = async (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => file.type.startsWith('video/'));
      if (validFiles.length === 0) {
        setMessage('Please upload valid video files.');
        return;
      }
      setMessage('Uploading video clips...');
      try {
        const newClips = await Promise.all(validFiles.map(async (file) => {
          const videoEl = document.createElement('video');
          videoEl.preload = 'metadata';
          const metadataLoaded = new Promise((resolve) => {
            videoEl.onloadedmetadata = () => resolve(videoEl);
          });
          videoEl.src = URL.createObjectURL(file);
          const loadedVideo = await metadataLoaded;
          const thumbnail = await getVideoThumbnail(file);
          // Upload video to Supabase
          const videoFileName = `video_${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(videoFileName, file);
          if (error) {
            throw new Error(`Error uploading video ${file.name}: ${error.message}`);
          }
          // Get public URL for the uploaded video
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(videoFileName);
          return {
            file,
            url: publicUrlData.publicUrl, // Use Supabase URL for rendering
            name: file.name,
            duration: loadedVideo.duration,
            thumbnail,
            path: videoFileName // Store path for reference
          };
        }));
        setVideoClips(prev => [...prev, ...newClips]);
        setMessage(`${validFiles.length} video clip(s) uploaded successfully.`);
      } catch (error) {
        setMessage('Error uploading video clips: ' + error.message);
      }
    }
  };

  const getVideoThumbnail = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          URL.revokeObjectURL(video.src);
          resolve(dataUrl);
        };
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const removeClip = (index) => {
    const newClips = [...videoClips];
    if (newClips[index]?.url) URL.revokeObjectURL(newClips[index].url);
    if (newClips[index]?.thumbnail) URL.revokeObjectURL(newClips[index].thumbnail);
    newClips.splice(index, 1);
    setVideoClips(newClips);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (videoPlayerRef.current) {
      if (isPlaying) videoPlayerRef.current.pause();
      else videoPlayerRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const triggerAudioInput = () => audioInputRef.current?.click();
  const triggerVideoInput = () => videoInputRef.current?.click();

  const handleRenderVideo = async () => {
    if (videoClips.length === 0) {
      setMessage('Please upload at least one video clip to render.');
      return;
    }
    setIsRendering(true);
    setMessage('Rendering video... This may take a few minutes.');
    try {
      const videoUrls = videoClips.map(clip => clip.url); // Use full Supabase URLs
      const audioUrl = audioFile?.url || ''; // Use full Supabase URL
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrls,
          audioUrl,
          subtitles: [], // Add subtitles if needed
          styleType: 'none', // Default style, modify if needed
          segmentIndex: 0, // Can be dynamic if needed
          duration: totalDuration
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to render video');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setRenderedVideoUrl(url);
      setMessage('Video rendered successfully! Download the video below.');
    } catch (error) {
      setMessage('Error rendering video: ' + error.message);
    } finally {
      setIsRendering(false);
    }
  };

  const Particles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particleStyles.map((style, i) => (
        <div 
          key={i}
          className="absolute w-2 h-2 rounded-full bg-purple-500 opacity-20"
          style={style}
        />
      ))}
    </div>
  );

  const NavItem = ({ icon, label, active, onClick, href }) => (
    <li>
      <a href={href} onClick={onClick} className={`w-full flex items-center py-3 px-4 rounded-xl transition-all duration-300 group
        ${active ? 'bg-gradient-to-r from-purple-900/60 to-blue-900/40 text-white shadow-md shadow-purple-900/20' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}>
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
          ${active ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-purple-300' : 'text-gray-400 group-hover:text-purple-300'}`}>
          {icon}
        </div>
        {sidebarOpen && (
          <div className="ml-3 flex-1 flex flex-col items-start overflow-hidden">
            <span className={`font-medium ${active ? 'text-white' : ''}`}>{label}</span>
            {active && <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 mt-1 rounded-full"></div>}
          </div>
        )}
      </a>
    </li>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 opacity-50 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-900/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '15s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-1/2 h-1/2 bg-blue-900/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '20s' }}></div>
      </div>
      
      <Particles />

      <div className={`${sidebarOpen ? 'w-72' : 'w-24'} bg-gray-900/90 backdrop-blur-md border-r border-gray-800/50 transition-all duration-300 flex flex-col z-10`}>
        <div className="py-6 border-b border-gray-800/50">
          <div className={`px-6 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen ? (
              <div className="flex items-center">
                <div className="relative w-12 h-12 mr-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center">
                    <Video size={24} className="text-white z-10" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">AudioSync</h1>
                  <p className="text-xs text-gray-400">AI Video Editor</p>
                </div>
              </div>
            ) : (
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center">
                  <Video size={24} className="text-white z-10" />
                </div>
              </div>
            )}
            <button onClick={toggleSidebar} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800/50 transition-all z-50">
              {sidebarOpen ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4">
          {sidebarOpen && <h3 className="text-xs uppercase text-gray-500 font-semibold tracking-wider px-4 mb-4">Main Menu</h3>}
          <ul className="space-y-2">
            <NavItem icon={<Home size={20} />} label="Dashboard" active={false} href="/dashboard" />
            <NavItem icon={<Video size={20} />} label="Create Videos" active={true} href="/create" />
            <NavItem icon={<BookOpen size={20} />} label="Video Library" active={false} href="/videolibrary" />
            <NavItem icon={<BarChart2 size={20} />} label="Your Stats" active={false} href="/stats" />
          </ul>
        </div>
        
        <div className="p-4 border-t border-gray-800/50">
          <button className="w-full flex items-center justify-center py-4 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/20">
            {sidebarOpen ? (
              <>
                <Plus size={18} className="mr-2" />
                <span className="font-medium">Create New Project</span>
              </>
            ) : (
              <Plus size={22} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col z-10">
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
              <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800/50 transition">
                <HelpCircle size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-medium">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Audio-Synced Video Creator
              </h1>
              <p className="text-gray-400 mt-2">
                Upload an audio track and video clips to create a seamless video with background music.
              </p>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 mb-8 relative overflow-hidden">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-900/30 rounded-full filter blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-900/30 rounded-full filter blur-3xl animate-pulse"></div>

              <div className="text-center mb-6 relative z-10">
                <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">Upload Files</h2>
                <p className="text-gray-400">Upload one audio file and multiple video clips to combine.</p>
              </div>

              {/* Audio Upload */}
              <motion.div 
                className={`border-2 border-dashed rounded-xl py-8 px-8 text-center transition-all relative z-10 mb-6 ${dragActive ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleAudioDrop}
              >
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleAudioUpload} 
                  className="hidden" 
                  ref={audioInputRef}
                />
                {!audioFile ? (
                  <div>
                    <motion.div 
                      animate={pulseAnimation}
                      className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-full flex items-center justify-center mb-8">
                      <Music size={40} className="text-purple-400" />
                    </motion.div>
                    <h4 className="text-2xl font-medium mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">Drag your audio here</h4>
                    <p className="text-gray-400 mb-10 max-w-lg mx-auto">Upload an audio file (MP3, WAV) for background music.</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={triggerAudioInput}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-4 px-10 rounded-lg transition-all shadow-xl"
                    >
                      <Zap size={22} className="mr-2 inline" /> Select Audio
                    </motion.button>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={28} className="text-green-400" />
                    </div>
                    <p className="text-gray-300 mb-2">Audio uploaded</p>
                    <h3 className="text-lg font-medium mb-2">{audioFile.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">Duration: {formatDuration(audioFile.duration)}</p>
                    <button 
                      onClick={() => {
                        setAudioFile(null);
                      }}
                      className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-all">
                      <Trash2 size={18} className="mr-2 inline" /> Remove Audio
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Video Clips Upload */}
              <motion.div 
                className={`border-2 border-dashed rounded-xl py-8 px-8 text-center transition-all relative z-10 ${dragActive ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleVideoDrop}
              >
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleVideoUpload} 
                  className="hidden" 
                  ref={videoInputRef}
                  multiple
                />
                {videoClips.length === 0 ? (
                  <div>
                    <motion.div 
                      animate={pulseAnimation}
                      className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-full flex items-center justify-center mb-8">
                      <Video size={40} className="text-purple-400" />
                    </motion.div>
                    <h4 className="text-2xl font-medium mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">Drag your video clips here</h4>
                    <p className="text-gray-400 mb-10 max-w-lg mx-auto">Upload multiple video clips (MP4, AVI) to combine.</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={triggerVideoInput}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-4 px-10 rounded-lg transition-all shadow-xl">
                      <Zap size={22} className="mr-2 inline" /> Select Video Clips
                    </motion.button>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={28} className="text-green-400" />
                    </div>
                    <p className="text-gray-300 mb-2">{videoClips.length} video clip(s) uploaded</p>
                    <p className="text-sm text-gray-400 mb-4">Total Duration: {formatDuration(totalDuration)}</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={triggerVideoInput}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all">
                      <Plus size={18} className="mr-2 inline" /> Add More Clips
                    </motion.button>
                  </div>
                )}
              </motion.div>

              {message && (
                <p className="mt-6 text-sm text-gray-500 relative z-10">{message}</p>
              )}
            </div>

            {videoClips.length > 0 && totalDuration > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800 p-6 relative overflow-hidden"
              >
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-900/30 rounded-full filter blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-900/30 rounded-full filter blur-3xl animate-pulse"></div>

                <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300 mb-6">Video Preview</h3>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-lg">
                      <Player
                        ref={videoPlayerRef}
                        component={CombinedVideoWithAudio}
                        inputProps={{
                          videoClips,
                          audioUrl: audioFile?.url || '',
                          totalDuration
                        }}
                        durationInFrames={Math.ceil(totalDuration * 30)}
                        compositionWidth={607}
                        compositionHeight={1080}
                        fps={30}
                        controls={true}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'black' }}
                        onEnded={() => setIsPlaying(false)}
                      />
                      <div 
                        className="absolute inset-0 flex items-center justify-center cursor-pointer"
                        onClick={togglePlayPause}
                      >
                        <motion.div 
                          animate={{ opacity: isPlaying ? 0 : 1, scale: isPlaying ? 0.8 : 1 }}
                          className="w-16 h-16 rounded-full bg-purple-600/80 flex items-center justify-center">
                          <Play size={30} fill="white" className="text-white ml-1" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-xl font-medium mb-4 flex items-center">
                      <Video size={20} className="text-purple-400 mr-2" /> Video Clips
                    </h4>
                    <motion.div 
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                    >
                      {videoClips.map((clip, index) => (
                        <motion.div 
                          key={index}
                          variants={itemVariants}
                          whileHover={{ y: -5, scale: 1.03 }}
                          className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/70 group"
                        >
                          <div className="relative aspect-[9/16] bg-black">
                            {clip.thumbnail ? (
                              <img 
                                src={clip.thumbnail} 
                                alt="Thumbnail" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <Video size={40} className="text-gray-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/80 opacity-80"></div>
                            <div className="absolute bottom-3 left-3 bg-gray-900/80 rounded-md px-2 py-1 text-xs flex items-center">
                              <Clock size={12} className="text-purple-400" />
                              {formatDuration(clip.duration)}
                            </div>
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => removeClip(index)}
                                className="bg-red-600/80 text-white p-2 rounded-full">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="p-3">
                            <h5 className="font-medium text-sm truncate">{clip.name}</h5>
                            <div className="text-xs text-gray-400 mt-1">Clip {index + 1}</div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                    <div className="mt-6">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRenderVideo}
                        disabled={isRendering}
                        className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all ${
                          isRendering ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Video size={18} className="mr-2 inline" />
                        {isRendering ? 'Rendering...' : 'Render Video'}
                      </motion.button>
                      {renderedVideoUrl && (
                        <a
                          href={renderedVideoUrl}
                          download="rendered_video.mp4"
                          className="ml-4 inline-flex items-center bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-6 rounded-lg transition-all"
                        >
                          <Download size={18} className="mr-2" />
                          Download Rendered Video
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}