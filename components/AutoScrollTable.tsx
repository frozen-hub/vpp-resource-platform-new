import React, { useEffect, useRef, useState } from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  width?: string;
  className?: string;
}

interface AutoScrollTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: string;
  rowHeight?: number;
  speed?: number; // pixels per frame
  minWidth?: string; // Optional minimum width to force horizontal scrolling
}

export const AutoScrollTable = <T,>({
  data,
  columns,
  height = 'h-64',
  rowHeight = 40,
  speed = 0.5,
  minWidth,
}: AutoScrollTableProps<T>) => {
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const animate = () => {
      if (!isHovered && scrollContainer) {
        // Read current scroll position directly from the element
        let currentScroll = scrollContainer.scrollTop;
        let newScroll = currentScroll + speed;
        
        // Calculate the halfway point (height of one set of data)
        const halfHeight = scrollContainer.scrollHeight / 2;

        // Reset if we've scrolled past the first set
        if (newScroll >= halfHeight) {
          // Adjust position to the start of the second set (which is identical to start of first)
          // seamlessly by subtracting the height of one set
          newScroll = newScroll - halfHeight;
        }

        scrollContainer.scrollTop = newScroll;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isHovered, speed, data.length]);

  // Duplicate data for seamless looping
  const displayData = [...data, ...data];

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden h-full">
      {/* 
        Horizontal Scroll Wrapper.
        If minWidth is provided, this container allows horizontal scrolling 
        while the inner container enforces the width.
      */}
      <div className="overflow-x-auto h-full w-full custom-scrollbar">
        <div 
          className="flex flex-col h-full" 
          style={{ minWidth: minWidth || '100%' }}
        >
          {/* Header */}
          <div className="flex bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700 sticky top-0 z-10 shrink-0">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className={`p-2 truncate ${col.width || 'flex-1'} ${col.className || ''}`}
              >
                {col.header}
              </div>
            ))}
          </div>

          {/* Scrolling Body (Vertical only) */}
          <div
            ref={scrollRef}
            className={`${height} overflow-y-auto relative custom-scrollbar flex-1`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="w-full">
              {displayData.map((item, index) => (
                <div
                  key={index}
                  className={`flex border-b border-gray-100 text-xs text-gray-600 hover:bg-blue-50 transition-colors`}
                  style={{ height: `${rowHeight}px` }}
                >
                  {columns.map((col, colIdx) => (
                    <div
                      key={colIdx}
                      className={`px-2 truncate flex items-center ${col.width || 'flex-1'} ${col.className || ''}`}
                    >
                      {col.accessor(item)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};