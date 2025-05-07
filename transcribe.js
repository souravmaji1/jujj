import { createClient } from "@deepgram/sdk";


// Initialize Deepgram client with your API key
const deepgram = createClient("e94b27c95854e303c17c7c9dc0ba2bb735998ff1");

// Async function to transcribe audio from URL
async function transcribeAudio() {
  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      {
        url: "https://fmkjdrdiifebucfpkbsz.supabase.co/storage/v1/object/public/avatars//music-video%20(4).mp4",
      },
      {
        model: "nova-3", // Note: Verify if 'nova-3' exists; 'nova-2' is the latest as of my knowledge
        punctuate: true,
        utterances: true,
      }
    );

    if (error) {
      console.error("Error:", error);
      return;
    }

    console.log("Transcription Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

// Run the transcription
transcribeAudio();