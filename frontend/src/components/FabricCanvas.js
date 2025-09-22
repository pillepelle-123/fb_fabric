import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { getPageDimensions } from '../config';
import { Box, Toolbar, IconButton, ButtonGroup, Slider, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Brush as BrushIcon,
  Create as PencilIcon,
  CropSquare as RectIcon,
  RadioButtonUnchecked as CircleIcon,
  TextFields as TextIcon,
  Image as ImageIcon,
  PanTool as SelectIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as FitIcon,
  Favorite as HeartIcon,
  Star as StarIcon,
  EmojiEmotions as SmileyIcon,
  PhotoCamera as PhotoIcon,
  FormatColorFill as FillIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  FlipToFront as FrontIcon,
  FlipToBack as BackIcon
} from '@mui/icons-material';

const FabricCanvas = ({ onMount, pageSize = 'A4', orientation = 'portrait', onCanvasChange }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [tool, setTool] = useState('select');
  const [brushWidth, setBrushWidth] = useState(5);
  const [color, setColor] = useState('#000000');
  const [history, setHistory] = useState({ undo: [], redo: [] });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, target: null });
  const saveTimeoutRef = useRef(null);

  const { canvasWidth, canvasHeight, pageWidth, pageHeight } = getPageDimensions(pageSize, orientation);

  useEffect(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: containerWidth,
      height: containerHeight,
      backgroundColor: '#f5f5f5'
    });

    // Add page boundary
    const scale = Math.min(containerWidth / (pageWidth * 1.2), containerHeight / (pageHeight * 1.2));
    const scaledPageWidth = pageWidth * scale;
    const scaledPageHeight = pageHeight * scale;
    
    const pageBoundary = new fabric.Rect({
      left: (containerWidth - scaledPageWidth) / 2,
      top: (containerHeight - scaledPageHeight) / 2,
      width: scaledPageWidth,
      height: scaledPageHeight,
      fill: 'white',
      stroke: '#333',
      strokeWidth: 2,
      selectable: false,
      evented: false,
      isPageBoundary: true
    });

    fabricCanvas.add(pageBoundary);
    fabricCanvas.renderAll();

    fabricCanvasRef.current = fabricCanvas;
    setCanvas(fabricCanvas);
    
    // Save initial state
    setTimeout(() => {
      const initialState = fabricCanvas.toJSON(['excludeFromExport']);
      setHistory({ undo: [initialState], redo: [] });
    }, 100);

    // Setup event handlers
    fabricCanvas.on('path:created', saveState);
    fabricCanvas.on('object:added', saveState);
    fabricCanvas.on('object:removed', saveState);
    fabricCanvas.on('object:modified', saveState);
    
    // Prevent page boundary from being selected or moved
    fabricCanvas.on('selection:created', (e) => {
      if (e.selected && e.selected.some(obj => obj.isPageBoundary)) {
        fabricCanvas.discardActiveObject();
      }
    });
    
    fabricCanvas.on('selection:updated', (e) => {
      if (e.selected && e.selected.some(obj => obj.isPageBoundary)) {
        fabricCanvas.discardActiveObject();
      }
    });
    
    fabricCanvas.on('object:moving', (e) => {
      if (e.target && e.target.isPageBoundary) {
        e.target.set({
          left: e.target.left,
          top: e.target.top
        });
        fabricCanvas.renderAll();
      }
    });
    
    // Context menu for objects
    fabricCanvas.on('mouse:down', (e) => {
      if (e.e.button === 2 && e.target && !e.target.excludeFromExport) {
        setContextMenu({ visible: false, x: 0, y: 0, target: null });
      }
    });

    if (onMount) {
      onMount({
        getCanvasData: () => fabricCanvas.toJSON(['isPageBoundary']),
        loadCanvasData: (data) => {
          fabricCanvas.loadFromJSON(data, () => {
            // Ensure page boundary is at the back and non-selectable
            const boundary = fabricCanvas.getObjects().find(obj => obj.isPageBoundary);
            if (boundary) {
              boundary.set({
                selectable: false,
                evented: false
              });
              fabricCanvas.sendToBack(boundary);
            }
            fabricCanvas.renderAll();
          });
        },
        clearCanvas: () => {
          fabricCanvas.getObjects().forEach(obj => {
            if (!obj.isPageBoundary) {
              fabricCanvas.remove(obj);
            }
          });
        },
        exportToPDF: (qualityOption = { quality: 0.7, format: 'jpeg' }) => {
          const boundary = fabricCanvas.getObjects().find(obj => obj.isPageBoundary);
          if (!boundary) return null;
          
          // Create export canvas at 300 DPI (actual page dimensions)
          const exportCanvas = document.createElement('canvas');
          const ctx = exportCanvas.getContext('2d');
          
          // Use actual 300 DPI page dimensions
          exportCanvas.width = pageWidth;
          exportCanvas.height = pageHeight;
          
          // Fill with white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
          
          // Calculate scale factor from display to print resolution
          const scaleX = pageWidth / boundary.width;
          const scaleY = pageHeight / boundary.height;
          
          // Get all objects except page boundary
          const objects = fabricCanvas.getObjects().filter(obj => !obj.isPageBoundary);
          
          // Create clipping region
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, pageWidth, pageHeight);
          ctx.clip();
          
          // Render each object scaled to 300 DPI
          objects.forEach(obj => {
            const objCanvas = new fabric.StaticCanvas(null, {
              width: pageWidth,
              height: pageHeight
            });
            
            // Clone and scale object for 300 DPI output
            obj.clone(cloned => {
              cloned.set({
                left: (cloned.left - boundary.left) * scaleX,
                top: (cloned.top - boundary.top) * scaleY,
                scaleX: (cloned.scaleX || 1) * scaleX,
                scaleY: (cloned.scaleY || 1) * scaleY
              });
              objCanvas.add(cloned);
              objCanvas.renderAll();
              
              // Draw object canvas onto export canvas
              const objElement = objCanvas.getElement();
              ctx.drawImage(objElement, 0, 0);
            });
          });
          
          ctx.restore();
          
          return exportCanvas.toDataURL(`image/${qualityOption.format}`, qualityOption.quality);
        }
      });
    }

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      // Update canvas dimensions
      fabricCanvas.setDimensions({ width: newWidth, height: newHeight });
      
      // Recalculate page boundary
      const newScale = Math.min(newWidth / (pageWidth * 1.2), newHeight / (pageHeight * 1.2));
      const newScaledPageWidth = pageWidth * newScale;
      const newScaledPageHeight = pageHeight * newScale;
      
      // Find and update page boundary
      const boundary = fabricCanvas.getObjects().find(obj => obj.isPageBoundary);
      if (boundary) {
        boundary.set({
          left: (newWidth - newScaledPageWidth) / 2,
          top: (newHeight - newScaledPageHeight) / 2,
          width: newScaledPageWidth,
          height: newScaledPageHeight
        });
      }
      
      fabricCanvas.renderAll();
    };

    // Handle mouse wheel zoom with Ctrl key
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY;
        const zoom = fabricCanvas.getZoom();
        let newZoom = zoom * (delta > 0 ? 0.9 : 1.1);
        newZoom = Math.max(0.1, Math.min(3, newZoom));
        
        const rect = canvasRef.current.getBoundingClientRect();
        const point = new fabric.Point(e.clientX - rect.left, e.clientY - rect.top);
        fabricCanvas.zoomToPoint(point, newZoom);
      }
    };

    // Handle right-click panning and context menu
    let isPanning = false;
    let lastPanPoint = null;
    let hasMoved = false;
    let rightClickTarget = null;

    const handleMouseDown = (e) => {
      if (e.button === 2) {
        e.preventDefault();
        lastPanPoint = { x: e.clientX, y: e.clientY };
        hasMoved = false;
        
        // Check if clicking on an object
        const pointer = fabricCanvas.getPointer(e);
        rightClickTarget = fabricCanvas.findTarget(e, false);
      }
    };

    const handleMouseMove = (e) => {
      if (lastPanPoint && e.buttons === 2) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;
        
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          if (!isPanning) {
            isPanning = true;
            fabricCanvas.selection = false;
            document.body.style.cursor = 'grabbing';
            canvasRef.current.style.cursor = 'grabbing';
          }
          hasMoved = true;
          
          const vpt = fabricCanvas.viewportTransform;
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          fabricCanvas.requestRenderAll();
        }
        
        lastPanPoint = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 2) {
        if (isPanning) {
          isPanning = false;
          fabricCanvas.selection = true;
          document.body.style.cursor = 'default';
          canvasRef.current.style.cursor = 'default';
        }
        lastPanPoint = null;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      
      if (!hasMoved && rightClickTarget && !rightClickTarget.isPageBoundary) {
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          target: rightClickTarget
        });
      }
      
      hasMoved = false;
      rightClickTarget = null;
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      fabricCanvas.dispose();
    };
  }, [pageSize, orientation]);

  const saveState = () => {
    if (!canvas) return;
    
    // Debounce to prevent multiple saves during single actions
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      const state = canvas.toJSON(['isPageBoundary']);
      
      // Prevent saving duplicate states
      setHistory(prev => {
        const lastState = prev.undo[prev.undo.length - 1];
        if (lastState && JSON.stringify(lastState) === JSON.stringify(state)) {
          return prev; // Don't save if state is identical
        }
        
        const newUndo = [...prev.undo, state].slice(-10);
        return {
          undo: newUndo,
          redo: []
        };
      });
      
      if (onCanvasChange) {
        onCanvasChange(state);
      }
    }, 100);
  };

  const undo = () => {
    if (history.undo.length > 1) {
      const current = history.undo[history.undo.length - 1];
      const previous = history.undo[history.undo.length - 2];
      
      // Temporarily remove event listeners to prevent saveState during undo
      canvas.off('object:added');
      canvas.off('object:removed');
      canvas.off('object:modified');
      canvas.off('path:created');
      
      canvas.loadFromJSON(previous, () => {
        const boundary = canvas.getObjects().find(obj => obj.isPageBoundary);
        if (boundary) {
          boundary.set({
            selectable: false,
            evented: false
          });
          canvas.sendToBack(boundary);
        }
        canvas.renderAll();
        
        // Re-add event listeners
        canvas.on('path:created', saveState);
        canvas.on('object:added', saveState);
        canvas.on('object:removed', saveState);
        canvas.on('object:modified', saveState);
        
        setHistory(prev => ({
          undo: prev.undo.slice(0, -1),
          redo: [current, ...prev.redo.slice(0, 9)]
        }));
      });
    }
  };

  const redo = () => {
    if (history.redo.length > 0) {
      const next = history.redo[0];
      
      // Temporarily remove event listeners to prevent saveState during redo
      canvas.off('object:added');
      canvas.off('object:removed');
      canvas.off('object:modified');
      canvas.off('path:created');
      
      canvas.loadFromJSON(next, () => {
        const boundary = canvas.getObjects().find(obj => obj.isPageBoundary);
        if (boundary) {
          boundary.set({
            selectable: false,
            evented: false
          });
          canvas.sendToBack(boundary);
        }
        canvas.renderAll();
        
        // Re-add event listeners
        canvas.on('path:created', saveState);
        canvas.on('object:added', saveState);
        canvas.on('object:removed', saveState);
        canvas.on('object:modified', saveState);
        
        setHistory(prev => ({
          undo: [...prev.undo, next],
          redo: prev.redo.slice(1)
        }));
      });
    }
  };

  const setDrawingMode = (mode) => {
    if (!canvas) return;
    
    canvas.isDrawingMode = mode === 'brush' || mode === 'pencil';
    
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.width = brushWidth;
      canvas.freeDrawingBrush.color = color;
    }
    
    setTool(mode);
  };

  const addShape = (shapeType) => {
    if (!canvas) return;
    
    let shape;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({
          left: centerX - 50,
          top: centerY - 25,
          width: 100,
          height: 50,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 2
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: centerX - 25,
          top: centerY - 25,
          radius: 25,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 2
        });
        break;
      case 'text':
        shape = new fabric.IText('Text eingeben', {
          left: centerX - 50,
          top: centerY - 10,
          fontSize: 20,
          fill: color
        });
        break;
      case 'heart':
        const heartPath = 'M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.04L12,21.35Z';
        shape = new fabric.Path(heartPath, {
          left: centerX - 15,
          top: centerY - 15,
          fill: '#ff69b4',
          scaleX: 1.5,
          scaleY: 1.5
        });
        break;
      case 'star':
        const starPath = 'M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z';
        shape = new fabric.Path(starPath, {
          left: centerX - 15,
          top: centerY - 15,
          fill: '#ffd700',
          scaleX: 1.5,
          scaleY: 1.5
        });
        break;
      case 'smiley':
        shape = new fabric.Circle({
          left: centerX - 25,
          top: centerY - 25,
          radius: 25,
          fill: '#ffeb3b',
          stroke: '#333',
          strokeWidth: 2
        });
        const leftEye = new fabric.Circle({ left: centerX - 15, top: centerY - 10, radius: 3, fill: '#333' });
        const rightEye = new fabric.Circle({ left: centerX + 5, top: centerY - 10, radius: 3, fill: '#333' });
        const mouth = new fabric.Path('M -10,5 Q 0,15 10,5', { left: centerX - 10, top: centerY + 5, stroke: '#333', strokeWidth: 2, fill: '' });
        const group = new fabric.Group([shape, leftEye, rightEye, mouth], {
          left: centerX - 25,
          top: centerY - 25
        });
        canvas.add(group);
        canvas.setActiveObject(group);
        saveState();
        return;
      case 'line':
        shape = new fabric.Line([centerX - 50, centerY, centerX + 50, centerY], {
          stroke: color,
          strokeWidth: 3
        });
        break;
    }
    
    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      saveState();
    }
  };

  const zoomIn = () => {
    if (!canvas) return;
    const zoom = canvas.getZoom() * 1.1;
    canvas.setZoom(zoom > 3 ? 3 : zoom);
  };

  const zoomOut = () => {
    if (!canvas) return;
    const zoom = canvas.getZoom() * 0.9;
    canvas.setZoom(zoom < 0.1 ? 0.1 : zoom);
  };

  const fitToView = () => {
    if (!canvas) return;
    canvas.setZoom(1);
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    canvas.renderAll();
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          fabric.Image.fromURL(event.target.result, (img) => {
            img.set({
              left: canvas.width / 2 - 50,
              top: canvas.height / 2 - 50,
              scaleX: 0.5,
              scaleY: 0.5
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            saveState();
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const deleteObject = () => {
    if (contextMenu.target) {
      canvas.remove(contextMenu.target);
      saveState();
    }
    setContextMenu({ visible: false, x: 0, y: 0, target: null });
  };

  const duplicateObject = () => {
    if (contextMenu.target) {
      contextMenu.target.clone((cloned) => {
        cloned.set({
          left: cloned.left + 10,
          top: cloned.top + 10
        });
        canvas.add(cloned);
        saveState();
      });
    }
    setContextMenu({ visible: false, x: 0, y: 0, target: null });
  };

  const bringToFront = () => {
    if (contextMenu.target) {
      canvas.bringToFront(contextMenu.target);
      saveState();
    }
    setContextMenu({ visible: false, x: 0, y: 0, target: null });
  };

  const sendToBack = () => {
    if (contextMenu.target) {
      canvas.sendToBack(contextMenu.target);
      const boundary = canvas.getObjects().find(obj => obj.isPageBoundary);
      if (boundary) canvas.sendToBack(boundary);
      saveState();
    }
    setContextMenu({ visible: false, x: 0, y: 0, target: null });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar variant="dense" sx={{ minHeight: 48, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <IconButton 
            onClick={() => setDrawingMode('select')}
            color={tool === 'select' ? 'primary' : 'default'}
          >
            <SelectIcon />
          </IconButton>
          <IconButton 
            onClick={() => setDrawingMode('pencil')}
            color={tool === 'pencil' ? 'primary' : 'default'}
          >
            <PencilIcon />
          </IconButton>
          <IconButton 
            onClick={() => setDrawingMode('brush')}
            color={tool === 'brush' ? 'primary' : 'default'}
          >
            <BrushIcon />
          </IconButton>
        </ButtonGroup>

        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <IconButton onClick={() => addShape('rect')}>
            <RectIcon />
          </IconButton>
          <IconButton onClick={() => addShape('circle')}>
            <CircleIcon />
          </IconButton>
          <IconButton onClick={() => addShape('line')}>
            <PencilIcon />
          </IconButton>
        </ButtonGroup>

        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <IconButton onClick={() => addShape('text')}>
            <TextIcon />
          </IconButton>
          <IconButton onClick={() => addShape('heart')}>
            <HeartIcon />
          </IconButton>
          <IconButton onClick={() => addShape('star')}>
            <StarIcon />
          </IconButton>
          <IconButton onClick={() => addShape('smiley')}>
            <SmileyIcon />
          </IconButton>
        </ButtonGroup>

        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <IconButton onClick={addImage}>
            <PhotoIcon />
          </IconButton>
        </ButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Typography variant="caption" sx={{ mr: 1 }}>Stärke:</Typography>
          <Slider
            value={brushWidth}
            onChange={(e, value) => setBrushWidth(value)}
            min={1}
            max={20}
            sx={{ width: 80 }}
            size="small"
          />
        </Box>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: 30, height: 30, border: 'none', borderRadius: 4, marginRight: 16 }}
        />

        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <IconButton onClick={undo} disabled={history.undo.length <= 1}>
            <UndoIcon />
          </IconButton>
          <IconButton onClick={redo} disabled={history.redo.length === 0}>
            <RedoIcon />
          </IconButton>
        </ButtonGroup>

        <ButtonGroup size="small">
          <IconButton onClick={zoomOut}>
            <ZoomOutIcon />
          </IconButton>
          <IconButton onClick={fitToView}>
            <FitIcon />
          </IconButton>
          <IconButton onClick={zoomIn}>
            <ZoomInIcon />
          </IconButton>
        </ButtonGroup>
      </Toolbar>

      <Box sx={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        
        <Menu
          open={contextMenu.visible}
          onClose={() => setContextMenu({ visible: false, x: 0, y: 0, target: null })}
          anchorReference="anchorPosition"
          anchorPosition={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <MenuItem onClick={duplicateObject}>
            <ListItemIcon><CopyIcon /></ListItemIcon>
            <ListItemText>Duplizieren</ListItemText>
          </MenuItem>
          <MenuItem onClick={bringToFront}>
            <ListItemIcon><FrontIcon /></ListItemIcon>
            <ListItemText>Nach vorne</ListItemText>
          </MenuItem>
          <MenuItem onClick={sendToBack}>
            <ListItemIcon><BackIcon /></ListItemIcon>
            <ListItemText>Nach hinten</ListItemText>
          </MenuItem>
          <MenuItem onClick={deleteObject}>
            <ListItemIcon><DeleteIcon /></ListItemIcon>
            <ListItemText>Löschen</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default FabricCanvas;