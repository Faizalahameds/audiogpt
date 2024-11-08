// src/AudioRecorder.js
import React, { useState, useRef } from "react";
import axios from "axios";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import "./AudioRecorder.css"; // Import custom CSS

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const recognitionRef = useRef(null); // Use useRef to persist recognition instance across renders

  // Start or stop recording and transcribing audio
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      if (!("webkitSpeechRecognition" in window)) {
        alert("Speech recognition not supported by your browser.");
        return;
      }
    
      // Create a new instance only if it doesn't already exist
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => setIsRecording(true);
      recognitionRef.current.onresult = (event) => {
        const transcriptText = event.results[0][0].transcript;
        setTranscript(transcriptText);
        fetchResponse(transcriptText); // Send transcript to the backend
      };
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event);
      };
      recognitionRef.current.onend = () => setIsRecording(false);
    }

    // If it's recording, stop the recording, else start it
    if (isRecording) {
      recognitionRef.current.stop(); // Stop recording if already recording
      setIsRecording(false);
    } else {
      recognitionRef.current.start(); // Start recording
    }
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
    <div className="audio-recorder-container">
      <h1 className="title">AI Chatbot</h1>
      <button
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={toggleRecording}
        disabled={false} // The button can be clicked at any time
      >
        <FontAwesomeIcon icon={faMicrophone} /> {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <h3>Transcript:</h3>
      <p className="transcript">{transcript}</p>
      <h3>Response:</h3>
      <div className="response-container" dangerouslySetInnerHTML={{ __html: response }} />
    </div>
  );
};

export default AudioRecorder;
