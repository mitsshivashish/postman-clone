'use client';
import React, { useRef, useEffect, useState } from 'react';

interface Props {
  top: React.ReactNode;
  bottom: React.ReactNode;
  defaultTopHeight?: number;
  minTop?: number;
  minBottom?: number;
}

export default function ResizableSplit({ top, bottom, defaultTopHeight = 280, minTop = 150, minBottom = 120 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topHeight, setTopHeight] = useState(defaultTopHeight);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = topHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const container = containerRef.current.getBoundingClientRect();
      const delta = e.clientY - startY.current;
      const newH = Math.min(
        container.height - minBottom,
        Math.max(minTop, startH.current + delta)
      );
      setTopHeight(newH);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [minTop, minBottom]);

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
      {/* Top pane */}
      <div style={{ height: topHeight, minHeight: minTop }} className="overflow-hidden flex flex-col shrink-0">
        {top}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="h-1 hover:h-1.5 bg-[#2a2a2a] hover:bg-orange-500/40 cursor-row-resize shrink-0 transition-all flex items-center justify-center group"
      >
        <div className="w-8 h-0.5 bg-[#3a3a3a] group-hover:bg-orange-500/60 rounded-full" />
      </div>

      {/* Bottom pane */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {bottom}
      </div>
    </div>
  );
}
