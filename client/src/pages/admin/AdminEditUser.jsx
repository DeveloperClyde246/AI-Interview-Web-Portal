import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/admin/AdminEditUser.css";

const AdminEditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", role: "candidate" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/admin-dashboard", {
          withCredentials: true,
        });
        const user = res.data.find((u) => u._id === id);
        if (user) {
          setForm({ name: user.name, email: user.email, role: user.role });
        } else {
          alert("User not found.");
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
        alert("Failed to load user from server.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:5000/admin-dashboard/edit/${id}`,
        form,
        { withCredentials: true }
      );
      navigate("/admin");
    } catch (err) {
      console.error("❌ Update error:", err);
      if (err.response?.status === 400) {
        alert("Invalid input. All fields are required.");
      } else if (err.response?.status === 500) {
        alert("Server error while updating user.");
      } else {
        alert("Failed to update user.");
      }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="edit-user-container">
      <div className="edit-user-card">
        <h2>Edit User</h2>
        <form onSubmit={handleSubmit} className="edit-user-form">
          <label htmlFor="name">Name:</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <br/>
          <br/>
          <button type="submit" className="save-btn">
            Save Changes
          </button>
        </form>
        <button onClick={() => navigate("/admin")} className="back-btn">
          Back
        </button>
      </div>
    </div>
  );
};

export default AdminEditUser;
