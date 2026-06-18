import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [recentDocs, setRecentDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://127.0.0.1:8000/documents/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Failed to fetch documents");
        
        const allDocs = await response.json();
        
        const total = allDocs.length;
        const pending = allDocs.filter(doc => doc.status === 'In Review').length;
        const approved = allDocs.filter(doc => doc.status === 'Approved').length;
        
        setStats({ total, pending, approved });

        const recent = [...allDocs].reverse().slice(0, 5);
        setRecentDocs(recent);

      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) return <div className="p-8 text-gray-500">Loading your command center...</div>;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
            <FileText size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Documents</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex items-center gap-6">
          <div className="p-4 bg-amber-50 text-amber-500 rounded-full">
            <Clock size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Review</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.pending}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex items-center gap-6">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
            <CheckCircle size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Approved</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.approved}</h3>
          </div>
        </div>

      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            Recently Added Documents
          </h3>
          <Link to="/documents" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-gray-100">
            {recentDocs.length === 0 ? (
              <tr><td className="px-6 py-8 text-center text-gray-500">No documents found. Start uploading!</td></tr>
            ) : (
              recentDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3 text-gray-800 font-medium">
                    <FileText size={16} className="text-gray-400" />
                    {doc.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      doc.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                      doc.status === 'In Review' ? 'bg-amber-100 text-amber-800' :
                      doc.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/documents/${doc.id}`} className="text-blue-600 font-medium hover:underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}