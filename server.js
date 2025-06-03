const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Simple middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'BrieflyAI Backend is running!' });
});

// Simple user storage (in production, use a real database)
const users = [];

// Register route
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if user exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }
  
  // Create new user
  const user = {
    id: Date.now(),
    name,
    email,
    password, // In production, hash this!
    credits: 5
  };
  
  users.push(user);
  
  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email },
    credits: user.credits,
    message: 'User registered successfully'
  });
});

// Login route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email },
    credits: user.credits,
    message: 'Login successful'
  });
});

// Get user credits
app.get('/api/user/credits', (req, res) => {
  res.json({
    success: true,
    credits: 5
  });
});

const AIBriefGenerator = require('./services/aiService');
const aiGenerator = new AIBriefGenerator();

// AI-powered brief generation
app.post('/api/generate-brief', async (req, res) => {
  try {
    const briefData = req.body;
    
    console.log('🤖 Generating AI brief for:', briefData.clientName);
    
    const aiResult = await aiGenerator.generateEnhancedBrief(briefData);
    
    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        message: 'AI generation failed',
        error: aiResult.error
      });
    }
    
    const brief = {
      id: Date.now(),
      title: `${briefData.projectType} Brief for ${briefData.clientName}`,
      content: aiResult.brief,
      aiGenerated: true,
      createdAt: new Date()
    };
    
    res.json({ 
      success: true, 
      brief,
      message: 'AI-powered brief generated! 🎨'
    });
    
  } catch (error) {
    console.error('Brief generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
