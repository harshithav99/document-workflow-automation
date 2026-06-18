import { useState, useEffect } from 'react';
import { FileText, Plus, X, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

const parseJwt = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
};

export default function Documents() {
  const [userRole, setUserRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [documents, setDocuments] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); 
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      const role = decoded?.role || (decoded?.sub?.includes('author') ? 'author' : 'reviewer');
      setUserRole(role);
      
      fetchDocuments(token);
    }
  }, []);

  const fetchDocuments = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/documents/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      
      const data = await response.json();
      setDocuments(data); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Draft': return 'bg-gray-100 text-gray-700';
      case 'In Review': return 'bg-amber-100 text-amber-800';
      case 'Approved': return 'bg-green-100 text-green-800'; 
      case 'Rejected': return 'bg-red-100 text-red-800';     
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
   if (!selectedFile) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in to upload files.');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name);
      if (dueDate) {
      formData.append("due_date_str", dueDate); 
      }
      const response = await fetch('http://127.0.0.1:8000/documents/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
          
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload document to the server.');

      const data = await response.json();
      
      alert(`Success! File uploaded.`);
      
      setIsModalOpen(false);
      setSelectedFile(null);
      
      fetchDocuments(token); 
      
    } catch (err) {
      alert(err.message);
    }
  };
  const processedDocuments = documents
  .filter(doc => {
    const matchesOwner = doc.owner_name 
      ? doc.owner_name.toLowerCase().includes(ownerFilter.toLowerCase()) 
      : true; 

    const matchesDate = dateFilter 
      ? doc.createdDate && doc.createdDate.startsWith(dateFilter) 
      : true; 
    
    return matchesOwner && matchesDate;
  })
  
  .sort((a, b) => {
    const dateA = new Date(a.createdDate);
    const dateB = new Date(b.createdDate);
    
    return sortOrder === 'desc' 
      ? dateB - dateA 
      : dateA - dateB; 
  });
  const totalPages = Math.ceil(processedDocuments.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDocuments = processedDocuments.slice(startIndex, startIndex + itemsPerPage);

    if (currentPage > totalPages) {
        setCurrentPage(1);
    }
  console.log("THE CURRENT ROLE IS EXACTLY:", userRole);
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">Documents</h1>
        
        {(String(userRole).toLowerCase().includes('author') || String(userRole).toLowerCase().includes('both')) && (
        <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
        <Plus size={20} />
        Upload Document
        </button>
        )}
      </div>
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-600 mb-1">Filter by Owner</label>
          <input 
            type="text" 
            placeholder="Type username..." 
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="p-2 border rounded-md"
          />
        </div>

        <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-600 mb-1">Filter by Date</label>
        <input 
          type="date" 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-2 border rounded-md"
        />
        </div>

        <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-600 mb-1">Sort by Date</label>
        <select 
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border rounded-md"
        >
        <option value="desc">Newest First</option>
        <option value="asc">Oldest First</option>
        </select>
        </div>
  
        <div className="flex flex-col justify-end">
        <button 
          onClick={() => { setOwnerFilter(''); setDateFilter(''); }}
          className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
        >
        Clear Filters
        </button>
    </div>

</div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-gray-600 font-medium">
              <th className="px-6 py-4">Document Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-6 text-left">Created Date</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan="5" className="text-center py-8 text-gray-500">Loading documents...</td></tr>
            )}
            
            {!isLoading && paginatedDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3 text-gray-800 font-medium">
                  <FileText size={18} className="text-gray-400" />
                  {doc.title} 
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(doc.status)}`}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{doc.owner_name}</td>
                <td> 
                {doc.createdDate ? new Date(doc.createdDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric'
                }) : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/documents/${doc.id}`}>
                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">
                      View &gt;
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{processedDocuments.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, processedDocuments.length)}</span> of <span className="font-medium">{processedDocuments.length}</span> results
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border text-sm font-medium transition-colors
              ${currentPage === 1 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
              {'<'}
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded border text-sm font-medium transition-colors
              ${currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
              {'>'}
            </button>
            </div>
          </div>
      </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <UploadCloud size={20} className="text-blue-600" />
                Upload New Document
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File (PDF or DOCX)
                </label>
                <input 
                  type="file" 
                  accept=".pdf,.docx"
                  required
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-md cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                    ✓ {selectedFile.name} selected
                  </p>
                )}
              </div>
              <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline (Optional)
              </label>
              <input 
              type="datetime-local" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}