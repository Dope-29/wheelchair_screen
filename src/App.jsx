import React, { useState, useRef } from "react";
import "./App.css";

// Format text with markdown-like syntax
const formatMessage = (text) => {
  // Split text into segments
  const segments = text.split(/(\*\*.*?\*\*)/g);
  
  return segments.map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      // Remove asterisks and wrap in bold span
      const boldText = segment.slice(2, -2);
      return <strong key={index}>{boldText}</strong>;
    }
    return segment;
  });
};

export default function App() {
  const [voiceActive, setVoiceActive] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const destinations = ["Room 101", "Room 201", "Lab", "ICU", "Diagnostics"];

  // 👉 Send blob to webhook and process response
  const sendToWebhook = async (blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", blob, "voiceRecording.mp3");

    try {
      const res = await fetch(
        "https://amzman172.app.n8n.cloud/webhook/autopilot",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      
      const data = await res.json();
      const response = data.Result || "Sorry, I couldn't process that.";
      
      setMessages(prev => [...prev, 
        { type: 'user', content: 'Audio message sent' },
        { type: 'assistant', content: response }
      ]);
      
      console.log("✅ Audio sent to webhook!");
    } catch (err) {
      console.error("❌ Failed to send audio:", err);
      setMessages(prev => [...prev, 
        { type: 'error', content: 'Failed to process audio message' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎤 Start or stop recording
  const handleVoiceToggle = async () => {
    if (!voiceActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/mp3' };
        try {
          mediaRecorderRef.current = new MediaRecorder(stream, options);
        } catch (e) {
          // Fallback to default format if MP3 is not supported
          mediaRecorderRef.current = new MediaRecorder(stream);
        }
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
          setAudioUrl(URL.createObjectURL(blob));
          console.log("Recorded Blob ready:", blob);

          // 🚀 Send automatically to webhook
          sendToWebhook(blob);
        };

        mediaRecorderRef.current.start();
        setVoiceActive(true);
      } catch (err) {
        console.error("Mic error:", err);
        alert("Could not access microphone");
      }
    } else {
      mediaRecorderRef.current.stop();
      setVoiceActive(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">🦽 Autopilot Wheelchair Interface</h1>

      {/* Navigation Tabs */}
      <div className="nav-bar">
        <button className="nav-btn active">Dashboard</button>
        <button className="nav-btn">Controls</button>
        <button className="nav-btn">Sensors</button>
        <button className="nav-btn">Settings</button>
      </div>

      {/* Destination Presets */}
      <div className="card">
        <h2 className="section-title">Choose Destination</h2>
        <div className="destinations">
          {destinations.map((dest) => (
            <button
              key={dest}
              onClick={() => setSelectedDestination(dest)}
              className={`destination-btn ${
                selectedDestination === dest ? "active" : ""
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Assistant */}
      <div className="card">
        <h2 className="section-title">Voice Assistant</h2>
        <div className="chat-container">
          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-content">
                  {typeof message.content === 'string' 
                    ? formatMessage(message.content)
                    : message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message system">
                <div className="message-content">Processing your message...</div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleVoiceToggle}
          className={`voice-btn ${voiceActive ? "stop" : "start"}`}
        >
          {voiceActive ? "Stop Voice Assistant 🎤" : "Start Voice Assistant 🎙️"}
        </button>
        {voiceActive && <p className="listening">Listening...</p>}
        {audioUrl && (
          <div className="audio-preview">
            <audio src={audioUrl} controls />
            <a href={audioUrl} download="voiceRecording.webm" className="download-btn">
              ⬇️ Download Recording
            </a>
          </div>
        )}
      </div>

      {/* Face Tracker */}
      <div className="card">
        <h2 className="section-title">Face Tracker</h2>
        <div className="placeholder">🎥 Live Camera Feed Placeholder</div>
      </div>

      {/* Sensor Dashboard */}
      <div className="card">
        <h2 className="section-title">Sensors</h2>
        <div className="sensor-grid">
          <div className="sensor">❤️ Heart Rate <br /> 72 bpm</div>
          <div className="sensor">🩸 SpO₂ <br /> 97%</div>
          <div className="sensor">🩺 BP <br /> 120/80</div>
        </div>
      </div>

      {/* Simulation Map */}
      <div className="card">
        <h2 className="section-title">Simulation Map</h2>
        <div className="placeholder">🗺️ Indoor Map Placeholder</div>
      </div>
    </div>
  );
}
