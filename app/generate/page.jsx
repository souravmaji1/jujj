'use client'
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  Upload, Video, Scissors, Folder, CheckCircle, ChevronDown, ChevronRight, Home, Settings, Users, 
  BarChart2, HelpCircle, Plus, ArrowRight, Sparkles, Clock, Zap, BookOpen, Music, Cloud, Download, Play, ChevronLeft,Edit2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import BulkUpload from '@/components/bulkupload';
import { Player } from '@remotion/player';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Video as RemotionVideo } from 'remotion';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Subtitle Component for Remotion
const SubtitleOverlay = ({ subtitles, styleType }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeSubtitle = subtitles.find(
    subtitle => {
      const startFrame = Math.floor(subtitle.start * fps);
      const endFrame = Math.floor(subtitle.end * fps);
      return frame >= startFrame && frame <= endFrame;
    }
  );

  const styles = {
    hormozi: {
      position: 'absolute',
      left: '10%',
      right: '10%',
      bottom: '10%',
      textAlign: 'center',
      fontFamily: 'Impact, Arial, sans-serif',
      fontSize: '36px',
      fontWeight: '900',
      color: 'white',
      textTransform: 'uppercase',
      textShadow: '0 4px 6px rgba(0, 0, 0, 0.8)',
      padding: '15px 20px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderRadius: '12px',
      border: '4px solid #FFD700',
      zIndex: 10,
      opacity: activeSubtitle ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out'
    },
    abdaal: {
      position: 'absolute',
      left: '10%',
      right: '10%',
      bottom: '10%',
      textAlign: 'center',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: '28px',
      fontWeight: '600',
      color: '#F5F5F5',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
      padding: '10px 15px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: '10px',
      border: '2px solid #FFFFFF',
      zIndex: 10,
      opacity: activeSubtitle ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out'
    },
    neonGlow: {
      position: 'absolute',
      left: '10%',
      right: '10%',
      bottom: '10%',
      textAlign: 'center',
      fontFamily: '"Orbitron", Arial, sans-serif',
      fontSize: '32px',
      fontWeight: '700',
      color: '#00FFDD',
      textShadow: '0 0 8px #00FFDD, 0 0 16px #00FFDD, 0 0 24px #FF00FF',
      padding: '12px 18px',
      background: 'linear-gradient(45deg, rgba(255, 0, 255, 0.2), rgba(0, 255, 221, 0.2))',
      borderRadius: '10px',
      border: '2px solid #FF00FF',
      zIndex: 10,
      opacity: activeSubtitle ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
      animation: activeSubtitle ? 'neonFlicker 1.5s infinite alternate' : 'none'
    },
    retroWave: {
      position: 'absolute',
      left: '10%',
      right: '10%',
      bottom: '10%',
      textAlign: 'center',
      fontFamily: '"VCR OSD Mono", monospace',
      fontSize: '30px',
      fontWeight: '400',
      color: '#FF69B4',
      textShadow: '0 0 10px #FF1493, 0 0 20px #9400D3',
      padding: '10px 15px',
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '8px',
      border: '3px double #00FFFF',
      zIndex: 10,
      opacity: activeSubtitle ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out',
      filter: 'contrast(1.2)',
      letterSpacing: '2px'
    },
    minimalPop: {
      position: 'absolute',
      left: '10%',
      right: '10%',
      bottom: '10%',
      textAlign: 'center',
      fontFamily: '"Poppins", Arial, sans-serif',
      fontSize: '28px',
      fontWeight: '500',
      color: '#FFFFFF',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      padding: '8px 12px',
      background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
      borderRadius: '12px',
      border: 'none',
      zIndex: 10,
      opacity: activeSubtitle ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out, transform 0.2s ease-in-out',
      transform: activeSubtitle ? 'scale(1)' : 'scale(0.95)'
    },
    none: {
      position: 'absolute',
      left: '10%',
      right: '10%',
      bottom: '10%',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'white',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
      padding: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '8px',
      zIndex: 10,
      opacity: activeSubtitle ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out'
    }
  };

  return <div style={styles[styleType] || styles.none}>{activeSubtitle ? activeSubtitle.text : ''}</div>;
};

// Remotion Video Component
const VideoWithSubtitle = ({ videoUrl, subtitles, styleType }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill>
      <RemotionVideo
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        startFrom={0}
        endAt={durationInFrames}
        onError={(e) => console.error('Main video load error:', e)}
      />
      <SubtitleOverlay subtitles={subtitles} styleType={styleType} />
    </AbsoluteFill>
  );
};

// Animation variants for the upload section
const pulseAnimation = {
  scale: [1, 1.03, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    repeatType: "reverse",
  }
};

export default function VideoBulk() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedNav, setSelectedNav] = useState('video-projects');
  const [bulkUploadComplete, setBulkUploadComplete] = useState(false);
  const [ffmpeg, setFFmpeg] = useState(null);
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [segmentVideos, setSegmentVideos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoInputRef = useRef(null);
  const [segmentSubtitles, setSegmentSubtitles] = useState([]);
  const [subtitleStyles, setSubtitleStyles] = useState([]);
  const [particleStyles, setParticleStyles] = useState([]);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState([]);
  const [editingSegmentIndex, setEditingSegmentIndex] = useState(null);
  const [newSubtitle, setNewSubtitle] = useState({ text: '', start: '', end: '' });
  const [segmentMetadata, setSegmentMetadata] = useState([]);
  const [workflowData, setWorkflowData] = useState(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  // Mock recent projects data
  const recentProjects = [
    { name: 'Summer Campaign', date: '2023-10-15', progress: 100 },
    { name: 'Product Launch', date: '2023-10-10', progress: 75 },
    { name: 'Event Recap', date: '2023-10-05', progress: 100 },
  ];

  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        setIsLoadingFFmpeg(true);
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        const ffmpegInstance = new FFmpeg();
        
        ffmpegInstance.on('progress', ({ progress }) => {
          setProgress(progress * 100);
        });

        await ffmpegInstance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        console.log('FFmpeg loaded');
        setFFmpeg(ffmpegInstance);
        setIsLoadingFFmpeg(false);
      } catch (error) {
        console.error('Error loading FFmpeg:', error);
        setMessage('Failed to load FFmpeg');
        setIsLoadingFFmpeg(false);
      }
    };

    if (selectedOption === 'single' && !ffmpeg) {
      loadFFmpeg();
    }
  }, [selectedOption]);

  // Animation effect on mount
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Initialize subtitles, subtitle styles, subtitle generation status, and metadata arrays when segments are created
  useEffect(() => {
    if (segmentVideos.length > 0) {
      setSegmentSubtitles(segmentVideos.map(() => []));
      setSubtitleStyles(segmentVideos.map(() => 'none'));
      setIsGeneratingSubtitles(segmentVideos.map(() => false));
      setSegmentMetadata(segmentVideos.map(() => ({ title: '', description: '' })));
    } else {
      setSegmentSubtitles([]);
      setSubtitleStyles([]);
      setIsGeneratingSubtitles([]);
      setSegmentMetadata([]);
    }
  }, [segmentVideos]);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
   _face = e.dataTransfer;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleVideoUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('video/')) {
        setMessage('Please upload a valid video file.');
        return;
      }
      
      setMessage('Analyzing video...');
      
      try {
        const videoEl = document.createElement('video');
        videoEl.preload = 'metadata';
        
        const metadataLoaded = new Promise((resolve) => {
          videoEl.onloadedmetadata = () => resolve(videoEl);
        });
        
        videoEl.src = URL.createObjectURL(file);
        
        const loadedVideo = await metadataLoaded;
        
        const info = {
          name: file.name,
          duration: loadedVideo.duration,
          width: loadedVideo.videoWidth,
          height: loadedVideo.videoHeight
        };
        
        setUploadedVideo(file);
        setVideoInfo(info);
        
        setSegmentVideos([]);
        setSegmentSubtitles([]);
        setSubtitleStyles([]);
        setSegmentMetadata([]);
        
        if (selectedOption === 'single') {
          if (info.duration > 30) {
            await splitVideo(info);
          } else {
            setMessage(`Video is ${info.duration.toFixed(1)} seconds long. Processing as a single segment.`);
            await splitVideo(info);
          }
        } else {
          setMessage(`Video "${file.name}" is ready for processing.`);
        }
        
        URL.revokeObjectURL(loadedVideo.src);
      } catch (error) {
        console.error(`Error analyzing video ${file.name}:`, error);
        setMessage('Error analyzing video');
      }
    }
  };

  const splitVideo = async (videoInfo) => {
    if (!ffmpeg || !uploadedVideo || !videoInfo) return;
  
    setIsProcessing(true);
    setMessage('Processing video...');
    setSegmentVideos([]);
  
    try {
      const segmentDuration = 30;
      const maxSegments = Math.min(2, Math.ceil(videoInfo.duration / segmentDuration));
      setMessage(`Splitting into ${maxSegments} segment(s) of up to 30 seconds each for Instagram Reels...`);
  
      const videoData = await fetchFile(uploadedVideo);
      await ffmpeg.writeFile('input.mp4', videoData);
  
      const newSegments = [];
  
      for (let i = 0; i < maxSegments; i++) {
        const startTime = i * segmentDuration;
        const remainingDuration = Math.min(segmentDuration, videoInfo.duration - startTime);
        if (remainingDuration <= 0) break;
  
        setMessage(`Creating segment ${i + 1} of ${maxSegments}...`);
  
        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-ss', startTime.toString(),
          '-t', remainingDuration.toString(),
          '-vf', 'scale=-1:1080, crop=607:1080',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-preset', 'fast',
          '-f', 'mp4',
          `segment_${i}.mp4`
        ]);
  
        const data = await ffmpeg.readFile(`segment_${i}.mp4`);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
  
        const videoEl = document.createElement('video');
        videoEl.src = URL.createObjectURL(blob);
        const canPlay = await new Promise(resolve => {
          videoEl.oncanplay = () => resolve(true);
          videoEl.onerror = () => resolve(false);
          videoEl.load();
        });
  
        if (!canPlay) {
          throw new Error(`Segment ${i + 1} is not a valid video`);
        }
  
        const url = URL.createObjectURL(blob);
        newSegments.push({
          url,
          startTime,
          duration: remainingDuration,
          index: i
        });
      }
  
      setSegmentVideos(newSegments);
      setActiveSegmentIndex(0); // Reset to the first segment
      setMessage(`Video successfully split into ${newSegments.length} Instagram Reels segments.`);
    } catch (error) {
      console.error('Error splitting video:', error);
      setMessage('Error splitting video: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSubtitles = async (segmentIndex) => {
    const segment = segmentVideos[segmentIndex];
    if (!segment) return;

    setIsGeneratingSubtitles(prev => {
      const newState = [...prev];
      newState[segmentIndex] = true;
      return newState;
    });
    setMessage(`Generating subtitles for segment ${segmentIndex + 1}...`);

    try {
      const fileName = `segment_${segment.index}_${Date.now()}.mp4`;
      const blob = await fetch(segment.url).then(res => res.blob());
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`input/${fileName}`, blob, {
          contentType: 'video/mp4'
        });

      if (uploadError) {
        console.error(`Supabase upload error for segment ${segmentIndex + 1}:`, uploadError);
        setMessage(`Failed to upload segment ${segmentIndex + 1}: ${uploadError.message}`);
        setSegmentSubtitles(prev => {
          const newSubtitles = [...prev];
          newSubtitles[segmentIndex] = [{ text: 'Upload failed', start: 0, end: segment.duration }];
          return newSubtitles;
        });
        return;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`input/${fileName}`);
      
      const publicUrl = urlData.publicUrl;

      let transcription = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts && !transcription) {
        try {
          attempts++;
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrl: publicUrl, segmentStart: segment.startTime })
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (attempts === maxAttempts) {
              setMessage(`Failed to transcribe segment ${segmentIndex + 1} after ${maxAttempts} attempts`);
              setSegmentSubtitles(prev => {
                const newSubtitles = [...prev];
                newSubtitles[segmentIndex] = [{ text: 'Transcription failed', start: 0, end: segment.duration }];
                return newSubtitles;
              });
              break;
            }
            continue;
          }

          transcription = await response.json();
        } catch (error) {
          if (attempts === maxAttempts) {
            setMessage(`Error transcribing segment ${segmentIndex + 1}: ${error.message}`);
            setSegmentSubtitles(prev => {
              const newSubtitles = [...prev];
              newSubtitles[segmentIndex] = [{ text: 'Error generating subtitles', start: 0, end: segment.duration }];
              return newSubtitles;
            });
          }
          continue;
        }
      }

      if (transcription) {
        let subtitles = [];
        const utterances = transcription?.results?.channels?.[0]?.utterances;
        const paragraphs = transcription?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs;

        if (utterances && Array.isArray(utterances)) {
          subtitles = utterances.map(utterance => ({
            text: utterance.transcript,
            start: utterance.start - segment.startTime,
            end: utterance.end - segment.startTime
          })).filter(sub => sub.start >= 0 && sub.end <= segment.duration);
        } else if (paragraphs && Array.isArray(paragraphs)) {
          subtitles = paragraphs.flatMap(paragraph =>
            paragraph.sentences.map(sentence => ({
              text: sentence.text,
              start: sentence.start - segment.startTime,
              end: sentence.end - segment.startTime
            }))
          ).filter(sub => sub.start >= 0 && sub.end <= segment.duration);
        }

        if (subtitles.length === 0) {
          subtitles = [{ text: 'No audio detected', start: 0, end: segment.duration }];
        }

        setSegmentSubtitles(prev => {
          const newSubtitles = [...prev];
          newSubtitles[segmentIndex] = subtitles;
          return newSubtitles;
        });
        setMessage(`Subtitles generated for segment ${segmentIndex + 1}.`);
      }

      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([`input/${fileName}`]);

      if (deleteError) {
        console.warn(`Failed to delete segment ${fileName} from Supabase:`, deleteError);
      }
    } catch (error) {
      console.error(`Error processing segment ${segmentIndex + 1}:`, error);
      setMessage(`Error processing segment ${segmentIndex + 1}: ${error.message}`);
      setSegmentSubtitles(prev => {
        const newSubtitles = [...prev];
        newSubtitles[segmentIndex] = [{ text: 'Error generating subtitles', start: 0, end: segment.duration }];
        return newSubtitles;
      });
    } finally {
      setIsGeneratingSubtitles(prev => {
        const newState = [...prev];
        newState[segmentIndex] = false;
        return newState;
      });
    }
  };

  const renderAllSegments = async () => {
    if (!segmentVideos.length) {
      setMessage('No segments to render.');
      return;
    }
  
    if (!user?.id) {
      setMessage('User authentication required to render segments.');
      return;
    }
  
    setIsProcessing(true);
    setMessage('Initiating rendering for all segments...');
  
    try {
      const segments = await Promise.all(
        segmentVideos.map(async (segment, index) => {
          const fileName = `segment_${segment.index}_${Date.now()}.mp4`;
          const blob = await fetch(segment.url).then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch segment ${index + 1}: ${res.statusText}`);
            return res.blob();
          });
  
          let uploadData, uploadError;
          for (let attempt = 1; attempt <= 3; attempt++) {
            ({ data: uploadData, error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(`input/${fileName}`, blob, {
                contentType: 'video/mp4',
              }));
  
            console.log(`Upload attempt ${attempt} for segment ${index + 1}:`, { uploadData, uploadError });
  
            if (!uploadError) break;
  
            if (attempt === 3) {
              console.error(`Upload failed for segment ${index + 1} after 3 attempts:`, uploadError);
              throw new Error(`Failed to upload segment ${index + 1}: ${uploadError.message}`);
            }
  
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
  
          const { data: urlData, error: urlError } = supabase.storage
            .from('avatars')
            .getPublicUrl(`input/${fileName}`);
  
          if (urlError || !urlData.publicUrl) {
            throw new Error(`Failed to get public URL for segment ${index + 1}: ${urlError?.message}`);
          }
  
          console.log(`Public URL for segment ${index + 1}:`, urlData.publicUrl);
  
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          if (!response.ok) {
            throw new Error(`Segment ${index + 1} URL is inaccessible: ${urlData.publicUrl} (Status: ${response.status})`);
          }
  
          return {
            videoPath: `input/${fileName}`,
            subtitles: segmentSubtitles[index] || [],
            styleType: subtitleStyles[index] || 'none',
            segmentIndex: index,
            duration: segment.duration,
            title: segmentMetadata[index]?.title || `Segment ${index + 1}`,
            description: segmentMetadata[index]?.description || ''
          };
        })
      );
  
      console.log('Segments to render:', segments);
  
      await new Promise((resolve) => setTimeout(resolve, 2000));
  
      const response = await fetch('/api/bulkrender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments, userId: user.id }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Bulk render error:', errorData);
        throw new Error(errorData.error || 'Failed to initiate rendering');
      }
  
      const { workflowIds } = await response.json();
      setMessage(
        `Rendering initiated for ${workflowIds.length} segments. Workflow IDs: ${workflowIds.join(', ')}. Check Video Library for status.`
      );
  
      setWorkflowData({ workflowIds, segmentPaths: segments.map((s) => s.videoPath) });
    } catch (error) {
      console.error('Error initiating rendering:', error);
      setMessage(`Error initiating rendering: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubtitleStyleChange = (index, style) => {
    setSubtitleStyles(prev => {
      const newStyles = [...prev];
      newStyles[index] = style;
      return newStyles;
    });
  };

  const handleMetadataChange = (index, field, value) => {
    setSegmentMetadata(prev => {
      const newMetadata = [...prev];
      newMetadata[index] = { ...newMetadata[index], [field]: value };
      return newMetadata;
    });
  };

  const handleAddSubtitle = (segmentIndex) => {
    const segment = segmentVideos[segmentIndex];
    if (!segment) return;

    const start = parseFloat(newSubtitle.start);
    const end = parseFloat(newSubtitle.end);

    if (!newSubtitle.text || isNaN(start) || isNaN(end) || start < 0 || end > segment.duration || start >= end) {
      setMessage('Please enter valid subtitle text and timing.');
      return;
    }

    const newSub = { text: newSubtitle.text, start, end };
    setSegmentSubtitles(prev => {
      const newSubtitles = [...prev];
      newSubtitles[segmentIndex] = [...(newSubtitles[segmentIndex] || []), newSub].sort((a, b) => a.start - b.start);
      return newSubtitles;
    });

    setNewSubtitle({ text: '', start: '', end: '' });
    setMessage(`Subtitle added to segment ${segmentIndex + 1}.`);
  };

  const handleEditSubtitle = (segmentIndex, subtitleIndex, updatedSubtitle) => {
    const segment = segmentVideos[segmentIndex];
    if (!segment) return;

    const start = parseFloat(updatedSubtitle.start);
    const end = parseFloat(updatedSubtitle.end);

    if (!updatedSubtitle.text || isNaN(start) || isNaN(end) || start < 0 || end > segment.duration || start >= end) {
      setMessage('Please enter valid subtitle text and timing.');
      return;
    }

    setSegmentSubtitles(prev => {
      const newSubtitles = [...prev];
      newSubtitles[segmentIndex] = [
        ...newSubtitles[segmentIndex].slice(0, subtitleIndex),
        { text: updatedSubtitle.text, start, end },
        ...newSubtitles[segmentIndex].slice(subtitleIndex + 1)
      ].sort((a, b) => a.start - b.start);
      return newSubtitles;
    });

    setMessage(`Subtitle updated in segment ${segmentIndex + 1}.`);
  };

  const handleDeleteSubtitle = (segmentIndex, subtitleIndex) => {
    setSegmentSubtitles(prev => {
      const newSubtitles = [...prev];
      newSubtitles[segmentIndex] = [
        ...newSubtitles[segmentIndex].slice(0, subtitleIndex),
        ...newSubtitles[segmentIndex].slice(subtitleIndex + 1)
      ];
      return newSubtitles;
    });
    setMessage(`Subtitle deleted from segment ${segmentIndex + 1}.`);
  };

  const triggerVideoInput = () => {
    videoInputRef.current?.click();
  };

  const Particles = () => {
    return (
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
  };

  const NavItem = ({ icon, label, active, onClick }) => {
    return (
      <li>
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
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 opacity-50 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-900/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '15s' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-1/2 h-1/2 bg-blue-900/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '20s' }}></div>
        </div>
      </div>
      
      <Particles />

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
              />
              <NavItem 
                icon={<Video size={20} />} 
                label="Video Projects" 
                active={selectedNav === 'video-projects'} 
                onClick={() => setSelectedNav('video-projects')}
              />
              <NavItem 
                icon={<BookOpen size={20} />} 
                label="Templates" 
                active={selectedNav === 'templates'} 
                onClick={() => setSelectedNav('templates')}
              />
              <NavItem 
                icon={<Music size={20} />} 
                label="Audio Library" 
                active={selectedNav === 'audio'} 
                onClick={() => setSelectedNav('audio')}
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
                label="Team Members" 
                active={selectedNav === 'team'} 
                onClick={() => setSelectedNav('team')}
              />
              <NavItem 
                icon={<BarChart2 size={20} />} 
                label="Analytics" 
                active={selectedNav === 'analytics'} 
                onClick={() => setSelectedNav('analytics')}
              />
              <NavItem 
                icon={<Cloud size={20} />} 
                label="Cloud Storage" 
                active={selectedNav === 'cloud'} 
                onClick={() => setSelectedNav('cloud')}
              />
              <NavItem 
                icon={<Settings size={20} />} 
                label="Settings" 
                active={selectedNav === 'settings'} 
                onClick={() => setSelectedNav('settings')}
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
              <div className="hidden md:flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Tutorials</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Templates</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Support</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800/50 transition z-50">
                <HelpCircle size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-purple-500"></span>
              </button>
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm font-medium cursor-pointer border-2 border-transparent hover:border-white transition-all z-50">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                  <div className="p-3 border-b border-gray-800">
                    <div className="font-medium">{user?.fullName || 'User'}</div>
                    <div className="text-sm text-gray-400">{user?.primaryEmailAddress?.emailAddress || 'user@example.com'}</div>
                  </div>
                  <div className="p-2">
                    <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm transition">Profile Settings</a>
                    <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm transition">Subscription</a>
                    <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm transition">Sign Out</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Create New Video Project
              </h1>
              <p className="text-gray-400 mt-2">
                Upload and transform your videos for social media platforms automatically
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div 
                className={`relative border ${selectedOption === 'single' ? 'border-purple-500 bg-purple-900/10' : 'border-gray-800 hover:border-purple-400/40 hover:bg-gray-800/30'} 
                rounded-2xl p-6 transition-all duration-300 cursor-pointer overflow-hidden group z-10`}
                onClick={() => setSelectedOption('single')}
              >
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-xl group-hover:w-60 group-hover:h-60 transition-all duration-500 z-0 pointer-events-none"></div>
                <div className="absolute top-0 right-0 p-4 z-20">
                  {selectedOption === 'single' && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white animate-fadeIn">
                      <CheckCircle size={16} />
                    </div>
                  )}
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl w-14 h-14 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-all duration-300 z-10">
                  <Video className="text-purple-400 group-hover:text-purple-300 transition-all" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-300 transition-colors z-10 relative">Single Video</h3>
                <p className="text-gray-400 mb-4 text-sm z-10 relative">
                  Upload a single video to split into Instagram Reels format with AI-powered editing
                </p>
                <div className="inline-flex items-center text-purple-400 text-sm font-medium z-10 relative">
                  Choose <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                className={`relative border ${selectedOption === 'bulk' ? 'border-blue-500 bg-blue-900/10' : 'border-gray-800 hover:border-blue-400/40 hover:bg-gray-800/30'} 
                rounded-2xl p-6 transition-all duration-300 cursor-pointer overflow-hidden group z-10`}
                onClick={() => setSelectedOption('bulk')}
              >
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-xl group-hover:w-60 group-hover:h-60 transition-all duration-500 z-0 pointer-events-none"></div>
                <div className="absolute top-0 right-0 p-4 z-20">
                  {selectedOption === 'bulk' && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white animate-fadeIn">
                      <CheckCircle size={16} />
                    </div>
                  )}
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl w-14 h-14 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-all duration-300 z-10">
                  <Folder className="text-blue-400 group-hover:text-blue-300 transition-all" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-300 transition-colors z-10 relative">Bulk Upload</h3>
                <p className="text-gray-400 mb-4 text-sm z-10 relative">
                  Process multiple videos at once for different social media platforms
                </p>
                <div className="inline-flex items-center text-blue-400 text-sm font-medium z-10 relative">
                  Choose <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {selectedOption === 'single' && (
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 mb-8 transition-all animate-fadeIn relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-900/30 rounded-full filter blur-3xl animate-pulse"></div>
                  <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-900/30 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                  <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-700/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                  <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-blue-700/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-full filter blur-3xl"></div>
                </div>

                <div className="text-center mb-6 relative z-10">
                  <h2 className="text-2xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">Upload Your Reel</h2>
                  <p className="text-gray-400">Drag and drop your video to create an Instagram Reel with AI enhancements.</p>
                </div>

                <motion.div 
                  className={`border-2 border-dashed rounded-xl py-16 px-8 text-center transition-all relative z-10 ${dragActive ? 'border-purple-500 bg-purple-900/20 shadow-xl shadow-purple-900/40' : 'border-gray-700'}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleVideoUpload} 
                    className="hidden" 
                    ref={videoInputRef}
                  />
                  
                  {!uploadedVideo && (
                    <div>
                      <motion.div 
                        animate={pulseAnimation}
                        className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-full flex items-center justify-center mb-8 relative group"
                      >
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/50 animate-spin-slow z-0 pointer-events-none"></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 opacity-0 group-hover:opacity-100 scale-110 transition-all duration-300 z-0 pointer-events-none"></div>
                        <Upload size={40} className="text-purple-400 group-hover:scale-110 transition-all duration-300 z-10" />
                      </motion.div>
                      <h4 className="text-2xl font-medium mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">Drag your reel here</h4>
                      <p className="text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
                        Upload your video for Instagram Reels. We support vertical format videos (9:16) and other aspect ratios. Your reel will be processed with AI enhancements in minutes.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={triggerVideoInput}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-4 px-10 rounded-lg transition-all shadow-xl shadow-purple-900/30 hover:shadow-purple-900/50 relative overflow-hidden group z-50"
                      >
                        <span className="relative z-10 flex items-center justify-center text-lg">
                          <Zap size={22} className="mr-2" />
                          Select Reel
                        </span>
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/0 via-white/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full z-0 pointer-events-none"></div>
                      </motion.button>
                      <p className="text-xs text-gray-500 mt-6">
                        By uploading, you agree to our Terms of Service
                      </p>
                    </div>
                  )}
                  
                  {uploadedVideo && videoInfo && (
                    <div>
                      <div className="mx-auto w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={28} className="text-green-400" />
                      </div>
                      <p className="text-gray-300 mb-2">Video uploaded successfully</p>
                      <h3 className="text-lg font-medium mb-2">{videoInfo.name}</h3>
                      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 mb-4">
                        <span>Duration: {videoInfo.duration.toFixed(1)}s</span>
                        <span>Resolution: {videoInfo.width}x{videoInfo.height}</span>
                      </div>
                      
                      {!isProcessing && segmentVideos.length === 0 && (
                        <button 
                          onClick={() => splitVideo(videoInfo)}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 flex items-center justify-center mx-auto z-50 relative"
                          disabled={isProcessing}
                        >
                          <Scissors size={18} className="mr-2" />
                          Split into Instagram Reels
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>

                {isProcessing && (
                  <div className="mt-6 animate-fadeIn relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Processing video...</span>
                      <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{message}</p>
                  </div>
                )}

{segmentVideos.length > 0 && activeSegmentIndex < segmentVideos.length && (
  <motion.div 
  key={activeSegmentIndex}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mt-8 bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800 p-6 relative overflow-hidden"
  >
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-900/30 rounded-full filter blur-3xl animate-pulse"></div>
    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-900/30 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
    <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-700/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
    <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-blue-700/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
    
    <div className="flex justify-between items-center mb-6 relative z-10">
      <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
        Instagram Reels Editor
      </h3>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={renderAllSegments}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 px-6 rounded-lg transition-all flex items-center shadow-lg shadow-purple-900/20 disabled:opacity-50 relative overflow-hidden group z-50"
        disabled={isProcessing || isGeneratingSubtitles.some(s => s)}
      >
        <span className="relative z-10 flex items-center">
          <Sparkles size={18} className="mr-2" />
          Render All Segments
        </span>
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/0 via-white/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full"></div>
      </motion.button>
    </div>
    <p className="text-sm text-gray-400 mb-6 relative z-10">
      Edit your {segmentVideos.length} Instagram Reels segments. Add subtitles, customize styles, and prepare for posting.
    </p>

    <div className="flex flex-col md:flex-row gap-6 relative z-10">
      {/* Video Player Side */}
      <div className="w-full md:w-2/5 lg:w-1/3 mx-auto md:mx-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSegmentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden shadow-2xl shadow-purple-900/20"
          >
            <div className="relative bg-black aspect-[9/16] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none"></div>
              <Player
                component={VideoWithSubtitle}
                inputProps={{
                  videoUrl: segmentVideos[activeSegmentIndex].url,
                  subtitles: segmentSubtitles[activeSegmentIndex] || [],
                  styleType: subtitleStyles[activeSegmentIndex] || 'none'
                }}
                durationInFrames={Math.ceil(segmentVideos[activeSegmentIndex].duration * 30)}
                compositionWidth={607}
                compositionHeight={1080}
                fps={30}
                controls
                autoPlay={false}
                loop
                style={{ width: '100%', height: '100%' }}
              />
              <div className="absolute top-4 left-0 right-0 px-4 z-20">
                <h4 className="font-bold text-white text-shadow">Segment {activeSegmentIndex + 1}</h4>
              </div>
              <div className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-between z-20">
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs flex items-center">
                  <Clock size={12} className="mr-1 text-purple-400" />
                  {Math.floor(segmentVideos[activeSegmentIndex].startTime / 60)}:{(segmentVideos[activeSegmentIndex].startTime % 60).toString().padStart(2, '0')} - 
                  {Math.floor((segmentVideos[activeSegmentIndex].startTime + segmentVideos[activeSegmentIndex].duration) / 60)}:{((segmentVideos[activeSegmentIndex].startTime + segmentVideos[activeSegmentIndex].duration) % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center border-t border-gray-700/30">
              <button
                onClick={() => activeSegmentIndex > 0 && setActiveSegmentIndex(activeSegmentIndex - 1)}
                disabled={activeSegmentIndex === 0}
                className={`p-2 rounded-full ${activeSegmentIndex === 0 ? 'text-gray-600' : 'text-white hover:bg-gray-700/50'}`}
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-sm text-gray-400">
                {activeSegmentIndex + 1} / {segmentVideos.length}
              </div>
              <button
                onClick={() => activeSegmentIndex < segmentVideos.length - 1 && setActiveSegmentIndex(activeSegmentIndex + 1)}
                disabled={activeSegmentIndex === segmentVideos.length - 1}
                className={`p-2 rounded-full ${activeSegmentIndex === segmentVideos.length - 1 ? 'text-gray-600' : 'text-white hover:bg-gray-700/50'}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Editing Controls Side */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-medium flex items-center">
            <Edit2 size={20} className="text-purple-400 mr-2" />
            Edit Segment Details
          </h4>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => generateSubtitles(activeSegmentIndex)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-2 px-4 rounded-lg transition-all flex items-center shadow-lg shadow-blue-900/20 disabled:opacity-50"
            disabled={isGeneratingSubtitles[activeSegmentIndex] || isProcessing}
          >
            <Sparkles size={18} className="mr-2" />
            {isGeneratingSubtitles[activeSegmentIndex] ? 'Generating Subtitles...' : 'Generate Subtitles'}
          </motion.button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 rounded-xl border border-gray-700 p-6 shadow-lg"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Segment Title</label>
            <input
              type="text"
              value={segmentMetadata[activeSegmentIndex]?.title || ''}
              onChange={(e) => handleMetadataChange(activeSegmentIndex, 'title', e.target.value)}
              className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder={`Segment ${activeSegmentIndex + 1} Title`}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea
              value={segmentMetadata[activeSegmentIndex]?.description || ''}
              onChange={(e) => handleMetadataChange(activeSegmentIndex, 'description', e.target.value)}
              className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all h-32 resize-none"
              placeholder="Describe your reel segment"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Subtitle Style</label>
            <select
              value={subtitleStyles[activeSegmentIndex] || 'none'}
              onChange={(e) => handleSubtitleStyleChange(activeSegmentIndex, e.target.value)}
              className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              <option value="none">Default</option>
              <option value="hormozi">Alex Hormozi</option>
              <option value="abdaal">Ali Abdaal</option>
              <option value="neonGlow">Neon Glow</option>
              <option value="retroWave">Retro Wave</option>
              <option value="minimalPop">Minimal Pop</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Subtitles</label>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Subtitle text"
                  value={newSubtitle.text}
                  onChange={(e) => setNewSubtitle({ ...newSubtitle, text: e.target.value })}
                  className="col-span-3 bg-gray-900/70 border border-gray-700 rounded-lg p-2 text-sm text-white"
                />
                <input
                  type="number"
                  placeholder="Start (s)"
                  value={newSubtitle.start}
                  onChange={(e) => setNewSubtitle({ ...newSubtitle, start: e.target.value })}
                  className="bg-gray-900/70 border border-gray-700 rounded-lg p-2 text-sm text-white"
                  step="0.1"
                  min="0"
                  max={segmentVideos[activeSegmentIndex].duration}
                />
                <input
                  type="number"
                  placeholder="End (s)"
                  value={newSubtitle.end}
                  onChange={(e) => setNewSubtitle({ ...newSubtitle, end: e.target.value })}
                  className="bg-gray-900/70 border border-gray-700 rounded-lg p-2 text-sm text-white"
                  step="0.1"
                  min="0"
                  max={segmentVideos[activeSegmentIndex].duration}
                />
                <button
                  onClick={() => handleAddSubtitle(activeSegmentIndex)}
                  className="bg-purple-600 hover:bg-purple-500 rounded-lg p-2 text-sm text-white"
                >
                  Add
                </button>
              </div>
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-400 mb-2">Timeline</h5>
                <div className="relative h-8 bg-gray-700 rounded-lg">
                  {segmentSubtitles[activeSegmentIndex]?.map((sub, i) => (
                    <div
                      key={i}
                      className="absolute h-8 bg-purple-500 rounded-lg"
                      style={{
                        left: `${(sub.start / segmentVideos[activeSegmentIndex].duration) * 100}%`,
                        width: `${((sub.end - sub.start) / segmentVideos[activeSegmentIndex].duration) * 100}%`
                      }}
                      title={`${sub.text} (${sub.start.toFixed(1)}s - ${sub.end.toFixed(1)}s)`}
                    />
                  ))}
                </div>
              </div>
              <div className="max-h-40 overflow-auto">
                <h5 className="text-sm font-medium text-gray-400 mb-2">Existing Subtitles</h5>
                {segmentSubtitles[activeSegmentIndex]?.length > 0 ? (
                  segmentSubtitles[activeSegmentIndex].map((sub, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={sub.text}
                        onChange={(e) => handleEditSubtitle(activeSegmentIndex, i, { ...sub, text: e.target.value })}
                        className="flex-1 bg-gray-900/70 border border-gray-700 rounded-lg p-2 text-sm text-white"
                      />
                      <input
                        type="number"
                        value={sub.start}
                        onChange={(e) => handleEditSubtitle(activeSegmentIndex, i, { ...sub, start: e.target.value })}
                        className="w-20 bg-gray-900/70 border border-gray-700 rounded-lg p-2 text-sm text-white"
                        step="0.1"
                        min="0"
                        max={segmentVideos[activeSegmentIndex].duration}
                      />
                      <input
                        type="number"
                        value={sub.end}
                        onChange={(e) => handleEditSubtitle(activeSegmentIndex, i, { ...sub, end: e.target.value })}
                        className="w-20 bg-gray-900/70 border border-gray-700 rounded-lg p-2 text-sm text-white"
                        step="0.1"
                        min="0"
                        max={segmentVideos[activeSegmentIndex].duration}
                      />
                      <button
                        onClick={() => handleDeleteSubtitle(activeSegmentIndex, i)}
                        className="bg-red-600 hover:bg-red-500 rounded-lg p-2 text-sm text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">No subtitles added</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Segment Thumbnails */}
        <div className="mt-6">
          <h5 className="text-sm font-medium text-gray-400 mb-3">All Segments</h5>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {segmentVideos.map((segment, index) => (
              <motion.div
                key={segment.index}
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSegmentIndex(index)}
                className={`relative rounded-lg overflow-hidden cursor-pointer border-2 ${activeSegmentIndex === index ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-transparent'} transition-all`}
              >
                <div className="relative aspect-[9/16] bg-gray-900 overflow-hidden">
                  {segment.thumbnail ? (
                    <img 
                      src={segment.thumbnail} 
                      alt={`Segment ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Video size={24} className="text-gray-600" />
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-black ${activeSegmentIndex === index ? 'opacity-30' : 'opacity-60'} transition-opacity`}></div>
                  {activeSegmentIndex === index && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-purple-600/90 flex items-center justify-center">
                        <Play size={16} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
)}
              </div>
            )}
            
            {selectedOption === 'bulk' && (
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 mb-8 transition-all animate-fadeIn relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-900/30 rounded-full filter blur-3xl animate-pulse"></div>
                  <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-900/30 rounded-full filter blur-3xl animate-pulse"></div>
                </div>
                <div className="text-center mb-6 relative z-10">
                  <h2 className="text-2xl font-semibold mb-2">Bulk Upload</h2>
                  <p className="text-gray-400">Process multiple videos for different social media platforms at once</p>
                </div>
                
                {!bulkUploadComplete ? (
                  <BulkUpload onComplete={() => setBulkUploadComplete(true)} />
                ) : (
                  <div className="text-center py-8 relative z-10">
                    <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={28} className="text-green-400" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Bulk Processing Complete!</h3>
                    <p className="text-gray-400 mb-6">Your videos have been processed and are ready for download</p>
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 z-50 relative">
                      View All Processed Videos
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 transition-all animate-fadeIn relative overflow-hidden">
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-900/30 rounded-full filter blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-900/30 rounded-full filter blur-3xl animate-pulse"></div>
              </div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-2xl font-semibold">Recent Projects</h2>
                <button className="text-sm text-purple-400 hover:text-purple-300 flex items-center z-50 relative">
                  View All <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {recentProjects.map((project, index) => (
                  <div key={index} className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50 hover:border-gray-700 transition-all group">
                    <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={36} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
                      </div>
                      {project.progress < 100 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{project.name}</h4>
                        {project.progress === 100 ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-900/20 text-green-400">Completed</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-900/20 text-purple-400">In Progress</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span className="flex items-center"><Clock size={14} className="mr-1" /> {project.date}</span>
                        <span>Instagram Reels</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}