const express = require('express');
const cors = require('cors');
// Removed dotenv - not needed for Railway

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Simple storage (for launch)
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

// Simple auth - register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, referralCode } = req.body;
  
  console.log(`📝 Registration attempt: ${email}`);
  
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
    name,
    email,
    password, // In production, hash this
    createdAt: new Date(),
    plan: 'free'
  };
  
  users.push(newUser);
  
  // Give credits
  let credits = 5; // Default 5 free credits
  if (referralCode) {
    credits += 5; // Bonus for referral
  }
  userCredits.set(userId, credits);
  
  console.log(`✅ User registered: ${email} with ${credits} credits`);
  
  res.json({ 
    success: true, 
    user: { id: userId, name, email, plan: 'free' },
    credits,
    token: `token_${userId}`
  });
});

// Simple auth - login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log(`🔐 Login attempt: ${email}`);
  
  const user = users.find(u => u.email === email && u.password === password);
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

// Your existing brief generation (keep this working)
app.post('/api/generate-brief', (req, res) => {
  const { clientName, projectType, budget, timeline, goals, requirements } = req.body;
  
  console.log(`🚀 Generating brief: ${clientName} - ${projectType}`);
  
  // Enhanced brief generation
  const brief = {
    id: Date.now(),
    title: `${projectType} Brief for ${clientName}`,
    summary: `Professional ${projectType.toLowerCase()} project for ${clientName} with a budget of ₦${budget?.toLocaleString() || 'TBD'}.`,
    content: generateDetailedBrief(req.body),
    sections: generateBriefSections(req.body),
    formData: req.body,
    createdAt: new Date()
  };
  
  briefs.push(brief);
  
  console.log(`✅ Brief generated successfully`);
  
  res.json({ success: true, brief });
});

// New brief generation with auth
app.post('/api/briefs/generate', (req, res) => {
  const { formData } = req.body;
  const authHeader = req.headers.authorization;
  
  console.log(`🚀 Auth brief generation attempt`);
  
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
  
  // Generate brief
  const brief = {
    id: Date.now(),
    title: `${formData.projectType} Brief for ${formData.clientName}`,
    summary: `Professional ${formData.projectType.toLowerCase()} project for ${formData.clientName} with a budget of ₦${formData.budget?.toLocaleString()}.`,
    sections: generateBriefSections(formData),
    formData,
    userId,
    createdAt: new Date()
  };
  
  briefs.push(brief);
  
  console.log(`✅ Auth brief generated for user ${userId}. Credits remaining: ${credits - 1}`);
  
  res.json({ 
    success: true, 
    data: brief,
    creditsRemaining: credits - 1
  });
});

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

// Generate detailed brief content
function generateDetailedBrief(data) {
  const { clientName, projectType, budget, timeline, goals, requirements, targetAudience, brandPersonality } = data;
  
  return `
PROJECT OVERVIEW
This ${projectType} project for ${clientName} aims to deliver exceptional design solutions that meet business objectives and exceed client expectations.

OBJECTIVES
${goals || `• Create a distinctive ${projectType.toLowerCase()} that effectively represents the brand
• Ensure scalability across all applications and platforms
• Deliver within the specified timeline of ${timeline || '2 weeks'}
• Maintain the highest quality standards throughout the process`}

REQUIREMENTS
${requirements || `• Professional ${projectType.toLowerCase()} design
• Multiple format deliverables
• Comprehensive style guidelines
• Revision rounds as needed`}

TARGET AUDIENCE
${targetAudience || 'Target audience to be defined during discovery phase'}

BRAND PERSONALITY
${brandPersonality || 'Professional, trustworthy, and distinctive'}

BUDGET ALLOCATION
Total Project Budget: ₦${budget?.toLocaleString() || 'To be determined'}
• Design Development: 60%
• Revisions & Refinements: 25%
• Project Management: 15%

TIMELINE
Project Duration: ${timeline || '2 weeks'}
Expected Delivery: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
  `;
}

// Generate structured brief sections
function generateBriefSections(data) {
  const { clientName, clientEmail, projectType, budget, timeline, goals, requirements, targetAudience, brandPersonality } = data;
  
  return {
    executiveSummary: {
      title: 'Executive Summary',
      content: `This ${projectType} project for ${clientName} will deliver professional design solutions within ${timeline || '2 weeks'} timeframe and ₦${budget?.toLocaleString() || 'TBD'} budget.`,
      keyPoints: [
        `Project Type: ${projectType}`,
        `Client: ${clientName}`,
        `Timeline: ${timeline || '2 weeks'}`,
        `Budget: ₦${budget?.toLocaleString() || 'TBD'}`
      ]
    },
    clientInfo: {
      title: 'Client Information',
      clientName,
      contactInfo: { email: clientEmail },
      businessProfile: { targetAudience: targetAudience || 'To be defined' }
    },
    deliverables: {
      title: 'Deliverables',
      primaryDeliverables: [
        `Final ${projectType} design`,
        'Source files in multiple formats',
        'Usage guidelines and documentation',
        'Style guide and specifications'
      ],
      secondaryDeliverables: [
        'Revision rounds (up to 3)',
        'Final presentation materials',
        'Project documentation'
      ]
    },
    timeline: {
      title: 'Project Timeline',
      totalDuration: timeline || '2 weeks',
      phases: [
        { phase: 'Discovery', duration: '2-3 days', description: 'Project research and planning' },
        { phase: 'Design Development', duration: '5-7 days', description: 'Initial concepts and design' },
        { phase: 'Refinement', duration: '3-4 days', description: 'Revisions and finalization' }
      ]
    },
    budget: {
      title: 'Project Budget',
      totalBudget: budget || 50000,
      breakdown: [
        { item: 'Design Work', percentage: 60, amount: Math.round((budget || 50000) * 0.6) },
        { item: 'Revisions', percentage: 25, amount: Math.round((budget || 50000) * 0.25) },
        { item: 'Project Management', percentage: 15, amount: Math.round((budget || 50000) * 0.15) }
      ]
    }
  };
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BrieflyAI Backend running on port ${PORT}`);
  console.log(`📊 Ready to serve requests`);
  console.log(`🌐 CORS enabled for localhost:3000`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
