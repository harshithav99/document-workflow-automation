import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, ArrowLeft, X, Check, XCircle, Sparkles, Send, Download, Calendar, Edit2, Eye } from 'lucide-react';

export default function DocumentDetails() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(''); 
  const [currentUserSub, setCurrentUserSub] = useState('');  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [isViewing, setIsViewing] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [myUserId, setMyUserId] = useState(null);

  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = parseJwt(token);
        const role = decoded?.role || (decoded?.sub?.includes('author') ? 'author' : 'reviewer');
        setUserRole(role);
        setCurrentUserSub(decoded?.sub); 

        const response = await fetch(`http://127.0.0.1:8000/documents/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Could not fetch document");
        const data = await response.json();
        setDoc(data);

        const userResponse = await fetch(`http://127.0.0.1:8000/users/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userResponse.ok) {
          const allUsers = await userResponse.json();
        const me = allUsers.find(u => u.username === decoded?.sub);
          if (me) setMyUserId(me.id);
          
          const validReviewers = allUsers.filter(user => {
            if (!user || !user.role) return false;
            const r = String(user.role).toLowerCase().trim();
            return r === 'reviewer' || r === 'both';
          });
          setReviewers(validReviewers);
        }
      } catch (err) {
        console.error("Error loading document:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);
  
  const updateStatus = async (newStatus, reason = null, reviewerId = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/documents/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status: newStatus, reason: reason, reviewer_id: reviewerId })
      });

      if (!response.ok) throw new Error("Failed to update status");
      
      const updatedDoc = await response.json();
      setDoc(updatedDoc); 
      console.log("BACKEND SENT THIS:", updatedDoc);
      if (newStatus === 'Rejected') {
        setIsRejectModalOpen(false);
        setRejectReason('');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    updateStatus('Rejected', rejectReason);
  };

  const handleNewVersionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://127.0.0.1:8000/documents/${id}/file`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
      });
      
      if (!response.ok) throw new Error("Failed to upload new version");
      
      const updatedDoc = await response.json();
      setDoc(updatedDoc); 
      alert(`Version ${updatedDoc.version}.0 uploaded successfully!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:8000/documents/${doc.id}/download`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to download file. It may have been moved or deleted.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const extension = doc.title.includes('.') ? '' : '.pdf';
      a.download = `${doc.title}${extension}`; 
      
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateDeadline = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/documents/${doc.id}/deadline`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ due_date_str: newDeadline })
      });

      if (!response.ok) throw new Error("Failed to update deadline.");
      
      setIsEditingDeadline(false);
      window.location.reload(); 
      
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:8000/documents/${doc.id}/download`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to load document.");

      const blob = await response.blob();
      
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      
      setViewerUrl(url);
      setIsViewing(true);
      
    } catch (err) {
      alert(err.message);
    }
  };

  const closeViewer = () => {
    setIsViewing(false);
    if (viewerUrl) {
      window.URL.revokeObjectURL(viewerUrl);
      setViewerUrl(null);
    }
  };

  if (isLoading) return <div className="p-8 text-gray-500">Loading document details...</div>;
  if (!doc) return <div className="p-8 text-red-500">Document not found.</div>;

  const isAssignedReviewer = String(doc?.assigned_reviewer_id) === String(myUserId) || String(doc?.reviewer_id) === String(myUserId);
  const isPastDeadline = doc?.due_date ? new Date(doc.due_date) < new Date() : false;
  
  const canProvideVerdict = (userRole?.includes('reviewer') || userRole === 'both') && 
                            doc?.status === 'In Review' && 
                            (isAssignedReviewer || isPastDeadline);

  console.log("--- DATA ARRIVING IN REACT ---");
  console.log("Document Object:", doc);
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Document Details</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-8">
        
        <div className="flex items-center gap-3 text-gray-800 font-medium text-xl mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FileText size={24} />
          </div>
          {doc.title}
          <span className="ml-3 px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-bold tracking-wider">
            v{doc.version || 1}.0
          </span>
          <button 
              onClick={handleViewDocument}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium transition-colors border border-indigo-200 shadow-sm"
            >
              <Eye size={16} />
              View Document
            </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors border border-gray-200 shadow-sm"
          >
            <Download size={16} />
            Download Original
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-8">
          <div><span className="font-semibold mr-2">Owner ID:</span> {doc.owner_id}</div>
          <div><span className="font-semibold mr-2">Owner Name:</span> {doc.owner_name}</div>
          <div className="flex items-center">
            <span className="font-semibold mr-2">Created Date:</span> 
            {doc.createdDate ? (
              <>
                <span>
                  {new Date(doc.createdDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="mx-2 text-gray-400">|</span> 
                <span>
                  {new Date(doc.createdDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </>
            ) : 'Unknown'}
          </div>
          {doc.rejection_reason && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md shadow-sm">
              <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="font-semibold text-red-700 text-lg">Rejection Reason</span>
              </div>
    
              <p className="text-red-700 ml-7">
                {doc.rejection_reason || "No reason provided by the reviewer."}
              </p>
            </div>
          )}
          <div className="col-span-2 flex items-center mt-2">
            <span className="font-semibold mr-4">Current Status:</span> 
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
              doc.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
              doc.status === 'In Review' ? 'bg-amber-100 text-amber-800' :
              doc.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {doc.status}
            </span>
            {doc.status === 'In Review' && (
              <span className="ml-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Assigned to: {
                  doc.reviewer_name 
                  || reviewers.find(r => String(r.id) === String(doc.assigned_reviewer_id || doc.reviewer_id))?.username 
                  || "All Reviewers"
                }
              </span>
            )}
          </div>
        </div>

        <div>
          <span className="text-sm text-gray-500 block flex items-center gap-1">
            <Calendar size={14} />
            Deadline
          </span>
          
          {isEditingDeadline ? (
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="datetime-local" 
                className="border rounded p-1 text-sm border-gray-300"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
              <button onClick={handleUpdateDeadline} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Save</button>
              <button onClick={() => setIsEditingDeadline(false)} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-1">
              <span className={`font-medium ${doc.due_date && new Date(doc.due_date) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                {doc.due_date ? new Date(doc.due_date).toLocaleString() : "No Deadline Set"}
              </span>
              
              {(userRole?.includes('author') || userRole === 'both') && (
                <button 
                  onClick={() => setIsEditingDeadline(true)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit Deadline"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mb-10 mt-6 bg-indigo-50 border border-indigo-100 rounded-lg p-5">
          <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600"/> 
            AI Extracted Summary
          </h3>
          <p className="text-sm text-indigo-800 italic leading-relaxed">
            {doc.summary ? `"${doc.summary}"` : "No text could be extracted from this document."}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Actions:</h3>
          <div className="flex gap-4 items-center">
            
            {(userRole?.includes('author') || userRole === 'both') && (doc.status === 'Draft' || doc.status === 'Rejected') && (
              <div className="flex items-center gap-3">
                <div>
                  <input type="file" id="new-version" className="hidden" accept=".pdf,.docx" onChange={handleNewVersionUpload} />
                  <label htmlFor="new-version" className="cursor-pointer px-4 py-2 border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors inline-block">
                    Upload New Version
                  </label>
                </div>
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedReviewer}
                  onChange={(e) => setSelectedReviewer(e.target.value)}
                >
                  <option value="">Select a Reviewer...</option>
                  {reviewers.map(r => (
                    <option key={r.id} value={r.id}>{r.username} ({r.email})</option>
                  ))}
                </select>

                <button 
                  onClick={() => updateStatus('In Review', null, selectedReviewer)}
                  disabled={!selectedReviewer} 
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Send size={18} /> Send for Review
                </button>
              </div>
            )}

            {canProvideVerdict && (
              <>
                <button 
                  onClick={() => updateStatus('Approved')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Check size={18} /> Approve
                </button>
                <button 
                  onClick={() => setIsRejectModalOpen(true)}
                  className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <XCircle size={18} /> Reject
                </button>
              </>
            )}

            {(doc.status === 'Approved' || doc.status === 'Rejected') && (
              <span className="text-sm text-gray-500 italic">No further actions required.</span>
            )}
            
            {(userRole?.includes('author') || userRole === 'both') && doc.status === 'In Review' && (
              <span className="text-sm text-gray-500 italic flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Waiting for reviewer approval...
              </span>
            )}

          </div>
        </div>

      </div>

      <Link to="/documents" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium transition-colors w-fit">
        <ArrowLeft size={18} /> Back to Documents
      </Link>
      
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-lg">Reject Document</h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection:</label>
              <textarea 
                required rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none mb-6 text-sm text-gray-700"
                value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              ></textarea>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">Reject</button>
              </div>
            </form>
          </div>
        </div>  
      )}
      
      {isViewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600"/>
                {doc.title}
              </h3>
              <button 
                onClick={closeViewer}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-red-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow bg-gray-200 w-full rounded-b-lg overflow-hidden flex flex-col">
              {viewerUrl ? (
                <embed 
                  src={viewerUrl} 
                  type="application/pdf" 
                  className="w-full h-full min-h-[75vh]"
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[75vh]">
                  <p className="text-gray-500 font-medium animate-pulse">Loading document...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}