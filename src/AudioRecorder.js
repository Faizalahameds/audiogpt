import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import "./AudioRecorder.css";
import { Buffer } from 'buffer';
import axios from 'axios';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  // Function to send transcript to Gemini and process response
  const fetchResponse = async (text) => {
    try {
      const res = await axios.post("https://backend-gm6q.onrender.com/api/gemini", { query: text });
      let processedResponse = res.data.answer;

      // Process the response (e.g., convert markdown to HTML)
      processedResponse = processedResponse.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      processedResponse = processedResponse.replace(/\* (.+)/g, "<ul><li>$1</li></ul>");
      processedResponse = processedResponse.replace(/<\/ul><ul>/g, ''); // Remove unwanted nested lists
      processedResponse = processedResponse.replace(/```python([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
      processedResponse = processedResponse.trim().replace(/\s+/g, ' ');

      setResponse(processedResponse); // Set the processed response to state
    } catch (error) {
      console.error("Error fetching response from API", error);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.start();
      setIsRecording(true);
      setMediaRecorder(recorder);
    
      recorder.addEventListener("dataavailable", async (event) => {
        const audioBlob = event.data;
        const audioBuffer = await audioBlob.arrayBuffer();
        const audioBytes = Buffer.from(audioBuffer).toString("base64");
    
        // Send audio data to your backend for transcription and Gemini processing
        try {
          const response = await fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audio: audioBytes }),
          });
    
          const data = await response.json();
          if (response.ok) {
            setTranscript(data.transcript); // Display the transcript
            // Call fetchResponse to send transcript to Gemini API
            fetchResponse(data.transcript); // Get response from Gemini
          } else {
            setTranscript("Error: " + data.error);
          }
        } catch (error) {
          console.error("Error sending audio data to backend:", error);
        }
      });
    
      recorder.addEventListener("stop", () => {
        setIsRecording(false);
      });
    
      // Automatically stop recording after a certain duration (e.g., 5 seconds)
      setTimeout(() => {
        recorder.stop();
      }, 5000); // Change this duration as needed
    } catch (error) {
      console.error("Error getting user media:", error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  return (
    <div className="audio-recorder-container">
      <h1 className="title">AI Chatbot Voice</h1>
      <button
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        <FontAwesomeIcon icon={faMicrophone} /> {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <h3>Transcript:</h3>
      <p className="transcript">{transcript}</p>
      <h3>Response:</h3>
      {/* Display the processed Gemini response */}
      <div className="response-container" dangerouslySetInnerHTML={{ __html: response }} />
    </div>
  );
};

export default AudioRecorder;
