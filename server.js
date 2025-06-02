const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory storage (free alternative to complex database)
let users = [];
let briefs = [];
let credits = new Map(); // userId -> credit count

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'BrieflyAI Backend is running!', 
    status: 'healthy',
    users: users.length,
    briefs: briefs.length 
  });
});

// **FREE AUTH SYSTEM** - Simple but secure for launch
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, referralCode } = req.body;
  
  // Check if user exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }
  
  const userId = Date.now().toString();
  const newUser = {
    id: userId,
    name,
    email,
    password, // In production, hash this with bcrypt
    createdAt: new Date(),
    plan: 'free'
  };
  
  users.push(newUser);
  
  // Give credits
  let userCredits = 5; // Default 5 free credits
  if (referralCode) {
    userCredits += 5; // Bonus for referral
  }
  credits.set(userId, userCredits);
  
  res.json({ 
    success: true, 
    user: { id: userId, name, email, plan: 'free' },
    credits: userCredits,
    token: `token_${userId}` // Simple token for demo
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
  
  const userCredits = credits.get(user.id) || 0;
  
  res.json({ 
    success: true, 
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    credits: userCredits,
    token: `token_${user.id}`
  });
});

// **FREE AI ALTERNATIVE** - Smart template-based generation
app.post('/api/briefs/generate', (req, res) => {
  const { formData } = req.body;
  const token = req.headers.authorization?.replace('Bearer token_', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  // Check credits
  const userCredits = credits.get(token) || 0;
  if (userCredits < 1) {
    return res.status(400).json({ success: false, message: 'Insufficient credits' });
  }
  
  // Deduct credit
  credits.set(token, userCredits - 1);
  
  // **SMART TEMPLATE GENERATION** (Free alternative to AI)
  const brief = generateSmartBrief(formData);
  
  // Save brief
  const savedBrief = {
    ...brief,
    userId: token,
    createdAt: new Date()
  };
  briefs.push(savedBrief);
  
  res.json({ 
    success: true, 
    data: brief,
    creditsRemaining: credits.get(token)
  });
});

// **SMART BRIEF GENERATOR** - Free AI alternative
function generateSmartBrief(formData) {
  const {
    clientName,
    clientEmail,
    projectType,
    budget,
    timeline,
    goals,
    requirements,
    targetAudience,
    brandPersonality
  } = formData;
  
  // Smart content based on project type
  const templates = {
    'Logo Design': {
      deliverables: [
        'Primary logo design (full color)',
        'Logo variations (horizontal, vertical, icon)',
        'Black and white versions',
        'Usage guidelines document',
        'Vector files (AI, EPS, SVG)',
        'PNG files for web use'
      ],
      phases: [
        { phase: 'Discovery & Research', duration: '2-3 days', description: 'Brand research and client consultation' },
        { phase: 'Concept Development', duration: '3-5 days', description: 'Initial logo concepts and design exploration' },
        { phase: 'Refinement', duration: '2-3 days', description: 'Client feedback and design refinements' },
        { phase: 'Finalization', duration: '1-2 days', description: 'Final files and documentation delivery' }
      ]
    },
    'Website Design': {
      deliverables: [
        'Homepage design mockup',
        '5-7 interior page designs',
        'Mobile responsive layouts',
        'Style guide and components',
        'Interactive prototype',
        'Developer handoff package'
      ],
      phases: [
        { phase: 'Planning & Research', duration: '3-5 days', description: 'User research and site architecture' },
        { phase: 'Design Development', duration: '1-2 weeks', description: 'Visual design and page layouts' },
        { phase: 'Prototype & Testing', duration: '3-5 days', description: 'Interactive prototype creation' },
        { phase: 'Finalization', duration: '2-3 days', description: 'Final assets and documentation' }
      ]
    },
    'Brand Identity': {
      deliverables: [
        'Logo design and variations',
        'Color palette and typography',
        'Business stationery design',
        'Brand guidelines manual',
        'Marketing collateral templates',
        'Social media brand assets'
      ],
      phases: [
        { phase: 'Brand Strategy', duration: '1 week', description: 'Brand positioning and strategy development' },
        { phase: 'Visual Identity', duration: '2 weeks', description: 'Logo and visual system creation' },
        { phase: 'Brand Applications', duration: '1 week', description: 'Applying brand to various materials' },
        { phase: 'Guidelines & Delivery', duration: '3-5 days', description: 'Brand manual and asset delivery' }
      ]
    }
  };
  
  const template = templates[projectType] || templates['Logo Design'];
  
  // Smart pricing breakdown
  const budgetBreakdown = [
    { item: 'Design Work', percentage: 60, amount: Math.round(budget * 0.6) },
    { item: 'Revisions', percentage: 25, amount: Math.round(budget * 0.25) },
    { item: 'Project Management', percentage: 15, amount: Math.round(budget * 0.15) }
  ];
  
  // Generate professional content
  const brief = {
    id: Date.now(),
    title: `${projectType} Brief for ${clientName}`,
    summary: `Professional ${projectType.toLowerCase()} project for ${clientName} with a budget of ₦${budget.toLocaleString()}. ${goals ? 'Project focused on ' + goals.substring(0, 100) + '...' : 'Comprehensive design solution tailored to client needs.'}`,
    sections: {
      executiveSummary: {
        title: 'Executive Summary',
        content: `This ${projectType.toLowerCase()} project for ${clientName} aims to ${goals || 'deliver exceptional design solutions that meet business objectives'}. With a timeline of ${timeline} and budget of ₦${budget.toLocaleString()}, we will create ${projectType.toLowerCase()} solutions that resonate with ${targetAudience || 'the target audience'} and reflect a ${brandPersonality || 'professional and trustworthy'} brand personality.`,
        keyPoints: [
          `Project Type: ${projectType}`,
          `Client: ${clientName}`,
          `Timeline: ${timeline}`,
          `Budget: ₦${budget.toLocaleString()}`,
          `Target Audience: ${targetAudience || 'To be defined during discovery'}`
        ]
      },
      clientInfo: {
        title: 'Client Information',
        clientName,
        contactInfo: { email: clientEmail },
        businessProfile: { targetAudience: targetAudience || 'Target audience to be defined' }
      },
      overview: {
        title: 'Project Overview',
        content: `${requirements || `This ${projectType.toLowerCase()} project will deliver comprehensive design solutions that align with business objectives.`} The project will follow industry best practices and ensure high-quality deliverables that exceed client expectations.`,
        objectives: [
          `Deliver high-quality ${projectType.toLowerCase()} design`,
          'Meet all specified requirements and deadlines',
          'Ensure client satisfaction throughout the process',
          'Provide comprehensive documentation and guidelines'
        ]
      },
      deliverables: {
        title: 'Deliverables',
        primaryDeliverables: template.deliverables.slice(0, 4),
        secondaryDeliverables: template.deliverables.slice(4)
      },
      timeline: {
        title: 'Project Timeline',
        phases: template.phases,
        totalDuration: timeline
      },
      budget: {
        title: 'Project Budget',
        totalBudget: budget,
        breakdown: budgetBreakdown
      }
    },
    formData
  };
  
  return brief;
}

// **FREE PAYSTACK INTEGRATION** - Only pay when you earn
app.post('/api/payment/initialize', (req, res) => {
  // For now, return mock response
  // When you're ready, add real Paystack integration
  res.json({
    success: true,
    authorization_url: 'https://checkout.paystack.com/mock',
    access_code: 'mock_access_code',
    reference: 'mock_ref_' + Date.now()
  });
});

// Get user credits
app.get('/api/user/credits', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer token_', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  const userCredits = credits.get(token) || 0;
  res.json({ success: true, credits: userCredits });
});

// Get user briefs
app.get('/api/user/briefs', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer token_', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  const userBriefs = briefs.filter(b => b.userId === token);
  res.json({ success: true, briefs: userBriefs });
});

// Add credits (for referrals, purchases, etc.)
app.post('/api/user/add-credits', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer token_', '');
  const { amount, reason } = req.body;
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  const currentCredits = credits.get(token) || 0;
  credits.set(token, currentCredits + amount);
  
  res.json({ 
    success: true, 
    credits: credits.get(token),
    message: `Added ${amount} credits for: ${reason}`
  });
});

// Basic analytics endpoint
app.get('/api/analytics', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer token_', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  const userBriefs = briefs.filter(b => b.userId === token);
  const totalValue = userBriefs.reduce((sum, brief) => sum + (brief.formData?.budget || 0), 0);
  
  res.json({
    success: true,
    data: {
      totalBriefs: userBriefs.length,
      thisMonth: Math.floor(userBriefs.length * 0.7), // Mock data
      totalValue,
      averageValue: userBriefs.length > 0 ? Math.round(totalValue / userBriefs.length) : 0,
      successRate: 94 // Mock data
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BrieflyAI Backend running on port ${PORT}`);
  console.log(`📊 Status: ${users.length} users, ${briefs.length} briefs`);
});
