import React, { useState, useRef } from 'react';
import { Meeting, DocumentFile } from './types';
import { DocumentViewer } from './components/DocumentViewer';
import { SmartAssistant } from './components/SmartAssistant';
import { formatFileSize } from './utils/fileUtils';
import { 
  Layout, 
  Calendar, 
  Plus, 
  Upload, 
  FileText, 
  Search, 
  Menu,
  Sparkles,
  Users,
  Clock,
  MapPin,
  Trash2,
  X,
  FileUp,
  UserPlus,
  User,
  CalendarPlus,
  Settings,
  Folder,
  Save,
  Mail,
  Briefcase,
  Shield,
  Bell,
  Moon,
  Globe,
  MoreVertical,
  Filter,
  Download,
  CheckCircle2,
  Pencil
} from 'lucide-react';

// Mock Data
const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Họp Hội đồng Quản trị tháng 3',
    date: '2025-03-15T09:00:00',
    location: 'Phòng VIP 1',
    attendees: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Hoàng Xuân D'],
    status: 'ongoing'
  },
  {
    id: 'm2',
    title: 'Rà soát Kỹ thuật Dự án E-Meeting',
    date: '2025-03-16T14:30:00',
    location: 'Phòng Kỹ thuật',
    attendees: ['Phạm Văn D', 'Vũ Thị E'],
    status: 'upcoming'
  }
];

const MOCK_MEMBERS = [
  { id: 1, name: 'Nguyễn Văn A', email: 'vana@company.com', dept: 'Ban Giám Đốc', role: 'CEO' },
  { id: 2, name: 'Trần Thị B', email: 'thib@company.com', dept: 'Tài Chính', role: 'CFO' },
  { id: 3, name: 'Lê Văn C', email: 'vanc@company.com', dept: 'Kỹ Thuật', role: 'CTO' },
];

const MOCK_GLOBAL_DOCS = [
  { id: 'd1', name: 'Quy chế hoạt động 2025.pdf', size: '2.5 MB', type: 'PDF', date: '10/03/2025' },
  { id: 'd2', name: 'Mẫu báo cáo tuần.docx', size: '450 KB', type: 'DOCX', date: '11/03/2025' },
  { id: 'd3', name: 'Danh sách nhân sự Q1.xlsx', size: '1.2 MB', type: 'XLSX', date: '09/03/2025' },
  { id: 'd4', name: 'Brand Guidelines v2.pdf', size: '15 MB', type: 'PDF', date: '01/01/2025' },
];

type ActiveView = 'meeting' | 'members' | 'documents' | 'settings';

export default function App() {
  // Main Navigation State
  const [activeView, setActiveView] = useState<ActiveView>('meeting');

  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting>(MOCK_MEETINGS[0]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // States for Attendee Management
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [newAttendeeName, setNewAttendeeName] = useState('');

  // States for Create/Edit Meeting
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [newMeetingForm, setNewMeetingForm] = useState({
    title: '',
    date: '',
    location: ''
  });

  // States for Member Management View
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [newMemberForm, setNewMemberForm] = useState({ name: '', email: '', dept: '', role: '' });

  // States for Settings View
  const [systemConfig, setSystemConfig] = useState({
    emailNotif: true,
    aiFeatures: true,
    darkMode: false,
    autoSave: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList) => {
    const newDocuments: DocumentFile[] = Array.from(files).map((file: File) => {
      const isPdf = file.type === 'application/pdf';
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                     file.name.endsWith('.docx');
      
      if (!isPdf && !isDocx) return null;

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: isPdf ? 'pdf' : 'docx',
        size: file.size,
        file: file,
        url: URL.createObjectURL(file),
        uploadedAt: new Date()
      };
    }).filter((doc): doc is DocumentFile => doc !== null);

    if (newDocuments.length > 0) {
        setDocuments((prev) => [...prev, ...newDocuments]);
        if (!selectedDocument) {
            setSelectedDocument(newDocuments[0]);
        }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
        processFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (selectedDocument?.id === id) {
      setSelectedDocument(null);
      setShowAssistant(false);
    }
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
    if (!isFocusMode) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  };

  // Attendee Management Logic
  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendeeName.trim()) return;

    const updatedAttendees = [...selectedMeeting.attendees, newAttendeeName.trim()];
    updateMeetingAttendees(updatedAttendees);
    setNewAttendeeName('');
  };

  const handleRemoveAttendee = (indexToRemove: number) => {
    const updatedAttendees = selectedMeeting.attendees.filter((_, index) => index !== indexToRemove);
    updateMeetingAttendees(updatedAttendees);
  };

  const updateMeetingAttendees = (newAttendees: string[]) => {
    const updatedMeeting = { ...selectedMeeting, attendees: newAttendees };
    setSelectedMeeting(updatedMeeting);
    setMeetings(prev => prev.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
  };

  // Create/Edit Meeting Logic
  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingForm.title || !newMeetingForm.date) return;

    if (editingMeetingId) {
      // Update existing meeting
      const updatedMeetings = meetings.map(m => {
        if (m.id === editingMeetingId) {
          const updated = {
            ...m,
            title: newMeetingForm.title,
            date: newMeetingForm.date,
            location: newMeetingForm.location || 'Phòng họp trực tuyến',
          };
          if (selectedMeeting.id === editingMeetingId) {
            setSelectedMeeting(updated);
          }
          return updated;
        }
        return m;
      });
      setMeetings(updatedMeetings);
    } else {
      // Create new meeting
      const newMeeting: Meeting = {
        id: Math.random().toString(36).substr(2, 9),
        title: newMeetingForm.title,
        date: newMeetingForm.date,
        location: newMeetingForm.location || 'Phòng họp trực tuyến',
        attendees: [],
        status: 'upcoming'
      };
      setMeetings(prev => [newMeeting, ...prev]);
      setSelectedMeeting(newMeeting);
      setDocuments([]); 
      setSelectedDocument(null);
    }

    setShowCreateMeetingModal(false);
    setNewMeetingForm({ title: '', date: '', location: '' });
    setEditingMeetingId(null);
    setActiveView('meeting');
  };

  const handleEditMeetingClick = (e: React.MouseEvent, meeting: Meeting) => {
    e.stopPropagation();
    setEditingMeetingId(meeting.id);
    setNewMeetingForm({
      title: meeting.title,
      date: meeting.date,
      location: meeting.location
    });
    setShowCreateMeetingModal(true);
  };

  const handleDeleteMeeting = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa phiên họp này không?')) {
      const updatedMeetings = meetings.filter(m => m.id !== id);
      setMeetings(updatedMeetings);
      
      // If we deleted the selected meeting, select another one if available
      if (selectedMeeting.id === id) {
        if (updatedMeetings.length > 0) {
          setSelectedMeeting(updatedMeetings[0]);
        } else {
          // Keep the deleted data in view or clear it, handling empty state separately
          // For now, we'll keep previous logic or handle empty state in UI
        }
      }
    }
  };

  const openCreateModal = () => {
    setEditingMeetingId(null);
    setNewMeetingForm({ title: '', date: '', location: '' });
    setShowCreateMeetingModal(true);
  }

  // Create Member Logic
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember = {
        id: Date.now(),
        ...newMemberForm
    };
    setMembers(prev => [...prev, newMember]);
    setNewMemberForm({ name: '', email: '', dept: '', role: '' });
    alert("Đã thêm thành viên mới thành công!");
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Mobile Sidebar Toggle */}
      {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="absolute top-4 left-4 z-50 p-3 bg-slate-900 text-white shadow-2xl rounded-2xl md:hidden active:scale-95 transition-all"
          >
              <Menu className="w-6 h-6"/>
          </button>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'} transition-all duration-500 ease-in-out fixed md:relative z-40 h-full bg-slate-900 text-white flex flex-col shadow-2xl overflow-hidden`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="font-bold text-xl leading-none">E-Meeting</h1>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Enterprise v2.0</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-all">
              <X className="w-5 h-5 text-slate-400"/>
          </button>
        </div>

        <div className="p-4 shrink-0">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm nội dung..." 
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-6 scrollbar-hide">
          {/* Menu Quản lý Section */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 px-4 py-2 uppercase tracking-[0.2em]">Menu Quản lý</div>
            <div className="space-y-1.5 mt-1">
                <button 
                    onClick={() => setActiveView('members')}
                    className={`w-full text-left p-3 px-4 rounded-xl transition-all flex items-center gap-3 group ${activeView === 'members' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                    <UserPlus className={`w-5 h-5 ${activeView === 'members' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`} />
                    <span className="font-medium text-sm">Tạo thành viên mới</span>
                </button>
                <button 
                    onClick={() => setActiveView('documents')}
                    className={`w-full text-left p-3 px-4 rounded-xl transition-all flex items-center gap-3 group ${activeView === 'documents' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                    <Folder className={`w-5 h-5 ${activeView === 'documents' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`} />
                    <span className="font-medium text-sm">Kho tài liệu chung</span>
                </button>
                <button 
                    onClick={() => setActiveView('settings')}
                    className={`w-full text-left p-3 px-4 rounded-xl transition-all flex items-center gap-3 group ${activeView === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                    <Settings className={`w-5 h-5 ${activeView === 'settings' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`} />
                    <span className="font-medium text-sm">Cấu hình hệ thống</span>
                </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 px-4 py-2 uppercase tracking-[0.2em]">Lịch trình hôm nay</div>
            <div className="space-y-1.5 mt-1">
                {meetings.map(meeting => (
                <div key={meeting.id} className="relative group/item">
                  <button
                      onClick={() => {
                          setSelectedMeeting(meeting);
                          setActiveView('meeting');
                      }}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 group relative ${
                      selectedMeeting.id === meeting.id && activeView === 'meeting'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                  >
                      <div className="font-bold text-sm line-clamp-1 pr-6">{meeting.title}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(meeting.date).getHours()}:00</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {meeting.location}</span>
                      </div>
                      {selectedMeeting.id === meeting.id && activeView === 'meeting' && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-sm animate-pulse"></div>
                      )}
                  </button>
                  {/* Edit/Delete Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleEditMeetingClick(e, meeting)}
                      className={`p-1.5 rounded-lg hover:bg-slate-700 hover:text-white transition-colors ${selectedMeeting.id === meeting.id && activeView === 'meeting' ? 'text-blue-200' : 'text-slate-500'}`}
                      title="Sửa"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteMeeting(e, meeting.id)}
                      className={`p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors ${selectedMeeting.id === meeting.id && activeView === 'meeting' ? 'text-blue-200' : 'text-slate-500'}`}
                      title="Xóa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                ))}
            </div>
          </div>

          <div className="px-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-inner">
                <p className="text-xs text-slate-400 leading-relaxed italic">"Trợ lý AI đang sẵn sàng hỗ trợ bạn tóm tắt nội dung cuộc họp trong thời gian thực."</p>
                <div className="mt-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">AI Core Active</span>
                </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm shrink-0">
          <button 
            onClick={openCreateModal}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-tighter"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Phiên Họp Mới</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 transition-all duration-500 relative overflow-hidden">
        
        {/* VIEW 1: MEETING WORKSPACE (DEFAULT) */}
        {activeView === 'meeting' && meetings.length > 0 ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Header */}
                <header className={`${isFocusMode ? 'h-0 -translate-y-full opacity-0 overflow-hidden' : 'h-24 opacity-100'} bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 transition-all duration-500 shrink-0`}>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all hidden md:block">
                                <Menu className="w-5 h-5 text-slate-600"/>
                            </button>
                            )}
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedMeeting.title}</h2>
                            {selectedMeeting.status === 'ongoing' && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-200">
                                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                                    Live
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-5 text-sm font-medium text-slate-500 mt-1.5">
                            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> {new Date(selectedMeeting.date).toLocaleDateString('vi-VN', {weekday: 'long', day: 'numeric', month: 'long'})}</div>
                            <button 
                            onClick={() => setShowAttendeeModal(true)}
                            className="flex items-center gap-1.5 hover:text-indigo-600 hover:bg-indigo-50 px-2 -ml-2 py-0.5 rounded-lg transition-all cursor-pointer group"
                            title="Quản lý đại biểu"
                            >
                            <Users className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" /> 
                            <span>{selectedMeeting.attendees.length} đại biểu</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowAssistant(!showAssistant)}
                            className={`group flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all text-xs uppercase tracking-widest ${
                                showAssistant 
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-300' 
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'
                            }`}
                        >
                            <Sparkles className={`w-4 h-4 ${showAssistant ? 'animate-spin' : 'text-indigo-500 group-hover:scale-125'}`} />
                            <span>Trợ lý AI</span>
                        </button>
                        <div className="h-10 w-px bg-slate-200 mx-1"></div>
                        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">Admin User</p>
                                <p className="text-[10px] text-slate-500">Chủ tọa phiên họp</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 p-0.5 shadow-sm group-hover:shadow-md transition-all">
                                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-blue-600 text-sm">AU</div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar Document Management */}
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`${isFocusMode ? 'w-0 opacity-0 -translate-x-full' : 'w-80 opacity-100'} bg-white border-r border-slate-200 flex flex-col z-10 transition-all duration-500 ease-in-out ${isDragging ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : ''} overflow-hidden`}
                    >
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tighter">
                                Tài liệu họp 
                                <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded-full text-blue-600 font-black">{documents.length}</span>
                            </h3>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Tải lên tài liệu mới"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {documents.length === 0 ? (
                                <div 
                                    className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50"
                                >
                                    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                                        <FileUp className="w-10 h-10 text-slate-300 animate-bounce" />
                                    </div>
                                    <p className="text-sm font-black text-slate-600">Thả file vào đây</p>
                                    <p className="text-[10px] mt-2 text-slate-400 font-bold uppercase">Hỗ trợ .PDF, .DOCX</p>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-8 px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-xl transition-all active:scale-95"
                                    >
                                        Duyệt file
                                    </button>
                                </div>
                            ) : (
                                documents.map(doc => (
                                    <div 
                                        key={doc.id}
                                        onClick={() => setSelectedDocument(doc)}
                                        className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                            selectedDocument?.id === doc.id 
                                            ? 'bg-blue-50 border-blue-600 shadow-xl scale-[1.03] z-10' 
                                            : 'bg-white border-slate-50 hover:border-slate-200 hover:shadow-lg'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl shadow-inner ${doc.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-black text-sm truncate tracking-tight ${selectedDocument?.id === doc.id ? 'text-blue-900' : 'text-slate-800'}`}>{doc.name}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 tracking-widest">{doc.type}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{formatFileSize(doc.size)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-100 shrink-0">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="hidden"
                                multiple
                            />
                            <div className="bg-slate-900 text-white rounded-3xl p-5 overflow-hidden relative group cursor-help">
                                <div className="relative z-10">
                                    <h4 className="font-black text-xs uppercase tracking-widest mb-1 text-blue-400">Meeting Cloud</h4>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden shadow-inner">
                                        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full w-[15%]"></div>
                                    </div>
                                    <p className="text-[9px] mt-3 font-bold text-slate-500">125MB / 2.0GB • 12 FILES</p>
                                </div>
                                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-125 transition-all"></div>
                            </div>
                        </div>
                    </div>

                    {/* Main Viewer Area */}
                    <main className="flex-1 bg-slate-200/50 relative overflow-hidden flex flex-col z-0 transition-all duration-500">
                        {selectedDocument ? (
                            <DocumentViewer 
                            document={selectedDocument} 
                            onToggleFocus={toggleFocusMode}
                            isFocusMode={isFocusMode}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-40 h-40 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mb-10 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                                    <FileText className="w-20 h-20 text-slate-100" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">Hệ thống sẵn sàng</h3>
                                <p className="max-w-md text-slate-500 leading-relaxed font-bold text-sm">
                                    Phiên họp hiện chưa có tài liệu nào được hiển thị. Vui lòng chọn tài liệu từ danh sách hoặc tải lên nội dung mới để bắt đầu thảo luận.
                                </p>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-10 flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
                                >
                                    <Upload className="w-5 h-5" />
                                    Tải tài liệu ngay
                                </button>
                            </div>
                        )}
                        
                        {/* AI Assistant Overlay */}
                        {showAssistant && (
                            <SmartAssistant 
                                document={selectedDocument} 
                                onClose={() => setShowAssistant(false)} 
                            />
                        )}
                    </main>
                </div>
            </div>
        ) : activeView === 'meeting' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Calendar className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold text-lg">Chưa có phiên họp nào</p>
            <p className="text-sm mt-1">Vui lòng tạo phiên họp mới để bắt đầu</p>
            <button 
              onClick={openCreateModal}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              Tạo phiên họp ngay
            </button>
          </div>
        ) : null}

        {/* VIEW 2: MEMBER MANAGEMENT */}
        {activeView === 'members' && (
            <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
                <header className="h-24 px-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <UserPlus className="w-8 h-8 text-blue-600" />
                            Quản lý Thành viên
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Thêm và quản lý hồ sơ nhân sự hệ thống</p>
                    </div>
                    {!sidebarOpen && (
                        <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all md:hidden">
                            <Menu className="w-5 h-5 text-slate-600"/>
                        </button>
                    )}
                </header>
                
                <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Add Member Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-0">
                                <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-blue-600" />
                                    Thêm mới
                                </h3>
                                <form onSubmit={handleCreateMember} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Họ và tên</label>
                                        <div className="relative">
                                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                            <input 
                                                required
                                                type="text" 
                                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                placeholder="Nhập họ tên..."
                                                value={newMemberForm.name}
                                                onChange={e => setNewMemberForm({...newMemberForm, name: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Email</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                            <input 
                                                required
                                                type="email" 
                                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                placeholder="email@company.com"
                                                value={newMemberForm.email}
                                                onChange={e => setNewMemberForm({...newMemberForm, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600 uppercase">Phòng ban</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                placeholder="IT, HR..."
                                                value={newMemberForm.dept}
                                                onChange={e => setNewMemberForm({...newMemberForm, dept: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600 uppercase">Chức vụ</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                placeholder="Manager..."
                                                value={newMemberForm.role}
                                                onChange={e => setNewMemberForm({...newMemberForm, role: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" /> Lưu hồ sơ
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Member List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Danh sách nhân sự ({members.length})</h3>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-white rounded-lg text-slate-500 border border-transparent hover:border-slate-200 transition-all"><Filter className="w-4 h-4" /></button>
                                        <button className="p-2 hover:bg-white rounded-lg text-slate-500 border border-transparent hover:border-slate-200 transition-all"><MoreVertical className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4">Họ tên</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Phòng ban</th>
                                                <th className="px-6 py-4 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {members.map(member => (
                                                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{member.name}</p>
                                                                <p className="text-xs text-slate-500">{member.role}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{member.email}</td>
                                                    <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-500">{member.dept}</span></td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW 3: DOCUMENTS REPOSITORY */}
        {activeView === 'documents' && (
            <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
                <header className="h-24 px-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Folder className="w-8 h-8 text-yellow-500" />
                            Kho Tài liệu Chung
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Lưu trữ và chia sẻ tài liệu toàn công ty</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input type="text" placeholder="Tìm kiếm tài liệu..." className="pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" />
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
                            <Upload className="w-4 h-4" /> Tải lên
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                             {['Quy trình', 'Hợp đồng', 'Báo cáo', 'Tài liệu Marketing'].map((folder, idx) => (
                                 <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                                     <div className="flex items-center justify-between mb-3">
                                         <Folder className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                                         <button className="text-slate-300 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
                                     </div>
                                     <h4 className="font-bold text-slate-800 text-sm">{folder}</h4>
                                     <p className="text-xs text-slate-500 mt-1">12 files</p>
                                 </div>
                             ))}
                        </div>

                        <h3 className="font-bold text-slate-900 mb-4 text-lg">Tài liệu gần đây</h3>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Tên tài liệu</th>
                                        <th className="px-6 py-4">Kích thước</th>
                                        <th className="px-6 py-4">Ngày cập nhật</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {MOCK_GLOBAL_DOCS.map(doc => (
                                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${doc.type === 'PDF' ? 'bg-red-50 text-red-500' : doc.type === 'DOCX' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{doc.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{doc.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{doc.size}</td>
                                            <td className="px-6 py-4 text-slate-500">{doc.date}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Download className="w-4 h-4" /></button>
                                                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW 4: SYSTEM SETTINGS */}
        {activeView === 'settings' && (
            <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
                <header className="h-24 px-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Settings className="w-8 h-8 text-slate-700" />
                            Cấu hình Hệ thống
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Tùy chỉnh thông số và tính năng ứng dụng</p>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
                    <div className="max-w-3xl mx-auto space-y-6">
                        
                        {/* AI Config */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Sparkles className="w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Trợ lý ảo AI</h3>
                                    <p className="text-slate-500 text-sm">Cấu hình các tính năng thông minh Gemini 3.0</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="font-bold text-slate-800">Kích hoạt AI Summary</p>
                                        <p className="text-xs text-slate-500 mt-1">Tự động tóm tắt nội dung tài liệu khi mở</p>
                                    </div>
                                    <button 
                                        onClick={() => setSystemConfig({...systemConfig, aiFeatures: !systemConfig.aiFeatures})}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.aiFeatures ? 'bg-blue-600' : 'bg-slate-300'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${systemConfig.aiFeatures ? 'left-7' : 'left-1'}`}></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notification Config */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-xl"><Bell className="w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Thông báo</h3>
                                    <p className="text-slate-500 text-sm">Quản lý cách hệ thống gửi thông báo đến bạn</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="font-bold text-slate-800">Thông báo qua Email</p>
                                        <p className="text-xs text-slate-500 mt-1">Nhận email khi có lịch họp mới</p>
                                    </div>
                                    <button 
                                        onClick={() => setSystemConfig({...systemConfig, emailNotif: !systemConfig.emailNotif})}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.emailNotif ? 'bg-blue-600' : 'bg-slate-300'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${systemConfig.emailNotif ? 'left-7' : 'left-1'}`}></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* General Config */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                             <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl"><Globe className="w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Cài đặt chung</h3>
                                    <p className="text-slate-500 text-sm">Giao diện và ngôn ngữ</p>
                                </div>
                            </div>
                             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <p className="font-bold text-slate-800">Giao diện tối (Dark Mode)</p>
                                    <p className="text-xs text-slate-500 mt-1">Chuyển đổi giao diện nền tối</p>
                                </div>
                                <button 
                                    onClick={() => setSystemConfig({...systemConfig, darkMode: !systemConfig.darkMode})}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${systemConfig.darkMode ? 'left-7' : 'left-1'}`}></span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="pt-4 flex justify-end">
                            <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> Lưu cấu hình
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* CREATE/EDIT MEETING MODAL */}
        {showCreateMeetingModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 m-4 border border-slate-100">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {editingMeetingId ? <Pencil className="w-5 h-5" /> : <CalendarPlus className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-900">{editingMeetingId ? 'Cập Nhật Phiên Họp' : 'Tạo Phiên Họp Mới'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{editingMeetingId ? 'Chỉnh sửa thông tin cuộc họp hiện tại' : 'Thiết lập thông tin cho cuộc họp sắp tới'}</p>
                      </div>
                   </div>
                   <button 
                      onClick={() => setShowCreateMeetingModal(false)}
                      className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>
                
                <form onSubmit={handleSaveMeeting} className="p-6 space-y-5">
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Chủ đề cuộc họp</label>
                      <input 
                         type="text" 
                         required
                         value={newMeetingForm.title}
                         onChange={(e) => setNewMeetingForm({...newMeetingForm, title: e.target.value})}
                         placeholder="Ví dụ: Họp chiến lược Q3/2025"
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-sm font-medium outline-none"
                      />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Thời gian</label>
                          <input 
                            type="datetime-local" 
                            required
                            value={newMeetingForm.date}
                            onChange={(e) => setNewMeetingForm({...newMeetingForm, date: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-sm font-medium outline-none text-slate-600"
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Địa điểm</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="text" 
                              value={newMeetingForm.location}
                              onChange={(e) => setNewMeetingForm({...newMeetingForm, location: e.target.value})}
                              placeholder="Phòng VIP, Online..."
                              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-sm font-medium outline-none"
                            />
                          </div>
                      </div>
                   </div>

                   <div className="pt-4 flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowCreateMeetingModal(false)}
                        className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
                      >
                        Hủy bỏ
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
                      >
                        {editingMeetingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingMeetingId ? 'Lưu thay đổi' : 'Tạo phiên họp'}
                      </button>
                   </div>
                </form>
             </div>
          </div>
        )}

        {/* ATTENDEE MODAL */}
        {showAttendeeModal && activeView === 'meeting' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 m-4 border border-slate-100">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div>
                      <h3 className="font-black text-lg text-slate-900">Quản lý đại biểu</h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Thêm hoặc xóa người tham gia phiên họp này</p>
                   </div>
                   <button 
                      onClick={() => setShowAttendeeModal(false)}
                      className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="p-6">
                   <form onSubmit={handleAddAttendee} className="flex gap-2 mb-6">
                      <div className="relative flex-1">
                         <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                            type="text" 
                            value={newAttendeeName}
                            onChange={(e) => setNewAttendeeName(e.target.value)}
                            placeholder="Nhập tên đại biểu..."
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-sm font-medium outline-none"
                         />
                      </div>
                      <button 
                         type="submit"
                         disabled={!newAttendeeName.trim()}
                         className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/20"
                      >
                         <Plus className="w-5 h-5" />
                      </button>
                   </form>

                   <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {selectedMeeting.attendees.length === 0 && (
                          <p className="text-center text-slate-400 py-8 text-sm italic">Chưa có đại biểu nào trong danh sách.</p>
                      )}
                      {selectedMeeting.attendees.map((attendee, index) => (
                         <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-all">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                  {attendee.charAt(0)}
                                </div>
                               <span className="font-medium text-slate-700 text-sm">{attendee}</span>
                            </div>
                            <button 
                               onClick={() => handleRemoveAttendee(index)}
                               className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                               title="Xóa đại biểu"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      ))}
                   </div>
                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                       onClick={() => setShowAttendeeModal(false)}
                       className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all"
                    >
                       Hoàn tất
                    </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}