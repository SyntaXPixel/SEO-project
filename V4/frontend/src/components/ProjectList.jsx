import API from "../services/api";
import { Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";

export default function ProjectList({ projects, fetchProjects, setEditProject, hideHeading }) {
  const [confirmId, setConfirmId] = useState(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [showModal, setShowModal] = useState(false);

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
