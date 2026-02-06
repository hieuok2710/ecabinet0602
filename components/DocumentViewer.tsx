import React, { useEffect, useState, useRef } from 'react';
import { DocumentFile } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
// Try to import as a namespace to handle different ESM/CJS transformations
import * as docxNamespace from 'docx-preview';
import { 
  Loader2, 
  FileText, 
  AlertCircle, 
  Maximize2, 
  Minimize2, 
  Download, 
  Printer, 
  Eye, 
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// Cấu hình worker cho PDF.js từ CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs`;

interface DocumentViewerProps {
  document: DocumentFile | null;
  onToggleFocus?: () => void;
  isFocusMode?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  document, 
  onToggleFocus, 
  isFocusMode = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.5); // Default zoom 150%
  
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Xử lý render PDF
  const renderPdfPage = async (pageNum: number, scale: number) => {
    if (!pdfDocRef.current || !pdfCanvasRef.current) return;
    
    // Cancel previous render if exists
    if (renderTaskRef.current) {
        try {
            await renderTaskRef.current.cancel();
        } catch(e) {
            // Ignore cancel error
        }
    }

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error("PDF Render Error:", err);
      }
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      if (!document) return;

      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setZoom(1.5); // Reset to default 150%

      try {
        const arrayBuffer = await document.file.arrayBuffer();

        if (document.type === 'pdf') {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          pdfDocRef.current = pdf;
          setNumPages(pdf.numPages);
          // Note: Render is handled by the dependency effect below
        } else if (document.type === 'docx') {
          // Delay a bit to ensure container is ready
          setTimeout(async () => {
            if (docxContainerRef.current) {
              docxContainerRef.current.innerHTML = '';
              try {
                // Handle different export patterns for docx-preview
                const renderAsync = 
                  (docxNamespace as any).renderAsync || 
                  (docxNamespace as any).default?.renderAsync || 
                  (docxNamespace as any).default;

                if (typeof renderAsync === 'function') {
                  await renderAsync(arrayBuffer, docxContainerRef.current, undefined, {
                    className: "docx",
                    inWrapper: true,
                    ignoreLastRenderedPageBreak: false
                  });
                } else {
                  throw new Error("Không tìm thấy hàm renderAsync trong thư viện docx-preview");
                }
              } catch (docxErr) {
                console.error("Docx render error:", docxErr);
                setError("Không thể render file Word. Vui lòng kiểm tra lại tài liệu.");
              }
            }
          }, 0);
        }
      } catch (err) {
        console.error("Load document error:", err);
        setError("Không thể hiển thị nội dung file. Vui lòng kiểm tra lại định dạng.");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
    
    return () => {
        pdfDocRef.current = null;
        if (renderTaskRef.current) {
             renderTaskRef.current.cancel();
        }
    };
  }, [document]);

  // Re-render PDF khi thay đổi trang hoặc zoom
  useEffect(() => {
    if (document?.type === 'pdf' && !loading && pdfDocRef.current) {
      renderPdfPage(currentPage, zoom);
    }
  }, [currentPage, zoom, loading, document]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages));

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 border-l border-slate-200">
        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6 border border-slate-100">
            <FileText className="w-10 h-10 text-slate-200" />
        </div>
        <p className="text-xl font-black text-slate-700 uppercase tracking-tighter">Sẵn sàng phiên họp</p>
        <p className="text-xs mt-3 text-slate-400 font-medium">Vui lòng chọn hoặc tải lên tài liệu để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-slate-100 overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full relative'}`}>
        {/* Toolbar Cao cấp */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
                {onToggleFocus && (
                  <button 
                    onClick={onToggleFocus}
                    className={`p-2 rounded-xl transition-all ${isFocusMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    title="Chế độ tập trung"
                  >
                    {isFocusMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
                <div className="flex flex-col">
                    <h2 className="font-black text-slate-900 line-clamp-1 max-w-sm md:max-w-md text-base tracking-tight leading-none mb-1">{document.name}</h2>
                    <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${document.type === 'pdf' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {document.type} Engine
                        </span>
                    </div>
                </div>
            </div>

            {/* Điều khiển trang và Zoom */}
            <div className="flex items-center gap-2">
                {document.type === 'pdf' && (
                  <>
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl mr-2 border border-slate-200 shadow-inner">
                      <button onClick={handlePrevPage} disabled={currentPage <= 1} className="p-1.5 hover:bg-white disabled:opacity-30 rounded-lg transition-all text-slate-600"><ChevronLeft className="w-4 h-4"/></button>
                      <span className="px-3 text-[10px] font-black text-slate-700 min-w-[70px] text-center uppercase tracking-tighter">Trang {currentPage} / {numPages}</span>
                      <button onClick={handleNextPage} disabled={currentPage >= numPages} className="p-1.5 hover:bg-white disabled:opacity-30 rounded-lg transition-all text-slate-600"><ChevronRight className="w-4 h-4"/></button>
                    </div>
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl mr-2 border border-slate-200">
                      <button onClick={handleZoomOut} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600"><ZoomOut className="w-4 h-4"/></button>
                      <span className="px-2 text-[10px] font-black text-slate-700 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
                      <button onClick={handleZoomIn} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600"><ZoomIn className="w-4 h-4"/></button>
                    </div>
                  </>
                )}
                
                <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                
                <button onClick={() => window.print()} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"><Printer className="w-5 h-5" /></button>
                <a href={document.url} download={document.name} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"><Download className="w-5 h-5" /></a>
                <button onClick={toggleFullscreen} className={`p-2.5 rounded-xl transition-all ${isFullscreen ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
        
      {/* Wrapper cho Nội dung & Nút điều hướng */}
      <div className="flex-1 relative flex overflow-hidden">
          {/* Nút điều hướng PDF Overlay */}
          {!loading && !error && document.type === 'pdf' && (
              <>
                  <button 
                      onClick={handlePrevPage}
                      disabled={currentPage <= 1}
                      className="absolute left-6 top-1/2 -translate-y-1/2 z-40 p-4 bg-slate-900/10 hover:bg-blue-600/90 text-slate-500 hover:text-white rounded-full backdrop-blur-sm transition-all shadow-lg border border-white/20 disabled:opacity-0 disabled:-translate-x-10 transform active:scale-95 group"
                      title="Trang trước"
                  >
                      <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                  <button 
                      onClick={handleNextPage}
                      disabled={currentPage >= numPages}
                      className="absolute right-6 top-1/2 -translate-y-1/2 z-40 p-4 bg-slate-900/10 hover:bg-blue-600/90 text-slate-500 hover:text-white rounded-full backdrop-blur-sm transition-all shadow-lg border border-white/20 disabled:opacity-0 disabled:translate-x-10 transform active:scale-95 group"
                      title="Trang sau"
                  >
                      <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
              </>
          )}

          {/* Container Hiển thị cuộn được */}
          <div className={`w-full h-full overflow-auto focus-transition p-4 flex justify-center ${document.type === 'pdf' ? 'viewer-bg-dark' : 'bg-slate-200/50'}`}>
            {loading && (
              <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0 bg-white/80 backdrop-blur-sm z-40">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Đang tối ưu tài liệu cho cuộc họp...</p>
              </div>
            )}

            {error ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl shadow-xl max-w-md h-fit mt-10">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-slate-800 font-bold mb-2">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold"
                >
                  Thử lại
                </button>
              </div>
            ) : document.type === 'pdf' ? (
              <div className="flex justify-center w-full h-fit">
                <canvas ref={pdfCanvasRef} className="pdf-page-canvas shadow-2xl" />
              </div>
            ) : (
              <div className="w-full max-w-4xl" ref={docxContainerRef}>
                  {/* docx-preview will render content here */}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};