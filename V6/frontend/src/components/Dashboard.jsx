import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, BarChart3, Settings, User, Plus, TrendingUp, Link, FileText, 
  Globe, Zap, Target, Eye, CheckCircle, AlertTriangle, RefreshCw,
  ChevronDown, Menu, X, Home, Users, Activity, Code, ExternalLink, Info, ListChecks, ShieldCheck, Smartphone, XCircle, Upload
} from 'lucide-react';
import API from '../services/api';
import { fetchKeywordPlannerResults } from '../services/api';
import { analyzeContent, rewriteContent, analyzeTextContent, generateContent } from '../services/api';

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
  const [contentInput, setContentInput] = useState({ topic: '', tone: 'Professional', length: '50' });
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
  const [searchAnalytics, setSearchAnalytics] = useState(null);
  const [searchAnalyticsLoading, setSearchAnalyticsLoading] = useState(false);
  const [searchAnalyticsError, setSearchAnalyticsError] = useState(null);
  const [showSearchDetails, setShowSearchDetails] = useState(false);
  const [detailedSearchData, setDetailedSearchData] = useState(null);
  const [lastSearchDataFetch, setLastSearchDataFetch] = useState(null);
  const [countryDeviceData, setCountryDeviceData] = useState(null);
  const [countryDeviceLoading, setCountryDeviceLoading] = useState(false);
  const [countryDeviceError, setCountryDeviceError] = useState(null);
  const [urlInspectionData, setUrlInspectionData] = useState(null);
  const [urlInspectionLoading, setUrlInspectionLoading] = useState(false);
  const [urlInspectionError, setUrlInspectionError] = useState(null);
  const [urlToInspect, setUrlToInspect] = useState('');
  const [urlInputValue, setUrlInputValue] = useState('');
  const [siteAuditData, setSiteAuditData] = useState(null);
  const [siteAuditLoading, setSiteAuditLoading] = useState(false);
  const [siteAuditError, setSiteAuditError] = useState(null);
  const [auditProgress, setAuditProgress] = useState(0);
  const [keywordPlannerMode, setKeywordPlannerMode] = useState('normal');
  const [keywordPlannerInput, setKeywordPlannerInput] = useState('');
  const [keywordPlannerLoading, setKeywordPlannerLoading] = useState(false);
  const [keywordPlannerResults, setKeywordPlannerResults] = useState(null);
  const [keywordPlannerError, setKeywordPlannerError] = useState(null);
  const [optimizerInput, setOptimizerInput] = useState('');
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [optimizerResult, setOptimizerResult] = useState(null);
  const [optimizerError, setOptimizerError] = useState(null);
  const [showRewrite, setShowRewrite] = useState(false);
  const [rewriteText, setRewriteText] = useState('');
  const [rewriteResult, setRewriteResult] = useState(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const navigate = useNavigate();

  // Place this at the top level of SEODashboard, after useState hooks
  const keywordsArray = keywordInput.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  const textLower = optimizerInput.toLowerCase();
  const keywordInText = keywordsArray.some(k => k && textLower.includes(k));

  // State for AI Content Writer
  const [writerTopic, setWriterTopic] = useState('');
  const [writerTone, setWriterTone] = useState('Professional');
  const [writerLength, setWriterLength] = useState('50');
  const [writerResult, setWriterResult] = useState('');
  const [writerLoading, setWriterLoading] = useState(false);
  const [writerError, setWriterError] = useState('');

  // Add at the top of the component (after useState hooks)
  const toneOptions = [
    'Professional',
    'Neutral',
    'Friendly',
    'Persuasive',
    'Informative',
  ];
  const [toneDropdownOpen, setToneDropdownOpen] = useState(false);
  const toneDropdownRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target)) {
        setToneDropdownOpen(false);
      }
    }
    if (toneDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [toneDropdownOpen]);

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

  const fetchSearchAnalytics = async (projectId) => {
    if (!projectId) return;
    setSearchAnalyticsLoading(true);
    setSearchAnalyticsError(null);
    try {
      const response = await API.get(`/projects/${projectId}/search-analytics`);
      setSearchAnalytics(response.data.searchAnalytics);
      setLastSearchDataFetch(new Date());
    } catch (error) {
      setSearchAnalyticsError(error.response?.data?.message || 'Failed to fetch search analytics');
      setSearchAnalytics(null);
    } finally {
      setSearchAnalyticsLoading(false);
    }
  };

  const fetchDetailedSearchAnalytics = async (projectId) => {
    if (!projectId) return;
    try {
      const response = await API.get(`/projects/${projectId}/search-analytics/detailed`);
      return response.data.detailedSearchAnalytics;
    } catch (error) {
      console.error('Error fetching detailed search analytics:', error);
      return null;
    }
  };

  const handleViewSearchDetails = async () => {
    if (!selectedProjectId) return;
    
    setShowSearchDetails(true);
    const detailedData = await fetchDetailedSearchAnalytics(selectedProjectId);
    setDetailedSearchData(detailedData);
  };

  const fetchCountryDeviceData = async (projectId) => {
    if (!projectId) return;
    setCountryDeviceLoading(true);
    setCountryDeviceError(null);
    try {
      const response = await API.get(`/projects/${projectId}/country-device-data`);
      setCountryDeviceData(response.data.countryDeviceData);
    } catch (error) {
      setCountryDeviceError(error.response?.data?.message || 'Failed to fetch country/device data');
      setCountryDeviceData(null);
    } finally {
      setCountryDeviceLoading(false);
    }
  };

  const fetchUrlInspectionData = async (projectId, url) => {
    if (!projectId || !url) return;
    setUrlInspectionLoading(true);
    setUrlInspectionError(null);
    try {
      const response = await API.get(`/projects/${projectId}/url-inspection?url=${encodeURIComponent(url)}`);
      setUrlInspectionData(response.data.urlInspection);
    } catch (error) {
      setUrlInspectionError(error.response?.data?.message || 'Failed to fetch URL inspection data');
      setUrlInspectionData(null);
    } finally {
      setUrlInspectionLoading(false);
    }
  };

  const handleUrlInspection = async (e) => {
    e.preventDefault();
    if (!urlInputValue.trim()) return;
    
    setUrlToInspect(urlInputValue.trim());
    await fetchUrlInspectionData(selectedProjectId, urlInputValue.trim());
  };

  const runSiteAudit = async () => {
    if (!selectedProjectId || !selectedProjectObj) return;
    
    setSiteAuditLoading(true);
    setSiteAuditError(null);
    setAuditProgress(0);
    
    // Simulate audit progress
    const progressInterval = setInterval(() => {
      setAuditProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      // Fetch real audit data from backend
      const response = await API.get(`/projects/${selectedProjectId}/site-audit`);
      
      if (response.data.siteAudit && response.data.siteAudit.success) {
        setSiteAuditData(response.data.siteAudit);
        setAuditProgress(100);
      } else {
        setSiteAuditError(response.data.message || 'Failed to fetch audit data');
      }
      
    } catch (error) {
      console.error('Site audit error:', error);
      setSiteAuditError(error.response?.data?.message || 'Failed to run site audit. Please try again.');
    } finally {
      setSiteAuditLoading(false);
      clearInterval(progressInterval);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchUnassignedTraffic(selectedProjectId);
      fetchRealtimeMetrics(selectedProjectId);
      fetchSearchAnalytics(selectedProjectId);
      fetchCountryDeviceData(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Fetch search analytics when navigating to On Page SEO
  useEffect(() => {
    if (currentView === 'onpage' && selectedProjectId) {
      fetchSearchAnalytics(selectedProjectId);
    }
  }, [currentView, selectedProjectId]);

  // Auto-populate URL input with selected project's URL
  useEffect(() => {
    if (selectedProjectId && userProjects.length > 0) {
      const selectedProjectObj = userProjects.find(p => p._id === selectedProjectId);
      if (selectedProjectObj && selectedProjectObj.url) {
        // Set the base URL as default, user can modify to inspect specific pages
        setUrlInputValue(selectedProjectObj.url);
      }
    }
  }, [selectedProjectId, userProjects]);

  // Get selected project object
  const selectedProjectObj = userProjects.find(p => p._id === selectedProjectId);

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

  const handleGenerateContent = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGeneratedContent('');
    setContentHighlight(false);
    try {
      const res = await generateContent(contentInput.topic, writerTone, writerLength);
      setGeneratedContent(res.content);
      setContentHighlight(true);
      setTimeout(() => setContentHighlight(false), 800);
    } catch (err) {
      setGeneratedContent('Failed to generate content.');
    }
    setGenerating(false);
  };

  const handleCopyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
    }
  };

  const handleRegenerateContent = async () => {
    setGenerating(true);
    setGeneratedContent('');
    setContentHighlight(false);
    try {
      const res = await generateContent(contentInput.topic, contentInput.tone, contentInput.length);
      setGeneratedContent(res.content);
      setContentHighlight(true);
      setTimeout(() => setContentHighlight(false), 800);
    } catch (err) {
      setGeneratedContent('Failed to generate content.');
    }
    setGenerating(false);
  };

  const handleAnalyzeContent = async () => {
    setOptimizerLoading(true);
    setOptimizerError(null);
    try {
      // Call backend API
      const result = await analyzeContent(optimizerInput, keywordInput);
      // If multiple keywords, show the first one's analysis
      let keywordKey = keywordInput.split(',')[0].trim().toLowerCase();
      if (result.keyword_analysis && Object.keys(result.keyword_analysis).length > 0) {
        keywordKey = Object.keys(result.keyword_analysis)[0];
      }
      setOptimizerResult({
        flesch: result.readability.flesch_score,
        wordCount: result.readability.word_count,
        sentenceCount: result.readability.sentence_count,
        avgSentenceLength: result.readability.avg_sentence_length,
        keywordAnalysis: result.keyword_analysis[keywordKey] || {},
      });
    } catch (err) {
      setOptimizerError('Failed to analyze content.');
    }
    setOptimizerLoading(false);
  };

  const handleAIRewrite = async () => {
    setRewriteLoading(true);
    setRewriteText('');
    setRewriteResult(null);
    try {
      const result = await rewriteContent(optimizerInput);
      setRewriteText(result.rewritten_text);
      // Analyze the rewritten text
      const analysis = await analyzeTextContent(result.rewritten_text, keywordInput);
      // Use the first keyword's analysis
      let keywordKey = keywordInput.split(',')[0].trim().toLowerCase();
      if (analysis.keyword_analysis && Object.keys(analysis.keyword_analysis).length > 0) {
        keywordKey = Object.keys(analysis.keyword_analysis)[0];
      }
      setRewriteResult({
        flesch: analysis.readability.flesch_score,
        wordCount: analysis.readability.word_count,
        sentenceCount: analysis.readability.sentence_count,
        avgSentenceLength: analysis.readability.avg_sentence_length,
        keywordAnalysis: analysis.keyword_analysis[keywordKey] || {},
      });
    } catch (err) {
      setRewriteText('Failed to rewrite content.');
      setRewriteResult(null);
    }
    setRewriteLoading(false);
  };

  const handleCancelRewrite = () => {
    setShowRewrite(false);
    setRewriteText('');
    setRewriteResult(null);
  };

  const handleGenerateContentWriter = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGeneratedContent('');
    setContentHighlight(false);
    try {
      const res = await generateContent(contentInput.topic, writerTone, writerLength);
      setGeneratedContent(res.content);
      setContentHighlight(true);
      setTimeout(() => setContentHighlight(false), 800);
    } catch (err) {
      setGeneratedContent('Failed to generate content.');
    }
    setGenerating(false);
  };

  // Add state and handler for log analyzer at the top of the component
  const [logFileName, setLogFileName] = useState('');
  const [logEntries, setLogEntries] = useState([]);
  const [logSummary, setLogSummary] = useState(null);

  const handleLogFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const entries = [];
      let info = 0, warning = 0, error = 0;
      lines.forEach(line => {
        // Simple log format: [timestamp] [LEVEL] message
        const match = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/);
        if (match) {
          const [, timestamp, level, message] = match;
          entries.push({ timestamp, level, message });
          if (level === 'ERROR') error++;
          else if (level === 'WARNING') warning++;
          else info++;
        }
      });
      setLogEntries(entries);
      setLogSummary({ info, warning, error });
    };
    reader.readAsText(file);
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
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold mb-1 text-blue-800">Tone</label>
                        <div className="relative" ref={toneDropdownRef}>
                          <button
                            type="button"
                            className={`w-full flex items-center justify-between border-2 rounded-xl px-4 py-2 text-lg font-semibold text-blue-900 pr-10 transition-all duration-200 bg-gradient-to-r from-white to-blue-50 shadow-sm border-blue-200 hover:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-200 ${toneDropdownOpen ? 'border-blue-500 ring-4 ring-blue-200' : ''}`}
                            onClick={() => setToneDropdownOpen((open) => !open)}
                            disabled={writerLoading}
                          >
                            <span>{writerTone}</span>
                            <ChevronDown className={`h-5 w-5 text-blue-500 ml-2 transition-transform duration-200 ${toneDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {toneDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                              {toneOptions.map((tone) => (
                                <button
                                  key={tone}
                                  type="button"
                                  onClick={() => { setWriterTone(tone); setToneDropdownOpen(false); }}
                                  className={`w-full text-left px-6 py-3 hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${writerTone === tone ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{tone}</span>
                                    {writerTone === tone && <CheckCircle className="h-5 w-5 text-blue-600" />}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          {toneDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setToneDropdownOpen(false)} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-end">
                        <label className="block text-sm font-semibold mb-1 text-blue-800">Length</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-28 border-2 border-blue-200 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg"
                          placeholder="Words"
                          value={writerLength}
                          onChange={e => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length > 3) val = val.slice(0, 3);
                            setWriterLength(val);
                          }}
                          disabled={writerLoading}
                        />
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
                        onClick={handleRegenerateContent}
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

    if (onPageSubView === 'site-audit') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ShieldCheck className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-bold">Site Audit</h3>
              </div>
              {selectedProjectObj && (
                <div className="text-sm text-gray-600">
                  Auditing: <span className="font-semibold">{selectedProjectObj.url}</span>
                </div>
              )}
            </div>

            {/* Audit Controls */}
            <div className="mb-6">
              {!siteAuditData ? (
                <div className="text-center">
                  <button
                    onClick={runSiteAudit}
                    disabled={siteAuditLoading || !selectedProjectObj}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center mx-auto"
                  >
                    {siteAuditLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running Audit... {auditProgress}%
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Run Site Audit
                      </>
                    )}
                  </button>
                  {selectedProjectObj && (
                    <p className="text-sm text-gray-600 mt-2">
                      This will analyze your site for SEO, performance, accessibility, and security issues. 
                      <br />
                      <span className="text-xs text-blue-600">
                        🔍 Includes: Meta titles, descriptions, images, links, robots.txt, sitemap, and more
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={runSiteAudit}
                    disabled={siteAuditLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Run New Audit
                  </button>
                  <div className="text-sm text-gray-600 flex items-center">
                    Last audit: {new Date(siteAuditData.lastAudit).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {siteAuditLoading && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Audit Progress</span>
                  <span>{auditProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${auditProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {siteAuditError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 font-medium">Audit Error</span>
                </div>
                <p className="text-red-600 mt-1">{siteAuditError}</p>
              </div>
            )}

            {/* Audit Results */}
            {siteAuditData && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">Overall Score</h4>
                      <p className="text-sm text-gray-600">Based on all audit categories</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{siteAuditData.overallScore}/100</div>
                      <div className="text-sm text-gray-600">
                        {siteAuditData.overallScore >= 90 ? 'Excellent' : 
                         siteAuditData.overallScore >= 80 ? 'Good' : 
                         siteAuditData.overallScore >= 70 ? 'Fair' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Analytics Summary */}
                {siteAuditData.searchData && (
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Search Performance (Last 30 Days)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{siteAuditData.searchData.totalClicks?.toLocaleString() || '0'}</div>
                        <div className="text-sm text-gray-600">Total Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{siteAuditData.searchData.totalImpressions?.toLocaleString() || '0'}</div>
                        <div className="text-sm text-gray-600">Total Impressions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{siteAuditData.searchData.pagesAnalyzed || '0'}</div>
                        <div className="text-sm text-gray-600">Pages Analyzed</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Issues Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-800">Critical</span>
                      <span className="text-2xl font-bold text-red-600">{siteAuditData.issues.critical}</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-800">High</span>
                      <span className="text-2xl font-bold text-orange-600">{siteAuditData.issues.high}</span>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-yellow-800">Medium</span>
                      <span className="text-2xl font-bold text-yellow-600">{siteAuditData.issues.medium}</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Low</span>
                      <span className="text-2xl font-bold text-blue-600">{siteAuditData.issues.low}</span>
                    </div>
                  </div>
                </div>

                {/* Category Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(siteAuditData.categories).map(([category, data]) => (
                    <div key={category} className="bg-white border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold uppercase">{category === 'seo' ? 'SEO' : category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{data.score}/100</div>
                          <div className="text-sm text-gray-600">{data.issues.length} issues</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {data.issues.map((issue, idx) => (
                          <div key={idx} className="border-l-4 border-gray-200 pl-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                    issue.type === 'critical' ? 'bg-red-500' :
                                    issue.type === 'high' ? 'bg-orange-500' :
                                    issue.type === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                  }`}></span>
                                  <span className="font-medium text-sm">{issue.title}</span>
                                </div>
                                {/* Removed description and fix lines for summary card */}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* SEO Technical Checks - Impressive Design */}
                {siteAuditData.categories.seo && siteAuditData.categories.seo.issues.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-8 shadow-lg">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full mr-4">
                        <Search className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h5 className="text-xl font-bold text-gray-800">SEO Technical Checks</h5>
                        <p className="text-sm text-gray-600">Comprehensive analysis of your site's SEO elements</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {siteAuditData.categories.seo.issues.map((issue, idx) => (
                        <div key={idx} className={`relative overflow-hidden rounded-xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${
                          issue.type === 'critical' ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200' :
                          issue.type === 'high' ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' :
                          issue.type === 'medium' ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' :
                          'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                        }`}>
                          {/* Priority Badge */}
                          <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              issue.type === 'critical' ? 'bg-red-100 text-red-700 border border-red-300' :
                              issue.type === 'high' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                              issue.type === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                              'bg-blue-100 text-blue-700 border border-blue-300'
                            }`}>
                              {issue.type.toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Issue Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                            issue.type === 'critical' ? 'bg-red-100' :
                            issue.type === 'high' ? 'bg-orange-100' :
                            issue.type === 'medium' ? 'bg-yellow-100' :
                            'bg-blue-100'
                          }`}>
                            {issue.type === 'critical' ? (
                              <AlertTriangle className="h-6 w-6 text-red-600" />
                            ) : issue.type === 'high' ? (
                              <AlertTriangle className="h-5 w-5 text-orange-600" />
                            ) : issue.type === 'medium' ? (
                              <Info className="h-5 w-5 text-yellow-600" />
                            ) : (
                              <Info className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          
                          {/* Issue Content */}
                          <div className="space-y-3">
                            <h6 className="font-bold text-gray-800 text-lg">{issue.title}</h6>
                            <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                            
                            {/* Fix Section */}
                            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                              <div className="flex items-start">
                                <div className="bg-blue-100 p-2 rounded-full mr-3">
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-blue-800 mb-1">Recommended Fix</p>
                                  <p className="text-sm text-blue-700">{issue.fix}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Impact Indicator */}
                            <div className="flex items-center text-xs text-gray-500">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                issue.type === 'critical' ? 'bg-red-500' :
                                issue.type === 'high' ? 'bg-orange-500' :
                                issue.type === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}></span>
                              {issue.type === 'critical' ? 'High Impact - Fix Immediately' :
                               issue.type === 'high' ? 'Medium Impact - Fix Soon' :
                               issue.type === 'medium' ? 'Low Impact - Fix When Possible' :
                               'Minimal Impact - Optional Fix'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
                      <h6 className="font-semibold text-gray-800 mb-4">SEO Check Summary</h6>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {siteAuditData.categories.seo.issues.filter(i => i.type === 'critical').length}
                          </div>
                          <div className="text-xs text-gray-600">Critical</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {siteAuditData.categories.seo.issues.filter(i => i.type === 'high').length}
                          </div>
                          <div className="text-xs text-gray-600">High</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {siteAuditData.categories.seo.issues.filter(i => i.type === 'medium').length}
                          </div>
                          <div className="text-xs text-gray-600">Medium</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {siteAuditData.categories.seo.issues.filter(i => i.type === 'low').length}
                          </div>
                          <div className="text-xs text-gray-600">Low</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h5 className="text-lg font-semibold text-green-800 mb-4">Recommendations</h5>
                  <div className="space-y-2">
                    {siteAuditData.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-green-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (onPageSubView === 'keyword-planner') {
      const handleModeChange = (mode) => setKeywordPlannerMode(mode);
      const handleInputChange = (e) => setKeywordPlannerInput(e.target.value);
      const handleGetSuggestions = async () => {
        setKeywordPlannerLoading(true);
        setKeywordPlannerError(null);
        setKeywordPlannerResults(null);
        try {
          const data = await fetchKeywordPlannerResults(keywordPlannerMode, keywordPlannerInput);
          if (data.success && data.results) {
            setKeywordPlannerResults(data.results);
          } else {
            setKeywordPlannerError('No results found.');
          }
        } catch (err) {
          setKeywordPlannerError('Failed to fetch results.');
        }
        setKeywordPlannerLoading(false);
      };
      // Helper to determine trend icon from interest_over_time
      function getTrendIcon(interest) {
        if (!interest || interest.length < 2) return 'Stable';
        const first = interest[0];
        const last = interest[interest.length - 1];
        if (last > first * 1.1) return '📈 Rising';
        if (last < first * 0.9) return '📉 Falling';
        return '➖ Stable';
      }
      // Helper to mock difficulty from volume
      function getDifficulty(volume) {
        if (volume === null || volume === undefined) return 'Medium';
        if (volume > 20000) return 'High';
        if (volume > 5000) return 'Medium';
        return 'Low';
      }
      const showSuggestions = keywordPlannerMode !== 'normal';
      return (
        <div className="space-y-8 w-full">
          <div className="bg-white rounded-xl shadow-sm border p-8 md:p-10 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <h3 className="text-2xl font-extrabold text-blue-900 flex items-center gap-2">
                <Zap className="h-7 w-7 text-blue-600 animate-pulse" /> Keyword Planner
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-200 rounded-full p-1 shadow-inner w-fit">
                  <button
                    className={`px-5 py-2 rounded-full font-semibold transition-colors duration-200 ${
                      keywordPlannerMode === 'normal'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-transparent text-blue-700'
                    }`}
                    onClick={() => handleModeChange('normal')}
                  >
                    Normal
                  </button>
                  <button
                    className={`px-5 py-2 rounded-full font-semibold transition-colors duration-200 ${
                      keywordPlannerMode === 'smart'
                        ? 'bg-green-600 text-white shadow'
                        : 'bg-transparent text-green-700'
                    }`}
                    onClick={() => handleModeChange('smart')}
                  >
                    Smart
                  </button>
                  <button
                    className={`px-5 py-2 rounded-full font-semibold transition-colors duration-200 ${
                      keywordPlannerMode === 'ai'
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-transparent text-purple-700'
                    }`}
                    onClick={() => handleModeChange('ai')}
                  >
                    AI
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-lg font-semibold mb-2 text-blue-800">
                {keywordPlannerMode === 'normal' && 'Enter keywords (space separated)'}
                {keywordPlannerMode === 'smart' && 'Enter keywords or a short phrase'}
                {keywordPlannerMode === 'ai' && 'Describe your business, product, or idea'}
              </label>
              <textarea
                className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg min-h-[60px] max-h-[180px] shadow-sm bg-white"
                placeholder={
                  keywordPlannerMode === 'normal'
                    ? 'e.g. seo marketing analytics'
                    : keywordPlannerMode === 'smart'
                    ? 'e.g. best electric bikes for city commute'
                    : 'e.g. I want to start a dog grooming business in India.'
                }
                value={keywordPlannerInput}
                onChange={handleInputChange}
                rows={keywordPlannerMode === 'ai' ? 4 : 2}
              />
              <button
                type="button"
                className="mt-4 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
                onClick={handleGetSuggestions}
                disabled={keywordPlannerLoading || !keywordPlannerInput.trim()}
              >
                {keywordPlannerLoading ? (
                  <span className="flex items-center gap-2"><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</span>
                ) : (
                  <span className="flex items-center gap-2"><Search className="h-5 w-5" /> Get Results</span>
                )}
              </button>
              {keywordPlannerError && <div className="mt-2 text-red-600 text-sm">{keywordPlannerError}</div>}
            </div>
            <div className="mt-8">
              {keywordPlannerLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="h-10 w-10 text-blue-400 animate-spin mb-4" />
                  <span className="text-blue-700 font-semibold">Fetching keyword ideas...</span>
                </div>
              )}
              {keywordPlannerResults && (
                <div className="bg-blue-50 rounded-xl shadow border p-6 animate-fade-in">
                  <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2"><TrendingUp className="h-6 w-6 text-green-500" /> Keyword Results</h4>
                  <table className="w-full text-base mb-2">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Keyword</th>
                        <th className="py-2 text-left">Trend Type</th>
                        <th className="py-2 text-left">Top / Rising</th>
                        <th className="py-2 text-left">Popularity Score</th>
                        <th className="py-2 text-left">Trending Region</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywordPlannerResults.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b hover:bg-blue-100 transition ${row.parent ? 'bg-white' : ''}`}
                        >
                          <td className="py-2 font-semibold text-blue-900">
                            {row.parent && (
                              <span className="inline-block mr-2 align-middle text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">Suggestion</span>
                            )}
                            <span className={row.parent ? 'ml-4 text-blue-700 font-normal' : ''}>{row.keyword}</span>
                            {row.parent && (
                              <span className="ml-2 text-xs text-gray-400">(from {row.parent})</span>
                            )}
                          </td>
                          <td className="py-2">{row.trend_type}</td>
                          <td className="py-2">{row.top_or_rising}</td>
                          <td className="py-2">{row.popularity_score}</td>
                          <td className="py-2">{row.trending_region || <span className="text-gray-400">N/A</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-xs text-gray-500 mt-2">* All data is live from Google Trends via pytrends. Suggestions are shown as indented rows.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (onPageSubView === 'content-optimizer') {
      return (
        <div className="space-y-8 w-full">
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-8 md:p-10 max-w-full w-full mx-auto">
            <h3 className="text-2xl font-extrabold text-blue-900 flex items-center gap-2 mb-6">
              <FileText className="h-7 w-7 text-blue-600" /> Content Readability Analyzer
            </h3>
            <div className={`flex flex-col md:flex-row md:items-start md:gap-8 ${showRewrite ? 'md:flex-row' : ''}`}>
              {/* Original Content Box */}
              <div className={showRewrite ? 'w-full md:w-1/2' : 'w-full'}>
                <label className="block text-lg font-semibold mb-2 text-blue-800">Paste or write your content below</label>
                <textarea
                  className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg min-h-[120px] max-h-[320px] shadow-sm bg-white mb-4"
                  placeholder="Paste your blog post, landing page, or article here..."
                  value={optimizerInput}
                  onChange={e => setOptimizerInput(e.target.value)}
                  rows={8}
                  disabled={showRewrite}
                />
                <input
                  type="text"
                  className="w-full border-2 border-blue-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg mb-4"
                  placeholder="Enter keyword(s) (comma separated)"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  disabled={showRewrite}
                />
              </div>
              {/* AI Rewrite Box */}
              {showRewrite && (
                <div className="w-full md:w-1/2 flex flex-col">
                  <label className="block text-lg font-semibold mb-2 text-purple-800">AI Rewrite</label>
                  <textarea
                    className="w-full border-2 border-purple-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 text-lg min-h-[120px] max-h-[320px] shadow-sm bg-white mb-4"
                    value={rewriteLoading ? 'Generating rewrite...' : rewriteText}
                    onChange={e => setRewriteText(e.target.value)}
                    rows={8}
                    disabled={rewriteLoading}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
              <div className="flex flex-col md:flex-row w-full gap-4">
                <div className="flex-1">
                  <button
                    type="button"
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
                    onClick={handleAnalyzeContent}
                    disabled={optimizerLoading || !optimizerInput.trim() || !keywordInput.trim() || showRewrite}
                  >
                    {optimizerLoading ? (
                      <span className="flex items-center gap-2"><RefreshCw className="h-5 w-5 animate-spin" /> Analyzing...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Search className="h-5 w-5" /> Analyze Readability</span>
                    )}
                  </button>
                </div>
                <div className="flex-1 flex justify-end">
                  {optimizerResult && !showRewrite && (
                    <div className="flex flex-col items-end">
                      <button
                        type="button"
                        className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition
                          ${!keywordInput.trim() || !keywordInText
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600'}
                        `}
                        onClick={() => {
                          setShowRewrite(true);
                          handleAIRewrite();
                        }}
                        disabled={!keywordInput.trim() || !keywordInText}
                      >
                        AI Rewrite
                      </button>
                    </div>
                  )}
                  {showRewrite && (
                    <button
                      type="button"
                      className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl font-bold text-lg shadow-lg hover:from-red-600 hover:to-red-800 transition shadow-red-200"
                      onClick={handleCancelRewrite}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
            {optimizerError && <div className="mt-2 text-red-600 text-sm">{optimizerError}</div>}
            {/* Results Section */}
            {!showRewrite && optimizerResult && (
              <div className="mt-10 bg-blue-50 rounded-2xl shadow border p-10 animate-fade-in">
                <h4 className="text-2xl font-bold text-blue-900 mb-8 flex items-center gap-3">
                  <BarChart3 className="h-7 w-7 text-blue-600" /> Readability Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                  {(() => {
                    const fleschScore = optimizerResult.flesch;
                    let bg = 'bg-yellow-50';
                    let border = 'border-yellow-200';
                    let text = 'text-yellow-700';
                    let label = 'Moderate';
                    if (fleschScore >= 80) {
                      bg = 'bg-green-50';
                      border = 'border-green-200';
                      text = 'text-green-700';
                      label = 'Very Easy';
                    } else if (fleschScore < 60) {
                      bg = 'bg-red-50';
                      border = 'border-red-200';
                      text = 'text-red-700';
                      label = 'Hard';
                    }
                    return (
                      <div className={`${bg} rounded-xl p-6 shadow-sm border ${border} flex flex-col items-center transition-colors`}>
                        <span className={`text-4xl font-extrabold ${text} mb-2`}>{fleschScore !== undefined && fleschScore !== null ? fleschScore.toFixed(1) : ''}</span>
                        <span className={`text-base font-semibold ${text} flex items-center gap-1`}><BarChart3 className={`h-5 w-5 ${text}`} />Flesch Score</span>
                        <span className={`text-xs ${text} mt-1`}>
                          ({label})
                        </span>
                      </div>
                    );
                  })()}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-blue-700 mb-2">{optimizerResult.wordCount}</span>
                    <span className="text-base font-semibold text-blue-800 flex items-center gap-1"><FileText className="h-5 w-5 text-blue-400" />Words</span>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-blue-700 mb-2">{optimizerResult.sentenceCount !== undefined && optimizerResult.sentenceCount !== null ? optimizerResult.sentenceCount.toFixed(1) : ''}</span>
                    <span className="text-base font-semibold text-blue-800 flex items-center gap-1"><FileText className="h-5 w-5 text-blue-400" />Sentences</span>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-blue-700 mb-2">{optimizerResult.avgSentenceLength !== undefined && optimizerResult.avgSentenceLength !== null ? optimizerResult.avgSentenceLength.toFixed(1) : ''}</span>
                    <span className="text-base font-semibold text-blue-800 flex items-center gap-1"><BarChart3 className="h-5 w-5 text-blue-400" />Avg. Sentence Length</span>
                  </div>
                </div>
                <div className="mt-10 text-center">
                  <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-lg shadow-sm">Your content is highly readable!</span>
                </div>
                {/* Keyword Analysis Section */}
                <div className="mt-12 animate-fade-in">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200 p-10 max-w-4xl mx-auto">
                    <h5 className="text-2xl font-extrabold text-blue-900 mb-8 flex items-center gap-3">
                      <Search className="h-7 w-7 text-blue-500 animate-pulse" /> Keyword Analysis
                    </h5>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
                      <ul className="flex-1 space-y-5">
                        <li className="flex items-center gap-4">
                          {optimizerResult.keywordAnalysis.in_title ? (
                            <CheckCircle className="h-7 w-7 text-green-500" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-500" />
                          )}
                          <span className={`text-lg font-semibold ${optimizerResult.keywordAnalysis.in_title ? 'text-green-700' : 'text-red-700'}`}>In Title</span>
                        </li>
                        <li className="flex items-center gap-4">
                          {optimizerResult.keywordAnalysis.in_description ? (
                            <CheckCircle className="h-7 w-7 text-green-500" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-500" />
                          )}
                          <span className={`text-lg font-semibold ${optimizerResult.keywordAnalysis.in_description ? 'text-green-700' : 'text-red-700'}`}>In Description</span>
                        </li>
                        <li className="flex items-center gap-4">
                          {optimizerResult.keywordAnalysis.in_headings ? (
                            <CheckCircle className="h-7 w-7 text-green-500" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-500" />
                          )}
                          <span className={`text-lg font-semibold ${optimizerResult.keywordAnalysis.in_headings ? 'text-green-700' : 'text-red-700'}`}>In Headings</span>
                        </li>
                        <li className="flex items-center gap-4">
                          {optimizerResult.keywordAnalysis.in_first_paragraph ? (
                            <CheckCircle className="h-7 w-7 text-green-500" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-500" />
                          )}
                          <span className={`text-lg font-semibold ${optimizerResult.keywordAnalysis.in_first_paragraph ? 'text-green-700' : 'text-red-700'}`}>In 1st Paragraph</span>
                        </li>
                        <li className="flex items-center gap-4">
                          {optimizerResult.keywordAnalysis.in_alt_tags ? (
                            <CheckCircle className="h-7 w-7 text-green-500" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-500" />
                          )}
                          <span className={`text-lg font-semibold ${optimizerResult.keywordAnalysis.in_alt_tags ? 'text-green-700' : 'text-red-700'}`}>In Alt Tags</span>
                        </li>
                      </ul>
                      <div className="flex flex-col items-center">
                        <div className="relative flex items-center justify-center mb-2">
                          <svg className="w-36 h-36" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="65" fill="none" stroke="#e0e7ef" strokeWidth="10" />
                            <circle cx="70" cy="70" r="65" fill="none" stroke="#2563eb" strokeWidth="10" strokeDasharray="100" strokeDashoffset="64.3" strokeLinecap="round" className="animate-pulse" />
                          </svg>
                          <span className="absolute text-4xl font-extrabold text-blue-700">{optimizerResult.keywordAnalysis.density}%</span>
                        </div>
                        <span className="font-bold text-blue-900 text-lg mb-1">Density</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Rewrite Results Section */}
            {showRewrite && rewriteResult && (
              <div className="mt-10 bg-purple-50 rounded-2xl shadow border p-10 animate-fade-in">
                <h4 className="text-2xl font-bold text-purple-900 mb-8 flex items-center gap-3">
                  <BarChart3 className="h-7 w-7 text-purple-600" /> AI Rewrite Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                  {(() => {
                    const fleschScore = rewriteResult.flesch;
                    let bg = 'bg-yellow-50';
                    let border = 'border-yellow-200';
                    let text = 'text-yellow-700';
                    let label = 'Moderate';
                    if (fleschScore >= 80) {
                      bg = 'bg-green-50';
                      border = 'border-green-200';
                      text = 'text-green-700';
                      label = 'Very Easy';
                    } else if (fleschScore < 60) {
                      bg = 'bg-red-50';
                      border = 'border-red-200';
                      text = 'text-red-700';
                      label = 'Hard';
                    }
                    return (
                      <div className={`${bg} rounded-xl p-6 shadow-sm border ${border} flex flex-col items-center transition-colors`}>
                        <span className={`text-4xl font-extrabold ${text} mb-2`}>{fleschScore !== undefined && fleschScore !== null ? fleschScore.toFixed(1) : ''}</span>
                        <span className={`text-base font-semibold ${text} flex items-center gap-1`}><BarChart3 className={`h-5 w-5 ${text}`} />Flesch Score</span>
                        <span className={`text-xs ${text} mt-1`}>
                          ({label})
                        </span>
                      </div>
                    );
                  })()}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-blue-700 mb-2">{rewriteResult.wordCount}</span>
                    <span className="text-base font-semibold text-blue-800 flex items-center gap-1"><FileText className="h-5 w-5 text-blue-400" />Words</span>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-blue-700 mb-2">{rewriteResult.sentenceCount !== undefined && rewriteResult.sentenceCount !== null ? rewriteResult.sentenceCount.toFixed(1) : ''}</span>
                    <span className="text-base font-semibold text-blue-800 flex items-center gap-1"><FileText className="h-5 w-5 text-blue-400" />Sentences</span>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-blue-700 mb-2">{rewriteResult.avgSentenceLength !== undefined && rewriteResult.avgSentenceLength !== null ? rewriteResult.avgSentenceLength.toFixed(1) : ''}</span>
                    <span className="text-base font-semibold text-blue-800 flex items-center gap-1"><BarChart3 className="h-5 w-5 text-blue-400" />Avg. Sentence Length</span>
                  </div>
                </div>
                <div className="mt-10 text-center">
                  <span className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold text-lg shadow-sm">AI-rewritten content is highly readable!</span>
                </div>
                {/* Keyword Analysis Section */}
                <div className="mt-12 animate-fade-in">
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl shadow-lg border border-purple-200 p-10 max-w-4xl mx-auto">
                    <h5 className="text-2xl font-extrabold text-purple-900 mb-8 flex items-center gap-3">
                      <Search className="h-7 w-7 text-purple-500 animate-pulse" /> Keyword Analysis
                    </h5>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
                      <ul className="flex-1 space-y-5">
                        <li className="flex items-center gap-4">
                          <CheckCircle className="h-7 w-7 text-green-500" />
                          <span className="text-lg font-semibold text-green-700">In Title</span>
                        </li>
                        <li className="flex items-center gap-4">
                          <CheckCircle className="h-7 w-7 text-green-500" />
                          <span className="text-lg font-semibold text-green-700">In Description</span>
                        </li>
                        <li className="flex items-center gap-4">
                          <CheckCircle className="h-7 w-7 text-green-500" />
                          <span className="text-lg font-semibold text-green-700">In Headings</span>
                        </li>
                        <li className="flex items-center gap-4">
                          <CheckCircle className="h-7 w-7 text-green-500" />
                          <span className="text-lg font-semibold text-green-700">In 1st Paragraph</span>
                        </li>
                        <li className="flex items-center gap-4">
                          <CheckCircle className="h-7 w-7 text-green-500" />
                          <span className="text-lg font-semibold text-green-700">In Alt Tags</span>
                        </li>
                      </ul>
                      <div className="flex flex-col items-center">
                        <div className="relative flex items-center justify-center mb-2">
                          <svg className="w-36 h-36" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="65" fill="none" stroke="#e0e7ef" strokeWidth="10" />
                            <circle cx="70" cy="70" r="65" fill="none" stroke="#2563eb" strokeWidth="10" strokeDasharray="100" strokeDashoffset="64.3" strokeLinecap="round" className="animate-pulse" />
                          </svg>
                          <span className="absolute text-4xl font-extrabold text-purple-700">3.57%</span>
                        </div>
                        <span className="font-bold text-purple-900 text-lg mb-1">Density</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (onPageSubView === 'log-analyzer') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border p-10 max-w-6xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-blue-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" /> Log File Analyzer
              </h3>
            </div>
            <div className="flex flex-col md:flex-row gap-10">
              {/* Input Side */}
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow p-8 flex flex-col justify-between min-h-[340px] max-h-[600px] border border-blue-100">
                <div>
                  <h4 className="font-semibold text-lg mb-4 text-blue-700 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-400" /> Upload Log File
                  </h4>
                  {/* Drag-and-drop area */}
                  <div
                    className="relative flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50 transition-colors duration-200 cursor-pointer py-10 mb-4 group"
                    onClick={() => document.getElementById('log-file-input').click()}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleLogFileUpload({ target: { files: e.dataTransfer.files } });
                      }
                    }}
                  >
                    <input
                      id="log-file-input"
                      type="file"
                      accept=".log,.txt"
                      className="hidden"
                      onChange={handleLogFileUpload}
                    />
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-blue-400 group-hover:text-blue-600 transition" />
                      <span className="mt-2 text-blue-700 font-semibold">Drag & drop or click to upload</span>
                      <span className="text-xs text-gray-500 mt-1">Supported: .log, .txt</span>
                    </div>
                  </div>
                  {/* File name and progress */}
                  {logFileName && (
                    <div className="flex items-center gap-2 text-sm text-blue-800 mb-2 animate-fade-in">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span className="font-semibold">{logFileName}</span>
                    </div>
                  )}
                  {/* Summary */}
                  {logSummary && (
                    <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-4 animate-fade-in">
                      <div className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" /> Summary
                      </div>
                      <div className="flex gap-6 text-base font-bold">
                        <div className="flex items-center gap-1 text-green-700"><CheckCircle className="h-4 w-4" /> Info: {logSummary.info}</div>
                        <div className="flex items-center gap-1 text-yellow-700"><AlertTriangle className="h-4 w-4" /> Warnings: {logSummary.warning}</div>
                        <div className="flex items-center gap-1 text-red-700"><XCircle className="h-4 w-4" /> Errors: {logSummary.error}</div>
                      </div>
                    </div>
                  )}
                  {/* Empty state illustration */}
                  {!logFileName && (
                    <div className="flex flex-col items-center mt-8 animate-fade-in-slow">
                      <svg width="80" height="80" fill="none" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="#e0e7ef"/><rect x="20" y="30" width="40" height="20" rx="4" fill="#c7d2fe"/><rect x="28" y="38" width="24" height="4" rx="2" fill="#a5b4fc"/></svg>
                      <span className="mt-4 text-gray-400 text-sm">No file uploaded yet</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Output Side */}
              <div className="flex-1 bg-white rounded-2xl shadow border p-8 flex flex-col min-h-[340px] max-h-[600px] border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg text-blue-700 flex items-center gap-2"><ListChecks className="h-5 w-5 text-blue-400" /> Log Entries</h4>
                </div>
                <div className="relative flex-1 overflow-auto animate-fade-in">
                  {logEntries && logEntries.length > 0 ? (
                    <table className="w-full text-sm border rounded-xl overflow-hidden shadow-md animate-fade-in">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="py-2 px-3 text-left">Timestamp</th>
                          <th className="py-2 px-3 text-left">Level</th>
                          <th className="py-2 px-3 text-left">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logEntries.map((entry, idx) => (
                          <tr key={idx} className="border-b last:border-b-0 hover:bg-blue-50 transition">
                            <td className="py-1 px-3 font-mono text-xs text-gray-700">{entry.timestamp}</td>
                            <td className={`py-1 px-3 font-semibold ${entry.level === 'ERROR' ? 'text-red-600' : entry.level === 'WARNING' ? 'text-yellow-700' : 'text-green-700'}`}>{entry.level}</td>
                            <td className="py-1 px-3 text-gray-800">{entry.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-in-slow">
                      <svg width="80" height="80" fill="none" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="#f3f4f6"/><rect x="20" y="30" width="40" height="20" rx="4" fill="#e0e7ef"/><rect x="28" y="38" width="24" height="4" rx="2" fill="#cbd5e1"/></svg>
                      <span className="mt-4 text-gray-400 font-normal">No log entries to display.</span>
                    </div>
                  )}
                </div>
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
              <div className="text-2xl font-bold text-blue-900">
                {searchAnalyticsLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-blue-300 rounded"></div>
                ) : searchAnalyticsError ? (
                  <span className="text-red-600">Error</span>
                ) : searchAnalytics !== null && searchAnalytics.success ? (
                  searchAnalytics.clicks?.toLocaleString() || '0'
                ) : (
                  '--'
                )}
              </div>
              <div className="text-xs text-blue-700 font-semibold">Total Clicks</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-900">
                {searchAnalyticsLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-green-300 rounded"></div>
                ) : searchAnalyticsError ? (
                  <span className="text-red-600">Error</span>
                ) : searchAnalytics !== null && searchAnalytics.success ? (
                  searchAnalytics.impressions?.toLocaleString() || '0'
                ) : (
                  '--'
                )}
              </div>
              <div className="text-xs text-green-700 font-semibold">Total Impressions</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {searchAnalyticsLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-yellow-300 rounded"></div>
                ) : searchAnalyticsError ? (
                  <span className="text-red-600">Error</span>
                ) : searchAnalytics !== null && searchAnalytics.success ? (
                  `${searchAnalytics.ctr}%`
                ) : (
                  '--'
                )}
              </div>
              <div className="text-xs text-yellow-700 font-semibold">CTR</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-100 to-red-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
            <BarChart3 className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-900">
                {searchAnalyticsLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-red-300 rounded"></div>
                ) : searchAnalyticsError ? (
                  <span className="text-red-600">Error</span>
                ) : searchAnalytics !== null && searchAnalytics.success ? (
                  searchAnalytics.position || '0'
                ) : (
                  '--'
                )}
              </div>
              <div className="text-xs text-red-700 font-semibold">Avg Position</div>
            </div>
          </div>
        </div>

        {/* 1. Performance Report */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-bold text-blue-700">1. Performance Report</h2>
            </div>
            <button
              onClick={() => selectedProjectId && fetchSearchAnalytics(selectedProjectId)}
              disabled={searchAnalyticsLoading}
              className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${searchAnalyticsLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
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
                {searchAnalyticsLoading ? (
                  <tr className="border-b">
                    <td colSpan="5" className="py-4 text-center">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                      </div>
                    </td>
                  </tr>
                ) : searchAnalyticsError ? (
                  <tr className="border-b">
                    <td colSpan="5" className="py-4 text-center text-red-500">
                      <AlertTriangle className="h-4 w-4 mx-auto mb-2" />
                      {searchAnalyticsError}
                    </td>
                  </tr>
                ) : searchAnalytics !== null && searchAnalytics.success && searchAnalytics.rows ? (
                  searchAnalytics.rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 font-medium">{row.keys?.[0] || 'Unknown Query'}</td>
                      <td className="py-2">{row.clicks?.toLocaleString() || '0'}</td>
                      <td className="py-2">{row.impressions?.toLocaleString() || '0'}</td>
                      <td className="py-2">{(row.ctr * 100).toFixed(1)}%</td>
                      <td className="py-2">{row.position?.toFixed(1) || '0'}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b">
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      No search analytics data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center"><FileText className="h-4 w-4 mr-1 text-blue-500" />Search Analytics Summary</h3>
                {searchAnalyticsLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : searchAnalyticsError ? (
                  <div className="text-red-500 text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {searchAnalyticsError}
                  </div>
                ) : searchAnalytics !== null && searchAnalytics.success ? (
                  <>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>Total Clicks — <span className="font-bold text-blue-700">{searchAnalytics.clicks?.toLocaleString() || '0'}</span></li>
                      <li>Total Impressions — <span className="font-bold text-blue-700">{searchAnalytics.impressions?.toLocaleString() || '0'}</span></li>
                      <li>Average CTR — <span className="font-bold text-blue-700">{searchAnalytics.ctr}%</span></li>
                      <li>Average Position — <span className="font-bold text-blue-700">{searchAnalytics.position}</span></li>
                    </ul>
                    <div className="mt-2 text-xs text-gray-500">
                      <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                      Data loaded successfully
                      {lastSearchDataFetch && (
                        <span className="ml-2">
                          • Last updated: {lastSearchDataFetch.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 text-sm">No search analytics data available</div>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center"><Globe className="h-4 w-4 mr-1 text-blue-500" />Countries & Devices</h3>
                {countryDeviceLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : countryDeviceError ? (
                  <div className="text-red-500 text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {countryDeviceError}
                  </div>
                ) : countryDeviceData !== null && countryDeviceData.success && countryDeviceData.data && countryDeviceData.data.length > 0 ? (
                  <ul className="text-sm text-gray-700 space-y-1">
                    {countryDeviceData.data.slice(0, 5).map((item, index) => (
                      <li key={index}>
                        {item.country} <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs ml-1">{item.device}</span>: {item.sessions} sessions
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 text-sm">No country/device data available</div>
                )}
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Search className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-bold text-blue-700">2. URL Inspection Tool</h2>
            </div>
            <button
              onClick={() => urlToInspect && fetchUrlInspectionData(selectedProjectId, urlToInspect)}
              disabled={urlInspectionLoading || !urlToInspect}
              className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${urlInspectionLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
                    {/* URL Input Form */}
          <form onSubmit={handleUrlInspection} className="mb-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                                 placeholder={selectedProjectObj ? `Enter URL to inspect (e.g., ${selectedProjectObj.url} or ${selectedProjectObj.url}/test)` : "Enter URL to inspect (e.g., https://example.com/page)"}
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
              <button
                type="submit"
                disabled={urlInspectionLoading || !urlInputValue.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {urlInspectionLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Inspecting...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-1" />
                    Inspect URL
                  </>
                )}
              </button>
            </div>
            {selectedProjectObj && (
              <div className="mt-2 text-xs text-gray-600">
                                        You can inspect any page from your site ({selectedProjectObj.url}). Try the homepage or add common paths like "/", "/index.html", or "/test".
              </div>
            )}
          </form>

          {/* URL Inspection Results */}
          {urlInspectionLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : urlInspectionError ? (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              <div className="space-y-1">
                <p className="font-semibold">URL Inspection Error</p>
                <p>{urlInspectionError}</p>
                {urlInspectionError.includes('Site not found') && (
                  <p className="text-xs mt-2">
                                            Make sure your site is added to Google Search Console and the URL format matches exactly.
                  </p>
                )}
                {urlInspectionError.includes('must be part of your site') && (
                  <p className="text-xs mt-2">
                                            You can only inspect URLs from your own domain that's configured in this project.
                  </p>
                )}
              </div>
            </div>
          ) : urlInspectionData && urlInspectionData.success ? (
            <div className="space-y-4">
              {/* URL Display */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-semibold text-gray-700">Inspected URL:</span>
                <span className="ml-2 text-blue-600 font-mono text-sm break-all">{urlInspectionData.url}</span>
              </div>
              
              {/* Inspection Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Index Status */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-blue-500" />
                    Index Status
                  </h3>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    urlInspectionData.indexStatus === 'PASS' || urlInspectionData.indexStatus === 'Indexed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {urlInspectionData.indexStatus === 'PASS' || urlInspectionData.indexStatus === 'Indexed' 
                      ? <CheckCircle className="h-4 w-4 mr-1" /> 
                      : <AlertTriangle className="h-4 w-4 mr-1" />
                    }
                    {urlInspectionData.indexStatus || 'Unknown'}
                  </div>
                </div>

                {/* Last Crawled */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-blue-500" />
                    Last Crawled
                  </h3>
                  <div className="text-sm text-gray-700">
                    {urlInspectionData.lastCrawled 
                      ? new Date(urlInspectionData.lastCrawled).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'Unknown'
                    }
                  </div>
                </div>

                {/* Coverage Issues */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-blue-500" />
                    Coverage Issues
                  </h3>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    urlInspectionData.coverageIssues === 'Indexed' || urlInspectionData.coverageIssues === 'PASS' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {urlInspectionData.coverageIssues === 'Indexed' || urlInspectionData.coverageIssues === 'PASS' 
                      ? <CheckCircle className="h-4 w-4 mr-1" /> 
                      : <AlertTriangle className="h-4 w-4 mr-1" />
                    }
                    {urlInspectionData.coverageIssues || 'None'}
                  </div>
                </div>

                {/* Enhancements */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-blue-500" />
                    Enhancements
                  </h3>
                  <div className="space-y-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      urlInspectionData.mobileFriendly === 'PASS' || urlInspectionData.mobileFriendly === 'Mobile Friendly' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      <Smartphone className="h-3 w-3 mr-1" />
                      {urlInspectionData.mobileFriendly || 'Unknown'}
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      urlInspectionData.structuredData === 'PASS' || urlInspectionData.structuredData === 'Valid Structured Data' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {urlInspectionData.structuredData || 'Unknown'}
                    </div>
                    <div className="inline-flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Core Web Vitals: {urlInspectionData.coreWebVitals || 'Good'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                Real data from Google Search Console • Last updated: {new Date(siteAuditData.lastAudit).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <div className="space-y-2">
                <p>Enter a URL above to inspect its search performance and indexing status</p>
                {selectedProjectObj && (
                  <p className="text-xs text-blue-600">
                                            Tip: Try inspecting your homepage ({selectedProjectObj.url}) or add "/test" to the URL
                  </p>
                )}
              </div>
            </div>
          )}
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
