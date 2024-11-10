// src/AudioRecorder.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import "./AudioRecorder.css";

// Function to convert audio blob to base64 encoded string
const audioBlobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result;
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      resolve(base64Audio);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  useEffect(() => {
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaRecorder]);

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.start();
      setIsRecording(true);
      setMediaRecorder(recorder);

      recorder.addEventListener("dataavailable", async (event) => {
        const audioBlob = event.data;
        const base64Audio = await audioBlobToBase64(audioBlob);

        try {
          const response = await axios.post(
            `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
            {
              config: {
                encoding: "WEBM_OPUS",
                sampleRateHertz: 48000,
                languageCode: "en-US",
              },
              audio: {
                content: base64Audio,
              },
            }
          );

          if (response.data.results && response.data.results.length > 0) {
            const transcriptText = response.data.results[0].alternatives[0].transcript;
            setTranscript(transcriptText);
            fetchResponse(transcriptText); // Send transcript to the backend
          } else {
            setTranscript("No transcription available");
          }
        } catch (error) {
          console.error("Error with Google Speech-to-Text API:", error.response.data);
        }
      });
    } catch (error) {
      console.error("Error getting user media:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const fetchResponse = async (text) => {
    try {
      const res = await axios.post("https://backend-gm6q.onrender.com/api/gemini", { query: text });
      let processedResponse = res.data.answer;

      processedResponse = processedResponse.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      processedResponse = processedResponse.replace(/\* (.+)/g, "<ul><li>$1</li></ul>");
      processedResponse = processedResponse.replace(/<\/ul><ul>/g, ''); // Remove unwanted nested lists
      processedResponse = processedResponse.replace(/```python([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
      processedResponse = processedResponse.trim().replace(/\s+/g, ' ');

      setResponse(processedResponse);
    } catch (error) {
      console.error("Error fetching response from API", error);
    }
  };

  return (
    <div className="audio-recorder-container">
      <h1 className="title">AI Chatbot voice</h1>
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
