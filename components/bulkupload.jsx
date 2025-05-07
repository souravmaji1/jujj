'use client'
import { useState, useRef } from 'react';
import { Upload, Video, X, Edit2, FileText,  Plus, ArrowRight, Sparkles, CheckCircle, Clock, Trash2, ChevronRight, ChevronLeft, Zap, Film, Layout, Settings, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey);

const BulkUploadComponent = ({ onBack, onComplete }) => {
  const { user } = useUser();
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [uploadStatus, setUploadStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef(null);
  const videoPlayerRef = useRef(null);

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };

  const pulseAnimation = {
    scale: [1, 1.03, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
    }
  };

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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const newVideos = Array.from(files)
      .filter(file => file.type.startsWith('video/'))
      .map(file => ({
        file,
        name: file.name.replace(/\.[^/.]+$/, ""),
        description: '',
        duration: 0,
        url: URL.createObjectURL(file),
        thumbnail: '',
        status: 'uploaded',
        id: Math.random().toString(36).substring(2, 9)
      }));

    if (newVideos.length > 0) {
      setUploadedVideos([...uploadedVideos, ...newVideos]);
      loadVideoDurations(newVideos);
      generateThumbnails(newVideos);
      if (viewMode === 'grid') {
        setViewMode('detail');
      }
    }
  };

  const generateThumbnails = async (videos) => {
    const updatedVideos = await Promise.all(videos.map(async video => {
      const thumbnail = await getVideoThumbnail(video.file);
      return { ...video, thumbnail };
    }));
    
    setUploadedVideos(prev => {
      const newVideos = [...prev];
      updatedVideos.forEach(updatedVideo => {
        const index = newVideos.findIndex(v => v.id === updatedVideo.id);
        if (index !== -1) {
          newVideos[index] = updatedVideo;
        }
      });
      return newVideos;
    });
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
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg'));
          URL.revokeObjectURL(video.src);
        };
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const loadVideoDurations = async (videos) => {
    const updatedVideos = await Promise.all(videos.map(async video => {
      const duration = await getVideoDuration(video.file);
      return { ...video, duration };
    }));
    
    setUploadedVideos(prev => {
      const newVideos = [...prev];
      updatedVideos.forEach(updatedVideo => {
        const index = newVideos.findIndex(v => v.id === updatedVideo.id);
        if (index !== -1) {
          newVideos[index] = updatedVideo;
        }
      });
      return newVideos;
    });
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const removeVideo = (index) => {
    const newVideos = [...uploadedVideos];
    URL.revokeObjectURL(newVideos[index].url);
    newVideos.splice(index, 1);
    setUploadedVideos(newVideos);
    if (activeVideoIndex >= index) {
      setActiveVideoIndex(Math.max(0, activeVideoIndex - 1));
    }
  };

  const updateVideoDetails = (index, field, value) => {
    const newVideos = [...uploadedVideos];
    newVideos[index] = { ...newVideos[index], [field]: value };
    setUploadedVideos(newVideos);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const updateVideoStatus = (index, status) => {
    setUploadStatus(prev => ({
      ...prev,
      [index]: status
    }));
  };

  const togglePlayPause = () => {
    if (videoPlayerRef.current) {
      if (isPlaying) {
        videoPlayerRef.current.pause();
      } else {
        videoPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleProcessAll = async () => {
    if (!user) {
      console.error('No user logged in');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      for (let i = 0; i < uploadedVideos.length; i++) {
        const video = uploadedVideos[i];
        updateVideoStatus(i, 'uploading');
        setProgress((i / uploadedVideos.length) * 100);
        
        // Upload video file to Supabase Storage
        const fileExt = video.file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, video.file);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          updateVideoStatus(i, 'error');
          continue;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        // Save metadata to database
        const { error: dbError } = await supabase
          .from('user_videos')
          .insert({
            user_id: user.id,
            title: video.name,
            description: video.description,
            video_url: publicUrl,
            duration: video.duration,
            thumbnail_url: video.thumbnail,
            created_at: new Date().toISOString()
          });
        
        if (dbError) {
          console.error('Database error:', dbError);
          updateVideoStatus(i, 'error');
        } else {
          updateVideoStatus(i, 'uploaded');
        }
        
        setProgress(((i + 1) / uploadedVideos.length) * 100);
      }
      
      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        onComplete();
      }, 500);
      
    } catch (error) {
      console.error('Error processing videos:', error);
      setIsProcessing(false);
    }
  };

  // New function to toggle view mode
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'detail' : 'grid');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/50 backdrop-blur-xl rounded-xl border mt-8 border-gray-800 p-0 relative overflow-hidden"
    >
      {/* Dynamic background with more vibrant effects */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-900/30 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-900/30 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-700/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-blue-700/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-full filter blur-3xl"></div>
      
      {/* Header with glowing border */}
      <div className="border-b border-gray-800 relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-glow"></div>
        <div className="flex justify-between items-center p-6">
          <div>
            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Reels Studio
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {uploadedVideos.length > 0 
                ? `${uploadedVideos.length} reel${uploadedVideos.length !== 1 ? 's' : ''} in your collection`
                : 'Upload and manage your YouTube Reels'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {uploadedVideos.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleViewMode}
                className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition-all backdrop-blur-sm shadow-lg shadow-purple-900/10"
                title={viewMode === 'grid' ? 'Switch to detail view' : 'Switch to grid view'}
              >
                {viewMode === 'grid' ? <Layout size={20} /> : <Film size={20} />}
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded-lg transition-all flex items-center backdrop-blur-sm shadow-lg shadow-purple-900/10"
            >
              <ChevronLeft size={16} className="mr-1" />
              Back
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="p-6 relative z-10">
        {uploadedVideos.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`border-2 border-dashed rounded-xl py-16 px-8 text-center transition-all ${dragActive ? 'border-purple-500 bg-purple-900/20 shadow-xl shadow-purple-900/40' : 'border-gray-700'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <motion.div 
              animate={pulseAnimation}
              className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-full flex items-center justify-center mb-8 relative group"
            >
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/50 animate-spin-slow"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 opacity-0 group-hover:opacity-100 scale-110 transition-all duration-300"></div>
              <Upload size={40} className="text-purple-400 group-hover:scale-110 transition-all duration-300" />
            </motion.div>
            <h4 className="text-2xl font-medium mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">Drag your reels here</h4>
            <p className="text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
              Batch upload your YouTube Reels. We support vertical format videos (9:16) and other aspect ratios. Your reels will be processed and ready to share in minutes.
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileInput}
              className="hidden"
              multiple
              accept="video/*"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={triggerFileInput}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-4 px-10 rounded-lg transition-all shadow-xl shadow-purple-900/30 hover:shadow-purple-900/50 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center text-lg">
                <Zap size={22} className="mr-2" />
                Select Reels
              </span>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/0 via-white/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full"></div>
            </motion.button>
            <p className="text-xs text-gray-500 mt-6">
              By uploading, you agree to our Terms of Service
            </p>
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* Grid View - Optimized for Reels */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-medium flex items-center">
                <Film size={20} className="text-purple-400 mr-2" />
                Reels Collection
              </h4>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={triggerFileInput}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-2 px-4 rounded-lg transition-all flex items-center shadow-lg shadow-purple-900/20"
              >
                <Plus size={18} className="mr-1" />
                Add Reels
              </motion.button>
            </div>
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {uploadedVideos.map((video, index) => (
                <motion.div 
                  key={video.id}
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.03 }}
                  className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/70 transition-all shadow-lg hover:shadow-xl hover:shadow-purple-900/30 group"
                >
                  <div className="relative aspect-[9/16] bg-gray-900 overflow-hidden">
                    {video.thumbnail ? (
                      <img 
                        src={video.thumbnail} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <Video size={40} className="text-gray-600" />
                      </div>
                    )}
                    
                    {/* Glowing overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/80 opacity-80"></div>
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-16 h-16 rounded-full bg-purple-600/80 flex items-center justify-center backdrop-blur-sm cursor-pointer shadow-lg shadow-purple-900/50"
                        onClick={() => {
                          setActiveVideoIndex(index);
                          setViewMode('detail');
                        }}
                      >
                        <Play size={30} fill="white" className="text-white ml-1" />
                      </motion.div>
                    </div>
                    
                    {/* Duration badge */}
                    <div className="absolute bottom-3 left-3 bg-gray-900/80 rounded-md px-2 py-1 text-xs flex items-center backdrop-blur-sm">
                      <Clock size={12} className="mr-1 text-purple-400" />
                      {formatDuration(video.duration)}
                    </div>
                    
                    {/* Control buttons */}
                    <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeVideo(index)}
                        className="bg-red-600/80 text-white p-2 rounded-full backdrop-blur-sm"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h5 className="font-medium text-sm truncate">{video.name}</h5>
                    <div className="text-xs text-gray-400 mt-1 flex items-center">
                      <div className="w-1 h-1 bg-purple-500 rounded-full mr-1"></div>
                      <span>Reel</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Add more button */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.03 }}
                onClick={triggerFileInput}
                className="bg-gray-800/20 rounded-xl border border-dashed border-gray-700 aspect-[9/16] cursor-pointer hover:border-purple-500/50 transition-all flex flex-col items-center justify-center text-center p-6 shadow-lg hover:shadow-purple-900/20"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-900/30 to-blue-900/30 flex items-center justify-center mb-4">
                  <Plus size={24} className="text-purple-400" />
                </div>
                <p className="font-medium text-gray-300">Add More Reels</p>
                <p className="text-xs text-gray-500 mt-2">Upload YouTube Reels</p>
              </motion.div>
            </motion.div>
            
            <div className="mt-8 text-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProcessAll}
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 px-10 rounded-lg transition-all flex items-center justify-center max-w-md mx-auto relative overflow-hidden group shadow-xl shadow-purple-900/30"
              >
                <span className="relative z-10 flex items-center text-lg">
                  {isProcessing ? (
                    <>
                      <span className="mr-2">Processing...</span>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </>
                  ) : (
                    <>
                      <Sparkles size={22} className="mr-2" />
                      Process All Reels
                    </>
                  )}
                </span>
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/0 via-white/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full"></div>
                {isProcessing && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </motion.button>
            </div>
          </div>
        ) : (
          /* Detail View - Optimized for Reels */
          <div className="flex flex-col md:flex-row gap-6">
            {/* Video Player Side - Optimized for 9:16 ratio */}
            <div className="w-full md:w-2/5 lg:w-1/3 mx-auto md:mx-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVideoIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden shadow-2xl shadow-purple-900/20"
                >
                  {uploadedVideos[activeVideoIndex] && (
                    <>
                      <div className="relative bg-black aspect-[9/16] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none"></div>
                        
                        {/* Custom video player optimized for Reels */}
                        <div className="relative w-full h-full">
                          <video 
                            ref={videoPlayerRef}
                            src={uploadedVideos[activeVideoIndex].url} 
                            className="w-full h-full object-cover"
                            onEnded={handleVideoEnded}
                            playsInline
                            controls={false}
                          />
                          
                          {/* Custom play button */}
                          <div 
                            className="absolute inset-0 flex items-center justify-center cursor-pointer z-20"
                            onClick={togglePlayPause}
                          >
                            {!isPlaying && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="w-16 h-16 rounded-full bg-purple-600/80 flex items-center justify-center backdrop-blur-sm shadow-xl shadow-purple-900/50"
                              >
                                <Play size={30} fill="white" className="text-white ml-1" />
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Video title overlay */}
                          <div className="absolute top-4 left-0 right-0 px-4 z-20">
                            <h4 className="font-bold text-white text-shadow truncate">{uploadedVideos[activeVideoIndex].name}</h4>
                          </div>
                          
                          {/* Video controls overlay */}
                          <div className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-between z-20">
                            <div className="flex items-center space-x-2">
                              <div className="bg-gray-900/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs flex items-center">
                                <Clock size={12} className="mr-1 text-purple-400" />
                                {formatDuration(uploadedVideos[activeVideoIndex].duration)}
                              </div>
                            </div>
                            
                            <div>
                              <button
                                onClick={() => removeVideo(activeVideoIndex)}
                                className="bg-red-600/80 text-white p-2 rounded-full backdrop-blur-sm"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-30">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            style={{ width: `${(activeVideoIndex + 1) / uploadedVideos.length * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Video navigation */}
                      <div className="p-4 flex justify-between items-center border-t border-gray-700/30">
                        <button
                          onClick={() => activeVideoIndex > 0 && setActiveVideoIndex(activeVideoIndex - 1)}
                          disabled={activeVideoIndex === 0}
                          className={`p-2 rounded-full ${activeVideoIndex === 0 ? 'text-gray-600' : 'text-white hover:bg-gray-700/50'}`}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        
                        <div className="text-sm text-gray-400">
                          {activeVideoIndex + 1} / {uploadedVideos.length}
                        </div>
                        
                        <button
                          onClick={() => activeVideoIndex < uploadedVideos.length - 1 && setActiveVideoIndex(activeVideoIndex + 1)}
                          disabled={activeVideoIndex === uploadedVideos.length - 1}
                          className={`p-2 rounded-full ${activeVideoIndex === uploadedVideos.length - 1 ? 'text-gray-600' : 'text-white hover:bg-gray-700/50'}`}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Form Side */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-medium flex items-center">
                  <Edit2 size={20} className="text-purple-400 mr-2" />
                  Edit Reel Details
                </h4>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={triggerFileInput}
                  className="bg-gray-800/80 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-all flex items-center shadow-lg shadow-purple-900/10"
                >
                  <Plus size={18} className="mr-1" />
                  Add More
                </motion.button>
              </div>
              
              {uploadedVideos[activeVideoIndex] && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/30 rounded-xl border border-gray-700 p-6 shadow-lg"
                >
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Reel Title</label>
                    <input
                      type="text"
                      value={uploadedVideos[activeVideoIndex].name}
                      onChange={(e) => updateVideoDetails(activeVideoIndex, 'name', e.target.value)}
                      className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Enter a catchy title for your reel"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                    <textarea
                      value={uploadedVideos[activeVideoIndex].description}
                      onChange={(e) => updateVideoDetails(activeVideoIndex, 'description', e.target.value)}
                      className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all h-32 resize-none"
                      placeholder="Describe your reel to help it get discovered"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Format</label>
                    <div className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium">YouTube Reel</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Optimized for mobile viewing (9:16)</p>
                      </div>
                      <Settings size={18} className="text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2" />
                      <span>Duration: {formatDuration(uploadedVideos[activeVideoIndex].duration)}</span>
                    </div>
                    <div>
                      {uploadStatus[activeVideoIndex] === 'uploaded' ? (
                        <div className="flex items-center text-green-500">
                          <CheckCircle size={16} className="mr-1" />
                          <span>Processed</span>
                        </div>
                      ) : uploadStatus[activeVideoIndex] === 'uploading' ? (
                        <div className="flex items-center text-blue-500">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span>Processing...</span>
                        </div>
                      ) : uploadStatus[activeVideoIndex] === 'error' ? (
                        <div className="flex items-center text-red-500">
                          <X size={16} className="mr-1" />
                          <span>Error</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <FileText size={16} className="mr-1" />
                          <span>Ready to process</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProcessAll}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 px-8 rounded-lg transition-all flex items-center justify-center w-full relative overflow-hidden group shadow-xl shadow-purple-900/20"
                    >
                      <span className="relative z-10 flex items-center">
                        {isProcessing ? (
                          <>
                            <span className="mr-2">Processing...</span>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </>
                        ) : (
                          <>
                            <ArrowRight size={18} className="mr-2" />
                            Process All Reels
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/0 via-white/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full"></div>
                      {isProcessing && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
              
              {/* Thumbnails/Navigation for other videos */}
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-400 mb-3">All Reels</h5>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {uploadedVideos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      whileHover={{ y: -5, scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveVideoIndex(index)}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 ${activeVideoIndex === index ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-transparent'} transition-all`}
                    >
                      <div className="relative aspect-[9/16] bg-gray-900 overflow-hidden">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt="Thumbnail" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <Video size={24} className="text-gray-600" />
                          </div>
                        )}
                        
                        {/* Dark overlay */}
                        <div className={`absolute inset-0 bg-black ${activeVideoIndex === index ? 'opacity-30' : 'opacity-60'} transition-opacity`}></div>
                        
                        {/* Status indicator */}
                        {uploadStatus[index] === 'uploaded' && (
                          <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                            <CheckCircle size={10} />
                          </div>
                        )}
                        
                        {activeVideoIndex === index && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-purple-600/90 flex items-center justify-center">
                              <Play size={16} fill="white" className="text-white ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Add more button */}
                  <motion.div
                    whileHover={{ y: -5, scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={triggerFileInput}
                    className="relative rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-gray-700 hover:border-purple-500/50 transition-all"
                  >
                    <div className="aspect-[9/16] bg-gray-900/30 flex items-center justify-center">
                      <Plus size={24} className="text-gray-400" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BulkUploadComponent;