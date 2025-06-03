const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIBriefGenerator {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateEnhancedBrief(briefData) {
    const {
      clientName,
      projectType,
      budget,
      timeline,
      goals,
      requirements,
      targetAudience,
      brandPersonality
    } = briefData;

    const prompt = `Generate a detailed creative brief for:
Client: ${clientName}
Project: ${projectType}
Budget: ₦${budget}
Timeline: ${timeline}

Include color suggestions, font recommendations, and detailed visual descriptions.
Format as JSON with sections for executive summary, visual direction, colors, and fonts.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        brief: text,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gemini-1.5-flash'
        }
      };
      
    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AIBriefGenerator;
