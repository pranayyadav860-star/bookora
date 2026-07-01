// client/src/pages/AdminUsers.js
// UPDATED - Added Owners tab with full management

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  BuildingOfficeIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, admins, owners, users
  const [showMakeAdminModal, setShowMakeAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check admin access
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const res = await fetch("https://bookora-server-22ox.onrender.com/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      loadUsers();
    }
  }, [user]);

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://bookora-server-22ox.onrender.com/api/users/role/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        setSuccess(`User role updated to ${newRole}`);
        loadUsers();
        setEditingRole(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update role");
      }
    } catch (err) {
      setError("Error updating role");
    }
  };

  const deleteUser = async (userId, userEmail) => {
    if (userEmail === user?.email) {
      setError("You cannot delete your own account");
      return;
    }
    
    if (!window.confirm(`Delete user ${userEmail}? This cannot be undone!`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://bookora-server-22ox.onrender.com/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        setSuccess("User deleted successfully");
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to delete user");
      }
    } catch (err) {
      setError("Error deleting user");
    }
  };

  const makeNewAdmin = async () => {
    if (!adminEmail) {
      setError("Please enter an email address");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://bookora-server-22ox.onrender.com/api/auth/make-admin/${adminEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        setSuccess(`${adminEmail} is now an admin!`);
        setShowMakeAdminModal(false);
        setAdminEmail("");
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("User not found. Make sure the email is registered.");
      }
    } catch (err) {
      setError("Error making admin");
    }
  };

  // Filter users based on active tab and search
  const getFilteredUsers = () => {
    let filtered = users;
    
    if (activeTab === "admins") {
      filtered = filtered.filter(u => u.role === "admin");
    } else if (activeTab === "owners") {
      filtered = filtered.filter(u => u.role === "owner");
    } else if (activeTab === "users") {
      filtered = filtered.filter(u => u.role === "user");
    }
    
    if (search) {
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return filtered;
  };

  const admins = users.filter(u => u.role === "admin");
  const owners = users.filter(u => u.role === "owner");
  const regularUsers = users.filter(u => u.role === "user");
  const filteredUsers = getFilteredUsers();

  const stats = {
    total: users.length,
    admins: admins.length,
    owners: owners.length,
    users: regularUsers.length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">← Back</Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                <p className="text-sm text-gray-500 mt-1">View, manage and promote users, owners and admins</p>
              </div>
            </div>
            <button
              onClick={() => setShowMakeAdminModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-700 transition"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Make New Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards - Now 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-purple-50 rounded-2xl p-6 shadow-sm border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">Admins</p>
                <p className="text-3xl font-bold text-purple-700">{stats.admins}</p>
              </div>
              <ShieldCheckIcon className="h-10 w-10 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">Hotel Owners</p>
                <p className="text-3xl font-bold text-blue-700">{stats.owners}</p>
              </div>
              <BuildingOfficeIcon className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-green-50 rounded-2xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">Regular Users</p>
                <p className="text-3xl font-bold text-green-700">{stats.users}</p>
              </div>
              <UserIcon className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><XMarkIcon className="h-5 w-5" /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircleIcon className="h-5 w-5" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto"><XMarkIcon className="h-5 w-5" /></button>
          </div>
        )}

        {/* Tabs - Now 4 tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "all"
                  ? "text-yellow-600 border-b-2 border-yellow-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Users ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab("admins")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "admins"
                  ? "text-purple-600 border-b-2 border-purple-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              👑 Admins ({stats.admins})
            </button>
            <button
              onClick={() => setActiveTab("owners")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "owners"
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🏨 Hotel Owners ({stats.owners})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "users"
                  ? "text-green-600 border-b-2 border-green-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              👤 Regular Users ({stats.users})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "admins" ? "admins" : activeTab === "owners" ? "hotel owners" : activeTab === "users" ? "regular users" : "users"} by name or email...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Hotels Owned</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                    u.role === "admin" ? "bg-purple-50/30" : u.role === "owner" ? "bg-blue-50/30" : ""
                  }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          u.role === "admin" ? "bg-purple-100" : u.role === "owner" ? "bg-blue-100" : "bg-yellow-100"
                        }`}>
                          <span className={u.role === "admin" ? "text-purple-600 font-bold" : u.role === "owner" ? "text-blue-600 font-bold" : "text-yellow-600 font-bold"}>
                            {u.name?.charAt(0) || u.email?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{u.name || "N/A"}</span>
                          {u.email === user?.email && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      {editingRole === u._id ? (
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="border rounded-lg px-2 py-1 text-sm"
                        >
                          <option value="user">👤 User</option>
                          <option value="owner">🏨 Owner</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === "admin" 
                            ? "bg-purple-100 text-purple-700" 
                            : u.role === "owner"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {u.role === "admin" ? "👑 Admin" : u.role === "owner" ? "🏨 Owner" : "👤 User"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.role === "owner" ? (
                        <span className="flex items-center gap-1 text-sm text-blue-600">
                          <HomeIcon className="h-4 w-4" />
                          {u.hotelIds?.length || 0} hotels
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {editingRole === u._id ? (
                          <>
                            <button
                              onClick={() => updateUserRole(u._id, selectedRole)}
                              className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingRole(null)}
                              className="bg-gray-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingRole(u._id);
                                setSelectedRole(u.role);
                              }}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Change Role"
                            >
                              <ShieldCheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => deleteUser(u._id, u.email)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete User"
                              disabled={u.email === user?.email}
                            >
                              <TrashIcon className={`h-5 w-5 ${u.email === user?.email ? "opacity-50 cursor-not-allowed" : ""}`} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No {activeTab === "admins" ? "admins" : activeTab === "owners" ? "hotel owners" : activeTab === "users" ? "regular users" : "users"} found</p>
            </div>
          )}
        </div>
      </div>

      {/* Make Admin Modal */}
      {showMakeAdminModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Make New Admin</h2>
              <button onClick={() => setShowMakeAdminModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Enter the email address of the user you want to make an admin.
              <br />
              <span className="text-sm text-gray-400">Note: User must be already registered.</span>
            </p>
            <input
              type="email"
              placeholder="user@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={makeNewAdmin}
                className="flex-1 bg-purple-600 text-white py-2 rounded-xl font-semibold hover:bg-purple-700 transition"
              >
                Make Admin
              </button>
              <button
                onClick={() => setShowMakeAdminModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;