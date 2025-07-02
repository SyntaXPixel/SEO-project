import React, { useState, useEffect } from "react";
import { X, Folder, Link2 } from "lucide-react";
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

  useEffect(() => {
    setShow(true);
    if (editProject) {
      setName(editProject.name);
      setUrl(editProject.url);
      setType(editProject.type || "own");
    } else {
      setType("own");
    }
  }, [editProject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProject) {
        await API.put(`/projects/${editProject._id}`, { name, url, type });
        setModalError(null);
      } else {
        await API.post("/projects", { name, url, type });
        setModalError(null);
      }
      fetchProjects();
      setName("");
      setUrl("");
      setEditProject(null);
      setTimeout(() => closeForm(), 1000);
    } catch (err) {
      // Show specific error for duplicate URL or name
      let msg = "Error saving project";
      if (err.response && err.response.data && err.response.data.message) {
        if (err.response.data.message.includes("URL already exists")) {
          msg = `A project with the URL \"${url}\" already exists.`;
        } else if (err.response.data.message.includes("name already exists")) {
          msg = `A project with the name \"${name}\" already exists.`;
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
        <p className="text-center text-blue-400 mb-6">{editProject ? "Update your project details below." : "Add a new project to your dashboard."}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="flex space-x-3 justify-center mt-6">
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-tr from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {editProject ? "Update" : "Add"}
            </button>
            <button
              type="button"
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-8 py-3 rounded-xl font-bold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-100"
              onClick={() => {
                setEditProject(null);
                closeForm();
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
