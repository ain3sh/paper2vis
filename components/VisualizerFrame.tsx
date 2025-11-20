import React, { useEffect, useRef } from 'react';

interface VisualizerFrameProps {
  htmlContent: string;
}

const VisualizerFrame: React.FC<VisualizerFrameProps> = ({ htmlContent }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      // Create a blob to render content without simple data URI limitations
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [htmlContent]);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <iframe
        ref={iframeRef}
        title="Generated Visualization"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
};

export default VisualizerFrame;
