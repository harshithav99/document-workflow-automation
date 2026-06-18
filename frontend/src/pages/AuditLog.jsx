import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, User, FileText, Activity } from 'lucide-react';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://127.0.0.1:8000/documents/audit/logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Failed to fetch audit logs");
        
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.error("Audit Log Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";
    
    let safeString = String(dateString).replace(' ', 'T');
    if (!safeString.endsWith('Z')) {
      safeString += 'Z';
    }
    
    const date = new Date(safeString);
    
    if (isNaN(date.getTime())) return "Date Error";

    return new Intl.DateTimeFormat('en-US', {
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit',
      timeZoneName: 'short' 
    }).format(date);
  };
  const filteredLogs = logs.filter((log) => {
    
    const matchesUser = userFilter 
      ? (log.user_name || "").toLowerCase().includes(userFilter.toLowerCase()) 
      : true;

    const matchesDate = dateFilter 
      ? String(log.timestamp).startsWith(dateFilter) 
      : true;

    return matchesUser && matchesDate;
  });

  const displayLogs = filteredLogs.slice(0, 25);
  if (isLoading) return <div className="p-8 text-gray-500">Loading compliance records...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck size={32} className="text-blue-600" />
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">System Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Log records of all document workflows and system actions.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by User..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
         />
        <input
        type="date"
        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
      />
  
  {(userFilter || dateFilter) && (
    <button 
      onClick={() => { setUserFilter(""); setDateFilter(""); }}
      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
    >
      Clear Filters
    </button>
  )}
</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-gray-600 font-medium">
                <th className="px-6 py-4 flex items-center gap-2"><Clock size={16}/> Timestamp</th>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><User size={16}/> User</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><Activity size={16}/> Action</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><FileText size={16}/> Document</div></th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No system activity recorded yet.
                  </td>
                </tr>
              ) : (
                displayLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {log.user_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        log.action.includes('Uploaded') ? 'bg-blue-100 text-blue-800' :
                        log.action.includes('Approved') ? 'bg-emerald-100 text-emerald-800' :
                        log.action.includes('Rejected') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-normal break-words max-w-xs">
                      {log.document_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 italic whitespace-normal break-words min-w-[300px]">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}