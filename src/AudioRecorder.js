// src/AudioRecorder.js
import React, { useState } from "react";
import axios from "axios";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  // Start recording and transcribing audio
  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported by your browser.");
      return;
    }
    
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event) => {
      const transcriptText = event.results[0][0].transcript;
      setTranscript(transcriptText);
      fetchResponse(transcriptText); // Send transcript to the backend
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event);
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  // Fetch response from the backend
  const fetchResponse = async (text) => {
    try {
      const res = await axios.post("https://backend-gm6q.onrender.com/api/gemini", { query: text });
      setResponse(res.data.answer);
    } catch (error) {
      console.error("Error fetching response from API", error);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <button onClick={startRecording} disabled={isRecording}>
        {isRecording ? "Recording..." : "Start Recording"}
      </button>
      <h3>Transcript:</h3>
      <p>{transcript}</p>
      <h3>Response:</h3>
      <div dangerouslySetInnerHTML={{ __html: response }} />
    </div>
  );
  
};

export default AudioRecorder;
