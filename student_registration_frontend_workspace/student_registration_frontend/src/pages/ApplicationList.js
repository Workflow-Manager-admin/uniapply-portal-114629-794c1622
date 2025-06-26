import React, { useEffect, useState } from "react";
import { getMyApplications, getApplicationStatus } from "../api";
import { useAuth } from "../AuthContext";

export default function ApplicationList() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    async function fetchApps() {
      try {
        setError("");
        const apps = await getMyApplications(token);
        setApplications(apps);
        // Fetch all statuses in parallel:
        const statuses = await Promise.all(
          apps.map((a) =>
            getApplicationStatus(a.id, token)
              .then((st) => ({ id: a.id, status: st.status, updated_at: st.updated_at }))
              .catch(() => ({ id: a.id, status: "Unknown", updated_at: null }))
          )
        );
        const statemap = {};
        statuses.forEach((s) => {
          statemap[s.id] = s;
        });
        setStatusMap(statemap);
      } catch (err) {
        setError(err.detail || err.error || "Could not load applications.");
      }
    }
    fetchApps();
    // eslint-disable-next-line
  }, [token]);

  return (
    <div className="app-list-section">
      <h2>Your Applications</h2>
      {error && <div className="msg error">{error}</div>}
      {applications.length === 0 && !error && <p>No applications found.</p>}
      {applications.length > 0 && (
        <table className="app-table">
          <thead>
            <tr>
              <th>Program</th>
              <th>Full Name</th>
              <th>DOB</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id}>
                <td>{a.program}</td>
                <td>{a.full_name}</td>
                <td>{a.dob}</td>
                <td>
                  {statusMap[a.id] ? statusMap[a.id].status : a.status}
                </td>
                <td>{a.submit_time ? a.submit_time.slice(0, 19).replace("T", " ") : ""}</td>
                <td>
                  {statusMap[a.id] && statusMap[a.id].updated_at
                    ? statusMap[a.id].updated_at.slice(0, 19).replace("T", " ")
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
