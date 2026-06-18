import { useState, useEffect } from 'react';
import { ClipboardList, Clock, AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const parseJwt = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = parseJwt(token);
        const role = decoded?.role || (decoded?.sub?.includes('author') ? 'author' : 'reviewer');
        setUserRole(role);

        const response = await fetch('http://127.0.0.1:8000/documents/my-tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Could not fetch tasks");
        const allDocs = await response.json();

        setTasks(allDocs);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);
const sortedTasks = [...tasks].sort((a, b) => {
  const dateA = new Date(a.created_at || a.assigned_date || 0);
  const dateB = new Date(b.created_at || b.assigned_date || 0);
  
  return dateB - dateA; 
});
  if (isLoading) return <div className="p-8 text-gray-500">Loading your tasks...</div>;
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList size={32} className="text-blue-600" />
        <h1 className="text-3xl font-semibold text-gray-800">My Tasks</h1>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">You're all caught up!</h2>
          <p className="text-gray-500">There are no pending tasks requiring your attention at this time.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-gray-600 font-medium">
                <th className="px-6 py-4 tracking-wider">Task Type</th>
                <th className="px-6 py-4 tracking-wider">Document</th>
                <th className="px-6 py-4 tracking-wider">Current Status</th>
                <th className="w-48 px-4 py-3 text-left tracking-wider">Assigned Date</th>
                <th className="w-48 px-4 py-3 text-left tracking-wider">Assigned To</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTasks.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {doc.status === 'Rejected' ? (
                         <AlertCircle size={16} className="text-red-500" />
                      ) : (
                         <Clock size={16} className="text-amber-500" />
                      )}
                      <span className="font-semibold text-gray-800">
                        {doc.status === 'In Review' ? 'Review Required' : 'Action Required'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <FileText size={16} />
                      {doc.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      doc.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                      doc.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                      doc.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                  {doc.assigned_date ? new Date(doc.assigned_date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                  }) : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {["Draft", "Approved"].includes(doc.status) 
                    ? doc.owner_name 
                      : (doc.reviewer_name || "Unassigned")}
                    </td>

                  <td className="px-6 py-4 text-right">
                    <Link to={`/documents/${doc.id}`}>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                        Open Document
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CheckCircle({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}