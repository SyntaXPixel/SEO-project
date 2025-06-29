import React, { useEffect, useState } from "react";
import API from "../services/api";
import ProjectForm from "../components/ProjectForm";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [editProject, setEditProject] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchProjects = async () => {
    const res = await API.get("/projects");
    setProjects(res.data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this project?")) {
      await API.delete(`/projects/${id}`);
      fetchProjects();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Project
        </button>
      </div>

      {showForm && (
        <ProjectForm
          fetchProjects={fetchProjects}
          editProject={editProject}
          setEditProject={setEditProject}
          closeForm={() => setShowForm(false)}
        />
      )}

      <div className="mt-4">
        <ul className="space-y-2">
          {projects.map((proj) => (
            <li
              key={proj._id}
              className="p-3 border rounded flex justify-between items-center"
            >
              <div>
                <strong>{proj.name}</strong> - {proj.url}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setEditProject(proj);
                    setShowForm(true);
                  }}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(proj._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
