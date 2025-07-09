import API from "../services/api";
import { Edit, Trash2, Copy, CheckCircle, X } from "lucide-react";
import React, { useState } from "react";

export default function ProjectList({ projects, fetchProjects, setEditProject, hideHeading }) {
  const [confirmId, setConfirmId] = useState(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newGid, setNewGid] = useState("");
  const [showGidModal, setShowGidModal] = useState(false);
  const [gidProject, setGidProject] = useState(null);
  const [isSavingGid, setIsSavingGid] = useState(false);
  const [gidError, setGidError] = useState("");

  const handleDelete = async (id, name) => {
    if (confirmInput === name) {
      try {
        await API.delete(`/projects/${id}`);
        fetchProjects();
        setConfirmId(null);
        setConfirmInput("");
        setConfirmName("");
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const openModal = (id, name) => {
    setConfirmId(id);
    setConfirmInput("");
    setConfirmName(name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setConfirmId(null);
      setConfirmInput("");
      setConfirmName("");
    }, 200); // match transition duration
  };

  return (
    <div className="mt-8">
      {/* Modal for delete confirmation with fade animation */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${showModal && confirmId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: showModal && confirmId ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)' }}
      >
        {confirmId && (
          <div className={`bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col items-center transform transition-all duration-200 ${showModal ? 'scale-100' : 'scale-95'}`}>
            <h3 className="text-lg font-bold text-red-600 mb-2">Delete Project</h3>
            <p className="mb-4 text-gray-700 text-center">
              To confirm, type <span className="font-semibold">"{confirmName}"</span> in the box below to delete.
            </p>
            <input
              type="text"
              className="border border-blue-200 rounded px-3 py-2 w-full text-center text-base focus:outline-none focus:ring-2 focus:ring-blue-200 mb-4"
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              placeholder={confirmName}
            />
            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={() => handleDelete(confirmId, confirmName)}
                className="bg-red-600 text-white px-5 py-2 rounded font-semibold disabled:opacity-50"
                disabled={confirmInput !== confirmName}
              >
                Confirm Delete
              </button>
              <button
                onClick={closeModal}
                className="bg-gray-200 text-gray-700 px-5 py-2 rounded font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      {/* G-ID Modal */}
      {showGidModal && gidProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300 ease-out animate-fadein">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col items-center relative animate-modalin">
            <button
              className="absolute top-4 right-4 text-blue-300 hover:text-blue-600 focus:outline-none"
              onClick={() => { setShowGidModal(false); setGidProject(null); setNewGid(""); }}
              aria-label="Close G-ID modal"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-lg font-bold text-blue-700 mb-2">Add GA4 Measurement ID (G-ID)</h3>
            <p className="mb-4 text-gray-700 text-center text-sm">Find your G-ID in your Google Analytics 4 property. It looks like <b>G-XXXXXXXXXX</b>.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setGidError("");
              const gidPattern = /^G-[A-Z0-9]{10}$/;
              if (!gidPattern.test(newGid)) {
                setGidError("G-ID must start with G- and be followed by 10 uppercase letters or digits (no spaces or special characters).");
                return;
              }
              setIsSavingGid(true);
              try {
                await API.put(`/projects/${gidProject._id}`, { ...gidProject, gtag: newGid });
                await fetchProjects();
                setShowGidModal(false);
                setGidProject(null);
                setNewGid("");
              } catch (err) {
                console.error("Error saving G-ID:", err);
                let errorMessage = "Failed to save G-ID";
                
                // Handle specific error messages from the backend
                if (err.response && err.response.data) {
                  const errorData = err.response.data;
                  if (errorData.message) {
                    errorMessage = errorData.message;
                  }
                  // If backend provides available properties, show them
                  if (errorData.available_properties) {
                    errorMessage += `\n\nAvailable G-IDs in your account:\n${errorData.available_properties.join(', ')}`;
                  }
                  // If re-authentication is required, provide a button to re-verify
                  if (errorData.requires_reauth) {
                    errorMessage += "\n\nClick 'Re-verify' to update your Google permissions.";
                  }
                }
                
                setGidError(errorMessage);
              } finally {
                setIsSavingGid(false);
              }
            }} className="flex flex-col items-center gap-4 w-full">
              <input
                type="text"
                value={newGid}
                onChange={e => { setNewGid(e.target.value.toUpperCase()); setGidError(""); }}
                placeholder="G-XXXXXXXXXX"
                className="border border-blue-200 rounded px-3 py-2 w-full text-center text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
                pattern="^G-[A-Z0-9]{10}$"
                maxLength={12}
                autoComplete="off"
              />
              {gidError && <div className="text-red-500 text-xs text-center w-full">{gidError}</div>}
              <div className="flex gap-4 w-full justify-center">
                <button type="submit" className="bg-red-500 text-white px-6 py-2 rounded font-semibold flex items-center justify-center min-w-[100px]" disabled={isSavingGid}>
                  {isSavingGid ? (
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  ) : null}
                  Add G-ID
                </button>
                <button type="button" className="bg-gray-200 text-gray-700 px-6 py-2 rounded font-semibold" onClick={() => { setShowGidModal(false); setGidProject(null); setNewGid(""); }} disabled={isSavingGid}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {!hideHeading && (
        <h2 className="text-2xl font-bold mb-4 text-blue-800">Project List</h2>
      )}
      <ul className="space-y-4">
        {projects.length === 0 ? (
          <p className="text-blue-400">No projects found.</p>
        ) : (
          projects.map((proj) => (
            <li
              key={proj._id}
              className="p-5 bg-white border border-blue-100 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3">
                <strong className="text-blue-700 text-lg">{proj.name}</strong>
                {/* Tag for type */}
                {proj.type === 'own' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">Own</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">Global</span>
                )}
                <span className="ml-2 text-blue-400">{proj.url}</span>
                {/* Verification and G-ID logic */}
                {proj.type === 'own' && !proj.google_access_token ? (
                  <button
                    className="ml-4 bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-semibold hover:bg-green-200"
                    onClick={() => window.location.href = '/projects?verify=' + encodeURIComponent(proj.url)}
                  >
                    Verify with Google
                  </button>
                ) : proj.type === 'own' && proj.google_access_token && !proj.gtag ? (
                  <button
                    className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-600 shadow"
                    onClick={() => { setShowGidModal(true); setGidProject(proj); setNewGid(""); }}
                    title="Add your GA4 Measurement ID (G-ID)"
                  >
                    Add G-ID
                  </button>
                ) : proj.type === 'own' && proj.gtag ? (
                  <span className="ml-4 flex items-center gap-2 text-green-600 text-xs font-semibold bg-green-50 border border-green-200 rounded px-2 py-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    G-ID: {proj.gtag ? `G-XXXXXX${proj.gtag.slice(-4)}` : ''}
                    <button
                      className="ml-1 text-green-500 hover:text-green-700"
                      title="Copy G-ID"
                      onClick={() => navigator.clipboard.writeText(proj.gtag)}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </span>
                ) : null}
              </div>
              <div className="space-x-2 flex">
                <button
                  onClick={() => setEditProject(proj)}
                  className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => openModal(proj._id, proj.name)}
                  className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
