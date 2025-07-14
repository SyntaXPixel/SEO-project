import React, { useState, useEffect } from "react";
import { X, Folder, Link2, Info, Copy } from "lucide-react";
import API from "../services/api";

function CenteredModal({ message, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col items-center">
        <h3 className="text-lg font-bold text-red-600 mb-2">Error</h3>
        <p className="mb-4 text-gray-700 text-center">{message}</p>
        <button
          onClick={onClose}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold mt-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function ProjectForm({ fetchProjects, editProject, setEditProject, closeForm }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("own"); // 'own' or 'global'
  const [modalError, setModalError] = useState(null);
  const [show, setShow] = useState(false);
  const [gtag, setGtag] = useState("");
  const [oauthVerified, setOauthVerified] = useState(false);
  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const [gidError, setGidError] = useState("");

  useEffect(() => {
    setShow(true);
    if (editProject) {
      setName(editProject.name);
      setUrl(editProject.url);
      setType(editProject.type || "own");
      setGtag(editProject.gtag || "");
      // Check if project is already Google verified
      setIsGoogleVerified(!!editProject.google_access_token);
      setOauthVerified(true); // In edit mode, always show full form
    } else {
      setType("own");
      setGtag("");
      setIsGoogleVerified(false);
      // Check for OAuth callback
      const params = new URLSearchParams(window.location.search);
      if (params.get("code") && params.get("state")) {
        setOauthVerified(true);
      } else {
        setOauthVerified(false);
      }
    }
  }, [editProject]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state) {
      try {
        const projectUrl = decodeURIComponent(state);
        // Get user ID from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id;
        
        if (!userId) {
          console.error('No user ID found');
          return;
        }

        console.log('Processing OAuth callback:', { code, projectUrl, userId });
        
        fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': userId
          },
          body: JSON.stringify({ code, projectUrl })
        })
          .then(res => {
            console.log('OAuth callback response status:', res.status);
            return res.json();
          })
          .then(data => {
            console.log('OAuth callback response:', data);
            if (data.message === "Tokens saved to project") {
              // Refresh project list
              fetchProjects();
            }
          })
          .catch(err => {
            console.error('OAuth callback error:', err);
          });
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Error processing OAuth callback:', err);
      }
    }
  }, [fetchProjects]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!name || !url) {
      setModalError("Please fill in both Project Name and Website URL before verifying.");
      return;
    }
    try {
      // Add project to DB before OAuth
      await API.post("/projects", { name, url, type });
      // Now redirect to Google OAuth
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "788632825644-ipodtj4hl8j4oo1uj57f3016sr5ajiaf.apps.googleusercontent.com";
      const redirectUri = "http://localhost:3000/projects";
      const scope = [
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/webmasters.readonly"
      ].join(" ");
      const state = encodeURIComponent(url); // Only the site URL
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scope)}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${state}`;
      window.location.href = oauthUrl;
    } catch (err) {
      let msg = "Error saving project before OAuth";
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setModalError(msg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGidError("");
    const gidPattern = /^G-[A-Z0-9]{10}$/;
    if (gtag && !gidPattern.test(gtag)) {
      setGidError("G-ID must start with G- and be followed by 10 uppercase letters or digits (no spaces or special characters).");
      return;
    }
    try {
      if (editProject) {
        await API.put(`/projects/${editProject._id}`, { name, url, type, gtag });
        setModalError(null);
      } else {
        await API.post("/projects", { name, url, type, gtag });
        setModalError(null);
      }
      fetchProjects();
      setName("");
      setUrl("");
      setGtag("");
      setEditProject(null);
      setTimeout(() => closeForm(), 1000);
    } catch (err) {
      let msg = "Error saving project";
      if (err.response && err.response.data && err.response.data.message) {
        if (err.response.data.message.includes("URL already exists")) {
          msg = `A project with the URL \"${url}\" already exists.`;
        } else if (err.response.data.message.includes("name already exists")) {
          msg = `A project with the name \"${name}\" already exists.`;
        } else if (err.response.data.message.includes("Google OAuth not completed")) {
          msg = err.response.data.message;
        } else if (err.response.data.message.includes("G-ID") && err.response.data.available_properties) {
          msg = `${err.response.data.message}\n\nAvailable G-IDs in your account:\n${err.response.data.available_properties.join(', ')}`;
        } else {
          msg = err.response.data.message;
        }
      }
      setModalError(msg);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mb-8">
      {modalError && <CenteredModal message={modalError} onClose={() => setModalError(null)} />}
      <div className={`relative bg-white p-8 rounded-2xl shadow-lg border border-blue-100 transition-all duration-500 ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
        style={{ boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.10)' }}>
        <button
          type="button"
          className="absolute top-4 right-4 text-blue-300 hover:text-blue-600 focus:outline-none"
          aria-label="Close form"
          onClick={() => {
            setEditProject(null);
            closeForm();
          }}
        >
          <X className="h-6 w-6" />
        </button>
        {/* Project Type Selection (only when adding) */}
        {!editProject && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              type="button"
              className={`px-6 py-2 rounded-lg font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${type === 'own' ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
              onClick={() => setType('own')}
            >
              Own Site (GSC)
            </button>
            <button
              type="button"
              className={`px-6 py-2 rounded-lg font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${type === 'global' ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
              onClick={() => setType('global')}
            >
              Global Site (Public)
            </button>
          </div>
        )}
        <p className="text-center text-blue-400 mb-6">{!editProject ? "Add a new project to your dashboard." : ""}</p>
        <form onSubmit={editProject ? handleSubmit : handleVerify} className="space-y-6">
          {/* Step 1: Project fields + Verify button (if not editing and not already verified) */}
          {(!editProject && !isGoogleVerified) && (
            <>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"><Folder className="h-5 w-5" /></span>
                <input
                  type="text"
                  id="project-name"
                  className="peer w-full border border-blue-200 p-3 pl-12 pt-6 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-transparent bg-white/80"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Project Name"
                  autoComplete="off"
                />
                <label
                  htmlFor="project-name"
                  className="absolute left-12 top-3 text-blue-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm bg-white/80 px-1 pointer-events-none"
                >
                  Project Name
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"><Link2 className="h-5 w-5" /></span>
                <input
                  type="url"
                  id="project-url"
                  className="peer w-full border border-blue-200 p-3 pl-12 pt-6 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-transparent bg-white/80"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="Website URL"
                  autoComplete="off"
                  pattern="https?://.+"
                />
                <label
                  htmlFor="project-url"
                  className="absolute left-12 top-3 text-blue-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm bg-white/80 px-1 pointer-events-none"
                >
                  Website URL
                </label>
                <span className="block text-xs text-blue-300 mt-1 ml-12">e.g. https://example.com</span>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gradient-to-tr from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  Verify with Google
                </button>
              </div>
            </>
          )}
          {/* If already verified, show a message and G-code input */}
          {isGoogleVerified && (
            <>
              <div className="text-green-600 text-center font-semibold my-4">
                This site is already verified with Google.
              </div>
              <div className="mt-8 p-4 rounded-xl border border-blue-200 bg-blue-50">
                <div className="flex items-center mb-2">
                  <span className="font-semibold text-blue-700 mr-2">GA4 Measurement ID</span>
                  <span className="text-xs text-blue-400">(G-code)</span>
                  <button
                    type="button"
                    className="ml-2 text-blue-400 hover:text-blue-600"
                    title="Find your G-code in Google Analytics property settings"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="ga4-measurement-id"
                    className="flex-1 border border-blue-300 rounded-lg p-2"
                    value={gtag}
                    onChange={e => { setGtag(e.target.value.toUpperCase()); setGidError(""); }}
                    placeholder="G-XXXXXXXXXX"
                    autoComplete="off"
                    pattern="^G-[A-Z0-9]{10}$"
                    maxLength={12}
                  />
                  {gidError && <div className="text-red-500 text-xs text-center w-full">{gidError}</div>}
                  {gtag && (
                    <button
                      type="button"
                      className="text-green-600 hover:text-green-800"
                      onClick={() => navigator.clipboard.writeText(gtag)}
                      title="Copy G-code"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <span className="block text-xs text-blue-400 mt-1">
                  Example: G-XXXXXXXXXX. This connects your project to Google Analytics 4.
                </span>
              </div>
            </>
          )}
          {/* Edit mode: show full form as before */}
          {editProject && (
            <>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"><Folder className="h-5 w-5" /></span>
                <input
                  type="text"
                  id="project-name"
                  className="peer w-full border border-blue-200 p-3 pl-12 pt-6 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-transparent bg-white/80"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Project Name"
                  autoComplete="off"
                />
                <label
                  htmlFor="project-name"
                  className="absolute left-12 top-3 text-blue-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm bg-white/80 px-1 pointer-events-none"
                >
                  Project Name
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"><Link2 className="h-5 w-5" /></span>
                <input
                  type="url"
                  id="project-url"
                  className="peer w-full border border-blue-200 p-3 pl-12 pt-6 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-transparent bg-white/80"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="Website URL"
                  autoComplete="off"
                  pattern="https?://.+"
                />
                <label
                  htmlFor="project-url"
                  className="absolute left-12 top-3 text-blue-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm bg-white/80 px-1 pointer-events-none"
                >
                  Website URL
                </label>
                <span className="block text-xs text-blue-300 mt-1 ml-12">e.g. https://example.com</span>
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 font-bold px-8 py-3 rounded-xl"
                  onClick={() => {
                    setEditProject(null);
                    closeForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
