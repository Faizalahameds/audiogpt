import React, { useState, useEffect } from "react";
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
  const [audioContext, setAudioContext] = useState(null);
  const [processor, setProcessor] = useState(null);
  const silenceThreshold = 0.05; // Voice amplitude threshold
  const silenceDuration = 1000; // Duration of silence before stopping (in milliseconds)

  // Function to send transcript to Gemini and process response
  const fetchResponse = async (text) => {
    try {
      const res = await axios.post("https://backend-gm6q.onrender.com/api/gemini", { query: text });
      let processedResponse = res.data.answer;

      // Process the response (e.g., convert markdown to HTML)
      processedResponse = processedResponse
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")             // Bold text
      .replace(/\n\n/g, "<p></p>")                                  // Paragraph separation
      .replace(/(?:\*|-)\s+(.+)/g, "<ul><li>$1</li></ul>")          // Bullet points
      .replace(/<\/ul><ul>/g, '')                                   // Remove unwanted nested <ul> tags
      .replace(/(?:\d+\.)\s+(.+)/g, "<ol><li>$1</li></ol>")         // Numbered lists
      .replace(/<\/ol><ol>/g, '')                                   // Remove unwanted nested <ol> tags
      .replace(/\n/g, "<br>")                                       // Single line breaks
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>"); 

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

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(audioCtx);
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048; // FFT size for audio data analysis
      const dataArray = new Float32Array(analyser.fftSize);

      source.connect(analyser);

      // Silence detection using a timeout
      let silenceStart = performance.now();
      const checkSilence = () => {
        analyser.getFloatTimeDomainData(dataArray);
        const hasVoice = dataArray.some(sample => Math.abs(sample) > silenceThreshold);

        if (hasVoice) {
          silenceStart = performance.now(); // Reset silence timer if voice is detected
        } else if (performance.now() - silenceStart > silenceDuration) {
          stopRecording(); // Stop recording if silence has lasted long enough
        }

        if (isRecording) {
          requestAnimationFrame(checkSilence); // Continue checking for silence
        }
      };
      requestAnimationFrame(checkSilence);

      recorder.addEventListener("dataavailable", async (event) => {
        const audioBlob = event.data;
        const audioBuffer = await audioBlob.arrayBuffer();
        const audioBytes = Buffer.from(audioBuffer).toString("base64");

        // Send audio data to your backend for transcription and Gemini processing
        try {
          const response = await fetch('https://backend-gm6q.onrender.com/transcribe', {
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
        if (audioContext) audioContext.close();
      });
    } catch (error) {
      console.error("Error getting user media:", error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (audioContext) {
      audioContext.close();
    }
    setIsRecording(false);
  };

  return (
    <div className="audio-recorder-container">
      <h1 className="title">AI Chatbot</h1>
      <button
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
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
