import React, { useEffect, useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ProjectForm from "../components/ProjectForm";
import ProjectList from "../components/ProjectList";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [editProject, setEditProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-10 px-2">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl border border-blue-100 p-12 relative">
        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 p-3 rounded-full shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 mr-4"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-extrabold text-blue-800 text-center w-full">Projects</h1>
          </div>
          <button
            onClick={() => {
              setEditProject(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-tr from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ml-4"
          >
            <Plus className="h-5 w-5" /> Add Project
          </button>
        </div>
        {showForm && (
          <div className="mb-8">
            <ProjectForm
              fetchProjects={fetchProjects}
              editProject={editProject}
              setEditProject={setEditProject}
              closeForm={() => setShowForm(false)}
            />
          </div>
        )}
        <div className="h-[700px] overflow-y-auto">
          <ProjectList
            projects={projects}
            fetchProjects={fetchProjects}
            setEditProject={(proj) => {
              setEditProject(proj);
              setShowForm(true);
            }}
            hideHeading={true}
          />
        </div>
      </div>
    </div>
  );
}
