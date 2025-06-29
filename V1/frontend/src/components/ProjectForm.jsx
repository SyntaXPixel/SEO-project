import React, { useState, useEffect } from "react";
import API from "../services/api";

export default function ProjectForm({ fetchProjects, editProject, setEditProject, closeForm }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (editProject) {
      setName(editProject.name);
      setUrl(editProject.url);
    }
  }, [editProject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProject) {
        await API.put(`/projects/${editProject._id}`, { name, url });
        alert("Project updated!");
      } else {
        await API.post("/projects", { name, url });
        alert("Project added!");
      }
      fetchProjects();
      setName("");
      setUrl("");
      setEditProject(null);
      closeForm();
    } catch (err) {
      alert("Error saving project");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl mb-2">{editProject ? "Edit Project" : "Add Project"}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Project Name"
          className="w-full border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="url"
          placeholder="Website URL"
          className="w-full border p-2 rounded"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <div className="flex space-x-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editProject ? "Update" : "Add"}
          </button>
          <button
            type="button"
            className="bg-gray-400 text-white px-4 py-2 rounded"
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
  );
}
