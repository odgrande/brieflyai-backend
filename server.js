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
