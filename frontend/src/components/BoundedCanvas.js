import React, { useEffect, useRef } from 'react';
import { Tldraw, createShapeId } from 'tldraw';

const CANVAS_WIDTH = 2678;
const CANVAS_HEIGHT = 3789;
const PAGE_WIDTH = 2480;
const PAGE_HEIGHT = 3508;

const BoundedCanvas = ({ onMount, fitToView = false, ...props }) => {
  const editorRef = useRef(null);
  const hasInitialized = useRef(false);

  const fitCanvasToView = () => {
    if (!editorRef.current) return;
    
    editorRef.current.zoomToFit({
      targetBounds: {
        x: -CANVAS_WIDTH / 2,
        y: -CANVAS_HEIGHT / 2,
        w: CANVAS_WIDTH,
        h: CANVAS_HEIGHT
      },
      inset: 20,
      animation: { duration: 0 }
    });
  };

  const handleMount = (editor) => {
    editorRef.current = editor;
    
    // Enable dynamic size preference
    editor.user.updateUserPreferences({ isDynamicSizeMode: true });
    
    // Create boundary shapes
    setTimeout(() => {
      const canvasBoundaryId = createShapeId('canvas-boundary');
      const pageBoundaryId = createShapeId('page-boundary');
      
      editor.createShape({
        id: canvasBoundaryId,
        type: 'geo',
        x: -CANVAS_WIDTH / 2,
        y: -CANVAS_HEIGHT / 2,
        props: {
          w: CANVAS_WIDTH,
          h: CANVAS_HEIGHT,
          geo: 'rectangle',
          fill: 'none',
          color: 'grey',
          size: 'm'
        },
        isLocked: true
      });
      
      editor.createShape({
        id: pageBoundaryId,
        type: 'geo',
        x: -PAGE_WIDTH / 2,
        y: -PAGE_HEIGHT / 2,
        props: {
          w: PAGE_WIDTH,
          h: PAGE_HEIGHT,
          geo: 'rectangle',
          fill: 'none',
          color: 'black',
          size: 'm'
        },
        isLocked: true
      });
      
      if (!hasInitialized.current || fitToView) {
        fitCanvasToView();
        hasInitialized.current = true;
      }
    }, 100);

    if (onMount) {
      onMount(editor);
    }
  };

  useEffect(() => {
    if (fitToView && editorRef.current) {
      fitCanvasToView();
    }
  }, [fitToView]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!editorRef.current) return;
      
      try {
        const point = editorRef.current.screenToPage({ x: e.clientX, y: e.clientY });
        const isOutsideCanvas = 
          point.x < -CANVAS_WIDTH / 2 || 
          point.x > CANVAS_WIDTH / 2 || 
          point.y < -CANVAS_HEIGHT / 2 || 
          point.y > CANVAS_HEIGHT / 2;
        
        const canvas = document.querySelector('.tl-canvas');
        if (canvas) {
          canvas.style.cursor = isOutsideCanvas ? 'not-allowed' : '';
        }
      } catch (error) {
        // Ignore errors
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Tldraw onMount={handleMount} {...props} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(200, 200, 200, 0.3) 70%)',
          zIndex: 1000
        }}
      />
    </div>
  );
};

export default BoundedCanvas;