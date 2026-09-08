import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, Clock, AlertCircle, Search, Download,
  RefreshCw, Trash2, Eye, X, Lock, Mail, ShieldCheck,
  TrendingUp, IndianRupee, Filter, LogOut, Calendar,
  MapPin, Phone, GraduationCap, Briefcase, ChevronRight, User
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('rudram_admin_token') || '');
  const [adminUser, setAdminUser] = useState(JSON.parse(localStorage.getItem('rudram_admin_user') || 'null'));

  // Login Form State
  const [email, setEmail] = useState('admin@rudram.com');
  const [password, setPassword] = useState('Admin@12345');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard Data State
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    estimatedRevenue: 0
  });
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Load dashboard data when token is available
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, statusFilter]);

  // Handle Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid admin credentials');
      }

      setToken(data.token);
      setAdminUser(data.admin);
      localStorage.setItem('rudram_admin_token', data.token);
      localStorage.setItem('rudram_admin_user', JSON.stringify(data.admin));
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setToken('');
    setAdminUser(null);
    localStorage.removeItem('rudram_admin_token');
    localStorage.removeItem('rudram_admin_user');
  };

  // Fetch Stats & Registrations
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else if (statsRes.status === 401 || statsRes.status === 403) {
        handleLogout();
        return;
      }

      // 2. Fetch Registrations
      const regUrl = new URL(`${API_BASE_URL}/admin/registrations`);
      if (statusFilter !== 'All') regUrl.searchParams.append('status', statusFilter);
      if (search) regUrl.searchParams.append('search', search);
      regUrl.searchParams.append('limit', '500');

      const regRes = await fetch(regUrl.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (regRes.ok) {
        const regData = await regRes.json();
        setRegistrations(regData.registrations || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Payment Status
  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/registrations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus: newStatus })
      });

      if (res.ok) {
        setRegistrations(prev =>
          prev.map(item => item.id === id ? { ...item, paymentStatus: newStatus } : item)
        );
        if (selectedApplicant && selectedApplicant.id === id) {
          setSelectedApplicant(prev => ({ ...prev, paymentStatus: newStatus }));
        }
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.message || 'Status update failed');
      }
    } catch (error) {
      alert('Network error while updating status');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Registration
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this applicant registration?')) {
      return;
    }

    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/registrations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setRegistrations(prev => prev.filter(item => item.id !== id));
        if (selectedApplicant && selectedApplicant.id === id) {
          setSelectedApplicant(null);
        }
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.message || 'Deletion failed');
      }
    } catch (error) {
      alert('Network error while deleting registration');
    } finally {
      setActionLoading(null);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (registrations.length === 0) {
      alert('No data to export!');
      return;
    }

    const headers = [
      'ID', 'Candidate Name', 'Role', 'Father/Husband Name',
      'Contact Number', 'Email', 'Village', 'Post', 'Block',
      'District', 'State', 'Pin Code', 'Education', 'Payment Status',
      'Razorpay Order ID', 'Payment ID', 'Registered At'
    ];

    const rows = registrations.map(reg => [
      reg.id,
      `"${reg.name || ''}"`,
      `"${reg.role || ''}"`,
      `"${reg.fatherHusbandName || ''}"`,
      `"${reg.contactNumber || ''}"`,
      `"${reg.email || ''}"`,
      `"${reg.village || ''}"`,
      `"${reg.post || ''}"`,
      `"${reg.block || ''}"`,
      `"${reg.district || ''}"`,
      `"${reg.state || ''}"`,
      `"${reg.pinCode || ''}"`,
      `"${reg.education || ''}"`,
      `"${reg.paymentStatus || ''}"`,
      `"${reg.razorpay_order_id || ''}"`,
      `"${reg.razorpay_payment_id || ''}"`,
      `"${new Date(reg.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rudram_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter registrations by search
  const filteredRegistrations = registrations.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.contactNumber && item.contactNumber.includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.district && item.district.toLowerCase().includes(q)) ||
      (item.role && item.role.toLowerCase().includes(q))
    );
  });

  // -------------------------------------------------------------
  // VIEW: Admin Login Screen
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-slate-100">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/20 mb-4">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-teal-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">RudranPay Admin Console</h1>
            <p className="text-xs text-slate-400 mt-1">Authorized Administrative Access Only</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Admin Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rudram.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Quick credentials hint */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between items-center">
                <span>Default Email:</span>
                <code className="text-teal-400 font-mono">admin@rudram.com</code>
              </div>
              <div className="flex justify-between items-center">
                <span>Default Password:</span>
                <code className="text-teal-400 font-mono">Admin@12345</code>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 text-sm transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Session...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Access Admin Dashboard
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Admin Dashboard Main Interface
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 shadow-md">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
              RudranPay <span className="text-xs bg-teal-500/20 text-teal-300 font-semibold px-2 py-0.5 rounded-full border border-teal-500/30">Admin Console</span>
            </h1>
            <p className="text-[11px] text-slate-400">Applications & Verification Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            Refresh
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">Admin Account</div>
              <div className="text-[10px] text-teal-400 font-mono">{adminUser?.email || 'admin@rudram.com'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Logout from Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Total Applications */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Applicants</p>
                <h3 className="text-3xl font-extrabold text-white mt-1.5">{stats.totalRegistrations}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span>Registered through /register form</span>
            </div>
          </div>

          {/* Card 2: Completed Payments */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Paid / Verified</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-1.5">{stats.completedPayments}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-400/80 font-medium">
              <span>{stats.totalRegistrations > 0 ? Math.round((stats.completedPayments / stats.totalRegistrations) * 100) : 0}% Payment conversion</span>
            </div>
          </div>

          {/* Card 3: Pending Payments */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Pending</p>
                <h3 className="text-3xl font-extrabold text-amber-400 mt-1.5">{stats.pendingPayments}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>Step 2 pending completion</span>
            </div>
          </div>

          {/* Card 4: Estimated Revenue */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-cyan-500/30 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Collected</p>
                <h3 className="text-3xl font-extrabold text-cyan-400 mt-1.5">
                  ₹{stats.estimatedRevenue.toLocaleString('en-IN')}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>₹499 per completed applicant</span>
            </div>
          </div>

        </div>

        {/* Search, Filter & Actions Toolbar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, mobile, email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Filter & Export Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">

            {/* Status Filter Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['All', 'Completed', 'Pending'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${statusFilter === st
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* CSV Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export CSV</span>
            </button>

          </div>

        </div>

        {/* Applications Data Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400 mb-2" />
                      Loading registrations from database...
                    </td>
                  </tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      No candidate registrations found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-800/40 transition">

                      {/* Candidate Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {reg.photo ? (
                              <img
                                src={`${API_BASE_URL.replace(/\/api$/, '')}/${reg.photo}`}
                                alt={reg.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <User className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 text-sm">{reg.name}</div>
                            <div className="text-[11px] text-slate-500">S/O, D/O: {reg.fatherHusbandName || 'N/A'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium border border-slate-700 text-[11px]">
                          {reg.role}
                        </span>
                      </td>

                      {/* Contact Column */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Phone className="w-3 h-3 text-teal-400" />
                          <span>{reg.contactNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{reg.email}</span>
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{reg.district ? `${reg.district}, ${reg.state || ''}` : 'Not provided'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 pl-4">
                          {reg.village && `${reg.village}, `}{reg.pinCode && `PIN: ${reg.pinCode}`}
                        </div>
                      </td>

                      {/* Payment Status Column */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleStatusUpdate(reg.id, reg.paymentStatus)}
                          disabled={actionLoading === reg.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border ${reg.paymentStatus === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                          title="Click to toggle Payment Status"
                        >
                          {reg.paymentStatus === 'Completed' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{reg.paymentStatus}</span>
                        </button>
                      </td>

                      {/* Applied Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(reg.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedApplicant(reg)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4 text-teal-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(reg.id)}
                            disabled={actionLoading === reg.id}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="py-3 px-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filteredRegistrations.length} registered applicants</span>
            <span className="text-[11px] text-slate-500">Live synchronized with MySQL database</span>
          </div>
        </div>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Full Applicant Profile Details                         */}
      {/* ------------------------------------------------------------- */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-slate-100">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedApplicant.name}</h3>
                  <p className="text-xs text-slate-400">Application ID: #{selectedApplicant.id} • {selectedApplicant.role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Photo & Status */}
              <div className="flex flex-col items-center text-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="w-32 h-32 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden mb-3 shadow-inner">
                  {selectedApplicant.photo ? (
                    <img
                      src={`${API_BASE_URL.replace(/\/api$/, '')}/${selectedApplicant.photo}`}
                      alt={selectedApplicant.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-sm text-white">{selectedApplicant.name}</div>
                <div className="text-xs text-teal-400 mt-0.5">{selectedApplicant.role}</div>

                <div className="mt-4 pt-3 border-t border-slate-800 w-full flex flex-col gap-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Payment Status</div>
                  <button
                    onClick={() => handleStatusUpdate(selectedApplicant.id, selectedApplicant.paymentStatus)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${selectedApplicant.paymentStatus === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                  >
                    {selectedApplicant.paymentStatus} (Click to toggle)
                  </button>
                </div>
              </div>

              {/* Complete Information Details */}
              <div className="md:col-span-2 space-y-4 text-xs">

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-400" /> Personal & Education
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Father / Husband Name</span>
                      <span className="font-medium">{selectedApplicant.fatherHusbandName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Education Qualification</span>
                      <span className="font-medium">{selectedApplicant.education || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Mobile Contact</span>
                      <span className="font-medium text-teal-300">{selectedApplicant.contactNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Email Address</span>
                      <span className="font-medium">{selectedApplicant.email}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" /> Complete Address
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Village / Town</span>
                      <span className="font-medium">{selectedApplicant.village || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Post Office</span>
                      <span className="font-medium">{selectedApplicant.post || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Block / Tehsil</span>
                      <span className="font-medium">{selectedApplicant.block || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">District & State</span>
                      <span className="font-medium">{selectedApplicant.district}, {selectedApplicant.state}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Postal PIN Code</span>
                      <span className="font-mono font-medium text-teal-300">{selectedApplicant.pinCode || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Registered On</span>
                      <span className="font-medium">{new Date(selectedApplicant.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Gateway Meta */}
                {selectedApplicant.razorpay_order_id && (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Razorpay Order:</span>
                      <span className="text-slate-300">{selectedApplicant.razorpay_order_id}</span>
                    </div>
                    {selectedApplicant.razorpay_payment_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payment ID:</span>
                        <span className="text-emerald-400">{selectedApplicant.razorpay_payment_id}</span>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
