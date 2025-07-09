import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, BarChart3, Settings, User, Plus, TrendingUp, Link, FileText, 
  Globe, Zap, Target, Eye, CheckCircle, AlertTriangle, RefreshCw,
  ChevronDown, Menu, X, Home, Users, Activity, Code, ExternalLink, Info, ListChecks, ShieldCheck, Smartphone
} from 'lucide-react';
import API from '../services/api';

const SEODashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [onPageSubView, setOnPageSubView] = useState('overview');
  const [contentInput, setContentInput] = useState({ topic: '', tone: 'Neutral', length: 'Medium' });
  const [generatedContent, setGeneratedContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [contentHighlight, setContentHighlight] = useState(false);
  const [directTraffic, setDirectTraffic] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficError, setTrafficError] = useState(null);
  const [unassignedTraffic, setUnassignedTraffic] = useState(null);
  const [unassignedTrafficLoading, setUnassignedTrafficLoading] = useState(false);
  const [unassignedTrafficError, setUnassignedTrafficError] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [realtimeError, setRealtimeError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      fetchUserProjects();
    } else {
      navigate('/');
    }
  }, []);

  const fetchUserProjects = async () => {
    try {
      setLoading(true);
      const response = await API.get('/projects');
      setUserProjects(response.data);
      // Set the first project as selected if available
      if (response.data.length > 0) {
        setSelectedProject(response.data[0].name);
        setSelectedProjectId(response.data[0]._id);
        fetchDirectTraffic(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectTraffic = async (projectId) => {
    if (!projectId) return;
    
    setTrafficLoading(true);
    setTrafficError(null);
    
    try {
      const response = await API.get(`/projects/${projectId}/direct-traffic`);
      console.log('Direct traffic response:', response.data);
      setDirectTraffic(response.data);
    } catch (error) {
      console.error('Error fetching direct traffic:', error);
      setTrafficError(error.response?.data?.message || 'Failed to fetch direct traffic');
      setDirectTraffic(null);
    } finally {
      setTrafficLoading(false);
    }
  };

  const fetchUnassignedTraffic = async (projectId) => {
    if (!projectId) return;
    setUnassignedTrafficLoading(true);
    setUnassignedTrafficError(null);
    try {
      const response = await API.get(`/projects/${projectId}/unassigned-traffic`);
      setUnassignedTraffic(response.data.unassignedTraffic);
    } catch (error) {
      setUnassignedTrafficError(error.response?.data?.message || 'Failed to fetch unassigned traffic');
      setUnassignedTraffic(null);
    } finally {
      setUnassignedTrafficLoading(false);
    }
  };

  const fetchRealtimeMetrics = async (projectId) => {
    if (!projectId) return;
    setRealtimeLoading(true);
    setRealtimeError(null);
    try {
      const response = await API.get(`/projects/${projectId}/realtime-metrics`);
      setRealtimeMetrics(response.data);
    } catch (error) {
      setRealtimeError(error.response?.data?.message || 'Failed to fetch realtime metrics');
      setRealtimeMetrics(null);
    } finally {
      setRealtimeLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchUnassignedTraffic(selectedProjectId);
      fetchRealtimeMetrics(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleProjectSelect = (projectName) => {
    setSelectedProject(projectName);
    // Find the project ID from userProjects
    const project = userProjects.find(p => p.name === projectName);
    if (project) {
      setSelectedProjectId(project._id);
      fetchDirectTraffic(project._id);
    }
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Restore Content Writer handlers
  const handleContentInputChange = (e) => {
    const { name, value } = e.target;
    setContentInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateContent = (e) => {
    e.preventDefault();
    setGenerating(true);
    setTimeout(() => {
      setGeneratedContent(
        `Generated (${contentInput.tone}, ${contentInput.length}):\n\n` +
        `This is an AI-generated article about "${contentInput.topic}".\n\n[Demo content for ${contentInput.length} length and ${contentInput.tone} tone.]`
      );
      setGenerating(false);
      setContentHighlight(true);
      setTimeout(() => setContentHighlight(false), 800);
    }, 1200);
  };

  const handleCopyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
    }
  };

  const handleRegenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGeneratedContent(
        `Generated (${contentInput.tone}, ${contentInput.length}):\n\n` +
        `This is an AI-regenerated article about "${contentInput.topic}".\n\n[Demo content for ${contentInput.length} length and ${contentInput.tone} tone.]`
      );
      setGenerating(false);
      setContentHighlight(true);
      setTimeout(() => setContentHighlight(false), 800);
    }, 1200);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  // Mock data for demonstration
  const projects = [
    { id: 1, name: 'Website 1', domain: 'example.com', traffic: 15420, keywords: 234 },
    { id: 2, name: 'E-commerce Site', domain: 'shop.com', traffic: 8950, keywords: 156 },
    { id: 3, name: 'Blog Platform', domain: 'myblog.net', traffic: 12300, keywords: 189 }
  ];

  const kpiData = {
    organicTraffic: {},
    keywordRankings: {},
    backlinks: {},
    pageSpeed: {}
  };

  // Navigation structure
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { 
      id: 'onpage', 
      name: 'On Page SEO', 
      icon: FileText,
      submenu: [
        { id: 'site-audit', name: 'Site Audit' },
        { id: 'content-template', name: 'SEO Content Template' },
        { id: 'keyword-planner', name: 'Keyword Planner' },
        { id: 'content-optimizer', name: 'Content Optimizer' },
        { id: 'log-analyzer', name: 'Log File Analyzer' },
        { id: 'content-writer', name: 'On Page Content Writer' }
      ]
    },
    { 
      id: 'offpage', 
      name: 'Off Page SEO', 
      icon: Link,
      submenu: [
        { id: 'backlink-analytics', name: 'Backlink Analytics' },
        { id: 'backlink-creation', name: 'Backlink Creation' },
        { id: 'competitor-backlinks', name: 'Competitor Backlink Analysis' },
        { id: 'backlink-gap', name: 'Backlink Gap Analysis' },
        { id: 'master-database', name: 'Master Backlink Database' }
      ]
    },
    { 
      id: 'technical', 
      name: 'Technical SEO', 
      icon: Code,
      submenu: [
        { id: 'page-speed', name: 'Page Speed Insights' },
        { id: 'js-errors', name: 'JavaScript Error Detection' },
        { id: 'error-reporting', name: 'Error Reporting' },
        { id: 'ai-resolution', name: 'AI-driven Issue Resolution' }
      ]
    },
    { id: 'competitor', name: 'Competitor Analysis', icon: Users }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-end">
        {/* Active Users (last 30 min) */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users (last 30 min)</p>
              {realtimeLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 w-24 bg-gray-200 rounded"></div>
                </div>
              ) : realtimeError ? (
                <div className="flex items-center text-red-500 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {realtimeError}
                </div>
              ) : realtimeMetrics !== null ? (
                <>
                  <p className="text-2xl font-bold">{realtimeMetrics.activeUsers?.toLocaleString() || '0'}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Desktop:</span>
                      <span className="font-medium">{realtimeMetrics.deviceBreakdown?.percent?.desktop ?? realtimeMetrics.deviceBreakdown?.percent?.Desktop ?? 0}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mobile:</span>
                      <span className="font-medium">{realtimeMetrics.deviceBreakdown?.percent?.mobile ?? realtimeMetrics.deviceBreakdown?.percent?.Mobile ?? 0}%</span>
                    </div>
                    {realtimeMetrics.deviceBreakdown?.percent?.tablet !== undefined || realtimeMetrics.deviceBreakdown?.percent?.Tablet !== undefined ? (
                      <div className="flex items-center justify-between">
                        <span>Tablet:</span>
                        <span className="font-medium">{realtimeMetrics.deviceBreakdown?.percent?.tablet ?? realtimeMetrics.deviceBreakdown?.percent?.Tablet ?? 0}%</span>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-400">--</p>
              )}
            </div>
            <TrendingUp className={`h-8 w-8 ${realtimeMetrics !== null ? 'text-blue-600' : 'text-gray-300'}`} />
          </div>
        </div>
        {/* Views (last 30 min) */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Views (last 30 min)</p>
              {realtimeLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 w-24 bg-gray-200 rounded"></div>
                </div>
              ) : realtimeError ? (
                <div className="flex items-center text-red-500 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {realtimeError}
                </div>
              ) : realtimeMetrics !== null ? (
                <>
                  <p className="text-2xl font-bold">{realtimeMetrics.viewsLast30Min?.toLocaleString() || '0'}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Top Page:</span>
                      <span className="font-medium truncate max-w-32" title={realtimeMetrics.topPage?.pagePath || 'No data'}>
                        {realtimeMetrics.topPage?.pagePath || 'No data'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Page Views:</span>
                      <span className="font-medium">{realtimeMetrics.topPage?.screenPageViews?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-400">--</p>
              )}
            </div>
            <TrendingUp className={`h-8 w-8 ${realtimeMetrics !== null ? 'text-blue-600' : 'text-gray-300'}`} />
          </div>
        </div>
        {/* Direct Traffic Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Direct Traffic</p>
              {trafficLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ) : trafficError ? (
                <div className="flex items-center text-red-500 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {trafficError === 'ga4_not_configured' ? 'GA4 not set up' : 'Error loading data'}
                </div>
              ) : directTraffic !== null && directTraffic.organicTraffic ? (
                <>
                  <p className="text-2xl font-bold">{directTraffic.organicTraffic.totalUsers?.toLocaleString() || '0'}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Last 7 days</span>
                    <span className="text-green-500">
                      ({directTraffic.organicTraffic.totalUsers && directTraffic.organicTraffic.newUsers ? Math.round((directTraffic.organicTraffic.newUsers / directTraffic.organicTraffic.totalUsers) * 100) : 0}% new)
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Sessions:</span>
                      <span className="font-medium">{directTraffic.organicTraffic.sessions?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>New Users:</span>
                      <span className="font-medium">{directTraffic.organicTraffic.newUsers?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-400">--</p>
              )}
            </div>
            <TrendingUp className={`h-8 w-8 ${directTraffic !== null && directTraffic.organicTraffic ? 'text-blue-600' : 'text-gray-300'}`} />
          </div>
        </div>
        {/* Unassigned Traffic Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unassigned Traffic</p>
              {unassignedTrafficLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ) : unassignedTrafficError ? (
                <div className="flex items-center text-red-500 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {unassignedTrafficError === 'ga4_not_configured' ? 'GA4 not set up' : 'Error loading data'}
                </div>
              ) : unassignedTraffic !== null ? (
                <>
                  <p className="text-2xl font-bold">{unassignedTraffic.totalUsers?.toLocaleString() || '0'}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Last 7 days</span>
                    <span className="text-green-500">
                      ({unassignedTraffic.totalUsers && unassignedTraffic.newUsers ? Math.round((unassignedTraffic.newUsers / unassignedTraffic.totalUsers) * 100) : 0}% new)
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Sessions:</span>
                      <span className="font-medium">{unassignedTraffic.sessions?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>New Users:</span>
                      <span className="font-medium">{unassignedTraffic.newUsers?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-400">--</p>
              )}
            </div>
            <TrendingUp className={`h-8 w-8 ${unassignedTraffic !== null ? 'text-blue-600' : 'text-gray-300'}`} />
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            AI Recommendations
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            { priority: 'High', task: 'Fix 15 broken internal links on product pages', impact: 'High' },
            { priority: 'Medium', task: 'Optimize meta descriptions for 23 blog posts', impact: 'Medium' },
            { priority: 'High', task: 'Improve page speed for mobile devices', impact: 'High' }
          ].map((rec, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rec.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {rec.priority}
                  </span>
                  <p className="text-sm font-medium">{rec.task}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Expected Impact: {rec.impact}</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Automate Fix
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Traffic & Rankings Trend</h2>
        </div>
        <div className="p-6">
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart visualization would be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOnPageSEO = () => {
    if (onPageSubView === 'content-writer') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-10 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">AI Content Writer</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-10">
              {/* Input Side */}
              <div className="flex-1 bg-gray-50 rounded-xl shadow p-8 flex flex-col justify-between min-h-[420px] max-h-[600px]">
                <div>
                  <h4 className="font-semibold text-lg mb-4 text-blue-700">Content Settings</h4>
                  <form onSubmit={handleGenerateContent} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Topic / Keyword</label>
                      <textarea
                        name="topic"
                        value={contentInput.topic}
                        onChange={handleContentInputChange}
                        required
                        rows={5}
                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-vertical min-h-[120px] max-h-[220px]"
                        placeholder="e.g. SEO best practices, or paste your prompt here..."
                      />
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Tone</label>
                        <select
                          name="tone"
                          value={contentInput.tone}
                          onChange={handleContentInputChange}
                          className="w-full border rounded-lg px-4 py-2"
                        >
                          <option>Neutral</option>
                          <option>Formal</option>
                          <option>Informal</option>
                          <option>Persuasive</option>
                          <option>Friendly</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Length</label>
                        <select
                          name="length"
                          value={contentInput.length}
                          onChange={handleContentInputChange}
                          className="w-full border rounded-lg px-4 py-2"
                        >
                          <option>Short</option>
                          <option>Medium</option>
                          <option>Long</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                      disabled={generating}
                    >
                      {generating ? 'Generating...' : 'Generate Content'}
                    </button>
                  </form>
                </div>
              </div>
              {/* Output Side */}
              <div className="flex-1 bg-white rounded-xl shadow border p-8 flex flex-col min-h-[420px] max-h-[600px]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-lg text-blue-700">Generated Content</h4>
                  {generatedContent && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyContent}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold border border-blue-200"
                      >
                        Copy
                      </button>
                      <button
                        onClick={handleRegenerate}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-semibold border border-gray-200"
                        disabled={generating}
                      >
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>
                <div
                  className={`relative transition-all duration-500 flex-1 ${contentHighlight ? 'ring-2 ring-blue-400 bg-blue-50' : 'bg-gray-50'} border rounded-lg p-4 font-mono text-gray-800 whitespace-pre-line min-h-[220px] max-h-[380px] overflow-auto`}
                >
                  {generatedContent ? generatedContent : (
                    <span className="text-gray-400 font-normal">Generated content will appear here...</span>
                  )}
                </div>
                {generatedContent && (
                  <div className="mt-2 text-xs text-gray-500 text-right">
                    {generatedContent.split(/\s+/).filter(Boolean).length} words, {generatedContent.length} chars
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    // On Page SEO Overview with impressive visuals and test data/results for each section
    return (
      <div className="space-y-8">
        {/* Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
          <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-900">425</div>
              <div className="text-xs text-blue-700 font-semibold">Total Clicks</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-900">8</div>
              <div className="text-xs text-green-700 font-semibold">Valid Pages</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">1</div>
              <div className="text-xs text-yellow-700 font-semibold">Warnings</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-100 to-red-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
            <BarChart3 className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-900">1</div>
              <div className="text-xs text-red-700 font-semibold">Errors</div>
            </div>
          </div>
        </div>

        {/* 1. Performance Report */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-blue-700">1. Performance Report</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Query</th>
                  <th className="py-2 text-left">Clicks</th>
                  <th className="py-2 text-left">Impressions</th>
                  <th className="py-2 text-left">CTR</th>
                  <th className="py-2 text-left">Avg. Position</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { query: 'seo audit tool', clicks: 120, impressions: 1500, ctr: '8.0%', pos: 4.2 },
                  { query: 'on page seo', clicks: 95, impressions: 1100, ctr: '8.6%', pos: 5.1 },
                  { query: 'meta description example', clicks: 60, impressions: 900, ctr: '6.7%', pos: 7.3 }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 font-medium">{row.query}</td>
                    <td className="py-2">{row.clicks}</td>
                    <td className="py-2">{row.impressions}</td>
                    <td className="py-2">{row.ctr}</td>
                    <td className="py-2">{row.pos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center"><FileText className="h-4 w-4 mr-1 text-blue-500" />Top Pages</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>/home — <span className="font-bold text-blue-700">210</span> clicks, 2.1k impressions</li>
                  <li>/blog/seo-guide — <span className="font-bold text-blue-700">150</span> clicks, 1.3k impressions</li>
                  <li>/contact — <span className="font-bold text-blue-700">60</span> clicks, 400 impressions</li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center"><Globe className="h-4 w-4 mr-1 text-blue-500" />Countries & Devices</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>India <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs ml-1">Mobile</span>: 120 clicks</li>
                  <li>USA <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs ml-1">Desktop</span>: 80 clicks</li>
                  <li>UK <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs ml-1">Tablet</span>: 15 clicks</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ListChecks className="h-4 w-4 text-blue-500 mr-1" />
              <span className="font-semibold">Search Appearance:</span> <span className="ml-2">Rich Results <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">AMP: 2 pages</span> <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs ml-1">FAQ: 1 page</span></span>
            </div>
          </div>
        </div>

        {/* 2. URL Inspection Tool */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Search className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-blue-700">2. URL Inspection Tool</h2>
          </div>
          <div className="mb-2"><span className="font-semibold">URL:</span> https://example.com/blog/seo-guide</div>
          <ul className="text-sm text-gray-700 mb-2">
            <li><span className="font-semibold">Index Status:</span> <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs ml-1"><CheckCircle className="h-3 w-3 mr-1" />Indexed</span></li>
            <li><span className="font-semibold">Last Crawled:</span> 2024-06-10</li>
            <li><span className="font-semibold">Coverage Issues:</span> <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs ml-1"><CheckCircle className="h-3 w-3 mr-1" />None</span></li>
            <li><span className="font-semibold">Enhancements:</span> <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs ml-1"><Smartphone className="h-3 w-3 mr-1" />Mobile Friendly</span>, <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs ml-1"><CheckCircle className="h-3 w-3 mr-1" />Valid Structured Data</span>, <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs ml-1"><TrendingUp className="h-3 w-3 mr-1" />Core Web Vitals: Good</span></li>
          </ul>
          <div className="text-xs text-gray-500">(Test data for /blog/seo-guide)</div>
        </div>

        {/* 3. Coverage Report */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-blue-700">3. Coverage Report</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Page</th>
                  <th className="py-2 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2"><span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs"><CheckCircle className="h-3 w-3 mr-1" />Valid</span></td>
                  <td className="py-2">/home</td>
                  <td className="py-2">Indexed</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><span className="inline-flex items-center bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Error</span></td>
                  <td className="py-2">/404-page</td>
                  <td className="py-2">404 Error</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><span className="inline-flex items-center bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs"><Info className="h-3 w-3 mr-1" />Excluded</span></td>
                  <td className="py-2">/private</td>
                  <td className="py-2">noindex</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Enhancements Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Code className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-blue-700">4. Enhancements Section</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center"><Smartphone className="h-4 w-4 mr-1 text-green-600" />Mobile Usability</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs"><CheckCircle className="h-3 w-3 mr-1" />All tested pages are mobile-friendly</span></li>
                <li>No issues detected</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center"><TrendingUp className="h-4 w-4 mr-1 text-green-600" />Core Web Vitals</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>LCP: <span className="font-semibold">1.2s</span> <span className="ml-2 w-32 h-2 bg-green-200 rounded-full inline-block align-middle"><span className="block h-2 bg-green-500 rounded-full" style={{width: '90%'}}></span></span> <span className="ml-2 text-green-700 text-xs">Good</span></li>
                <li>INP: <span className="font-semibold">180ms</span> <span className="ml-2 w-32 h-2 bg-green-200 rounded-full inline-block align-middle"><span className="block h-2 bg-green-500 rounded-full" style={{width: '85%'}}></span></span> <span className="ml-2 text-green-700 text-xs">Good</span></li>
                <li>CLS: <span className="font-semibold">0.03</span> <span className="ml-2 w-32 h-2 bg-green-200 rounded-full inline-block align-middle"><span className="block h-2 bg-green-500 rounded-full" style={{width: '95%'}}></span></span> <span className="ml-2 text-green-700 text-xs">Good</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ListChecks className="h-4 w-4 text-green-600 mr-1" />
            <span className="font-semibold">Structured Data:</span> <span className="ml-2">All valid <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">AMP: 2 pages</span> <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs ml-1">Breadcrumbs: 3 pages</span></span>
          </div>
        </div>

        {/* 5. Sitemaps */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Link className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-blue-700">5. Sitemaps</h2>
          </div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Submitted: <span className="font-mono">/sitemap.xml</span> — 12 URLs, Last read: 2024-06-09 <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs ml-1"><CheckCircle className="h-3 w-3 mr-1" />All indexed</span></li>
            <li>All important pages included and indexed</li>
          </ul>
        </div>

        {/* 6. Manual Actions & Security Issues */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <ShieldCheck className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-blue-700">6. Manual Actions & Security Issues</h2>
          </div>
          <div className="flex items-center bg-green-100 rounded-lg p-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <div className="text-green-800 font-semibold">No issues detected. Your site is in good standing!</div>
          </div>
        </div>
      </div>
    );
  };

  const renderOffPageSEO = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Backlink Analytics', desc: 'Monitor existing backlink profile', metrics: '1,247 backlinks' },
          { title: 'Backlink Creation', desc: 'Automate high-quality backlink generation', metrics: '45 new this month' },
          { title: 'Competitor Analysis', desc: 'Analyze competitor backlink strategies', metrics: '15 competitors tracked' },
          { title: 'Gap Analysis', desc: 'Identify missing backlink opportunities', metrics: '230 gaps found' }
        ].map((feature, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <Link className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm mb-4">{feature.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600">{feature.metrics}</span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Master Backlink Database */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Master Backlink Database</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Domain</th>
                  <th className="text-left py-2">Authority</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { domain: 'techcrunch.com', authority: 92, category: 'Technology', status: 'Active' },
                  { domain: 'forbes.com', authority: 95, category: 'Business', status: 'Active' },
                  { domain: 'medium.com', authority: 78, category: 'General', status: 'Pending' }
                ].map((link, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{link.domain}</td>
                    <td className="py-2">{link.authority}</td>
                    <td className="py-2">{link.category}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        link.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <button className="text-blue-600 hover:underline">Use</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTechnicalSEO = () => (
    <div className="space-y-6">
      {/* Page Speed Insights */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Page Speed Insights</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { metric: 'TTFB', value: '250ms', score: 85, status: 'good' },
              { metric: 'LCP', value: '1.2s', score: 92, status: 'good' },
              { metric: 'CLS', value: '0.05', score: 78, status: 'needs-improvement' }
            ].map((metric, idx) => (
              <div key={idx} className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full border-4 flex items-center justify-center mb-2 ${
                  metric.status === 'good' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'
                }`}>
                  <span className="text-sm font-bold">{metric.score}</span>
                </div>
                <p className="font-semibold">{metric.metric}</p>
                <p className="text-sm text-gray-600">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Reporting */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Error Reporting</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { type: '404 Errors', count: 23, severity: 'high', color: 'red' },
              { type: '500 Errors', count: 2, severity: 'critical', color: 'red' },
              { type: 'Redirects', count: 45, severity: 'medium', color: 'yellow' },
              { type: 'JS Errors', count: 12, severity: 'medium', color: 'yellow' }
            ].map((error, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`h-5 w-5 text-${error.color}-500`} />
                  <div>
                    <p className="font-medium">{error.type}</p>
                    <p className="text-sm text-gray-600">{error.count} issues found</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Fix Issues
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompetitorAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Competitor Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'competitor1.com', traffic: '45K', keywords: 1250, backlinks: 2340 },
              { name: 'competitor2.com', traffic: '38K', keywords: 980, backlinks: 1890 },
              { name: 'competitor3.com', traffic: '52K', keywords: 1450, backlinks: 2890 }
            ].map((comp, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">{comp.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monthly Traffic:</span>
                    <span className="font-medium">{comp.traffic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Keywords:</span>
                    <span className="font-medium">{comp.keywords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backlinks:</span>
                    <span className="font-medium">{comp.backlinks}</span>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Analyze
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keyword Gap Analysis */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Keyword Gap Analysis</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Keyword</th>
                  <th className="text-left py-2">Volume</th>
                  <th className="text-left py-2">Difficulty</th>
                  <th className="text-left py-2">Competitors Ranking</th>
                  <th className="text-left py-2">Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { keyword: 'best seo tools', volume: '12K', difficulty: 'Medium', competitors: 3, opportunity: 'High' },
                  { keyword: 'seo automation', volume: '8K', difficulty: 'High', competitors: 2, opportunity: 'Medium' },
                  { keyword: 'technical seo guide', volume: '5K', difficulty: 'Low', competitors: 4, opportunity: 'High' }
                ].map((keyword, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 font-medium">{keyword.keyword}</td>
                    <td className="py-2">{keyword.volume}</td>
                    <td className="py-2">{keyword.difficulty}</td>
                    <td className="py-2">{keyword.competitors}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        keyword.opportunity === 'High' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {keyword.opportunity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'onpage':
        return renderOnPageSEO();
      case 'offpage':
        return renderOffPageSEO();
      case 'technical':
        return renderTechnicalSEO();
      case 'competitor':
        return renderCompetitorAnalysis();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-xl font-bold text-gray-900">AI SEO Automation</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Custom Project Selector - Only show user's saved projects */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between bg-white border-2 border-blue-200 rounded-xl px-6 py-3 pr-12 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 hover:shadow-md min-w-[280px] text-lg font-medium text-gray-700 cursor-pointer group"
                disabled={loading || userProjects.length === 0}
              >
                <span className="truncate">
                  {loading ? 'Loading projects...' : 
                   userProjects.length === 0 ? 'No projects found' : 
                   selectedProject || 'Select a project'}
                </span>
                <ChevronDown className={`h-5 w-5 text-blue-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {dropdownOpen && !loading && userProjects.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    {userProjects.map((project, index) => (
                      <button
                        key={project._id}
                        onClick={() => handleProjectSelect(project.name)}
                        className={`w-full text-left px-6 py-4 hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${
                          selectedProject === project.name ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">{project.name}</div>
                            <div className={`text-sm ${selectedProject === project.name ? 'text-blue-600' : 'text-gray-500'}`}>
                              {project.type === 'own' ? 'Own Site' : 'Global Site'}
                            </div>
                          </div>
                          {selectedProject === project.name && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Backdrop to close dropdown */}
              {dropdownOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)}
                />
              )}
            </div>
            
            {/* Custom Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{user?.name || 'Guest'}</p>
                  <p className="text-xs text-gray-600">{user?.email || 'user@example.com'}</p>
                </div>
              </button>
              
              {/* Profile Menu Panel */}
              {profileDropdownOpen && (
                <div className="absolute top-full right-0 mt-3 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200 min-w-[240px] transform origin-top-right">
                  {/* Profile Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{user?.name || 'Guest'}</div>
                        <div className="text-blue-100 text-sm">{user?.email || 'user@example.com'}</div>
                        <div className="text-blue-200 text-xs mt-1 font-mono bg-white/10 px-2 py-1 rounded">
                          ID: {user?._id ? user._id.substring(0, 10) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        // Add profile settings navigation here
                      }}
                      className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-150 text-gray-700 group"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Settings className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Profile Settings</div>
                        <div className="text-xs text-gray-500">Manage your profile</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        // Add account settings navigation here
                      }}
                      className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-150 text-gray-700 group"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Account Settings</div>
                        <div className="text-xs text-gray-500">Security & preferences</div>
                      </div>
                    </button>
                    
                    <div className="mx-4 my-2 border-t border-gray-200"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-red-50 transition-all duration-150 text-red-600 group"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <X className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Sign Out</div>
                        <div className="text-xs text-red-500">Logout from your account</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Backdrop to close profile menu */}
              {profileDropdownOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setProfileDropdownOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white shadow-sm min-h-screen">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      setCurrentView(item.id);
                      if (item.id === 'onpage') setOnPageSubView('overview');
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 ${
                      currentView === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                  {item.submenu && currentView === item.id && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.submenu.map((subitem) => (
                        <button
                          key={subitem.id}
                          className={`w-full text-left px-3 py-1 text-sm rounded ${
                            onPageSubView === subitem.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                          onClick={() => setOnPageSubView(subitem.id)}
                        >
                          {subitem.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            
            {/* Integration Status */}
            <div className="p-4 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Integrations</h3>
              <div className="space-y-2">
                {[
                  { name: 'Google Analytics 4', status: 'connected' },
                  { name: 'Search Console', status: 'connected' },
                  { name: 'WordPress', status: 'disconnected' }
                ].map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{integration.name}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      integration.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-6 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">
                    {currentView === 'dashboard' ? 'Dashboard' : currentView.replace(/([A-Z])/g, ' $1')}
                  </h2>
                  <p className="text-gray-600">
                    {currentView === 'dashboard' && `Managing ${selectedProject}`}
                    {currentView === 'onpage' && 'Optimize your website content and structure'}
                    {currentView === 'offpage' && 'Build authority through strategic link building'}
                    {currentView === 'technical' && 'Ensure technical excellence for search engines'}
                    {currentView === 'competitor' && 'Learn from your competitors strategies'}
                  </p>
                </div>
                
                {currentView === 'dashboard' && (
                  <button onClick={() => navigate('/projects')} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    <span>Add Project</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Content */}
            {currentView === 'onpage' ? renderOnPageSEO() : renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SEODashboard;  
