import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, BarChart3, Settings, User, Plus, TrendingUp, Link, FileText, 
  Globe, Zap, Target, Eye, CheckCircle, AlertTriangle, RefreshCw,
  ChevronDown, Menu, X, Home, Users, Activity, Code, ExternalLink
} from 'lucide-react';

const SEODashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState('Website 1');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  

  const [user, setUser] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    } else {
      navigate('/');
  }
  }, []);

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
    organicTraffic: { value: 15420, change: '+12.5%' },
    keywordRankings: { value: 234, change: '+8.2%' },
    backlinks: { value: 1247, change: '+15.3%' },
    pageSpeed: { value: 85, change: '+5.2%' }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(kpiData).map(([key, data]) => (
          <div key={key} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-2xl font-bold text-gray-900">{data.value}</p>
                <p className="text-sm text-green-600">{data.change}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        ))}
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

  const renderOnPageSEO = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Site Audit', icon: Search, desc: 'Crawl and identify website issues' },
          { title: 'SEO Content Template', icon: FileText, desc: 'Generate optimized content templates' },
          { title: 'Keyword Planner', icon: Target, desc: 'Discover keyword opportunities' },
          { title: 'Content Optimizer', icon: RefreshCw, desc: 'Analyze and improve existing content' },
          { title: 'Log File Analyzer', icon: Activity, desc: 'Analyze server logs for insights' },
          { title: 'Content Writer', icon: FileText, desc: 'AI-powered content generation' }
        ].map((feature, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
            <feature.icon className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.desc}</p>
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Launch Tool
            </button>
          </div>
        ))}
      </div>
    </div>
  );

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
            {/* Project Selector */}
            <div className="relative">
              <select 
                value={selectedProject} 
                onChange={(e) => setSelectedProject(e.target.value)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.name}>{project.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-gray-400" />
              <div className="text-sm">
                <p className="font-medium">{user?.name || 'Guest'}</p>
                <p className="text-gray-500">{user?.role || 'User'}</p>
              </div>
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
                    onClick={() => setCurrentView(item.id)}
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
                          className="w-full text-left px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
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
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SEODashboard;  
<button
  onClick={() => {
    localStorage.removeItem("user");
    window.location.href = "/";
  }}
  className="bg-red-500 text-white px-4 py-2 rounded"
>
  Logout
</button>
