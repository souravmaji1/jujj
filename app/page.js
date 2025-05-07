'use client'
import { useState, useEffect } from 'react';
import { 
  Play, 
  ChevronDown, 
  ArrowRight,
  Package as Instagram,
  MSquare as Youtube,
  Magnet as TikTok,
  GlassWater as Twitter,
  PackageCheck as Facebook,

  MessageCircle,
  ArrowUpCircle,
  ClockIcon,
  BrainIcon,
  TextIcon,
  CalendarSearch as CalendarIcon,
  BarChart2,

  Users,
  Smartphone,

  Zap,
  CheckCircle,
  Clock,
  Star,

  Sparkles,
  Rocket,
  Command,
  Layers,
  Video,
  PenTool,
  Palette

} from 'lucide-react';


export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('features');
  const [scrolled, setScrolled] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const [activeReel, setActiveReel] = useState(0);
  
  // Example video reel data
  const videoReels = [
    {
      platform: "Instagram",
      src: "/one.mp4", // 9:16 aspect ratio for Instagram
      position: "absolute -top-6 -left-6 w-40 rotate-6"
    },
    {
      platform: "TikTok",
      src: "/two.mp4", // 9:16 aspect ratio for TikTok
      position: "absolute -bottom-4 -right-4 w-40 -rotate-6"
    },
    {
      platform: "YouTube",
      src: "/three.mp4", // 16:9 aspect ratio for YouTube
      position: "absolute top-1/4 -right-10 w-40 rotate-12"
    }
  ];

  // Auto-rotate through reels
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReel((prev) => (prev + 1) % videoReels.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Manual selection of reels
  const selectReel = (index) => {
    setActiveReel(index);
  };

  // Auto-rotate through reels
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReel((prev) => (prev + 1) % videoReels.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Trigger stats animation when scrolled to that section
      const statsSection = document.getElementById('stats-section');
      if (statsSection && window.scrollY + window.innerHeight > statsSection.offsetTop) {
        setAnimateStats(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  const faqs = [
    {
      question: "How does VideoSync revolutionize multi-platform posting?",
      answer: "VideoSync uses cutting-edge AI to transform one video into multiple platform-perfect clips. Our technology analyzes your content, identifies the most engaging segments, and automatically optimizes them for each platform's specific requirements and audience preferences."
    },
    {
      question: "What makes VideoSync different from other video tools?",
      answer: "Unlike basic editing tools, VideoSync combines AI-powered editing, smart framing, automated captions, and cross-platform distribution in one seamless workflow. Our virality prediction algorithm also helps you optimize content for maximum engagement before you even publish."
    },
    {
      question: "Can I customize the AI's decisions?",
      answer: "Absolutely! While our AI makes intelligent suggestions, you have complete creative control. Adjust clip selection, customize captions, add your branding, and fine-tune every aspect before publishing. The AI learns from your preferences over time."
    },
    {
      question: "How much time will VideoSync save me?",
      answer: "Our users report saving 70-80% of their content creation time. What used to take hours of editing and reformatting now happens in minutes, allowing you to focus on creating great content rather than technical adjustments."
    },
    {
      question: "Which platforms does VideoSync support?",
      answer: "We support all major platforms including TikTok, YouTube, Instagram, Facebook, Twitter, LinkedIn, Pinterest, and Snapchat. Our platform continuously adapts to changing platform requirements and new emerging social networks."
    },
    {
      question: "Is there a limit to how many videos I can process?",
      answer: "Free accounts can process up to 5 videos per month with basic features. Our premium plans offer unlimited videos, advanced AI tools, priority processing, and complete analytics. Enterprise plans include custom solutions for teams and agencies."
    },
  ];

  const featuresData = {
    features: [
      {
        title: "Neural Clip Detection",
        description: "Our advanced AI identifies the most engaging moments from your videos using attention mapping technology that predicts viewer engagement.",
        icon: <Sparkles className="text-purple-400" size={24} />,
        image: "/john.webp",
        color: "from-purple-900 to-indigo-900"
      },
      {
        title: "Dynamic Captions",
        description: "Eye-catching animated captions with custom styles that follow your speech perfectly and automatically adapt to each platform's requirements.",
        icon: <MessageCircle className="text-blue-400" size={24} />,
        image: "/kl.webp",
        color: "from-blue-900 to-cyan-900"
      },
      {
        title: "Intelligent Framing",
        description: "Smart reframing that keeps important subjects centered regardless of aspect ratio, ensuring your content looks perfect everywhere.",
        icon: <Smartphone className="text-teal-400" size={24} />,
        image: "/jf.webp",
        color: "from-teal-900 to-emerald-900"
      }
    ],
    creative: [
      {
        title: "AI Scene Enhancement",
        description: "Automatically generate complementary B-Roll footage and visual elements that enhance your storytelling and maintain viewer attention.",
        icon: <Video className="text-rose-400" size={24} />,
        image: "/api/placeholder/500/300",
        color: "from-rose-900 to-pink-900"
      },
      {
        title: "Brand Identity System",
        description: "Create a consistent visual identity with custom intros, outros, overlays, and color schemes that automatically apply to all your content.",
        icon: <Palette className="text-amber-400" size={24} />,
        image: "/api/placeholder/500/300",
        color: "from-amber-900 to-orange-900"
      },
      {
        title: "Creative Enhancement",
        description: "AI-powered tools that suggest visual improvements, transitions, and effects specific to your content type and target audience.",
        icon: <PenTool className="text-green-400" size={24} />,
        image: "/api/placeholder/500/300",
        color: "from-green-900 to-lime-900"
      }
    ],
    growth: [
      {
        title: "Predictive Publishing",
        description: "Our algorithm analyzes platform trends and your audience behavior to determine the perfect publishing time for maximum impact.",
        icon: <Clock className="text-violet-400" size={24} />,
        image: "/api/placeholder/500/300",
        color: "from-violet-900 to-purple-900"
      },
      {
        title: "Cross-Platform Analytics",
        description: "Unified performance metrics that show how your content performs across all platforms with actionable insights to improve engagement.",
        icon: <BarChart2 className="text-cyan-400" size={24} />,
        image: "/api/placeholder/500/300",
        color: "from-cyan-900 to-blue-900"
      },
      {
        title: "Engagement Predictor",
        description: "Our proprietary algorithm analyzes your content before publishing to predict performance and suggest specific improvements for virality.",
        icon: <Zap className="text-yellow-400" size={24} />,
        image: "/api/placeholder/500/300",
        color: "from-yellow-900 to-amber-900"
      }
    ],
    collaboration: [
      {
        title: "Creative Cloud Integration",
        description: "Seamlessly export projects to professional editing software with all adjustments intact for further refinement.",
        icon: <Layers className="text-blue-400" size={24} />,
        image: "/api/placeholder/500/300",
        color: "from-blue-900 to-indigo-900"
      },
      {
        title: "Collaborative Workflow",
        description: "Real-time collaboration features allow teams to work together with role-based permissions and approval systems.",
        icon: <Users className="text-emerald-400" size={24} />,
        image: "/api/placeholder/500/300",
        color: "from-emerald-900 to-green-900"
      },
      {
        title: "Asset Management",
        description: "Centralized library for all your videos, templates, brand assets, and previous projects with smart tagging and search.",
        icon: <Command className="text-pink-400" size={24} />,
        image: "/api/placeholder/500/300",
        color: "from-pink-900 to-rose-900"
      }
    ]
  };

  const stats = [
    { number: "10M+", label: "active creators", icon: <Users className="text-purple-400" size={28} /> },
    { number: "25+", label: "platforms supported", icon: <Smartphone className="text-blue-400" size={28} /> },
    { number: "85%", label: "time saved", icon: <Clock className="text-teal-400" size={28} /> },
    { number: "2.5B+", label: "monthly views", icon: <BarChart2 className="text-rose-400" size={28} /> }
  ];

  const testimonials = [
    {
      quote: "VideoSync transformed my content strategy. I create once and reach my audience everywhere with perfectly optimized videos.",
      author: "Alex Morgan",
      role: "Tech Influencer • 3M+ Followers",
      image: "/api/placeholder/64/64",
      platforms: ["TikTok", "YouTube", "Instagram"]
    },
    {
      quote: "Our agency used to spend days reformatting client videos. Now it's automated, and we deliver 3x the content in half the time.",
      author: "Sarah Chen",
      role: "Digital Marketing Director",
      image: "/api/placeholder/64/64",
      platforms: ["Facebook", "LinkedIn", "Twitter"]
    },
    {
      quote: "The AI caption feature alone saved my team countless hours, and the engagement analytics helped us grow 400% in six months.",
      author: "Marcus Johnson",
      role: "Content Creator • 1.5M Subscribers",
      image: "/api/placeholder/64/64",
      platforms: ["YouTube", "Instagram", "TikTok"]
    }
  ];

  const brands = [
    "Netflix", "Spotify", "Adobe", "TikTok", "Red Bull", "Microsoft", "Shopify", "Electronic Arts"
  ];

  const plans = [
    {
      name: "Creator",
      price: "Free",
      features: [
        "5 videos per month",
        "Basic AI clip creation",
        "Standard captions",
        "3 social platforms",
        "Basic analytics"
      ],
      cta: "Start Free",
      popular: false,
      color: "border-blue-800 hover:border-blue-700"
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      features: [
        "Unlimited videos",
        "Advanced AI editing tools",
        "Animated captions",
        "All social platforms",
        "Engagement predictions",
        "Brand kit integration",
        "Priority processing"
      ],
      cta: "Get Started",
      popular: true,
      color: "border-purple-600 hover:border-purple-500"
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "API access",
        "Custom integrations",
        "Dedicated support",
        "White-label options",
        "Advanced analytics"
      ],
      cta: "Contact Sales",
      popular: false,
      color: "border-teal-800 hover:border-teal-700"
    }
  ];

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-950/95 backdrop-blur-md border-b border-gray-800' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">VideoSync</div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-400 hover:text-white transition">Features</a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition">Testimonials</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a>
            <a href="#faq" className="text-gray-400 hover:text-white transition">FAQ</a>
          </nav>
          <div className="flex space-x-4 items-center">
            <a href="#login" className="text-gray-400 hover:text-white transition">Log in</a>
            <a href="#signup" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full hover:from-purple-600 hover:to-blue-600 transition">Get Started</a>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
    
      
<section className="min-h-screen py-20 relative overflow-hidden flex items-center">
  {/* Background gradients */}
  <div className="absolute inset-0 bg-gray-950"></div>
  <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-purple-900/20 rounded-full blur-3xl"></div>
  <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 bg-blue-900/20 rounded-full blur-3xl"></div>
  
  {/* Grid pattern overlay */}
  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNjAgMEgwdjYwaDYwVjB6IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJNNTkuNSAwdjYwTTAgLjV2NTlNMCAwaDYwTTAgNjBoNjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIvPjwvc3ZnPg==')]"></div>
  
  <div className="container mx-auto px-4 relative z-10">
    <div className="flex flex-col items-center">
      {/* Headline section - centered */}
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-900/50 border border-gray-800 text-sm font-medium mb-4 backdrop-blur-sm">
          <Sparkles size={16} className="mr-2 text-purple-400" />
          <span>Revolutionary AI Video Platform</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          <span className="block">One video.</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400">Infinite potential.</span>
        </h1>
        <p className="text-gray-300 text-xl mb-8">
          Transform your content into platform-perfect videos for every social network. Create once, distribute everywhere with AI-powered optimization.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <a href="/create" className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-full hover:from-purple-600 hover:to-blue-600 transition font-medium flex items-center justify-center">
            <span>Start Creating Free</span>
            <ArrowRight size={18} className="ml-2" />
          </a>
          <a href="#demo" className="w-full sm:w-auto flex items-center justify-center text-white px-6 py-4 rounded-full bg-gray-900/50 border border-gray-800 hover:bg-gray-800/50 transition backdrop-blur-sm">
            <Play size={18} className="mr-2" />
            <span>Watch Demo</span>
          </a>
        </div>
      </div>

      {/* Extra large single featured video */}
      <div className="w-full max-w-4xl mx-auto relative">
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-800 shadow-2xl">
          {/* Main video with 16:9 aspect ratio */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <video 
              autoPlay 
              muted 
              loop 
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src="one.mp4"
            />
            
            {/* Stylish overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            
            {/* Platform transformation animations */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <div className="flex items-center px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-sm font-semibold border border-gray-700">
                <Instagram size={16} className="mr-2 text-pink-400" />
                <span>Reels</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-sm font-semibold border border-gray-700">
                <TikTok size={16} className="mr-2 text-teal-400" />
                <span>TikTok</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-sm font-semibold border border-gray-700">
                <Youtube size={16} className="mr-2 text-red-400" />
                <span>Shorts</span>
              </div>
            </div>
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center group">
              <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/20 transition transform group-hover:scale-110 duration-300">
                <Play size={40} className="text-white ml-2" />
              </div>
            </div>
            
            {/* Dynamic caption simulation */}
            <div className="absolute bottom-8 inset-x-0 px-8">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
                <div className="text-2xl font-semibold mb-2">
                  Create once. Share <span className="text-purple-400">everywhere</span>.
                </div>
                <div className="text-gray-300">
                  VideoSync optimizes your content for every platform automatically
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video transformation indicators */}
        <div className="flex justify-center mt-8 space-x-6">
          <div className="text-center">
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-2"></div>
            <span className="text-sm text-gray-400">Auto-crops</span>
          </div>
          <div className="text-center">
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-2"></div>
            <span className="text-sm text-gray-400">Smart captions</span>
          </div>
          <div className="text-center">
            <div className="w-16 h-1 bg-gradient-to-r from-teal-500 to-green-500 rounded-full mx-auto mb-2"></div>
            <span className="text-sm text-gray-400">Platform optimization</span>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -z-10 -bottom-20 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -z-10 -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  </div>
</section>

        {/* Brands Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <p className="text-center text-gray-500 mb-8">Trusted by leading creators and brands</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
              {brands.map((brand, index) => (
                <div key={index} className="text-gray-400 hover:text-gray-300 transition">
                  <div className="text-lg font-medium">{brand}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tab Features Section */}
        <section id="features" className="py-24 relative overflow-hidden">
          <div className="absolute top-1/4 left-0 w-1/3 h-1/3 bg-purple-900/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-0 w-1/3 h-1/3 bg-blue-900/20 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Supercharge</span> your video workflow
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Create platform-perfect content in minutes, not hours. Our AI-powered tools handle the technical work so you can focus on creativity.
              </p>
            </div>
            
            {/* Feature Tabs */}
            <div className="mb-12">
              <div className="flex flex-wrap justify-center space-x-2 md:space-x-4">
                {Object.keys(featuresData).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-sm md:text-base transition-all duration-200 ${
                      activeTab === tab 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium' 
                        : 'bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {featuresData[activeTab].map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition group"
                >
                  <div className={`h-48 bg-gradient-to-br ${feature.color} relative overflow-hidden`}>
                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 bg-gray-900/70 backdrop-blur-sm p-2 rounded-lg border border-gray-800">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 relative overflow-hidden">
  {/* Animated background with particles */}
  <div className="absolute inset-0">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-indigo-950/30 to-gray-950"></div>
    <div className="hidden md:block">
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full bg-blue-500/20 blur-3xl"
          style={{
            width: `${Math.random() * 400 + 100}px`,
            height: `${Math.random() * 400 + 100}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.3,
            animationDuration: `${Math.random() * 20 + 10}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}
    </div>
  </div>
  
  <div className="container mx-auto px-4 relative z-10">
    <div className="text-center mb-20">
      <div className="inline-block mb-3">
        <div className="flex items-center justify-center space-x-2 bg-gray-900/70 backdrop-blur-sm px-4 py-1 rounded-full border border-purple-500/30">
          <span className="animate-pulse w-2 h-2 rounded-full bg-purple-400"></span>
          <span className="text-purple-300 text-sm font-medium">Revolutionary Process</span>
        </div>
      </div>
      <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
        Experience the 
        <span className="relative ml-3 inline-block">
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400">VideoSync</span>
          <span className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-teal-500/20 blur-sm"></span>
        </span> 
        <span className="block mt-2">Magic</span>
      </h2>
      <p className="text-gray-400 text-xl max-w-2xl mx-auto">
        Transform your content into platform-perfect videos with three simple steps
      </p>
    </div>
    
    {/* 3D Tilted Cards Process */}
    <div className="relative">
      {/* Glowing connection line */}
      <div className="absolute hidden lg:block left-1/2 top-12 bottom-12 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-teal-500 -translate-x-1/2">
        <div className="absolute top-0 left-1/2 w-12 h-24 -translate-x-1/2 bg-purple-500/30 blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 w-12 h-24 -translate-x-1/2 -translate-y-1/2 bg-blue-500/30 blur-2xl"></div>
        <div className="absolute bottom-0 left-1/2 w-12 h-24 -translate-x-1/2 bg-teal-500/30 blur-2xl"></div>
      </div>
      
      {/* Process Steps */}
      <div className="space-y-40 md:space-y-56 relative">
        {/* Step 1 */}
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-5/12 flex justify-end order-2 lg:order-1 mt-8 lg:mt-0">
            <div className="group perspective">
              <div className="relative transform transition-all duration-700 group-hover:rotate-y-12 group-hover:-rotate-x-12">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-gray-900 rounded-2xl p-2 shadow-2xl backdrop-blur-sm border border-gray-800">
                  <div className="overflow-hidden rounded-xl">
                    <img 
                      src="/ghibli.jpg" 
                      alt="Upload Video" 
                      className="w-full h-auto transform transition duration-700 group-hover:scale-110" 
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                      <span className="text-purple-300 text-sm">Compatible with all formats</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/12 flex justify-center mb-8 lg:mb-0 order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-6 bg-purple-500/20 rounded-full blur-lg animate-pulse-slow"></div>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-2xl font-bold relative z-10 shadow-lg shadow-purple-500/30">
                1
              </div>
            </div>
          </div>
          
          <div className="lg:w-5/12 order-3">
            <div className="max-w-md group">
              <h3 className="text-3xl font-bold mb-4 flex items-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  Upload your video
                </span>
                <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <ArrowUpCircle size={24} className="text-purple-400 animate-bounce" />
                </span>
              </h3>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                Drop your masterpiece onto our platform and watch the transformation begin. 
                We handle everything from quick TikTok clips to cinematic long-form content in any format.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-purple-300 bg-purple-900/20 p-3 rounded-lg border border-purple-500/20">
                  <CheckCircle size={20} className="mr-3 text-purple-400" />
                  <span>4K, 8K, vertical, horizontal—we support it all</span>
                </div>
                <div className="flex items-center text-purple-300 bg-purple-900/20 p-3 rounded-lg border border-purple-500/20">
                  <ClockIcon size={20} className="mr-3 text-purple-400" />
                  <span>Uploads complete in seconds, not minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 2 */}
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-5/12 order-3 lg:order-1">
            <div className="max-w-md lg:ml-auto group">
              <h3 className="text-3xl font-bold mb-4 flex items-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                  AI transforms your content
                </span>
                <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <Sparkles size={24} className="text-blue-400 animate-ping" style={{animationDuration: '3s'}} />
                </span>
              </h3>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                Our proprietary AI doesnt just clip your video—it understands it. Identifying key moments, 
                perfect transitions, and optimal framing for each platform automatically.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-blue-300 bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                  <BrainIcon size={20} className="mr-3 text-blue-400" />
                  <span>Smart moment detection finds viral-worthy clips</span>
                </div>
                <div className="flex items-center text-blue-300 bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                  <TextIcon size={20} className="mr-3 text-blue-400" />
                  <span>Auto-generated captions with perfect timing</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/12 flex justify-center mb-8 lg:mb-0 order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-6 bg-blue-500/20 rounded-full blur-lg animate-pulse-slow"></div>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-2xl font-bold relative z-10 shadow-lg shadow-blue-500/30">
                2
              </div>
            </div>
          </div>
          
          <div className="lg:w-5/12 flex justify-start order-2 lg:order-3 mt-8 lg:mt-0">
            <div className="group perspective">
              <div className="relative transform transition-all duration-700 group-hover:rotate-y-12 group-hover:rotate-x-12">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-gray-900 rounded-2xl p-2 shadow-2xl backdrop-blur-sm border border-gray-800">
                  <div className="overflow-hidden rounded-xl relative">
                    <img 
                      src="/kl.webp" 
                      alt="AI Processing" 
                      className="w-full h-auto transform transition duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-teal-600/30 mix-blend-overlay"></div>
                    
                    {/* Animated overlay elements */}
                    <div className="absolute inset-0">
                      {/* Simulated AI analysis markers */}
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i}
                          className="absolute w-12 h-12 border-2 border-blue-400/70 rounded"
                          style={{
                            left: `${Math.random() * 70 + 10}%`,
                            top: `${Math.random() * 70 + 10}%`,
                            transform: 'translate(-50%, -50%)',
                            opacity: 0,
                            animation: `fadeInOut 3s ${i * 0.5}s infinite`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                      <span className="text-blue-300 text-sm">Advanced AI processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 3 */}
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-5/12 flex justify-end order-2 lg:order-1 mt-8 lg:mt-0">
            <div className="group perspective">
              <div className="relative transform transition-all duration-700 group-hover:-rotate-y-12 group-hover:-rotate-x-12">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-gray-900 rounded-2xl p-2 shadow-2xl backdrop-blur-sm border border-gray-800">
                  <div className="overflow-hidden rounded-xl relative">
                    <img 
                      src="/john.webp" 
                      alt="Publish Everywhere" 
                      className="w-full h-auto transform transition duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-600/30 to-emerald-600/30 mix-blend-overlay"></div>
                    
                    {/* Platform icons */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="grid grid-cols-3 gap-6">
                        {['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin'].map((platform, i) => (
                          <div 
                            key={platform}
                            className="w-12 h-12 bg-gray-900/80 rounded-full flex items-center justify-center"
                            style={{
                              animation: `float 3s ${i * 0.2}s infinite ease-in-out`
                            }}
                          >
                            <span className="text-teal-300 text-xl">{platform[0].toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                      <span className="text-teal-300 text-sm">Multi-platform publishing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/12 flex justify-center mb-8 lg:mb-0 order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-6 bg-teal-500/20 rounded-full blur-lg animate-pulse-slow"></div>
              <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold relative z-10 shadow-lg shadow-teal-500/30">
                3
              </div>
            </div>
          </div>
          
          <div className="lg:w-5/12 order-3">
            <div className="max-w-md group">
              <h3 className="text-3xl font-bold mb-4 flex items-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                  Publish everywhere
                </span>
                <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <Rocket size={24} className="text-teal-400 animate-float" />
                </span>
              </h3>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                One-click publishing to all major platforms. Our intelligent scheduling ensures your content 
                drops at peak engagement times, maximizing your reach and impact.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-teal-300 bg-teal-900/20 p-3 rounded-lg border border-teal-500/20">
                  <CalendarIcon size={20} className="mr-3 text-teal-400" />
                  <span>AI-powered optimal posting schedule</span>
                </div>
                <div className="flex items-center text-teal-300 bg-teal-900/20 p-3 rounded-lg border border-teal-500/20">
                  <BarChart2 size={20} className="mr-3 text-teal-400" />
                  <span>Comprehensive analytics across platforms</span>
                </div>
              </div>
              <div className="mt-8">
                <button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium py-3 px-6 rounded-lg shadow-lg shadow-teal-500/30 transform transition hover:-translate-y-1 duration-300 flex items-center">
                  <span>Start publishing today</span>
                  <ArrowRight size={18} className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Add CSS for animations */}
    <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes pulse-slow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }
      
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
      }
      
      .perspective {
        perspective: 1000px;
      }
      
      .rotate-y-12 {
        transform: rotateY(12deg);
      }
      
      .rotate-x-12 {
        transform: rotateX(12deg);
      }
      
      .-rotate-y-12 {
        transform: rotateY(-12deg);
      }
      
      .-rotate-x-12 {
        transform: rotateX(-12deg);
      }
      
      .animate-float {
        animation: float 3s infinite ease-in-out;
      }
      
      .animate-pulse-slow {
        animation: pulse-slow 4s infinite ease-in-out;
      }
    `}</style>
  </div>
</section>

        {/* Stats Section */}
        <section id="stats-section" className="py-16 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 text-center transform hover:scale-105 transition duration-300"
                >
                  <div className="flex justify-center mb-4">
                    {stat.icon}
                  </div>
                  <div className={`text-3xl md:text-4xl font-bold mb-2 ${animateStats ? 'animate-count-up' : ''}`}>
                    {stat.number}
                  </div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Support Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-1/3 right-0 w-1/3 h-1/3 bg-purple-900/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 left-0 w-1/3 h-1/3 bg-blue-900/20 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                One video, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">every platform</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Automatically transform your content into the perfect format for each platform
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 flex flex-col items-center hover:border-purple-500 transition">
                <TikTok size={36} className="text-purple-400 mb-3" />
                <h3 className="font-medium text-lg">TikTok</h3>
                <p className="text-gray-500 text-sm text-center mt-2">9:16 vertical format with trending elements</p>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 flex flex-col items-center hover:border-blue-500 transition">
                <Youtube size={36} className="text-blue-400 mb-3" />
                <h3 className="font-medium text-lg">YouTube</h3>
                <p className="text-gray-500 text-sm text-center mt-2">16:9 widescreen with chapters & cards</p>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 flex flex-col items-center hover:border-pink-500 transition">
                <Instagram size={36} className="text-pink-400 mb-3" />
                <h3 className="font-medium text-lg">Instagram</h3>
                <p className="text-gray-500 text-sm text-center mt-2">Reels, carousel posts & stories</p>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 flex flex-col items-center hover:border-cyan-500 transition">
                <Twitter size={36} className="text-cyan-400 mb-3" />
                <h3 className="font-medium text-lg">Twitter</h3>
                <p className="text-gray-500 text-sm text-center mt-2">Captivating videos with text overlays</p>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 flex flex-col items-center hover:border-teal-500 transition">
                <Facebook size={36} className="text-teal-400 mb-3" />
                <h3 className="font-medium text-lg">Facebook</h3>
                <p className="text-gray-500 text-sm text-center mt-2">Feed videos & stories optimized for engagement</p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-400 mb-6">And many more platforms supported...</p>
              <a href="#all-platforms" className="inline-flex items-center text-purple-400 hover:text-purple-300 transition">
                <span>See all supported platforms</span>
                <ArrowRight size={16} className="ml-2" />
              </a>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"></div>
          <div className="absolute top-1/2 left-1/4 w-1/2 h-1/2 bg-purple-900/20 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">creators worldwide</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Join thousands of content creators who are saving time and growing their audience
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-8 hover:border-purple-500 transition">
                  <div className="flex items-start mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} className="text-yellow-400 mr-1" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-6">{testimonial.quote}</blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border border-gray-700">
                      <img src={testimonial.image} alt={testimonial.author} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-medium">{testimonial.author}</h4>
                      <p className="text-gray-400 text-sm">{testimonial.role}</p>
                      <div className="flex mt-2 space-x-2">
                        {testimonial.platforms.map((platform, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-300">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 relative overflow-hidden">
          <div className="absolute top-1/3 left-0 w-1/3 h-1/3 bg-purple-900/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-0 w-1/3 h-1/3 bg-blue-900/20 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Simple pricing</span>, powerful results
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Choose the plan that fits your needs. No hidden fees or complicated tiers.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <div key={index} className={`bg-gray-900/50 backdrop-blur-sm rounded-xl border-2 ${plan.color} p-8 transform ${plan.popular ? 'scale-105 relative z-10' : ''} transition duration-300 hover:translate-y-[-8px]`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-gray-400">{plan.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a 
                    href="#signup" 
                    className={`block w-full py-3 rounded-lg text-center font-medium transition 
                    ${plan.popular 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                  >
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-400">
                Need a custom solution for your enterprise? <a href="#contact" className="text-purple-400 hover:text-purple-300">Contact our sales team</a>
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Frequently asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">questions</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Everything you need to know about VideoSync and how it works
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="mb-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden transition"
                >
                  <button 
                    onClick={() => toggleFaq(index)} 
                    className="w-full flex justify-between items-center p-6 text-left font-medium text-lg focus:outline-none"
                  >
                    {faq.question}
                    <ChevronDown 
                      size={20} 
                      className={`transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  <div 
                    className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${
                      openFaq === index ? 'max-h-96 pb-6' : 'max-h-0'
                    }`}
                  >
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-400 mb-6">
                Still have questions? Were here to help!
              </p>
              <a href="#contact" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:from-purple-600 hover:to-blue-600 transition">
                <MessageCircle size={18} className="mr-2" />
                <span>Contact Support</span>
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-blue-900/30"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNjAgMEgwdjYwaDYwVjB6IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJNNTkuNSAwdjYwTTAgLjV2NTlNMCAwaDYwTTAgNjBoNjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIvPjwvc3ZnPg==')]"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto bg-gray-900/70 backdrop-blur-lg rounded-2xl border border-gray-800 p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to transform your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">content strategy?</span>
                </h2>
                <p className="text-gray-300 text-lg">
                  Join thousands of creators saving time and growing their audience across every platform.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <a href="#signup" className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition font-medium">
                  <span>Start Creating Free</span>
                  <ArrowRight size={18} className="ml-2" />
                </a>
                <a href="#demo" className="inline-flex items-center justify-center px-8 py-4 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition">
                  <Play size={18} className="mr-2" />
                  <span>Watch Demo</span>
                </a>
              </div>
              
              <div className="mt-8 text-center text-gray-400 text-sm">
                No credit card required. Free plan includes 5 videos per month.
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4">VideoSync</div>
              <p className="text-gray-400 mb-4 max-w-md">
                Transform your content creation process with AI-powered video optimization for every social platform.
              </p>
              <div className="flex space-x-4">
                <a href="#twitter" className="text-gray-400 hover:text-white transition">
                  <Twitter size={20} />
                </a>
                <a href="#instagram" className="text-gray-400 hover:text-white transition">
                  <Instagram size={20} />
                </a>
                <a href="#youtube" className="text-gray-400 hover:text-white transition">
                  <Youtube size={20} />
                </a>
                <a href="#tiktok" className="text-gray-400 hover:text-white transition">
                  <TikTok size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                <li><a href="#integrations" className="text-gray-400 hover:text-white transition">Integrations</a></li>
                <li><a href="#enterprise" className="text-gray-400 hover:text-white transition">Enterprise</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#blog" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#guides" className="text-gray-400 hover:text-white transition">Guides</a></li>
                <li><a href="#help" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#events" className="text-gray-400 hover:text-white transition">Events</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white transition">About</a></li>
                <li><a href="#careers" className="text-gray-400 hover:text-white transition">Careers</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition">Contact</a></li>
                <li><a href="#press" className="text-gray-400 hover:text-white transition">Press</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} VideoSync. All rights reserved.
            </div>
            <div className="flex space-x-4 text-sm">
              <a href="#terms" className="text-gray-500 hover:text-white transition">Terms</a>
              <a href="#privacy" className="text-gray-500 hover:text-white transition">Privacy</a>
              <a href="#cookies" className="text-gray-500 hover:text-white transition">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}