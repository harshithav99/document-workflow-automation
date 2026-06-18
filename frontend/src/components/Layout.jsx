import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FolderKanban, Bell, CheckCircle } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);

  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      setUserName(decoded?.sub || 'User'); 
    }
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://127.0.0.1:8000/documents/notifications/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const logs = await response.json();
          setNotifications(logs.slice(0, 5)); 
        }
      } catch (err) {
        console.error("Notification error:", err);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const isActive = (path) => location.pathname === path 
    ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-4" 
    : "text-gray-600 hover:text-blue-600 pb-4";

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  const parseJwt = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };
  const getNotificationSentence = (action) => {
    if (!action) return "updated the document.";
    
    if (action.includes("In Review")) return "\trequested a review for this document.";
    if (action.includes("Approved")) return "\tapproved this document.";
    if (action.includes("Rejected")) return "\trejected this document.";
    if (action.includes("Uploaded Version")) return "\tuploaded a new version.";
    
    return action.toLowerCase();
  };
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Unknown Date";
    
    let safeString = String(timestamp);
    
    safeString = safeString.replace(' ', 'T');
    
    if (!safeString.endsWith('Z')) {
      safeString += 'Z';
    }
    
    const date = new Date(safeString);
    
    if (isNaN(date.getTime())) {
      console.error("Unreadable Date Format from Backend:", timestamp);
      return "Date Error";
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short' 
    });
  };
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-8 pt-4 shadow-sm flex items-center justify-between relative z-50">
        
        <div className="flex items-center gap-2 text-blue-700 font-bold text-xl pb-4">
          <FolderKanban size={24} />
          <span>Document Management System</span>
        </div>

        <div className="flex items-center gap-8 font-medium mt-2">
          <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
          <Link to="/documents" className={isActive('/documents')}>Documents</Link>
          <Link to="/tasks" className={isActive('/tasks')}>My Tasks</Link>
          <Link to="/audit" className={isActive('/audit')}>Audit Log</Link>
        </div>

        <div className="flex items-center gap-6 pb-4">
          
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-50"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <span className="font-semibold text-gray-800">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="py-2">
                 {notifications.length === 0 ? (
                 <div className="px-4 py-3 text-sm text-gray-500 text-center">No new notifications</div>
                  ) : (
                  notifications.map((notif) => (
                  <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                    <p className="text-sm font-medium text-gray-800">
                    {notif.document_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                    <span className="font-semibold text-blue-600">{notif?.user_name || "System"}</span>
                    {getNotificationSentence(notif?.action)}
                    </p>
      
                    <div className="mt-2">
                    <span className="text-[11px] text-gray-400 font-medium">
                    {formatDateTime(notif.timestamp)}
                    </span>
                    </div>
                    
                  </div>
                  
                  
            ))
            
          )}
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
  <button 
    onClick={() => {
      setIsNotificationsOpen(false); // Closes the menu
      navigate('/audit'); // Routes to the main audit page
    }}
    className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
  >
    View all history
  </button>
</div>

              </div>
            )}
          </div>

          <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
            <span className="text-gray-600 text-sm font-medium">Welcome, </span><span className="font-semibold text-blue-600 capitalize">{userName}</span>
            <button onClick={handleLogout} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
}