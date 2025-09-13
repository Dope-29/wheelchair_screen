import React, { useState, useRef } from "react";
import "./App.css";

export default function App() {
  const [voiceActive, setVoiceActive] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const destinations = ["Room 101", "Room 201", "Lab", "ICU", "Diagnostics"];

  // 👉 Send blob to webhook
  const sendToWebhook = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "voiceRecording.webm");

    try {
      const res = await fetch(
        "https://amzman172.app.n8n.cloud/webhook-test/autowheel",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      console.log("✅ Audio sent to webhook!");
    } catch (err) {
      console.error("❌ Failed to send audio:", err);
    }
  };

  // 🎤 Start or stop recording
  const handleVoiceToggle = async () => {
    if (!voiceActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
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
