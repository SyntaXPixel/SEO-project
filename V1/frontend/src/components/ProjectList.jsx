import API from "../services/api";

export default function ProjectList({ projects, fetchProjects, setEditProject }) {
  // 🔥 Delete Project Function
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await API.delete(`/projects/${id}`);
        fetchProjects(); // Refresh the list after deleting
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl mb-2">Project List</h2>
      <ul className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-gray-500">No projects found.</p>
        ) : (
          projects.map((proj) => (
            <li
              key={proj._id}
              className="p-3 border rounded flex justify-between items-center"
            >
              <div>
                <strong>{proj.name}</strong> - {proj.url}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setEditProject(proj)}
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
          ))
        )}
      </ul>
    </div>
  );
}
