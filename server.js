const express = require('express');
const cors = require('cors');

const app = express();

// Simple middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'BrieflyAI Backend is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Simple brief generation (no database yet)
app.post('/api/generate-brief', (req, res) => {
  const { clientName, projectType, budget, timeline, goals, requirements } = req.body;
  
  // Create a detailed mock brief
  const brief = {
    id: Date.now(),
    title: `${projectType} Brief for ${clientName}`,
    summary: `Professional ${projectType} project for ${clientName} with budget ₦${budget?.toLocaleString()} to be completed within ${timeline}.`,
    sections: {
      executiveSummary: {
        title: "📋 Executive Summary",
        content: `${clientName} has commissioned a ${projectType} project with a budget of ₦${budget?.toLocaleString()} to be completed within ${timeline}. ${goals || 'This project aims to deliver high-quality creative solutions that meet client expectations.'}`
      },
      projectDetails: {
        title: "🎯 Project Details",
        client: clientName,
        type: projectType,
        budget: budget,
        timeline: timeline,
        goals: goals || 'To be defined during project kickoff',
        requirements: requirements || 'Detailed requirements to be finalized during discovery phase'
      },
      deliverables: {
        title: "📦 Key Deliverables",
        items: [
          `Complete ${projectType} design`,
          "Source files in multiple formats",
          "Usage guidelines and documentation",
          "Revision rounds as specified",
          "Final presentation and handover"
        ]
      }
    },
    metadata: {
      createdAt: new Date().toISOString(),
      status: "generated",
      version: "1.0"
    }
  };
  
  res.json({ 
    success: true, 
    brief,
    message: "Brief generated successfully"
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BrieflyAI Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
