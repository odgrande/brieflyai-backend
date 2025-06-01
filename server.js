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

// Simple brief generation (no AI yet)
app.post('/api/generate-brief', (req, res) => {
  const { clientName, projectType, budget } = req.body;
  
  // Simple mock brief
  const brief = {
    id: Date.now(),
    title: `${projectType} Brief for ${clientName}`,
    content: `This is a mock brief for ${clientName}'s ${projectType} project with budget ₦${budget}.`,
    createdAt: new Date()
  };
  
  res.json({ success: true, brief });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});