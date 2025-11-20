import React, { useState } from 'react';
import { Zap, Download, RotateCcw, Sparkles, BrainCircuit, ChevronLeft, ChevronRight, FileText, X, RefreshCw, MessageSquare } from 'lucide-react';
import FileUploader from './components/FileUploader';
import VisualizerFrame from './components/VisualizerFrame';
import { generateVisualizationFromPdf } from './services/gemini';
import { fileToBase64, downloadHtml } from './utils/helpers';

// A sleek, dark grid background for the "Idle" state
const DEFAULT_VISUAL = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; background: #020204; overflow: hidden; }
  canvas { display: block; }
</style>
</head>
<body>
<script type="module">
  import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
  
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020204, 0.002);
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Grid
  const gridHelper = new THREE.GridHelper(100, 50, 0x333333, 0x111111);
  scene.add(gridHelper);

  // Particles
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i < 500; i++) {
    vertices.push((Math.random() - 0.5) * 100);
    vertices.push(Math.random() * 40);
    vertices.push((Math.random() - 0.5) * 100);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.2, transparent: true, opacity: 0.5 });
  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  camera.position.set(0, 20, 40);
  camera.lookAt(0, 0, 0);

  function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.0005;
    camera.position.x = Math.cos(time) * 30;
    camera.position.z = Math.sin(time) * 30;
    camera.lookAt(0, 0, 0);
    particles.rotation.y = time * 0.1;
    renderer.render(scene, camera);
  }
  animate();
  
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
</script>
</body>
</html>
`;

const App: React.FC = () => {
  const [status, setStatus] = useState<string>('idle'); // idle, processing, completed, error
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [extractedTitle, setExtractedTitle] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // User Inputs
  const [initialPrompt, setInitialPrompt] = useState('');
  const [regeneratePrompt, setRegeneratePrompt] = useState('');

  const handleFileSelect = async (file: File) => {
    setCurrentFile(file);
    setStatus('processing');
    setStatusMessage('Initializing system...');
    
    try {
      const base64 = await fileToBase64(file);
      setPdfBase64(base64);
      
      await processVisualization(base64, initialPrompt);
    } catch (error) {
      handleError(error);
    }
  };

  const handleRegenerate = async () => {
    if (!pdfBase64) return;
    setStatus('processing');
    setStatusMessage('Refining visualization...');
    
    try {
      await processVisualization(pdfBase64, regeneratePrompt);
      setRegeneratePrompt(''); // Clear after success
    } catch (error) {
      handleError(error);
    }
  };

  const processVisualization = async (base64: string, customInstruction: string) => {
    setStatusMessage(customInstruction ? 'Analyzing with custom focus...' : 'Analyzing research logic...');
      
    const result = await generateVisualizationFromPdf(base64, customInstruction, (msg) => setStatusMessage(msg));
    
    setGeneratedHtml(result.html);
    setExtractedTitle(result.title);
    setStatus('completed');
  };

  const handleError = (error: unknown) => {
    console.error(error);
    setStatus('error');
    if (error instanceof Error) {
       if (error.message.includes('thinking_budget')) {
         setStatusMessage('Error: Complexity exceeded token limit.');
       } else {
         setStatusMessage(error.message || 'Generation failed.');
       }
    } else {
      setStatusMessage('Generation failed.');
    }
  };

  const handleDownload = () => {
    if (generatedHtml) {
      // Sanitize title for filename
      const safeTitle = extractedTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'visualization';
      downloadHtml(generatedHtml, `${safeTitle}.html`);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setGeneratedHtml(null);
    setCurrentFile(null);
    setPdfBase64(null);
    setExtractedTitle('');
    setInitialPrompt('');
    setRegeneratePrompt('');
    setStatusMessage('');
    setIsPanelOpen(true);
  };

  return (
    <div className="relative w-full h-screen bg-[#020204] overflow-hidden text-white font-sans selection:bg-cyan-500/30">
      
      {/* 1. BACKGROUND VISUALIZER LAYER */}
      <div className="absolute inset-0 z-0">
        <VisualizerFrame htmlContent={generatedHtml || DEFAULT_VISUAL} />
      </div>

      {/* 2. IMMERSIVE UI OVERLAY LAYER */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        
        {/* HEADER (Visible only in Idle/Processing) */}
        <header className={`p-8 flex justify-between items-start transition-opacity duration-500 ${status === 'completed' ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Zap className="text-white w-6 h-6" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
                  Lumina
                </h1>
                <span className="text-xs font-mono text-cyan-400 tracking-wider opacity-80">RESEARCH VISUALIZER</span>
              </div>
           </div>
        </header>

        {/* CENTER STAGE (Idle & Processing) */}
        <div className={`flex-1 flex items-center justify-center p-6 transition-all duration-700 ${status === 'completed' ? 'opacity-0 scale-95 pointer-events-none hidden' : 'opacity-100 scale-100'}`}>
           
           {status === 'idle' && (
             <div className="w-full max-w-2xl pointer-events-auto animate-in fade-in zoom-in duration-500 flex flex-col gap-6">
               <div className="text-center mb-6 space-y-4">
                 <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-500 tracking-tight drop-shadow-2xl">
                   See what you read.
                 </h2>
                 <p className="text-lg text-gray-400 max-w-md mx-auto leading-relaxed">
                   Turn dense PDFs into interactive 3D mental models.
                   <br/>Powered by Gemini 3 Pro Deep Reasoning.
                 </p>
               </div>
               
               <FileUploader onFileSelected={handleFileSelect} isProcessing={false} />

               {/* Initial Focus Prompt */}
               <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-1 flex items-center focus-within:border-cyan-500/50 transition-colors">
                    <div className="pl-3 text-gray-400">
                      <Sparkles size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={initialPrompt}
                      onChange={(e) => setInitialPrompt(e.target.value)}
                      placeholder="Optional: Focus on specific concepts (e.g., 'KV Cache mechanism')..."
                      className="w-full bg-transparent border-none text-sm p-3 text-white placeholder-gray-500 focus:ring-0 focus:outline-none"
                    />
                  </div>
               </div>
             </div>
           )}

           {status === 'processing' && (
             <div className="pointer-events-auto text-center animate-in fade-in duration-1000">
                <div className="relative inline-flex items-center justify-center mb-8">
                   <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
                   <div className="w-24 h-24 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
                   <BrainCircuit className="absolute w-10 h-10 text-cyan-100 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{statusMessage}</h3>
                <p className="text-sm text-gray-500 font-mono uppercase tracking-widest">Thinking Budget: 64k</p>
                
                {/* Progress Bar */}
                <div className="w-64 h-1 bg-gray-800 rounded-full mt-6 mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-progress w-full origin-left"></div>
                </div>
             </div>
           )}

           {status === 'error' && (
             <div className="pointer-events-auto bg-red-950/80 backdrop-blur-xl border border-red-500/50 p-8 rounded-2xl max-w-md text-center shadow-2xl animate-in zoom-in duration-300">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="text-red-400 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-red-100 mb-2">Generation Failed</h3>
                <p className="text-red-300/80 mb-6 text-sm">{statusMessage}</p>
                <button 
                  onClick={handleReset}
                  className="px-6 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
             </div>
           )}
        </div>
        
        {/* FOOTER SPACER */}
        <div className="h-16"></div>
      </div>

      {/* 3. COMPLETED STATE - CONTROL DECK (Floating Panel) */}
      {status === 'completed' && (
        <div className={`absolute top-0 left-0 h-full z-20 transition-all duration-500 ease-in-out ${isPanelOpen ? 'w-80 md:w-96 translate-x-0' : 'w-0 -translate-x-full'}`}>
          <div className="h-full w-full glass-panel border-r border-gray-800/50 bg-[#050508]/80 backdrop-blur-2xl flex flex-col relative shadow-2xl">
            
            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-6 min-w-[20rem]">
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="text-white w-4 h-4" fill="currentColor" />
                 </div>
                 <span className="font-bold tracking-tight">Lumina</span>
              </div>

              {/* File Info Card */}
              <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-cyan-500/30 transition-colors">
                 <div className="flex items-start gap-3 mb-3">
                    <FileText className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-sm text-white break-words leading-tight">
                          {extractedTitle || currentFile?.name || 'Unknown Paper'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 break-all line-clamp-1">{currentFile?.name}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 {/* Actions */}
                 <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Actions</h4>
                    <div className="grid gap-3">
                      <button 
                        onClick={handleDownload}
                        className="w-full py-3 px-4 bg-white text-black hover:bg-gray-200 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                      >
                        <Download size={18} />
                        Download Source
                      </button>
                      <button 
                        onClick={handleReset}
                        className="w-full py-3 px-4 bg-transparent border border-gray-700 hover:border-gray-500 text-gray-300 font-medium rounded-xl transition-colors hover:bg-white/5 flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={18} />
                        Upload New Paper
                      </button>
                    </div>
                 </div>

                 {/* Refine / Regenerate */}
                 <div className="p-4 rounded-xl bg-cyan-900/10 border border-cyan-500/20">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <RefreshCw size={12} />
                        Refine Visualization
                    </h4>
                    <textarea 
                        value={regeneratePrompt}
                        onChange={(e) => setRegeneratePrompt(e.target.value)}
                        placeholder="Tell the AI what to change or focus on..."
                        className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white resize-none focus:border-cyan-500/50 focus:ring-0 focus:outline-none mb-3"
                    />
                    <button 
                        onClick={handleRegenerate}
                        disabled={!regeneratePrompt.trim()}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                            ${regeneratePrompt.trim() 
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20' 
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    >
                        Regenerate
                    </button>
                 </div>

                 {/* Stats */}
                 <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">System Stats</h4>
                    <div className="space-y-2 text-xs text-gray-400 font-mono">
                       <div className="flex justify-between py-2 border-b border-white/5">
                          <span>Model</span>
                          <span className="text-cyan-400">gemini-3-pro</span>
                       </div>
                       <div className="flex justify-between py-2 border-b border-white/5">
                          <span>Output Size</span>
                          <span>~{(generatedHtml?.length || 0) / 1024} KB</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Bottom Credit */}
            <div className="p-6 border-t border-white/5 min-w-[20rem]">
               <p className="text-xs text-gray-600 text-center">
                  AI generated content.
               </p>
            </div>

          </div>
          
          {/* Toggle Button (Attached to panel) */}
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="absolute top-1/2 -right-3 w-6 h-12 bg-[#111] border border-gray-800 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-cyan-900/50 transition-colors z-30"
            aria-label="Close Panel"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      {/* COLLAPSED TOGGLE BUTTON */}
      {status === 'completed' && !isPanelOpen && (
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="absolute top-1/2 left-0 w-6 h-12 bg-[#111] border border-gray-800 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-cyan-900/50 transition-colors z-30 shadow-xl"
          aria-label="Open Panel"
        >
          <ChevronRight size={14} />
        </button>
      )}

      <style>{`
        @keyframes progress {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(0.5); }
            100% { transform: scaleX(1); }
        }
        .animate-progress {
            animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;