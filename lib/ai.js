import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

export async function answerQuestion(context, question) {
  try {
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct", // Groq's model
      messages: [
        {
          role: "system",
          content: `You are an AI assistant analyzing a Zoom meeting transcript.
           Provide concise, accurate answers based only on the following transcript.
          If the answer isn't in the transcript, say "This wasn't mentioned in the meeting."
          Be specific and include relevant numbers or details when available.
          
          Transcript:
          ${context}`
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });
    
    return response.choices[0]?.message?.content || "I couldn't generate an answer.";
  } catch (error) {
    console.error('AI error:', error);
    return "Sorry, I encountered an error processing your question.";
  }
}