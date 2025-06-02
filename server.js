// Enhanced server.js with Free AI Integration

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Simple storage
let users = [];
let briefs = [];
let userCredits = new Map();

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'BrieflyAI Backend is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    users: users.length,
    briefs: briefs.length,
    timestamp: new Date().toISOString()
  });
});

// Enhanced auth with validation
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, referralCode } = req.body;
  
  console.log(`📝 Registration attempt: ${email}`);
  
  // Server-side validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid email is required' 
    });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 6 characters long' 
    });
  }
  
  if (!name || name.length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'Full name is required' 
    });
  }
  
  // Check if user exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    console.log(`❌ User already exists: ${email}`);
    return res.status(400).json({ 
      success: false, 
      message: 'User already exists with this email' 
    });
  }
  
  // Create user
  const userId = Date.now().toString();
  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password, // In production, hash this
    createdAt: new Date(),
    plan: 'free'
  };
  
  users.push(newUser);
  
  // Give credits
  let credits = 5; // Default 5 free credits
  if (referralCode && referralCode.trim()) {
    credits += 5; // Bonus for referral
  }
  userCredits.set(userId, credits);
  
  console.log(`✅ User registered: ${email} with ${credits} credits`);
  
  res.json({ 
    success: true, 
    user: { id: userId, name: name.trim(), email: email.trim().toLowerCase(), plan: 'free' },
    credits,
    token: `token_${userId}`
  });
});

// Enhanced login with validation
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log(`🔐 Login attempt: ${email}`);
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }
  
  const user = users.find(u => u.email === email.toLowerCase() && u.password === password);
  if (!user) {
    console.log(`❌ Invalid credentials: ${email}`);
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
  }
  
  const credits = userCredits.get(user.id) || 0;
  
  console.log(`✅ User logged in: ${email} with ${credits} credits`);
  
  res.json({ 
    success: true, 
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    credits,
    token: `token_${user.id}`
  });
});

// ENHANCED AI-POWERED BRIEF GENERATION
app.post('/api/briefs/generate', async (req, res) => {
  const { formData } = req.body;
  const authHeader = req.headers.authorization;
  
  console.log(`🚀 AI brief generation attempt`);
  
  if (!authHeader || !authHeader.startsWith('Bearer token_')) {
    console.log(`❌ No auth header provided`);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  const userId = authHeader.replace('Bearer token_', '');
  const credits = userCredits.get(userId) || 0;
  
  console.log(`💳 User ${userId} has ${credits} credits`);
  
  if (credits < 1) {
    console.log(`❌ Insufficient credits for user ${userId}`);
    return res.status(400).json({ 
      success: false, 
      message: 'Insufficient credits. You need at least 1 credit to generate a brief.' 
    });
  }
  
  // Deduct credit
  userCredits.set(userId, credits - 1);
  
  try {
    // Generate AI-enhanced brief
    const brief = await generateAIBrief(formData);
    brief.userId = userId;
    brief.createdAt = new Date();
    
    briefs.push(brief);
    
    console.log(`✅ AI brief generated for user ${userId}. Credits remaining: ${credits - 1}`);
    
    res.json({ 
      success: true, 
      data: brief,
      creditsRemaining: credits - 1
    });
  } catch (error) {
    // Refund credit on error
    userCredits.set(userId, credits);
    console.error('❌ Brief generation failed:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Brief generation failed. Please try again.' 
    });
  }
});

// Your existing endpoint (keep working)
app.post('/api/generate-brief', async (req, res) => {
  console.log(`🚀 Generating brief: ${req.body.clientName} - ${req.body.projectType}`);
  
  try {
    const brief = await generateAIBrief(req.body);
    briefs.push(brief);
    
    console.log(`✅ Brief generated successfully`);
    res.json({ success: true, brief });
  } catch (error) {
    console.error('❌ Brief generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Brief generation failed' 
    });
  }
});

// AI-ENHANCED BRIEF GENERATION FUNCTION
async function generateAIBrief(formData) {
  const { clientName, projectType, budget, timeline, goals, requirements, targetAudience, brandPersonality } = formData;
  
  // Get category-specific templates and AI suggestions
  const categoryData = getCategorySpecificData(projectType);
  const colorSuggestions = generateColorSuggestions(projectType, brandPersonality);
  const fontSuggestions = generateFontSuggestions(projectType, brandPersonality);
  const aiContent = await generateAIContent(formData);
  
  const brief = {
    id: Date.now(),
    title: `${projectType} Brief for ${clientName}`,
    summary: aiContent.summary,
    sections: {
      executiveSummary: {
        title: 'Executive Summary',
        content: aiContent.executiveSummary,
        keyPoints: [
          `Project Type: ${projectType}`,
          `Client: ${clientName}`,
          `Timeline: ${timeline || '2 weeks'}`,
          `Budget: ₦${budget?.toLocaleString() || 'TBD'}`,
          `Target Audience: ${targetAudience || 'To be defined'}`
        ]
      },
      clientInfo: {
        title: 'Client Information',
        clientName,
        contactInfo: { email: formData.clientEmail },
        businessProfile: { targetAudience: targetAudience || 'To be defined' }
      },
      projectOverview: {
        title: 'Project Overview',
        content: aiContent.projectOverview,
        objectives: aiContent.objectives
      },
      deliverables: {
        title: 'Deliverables',
        primaryDeliverables: categoryData.primaryDeliverables,
        secondaryDeliverables: categoryData.secondaryDeliverables,
        technicalSpecs: categoryData.technicalSpecs
      },
      designDirection: {
        title: 'Design Direction',
        colorPalette: colorSuggestions,
        typography: fontSuggestions,
        styleGuide: aiContent.styleGuide,
        visualReference: categoryData.visualReference
      },
      timeline: {
        title: 'Project Timeline',
        totalDuration: timeline || categoryData.defaultTimeline,
        phases: categoryData.phases,
        milestones: categoryData.milestones
      },
      budget: {
        title: 'Project Budget',
        totalBudget: budget || categoryData.suggestedBudget,
        breakdown: generateBudgetBreakdown(budget || categoryData.suggestedBudget, projectType)
      },
      success: {
        title: 'Success Metrics',
        kpis: aiContent.successMetrics,
        deliveryChecklist: categoryData.deliveryChecklist
      }
    },
    formData,
    aiEnhanced: true,
    categoryData: projectType
  };
  
  return brief;
}

// FREE AI CONTENT GENERATION (Using templates with smart logic)
async function generateAIContent(formData) {
  const { clientName, projectType, goals, requirements, targetAudience, brandPersonality } = formData;
  
  // Smart content generation based on inputs
  const summary = `Professional ${projectType} project for ${clientName}. ${goals ? 'Focused on ' + goals.substring(0, 100) + '...' : 'Comprehensive design solution tailored to achieve business objectives and create lasting brand impact.'}`;
  
  const executiveSummary = `This ${projectType} project for ${clientName} represents a strategic design initiative aimed at ${goals || 'establishing a strong brand presence and achieving business objectives'}. 
  
With a focus on ${targetAudience || 'target market engagement'} and embodying a ${brandPersonality || 'professional and trustworthy'} brand personality, this project will deliver ${projectType.toLowerCase()} solutions that not only meet immediate business needs but also position ${clientName} for long-term success in their market.

${requirements ? 'Key requirements include: ' + requirements.substring(0, 200) + '...' : 'The project will follow industry best practices and incorporate modern design principles to ensure maximum impact and effectiveness.'}`;

  const projectOverview = `${requirements || `This ${projectType} project will deliver comprehensive design solutions that align with ${clientName}'s brand vision and business objectives.`}

The project scope encompasses strategic planning, creative development, and technical execution to ensure deliverables that exceed expectations. Our approach combines industry expertise with innovative design thinking to create solutions that resonate with ${targetAudience || 'the target audience'} and drive meaningful business results.

Key focus areas include brand consistency, user experience optimization, and scalable design systems that will serve ${clientName} well into the future.`;

  const objectives = [
    `Deliver exceptional ${projectType.toLowerCase()} that exceeds client expectations`,
    `Create designs that resonate with ${targetAudience || 'target audience'}`,
    `Establish strong brand recognition and market presence`,
    `Ensure scalability and long-term brand consistency`,
    `Provide comprehensive documentation and guidelines`
  ];

  const styleGuide = `Design approach will embody ${brandPersonality || 'professional and modern'} characteristics through carefully selected visual elements. The overall aesthetic will balance contemporary design trends with timeless appeal, ensuring longevity and broad market appeal.

Visual hierarchy will be established through strategic use of typography, color, and spacing to guide user attention and improve overall experience. All design elements will work cohesively to reinforce ${clientName}'s brand message and values.`;

  const successMetrics = [
    'Brand recognition increase of 40%+ within 6 months',
    'User engagement improvement of 25%+',
    'Client satisfaction score of 95%+',
    'On-time delivery within agreed timeline',
    'Design consistency across all brand touchpoints'
  ];

  return {
    summary,
    executiveSummary,
    projectOverview,
    objectives,
    styleGuide,
    successMetrics
  };
}

// CATEGORY-SPECIFIC DATA
function getCategorySpecificData(projectType) {
  const categories = {
    'Logo Design': {
      primaryDeliverables: [
        'Primary logo design (full color)',
        'Logo variations (horizontal, vertical, icon-only)',
        'Black and white versions',
        'Reversed/knockout versions for dark backgrounds',
        'Vector files (AI, EPS, SVG)',
        'Raster files (PNG, JPG) in multiple resolutions'
      ],
      secondaryDeliverables: [
        'Social media profile optimized versions',
        'Favicon and app icon versions',
        'Watermark versions',
        'Brand style guide (10-15 pages)',
        'Usage guidelines document'
      ],
      technicalSpecs: [
        'Minimum size: 16px × 16px (favicon)',
        'Maximum scalability: Billboard size',
        'Color modes: CMYK, RGB, Pantone',
        'File formats: AI, EPS, SVG, PNG, JPG, PDF'
      ],
      phases: [
        { phase: 'Discovery & Research', duration: '2-3 days', description: 'Brand research, competitor analysis, and client consultation' },
        { phase: 'Concept Development', duration: '3-5 days', description: 'Initial logo concepts and design exploration' },
        { phase: 'Refinement', duration: '2-3 days', description: 'Client feedback implementation and design refinements' },
        { phase: 'Finalization', duration: '1-2 days', description: 'Final file preparation and documentation delivery' }
      ],
      milestones: [
        'Research completion and insights presentation',
        'Initial concepts presentation (3-5 options)',
        'Refined design approval',
        'Final files and guidelines delivery'
      ],
      defaultTimeline: '2 weeks',
      suggestedBudget: 75000,
      visualReference: 'Clean, memorable, scalable design that works across all applications',
      deliveryChecklist: [
        'All file formats delivered',
        'Style guide completed',
        'Usage examples provided',
        'Client training completed'
      ]
    },
    'Website Design': {
      primaryDeliverables: [
        'Homepage design mockup',
        '5-7 interior page designs',
        'Mobile responsive layouts',
        'Interactive prototype',
        'Style guide and component library',
        'Developer handoff package'
      ],
      secondaryDeliverables: [
        'User flow diagrams',
        'Wireframes and site architecture',
        'Icon set and imagery guidelines',
        'Animation and interaction specifications',
        'SEO optimization guidelines'
      ],
      technicalSpecs: [
        'Responsive breakpoints: 320px, 768px, 1024px, 1440px',
        'Page load speed: <3 seconds',
        'Browser compatibility: Chrome, Firefox, Safari, Edge',
        'Accessibility: WCAG 2.1 AA compliance'
      ],
      phases: [
        { phase: 'Planning & Research', duration: '3-5 days', description: 'User research, site architecture, and content strategy' },
        { phase: 'Design Development', duration: '1-2 weeks', description: 'Visual design and page layouts creation' },
        { phase: 'Prototype & Testing', duration: '3-5 days', description: 'Interactive prototype and user testing' },
        { phase: 'Finalization', duration: '2-3 days', description: 'Final assets and developer documentation' }
      ],
      milestones: [
        'Site architecture approval',
        'Homepage design approval',
        'Full site design completion',
        'Prototype testing and final delivery'
      ],
      defaultTimeline: '1 month',
      suggestedBudget: 250000,
      visualReference: 'Modern, user-friendly interface with intuitive navigation and engaging visuals',
      deliveryChecklist: [
        'All page designs completed',
        'Responsive layouts verified',
        'Prototype tested and approved',
        'Developer documentation provided'
      ]
    },
    'Brand Identity': {
      primaryDeliverables: [
        'Logo design and complete variation suite',
        'Color palette with psychological considerations',
        'Typography system (primary and secondary fonts)',
        'Business stationery design package',
        'Brand guidelines manual (30-50 pages)',
        'Marketing collateral templates'
      ],
      secondaryDeliverables: [
        'Social media brand templates',
        'Email signature designs',
        'Brand photography style guide',
        'Voice and tone guidelines',
        'Brand application examples'
      ],
      technicalSpecs: [
        'Logo scalability: Business card to billboard',
        'Color specifications: Pantone, CMYK, RGB, HEX',
        'Typography licensing and web font setup',
        'Print specifications and color profiles'
      ],
      phases: [
        { phase: 'Brand Strategy', duration: '1 week', description: 'Brand positioning, personality, and strategy development' },
        { phase: 'Visual Identity', duration: '2 weeks', description: 'Logo, colors, typography, and visual system creation' },
        { phase: 'Brand Applications', duration: '1 week', description: 'Applying brand to various materials and touchpoints' },
        { phase: 'Guidelines & Training', duration: '3-5 days', description: 'Brand manual creation and team training' }
      ],
      milestones: [
        'Brand strategy approval',
        'Visual identity system approval',
        'Application designs completed',
        'Brand manual and training delivered'
      ],
      defaultTimeline: '2 months',
      suggestedBudget: 500000,
      visualReference: 'Cohesive brand system that tells a compelling story and differentiates in the market',
      deliveryChecklist: [
        'Complete brand manual delivered',
        'All brand applications completed',
        'Team training conducted',
        'Brand launch strategy provided'
      ]
    }
  };
  
  return categories[projectType] || categories['Logo Design'];
}

// COLOR SUGGESTIONS BASED ON CATEGORY AND PERSONALITY
function generateColorSuggestions(projectType, brandPersonality) {
  const colorPsychology = {
    'Logo Design': {
      'professional': ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6'],
      'modern': ['#3498DB', '#9B59B6', '#E74C3C', '#F39C12'],
      'trustworthy': ['#2980B9', '#27AE60', '#16A085', '#8E44AD'],
      'creative': ['#E67E22', '#E91E63', '#9C27B0', '#FF5722'],
      'default': ['#2C3E50', '#3498DB', '#E74C3C', '#F39C12']
    },
    'Website Design': {
      'professional': ['#1A202C', '#2D3748', '#4A5568', '#718096'],
      'modern': ['#667EEA', '#764BA2', '#F093FB', '#F5576C'],
      'trustworthy': ['#4299E1', '#38B2AC', '#68D391', '#9F7AEA'],
      'creative': ['#ED8936', '#F56565', '#EC4899', '#8B5CF6'],
      'default': ['#1A202C', '#4299E1', '#ED8936', '#38B2AC']
    },
    'Brand Identity': {
      'professional': ['#1E293B', '#475569', '#64748B', '#94A3B8'],
      'modern': ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B'],
      'trustworthy': ['#0369A1', '#059669', '#7C3AED', '#DC2626'],
      'creative': ['#EA580C', '#DB2777', '#7C2D12', '#BE123C'],
      'default': ['#1E293B', '#6366F1', '#EA580C', '#059669']
    }
  };
  
  const personality = brandPersonality?.toLowerCase() || 'default';
  const categoryColors = colorPsychology[projectType] || colorPsychology['Logo Design'];
  
  let colors = categoryColors[personality];
  if (!colors) {
    // Find closest match
    if (personality.includes('professional') || personality.includes('corporate')) {
      colors = categoryColors['professional'];
    } else if (personality.includes('modern') || personality.includes('contemporary')) {
      colors = categoryColors['modern'];
    } else if (personality.includes('trust') || personality.includes('reliable')) {
      colors = categoryColors['trustworthy'];
    } else if (personality.includes('creative') || personality.includes('artistic')) {
      colors = categoryColors['creative'];
    } else {
      colors = categoryColors['default'];
    }
  }
  
  return {
    primary: colors[0],
    secondary: colors[1],
    accent: colors[2],
    neutral: colors[3],
    description: `Carefully selected color palette that embodies ${brandPersonality || 'professional'} characteristics while ensuring accessibility and brand recognition.`,
    usage: [
      `Primary (${colors[0]}): Main brand color for logos and key elements`,
      `Secondary (${colors[1]}): Supporting color for backgrounds and secondary elements`,
      `Accent (${colors[2]}): Call-to-action buttons and highlights`,
      `Neutral (${colors[3]}): Text and subtle background elements`
    ]
  };
}

// FONT SUGGESTIONS BASED ON CATEGORY AND PERSONALITY
function generateFontSuggestions(projectType, brandPersonality) {
  const fontDatabase = {
    'Logo Design': {
      'professional': {
        primary: 'Montserrat',
        secondary: 'Source Sans Pro',
        description: 'Clean, professional typefaces that convey reliability and sophistication'
      },
      'modern': {
        primary: 'Poppins',
        secondary: 'Inter',
        description: 'Contemporary fonts with geometric precision and excellent readability'
      },
      'creative': {
        primary: 'Playfair Display',
        secondary: 'Lato',
        description: 'Expressive typefaces that balance creativity with professional appeal'
      },
      'default': {
        primary: 'Open Sans',
        secondary: 'Roboto',
        description: 'Versatile, highly readable fonts suitable for all applications'
      }
    },
    'Website Design': {
      'professional': {
        primary: 'Source Sans Pro',
        secondary: 'Georgia',
        description: 'Web-optimized fonts that ensure excellent readability across all devices'
      },
      'modern': {
        primary: 'Inter',
        secondary: 'Space Grotesk',
        description: 'Modern system fonts designed for digital interfaces and user experiences'
      },
      'creative': {
        primary: 'Nunito',
        secondary: 'Merriweather',
        description: 'Friendly, approachable fonts that add personality while maintaining usability'
      },
      'default': {
        primary: 'Roboto',
        secondary: 'Open Sans',
        description: 'Google Fonts that provide reliable cross-platform consistency'
      }
    },
    'Brand Identity': {
      'professional': {
        primary: 'Helvetica Neue',
        secondary: 'Times New Roman',
        description: 'Classic typefaces that convey established authority and timeless appeal'
      },
      'modern': {
        primary: 'Avenir Next',
        secondary: 'Proxima Nova',
        description: 'Contemporary fonts that project innovation and forward-thinking'
      },
      'creative': {
        primary: 'Futura',
        secondary: 'Caslon',
        description: 'Distinctive typefaces that create memorable brand experiences'
      },
      'default': {
        primary: 'Arial',
        secondary: 'Verdana',
        description: 'Reliable system fonts with universal compatibility'
      }
    }
  };
  
  const personality = brandPersonality?.toLowerCase() || 'default';
  const categoryFonts = fontDatabase[projectType] || fontDatabase['Logo Design'];
  
  let fonts = categoryFonts[personality];
  if (!fonts) {
    // Find closest match
    if (personality.includes('professional') || personality.includes('corporate')) {
      fonts = categoryFonts['professional'];
    } else if (personality.includes('modern') || personality.includes('contemporary')) {
      fonts = categoryFonts['modern'];
    } else if (personality.includes('creative') || personality.includes('artistic')) {
      fonts = categoryFonts['creative'];
    } else {
      fonts = categoryFonts['default'];
    }
  }
  
  return {
    primary: fonts.primary,
    secondary: fonts.secondary,
    description: fonts.description,
    usage: [
      `Primary Font (${fonts.primary}): Headlines, logos, and main brand typography`,
      `Secondary Font (${fonts.secondary}): Body text, captions, and supporting content`,
      'Font pairing selected for optimal hierarchy and brand consistency',
      'All fonts verified for web and print compatibility'
    ],
    licensing: 'Ensure proper licensing for commercial use across all applications'
  };
}

// SMART BUDGET BREAKDOWN
function generateBudgetBreakdown(budget, projectType) {
  const breakdownTemplates = {
    'Logo Design': [
      { item: 'Design Development', percentage: 50, description: 'Concept creation and logo design' },
      { item: 'Revisions & Refinements', percentage: 25, description: 'Client feedback and adjustments' },
      { item: 'File Preparation', percentage: 15, description: 'Multiple formats and variations' },
      { item: 'Style Guide Creation', percentage: 10, description: 'Usage guidelines and documentation' }
    ],
    'Website Design': [
      { item: 'Design & Development', percentage: 60, description: 'Visual design and page layouts' },
      { item: 'Responsive Optimization', percentage: 20, description: 'Mobile and tablet adaptations' },
      { item: 'Testing & Refinements', percentage: 15, description: 'User testing and improvements' },
      { item: 'Documentation & Handoff', percentage: 5, description: 'Developer assets and guidelines' }
    ],
    'Brand Identity': [
      { item: 'Strategy & Research', percentage: 20, description: 'Brand positioning and market analysis' },
      { item: 'Visual Identity Design', percentage: 40, description: 'Logo, colors, typography system' },
      { item: 'Brand Applications', percentage: 25, description: 'Stationery, templates, and materials' },
      { item: 'Guidelines & Training', percentage: 15, description: 'Brand manual and team training' }
    ]
  };
  
  const template = breakdownTemplates[projectType] || breakdownTemplates['Logo Design'];
  
  return template.map(item => ({
    ...item,
    amount: Math.round(budget * (item.percentage / 100))
  }));
}

// Get user credits
app.get('/api/user/credits', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer token_')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  const userId = authHeader.replace('Bearer token_', '');
  const credits = userCredits.get(userId) || 0;
  
  console.log(`💳 Credits check for user ${userId}: ${credits}`);
  
  res.json({ success: true, credits });
});

// Get user briefs
app.get('/api/user/briefs', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer token_')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  const userId = authHeader.replace('Bearer token_', '');
  const userBriefs = briefs.filter(b => b.userId === userId);
  
  console.log(`📄 Briefs retrieved for user ${userId}: ${userBriefs.length} briefs`);
  
  res.json({ success: true, briefs: userBriefs });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BrieflyAI Backend running on port ${PORT}`);
  console.log(`📊 Ready to serve requests`);
  console.log(`🌐 CORS enabled for localhost:3000`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎨 AI-Enhanced Brief Generation: ACTIVE`);
});
