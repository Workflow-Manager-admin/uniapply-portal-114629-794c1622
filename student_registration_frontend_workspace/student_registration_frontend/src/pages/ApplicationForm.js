import React, { useState } from "react";
import { submitApplication } from "../api";
import { useAuth } from "../AuthContext";

export default function ApplicationForm({ onSubmitted }) {
  const [program, setProgram] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { token } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await submitApplication(
        {
          program,
          full_name: fullName,
          dob,
          additional_info: additionalInfo,
        },
        token
      );
      setSuccess("Application submitted successfully!");
      setProgram("");
      setFullName("");
      setDob("");
      setAdditionalInfo("");
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.detail || err.error || "Submission failed.");
    }
  }

  return (
    <div className="form-container">
      <h2>Apply for a Program</h2>
      <form onSubmit={handleSubmit}>
        <label>Program</label>
        <input
          type="text"
          required
          value={program}
          placeholder="e.g. BSc Computer Science"
          onChange={(e) => setProgram(e.target.value)}
        />
        <label>Full Name</label>
        <input
          type="text"
          required
          value={fullName}
          placeholder="Your full legal name"
          onChange={(e) => setFullName(e.target.value)}
        />
        <label>Date of Birth</label>
        <input
          type="date"
          required
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />
        <label>Additional Info</label>
        <textarea
          value={additionalInfo}
          placeholder="Optional"
          onChange={(e) => setAdditionalInfo(e.target.value)}
        />
        <button type="submit" className="primary-btn">
          Submit Application
        </button>
      </form>
      {error && <div className="msg error">{error}</div>}
      {success && <div className="msg success">{success}</div>}
    </div>
  );
}
