import React from 'react';
import { Box, CircularProgress, Chip } from '@mui/material';
import { useState } from 'react';
import { motion } from 'framer-motion';
// @ts-expect-error: react-plotly.js missing types
import PlotlyHelper from 'react-plotly.js';

// Handle Plotly import for Vite
const Plot = PlotlyHelper.default ? PlotlyHelper.default : PlotlyHelper;

interface Coordinate {
  x: number;
  y: number;
  z: number;
}

interface GraphDataPoint extends Coordinate {
  cluster: number;
  original_label?: string;
}

interface AnalysisResult {
  kmeans: {
    cluster_id: number;
    coordinates: Coordinate;
  };
  classification: {
    category: string;
    confidence: number;
  };
}

interface ClusterMapProps {
  graphData: GraphDataPoint[];
  result?: AnalysisResult | null;
}

const ClusterMap: React.FC<ClusterMapProps> = ({ graphData, result }) => {
  const [activeFilters, setActiveFilters] = useState<string[]>(['street', 'minimal', 'casual', 'classic']);
  const [showDataset, setShowDataset] = useState(true);
  const [showMyStyle, setShowMyStyle] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const categories = ['street', 'minimal', 'casual', 'classic'];

  const categoryColors: Record<string, string> = {
    street: '#0072B2',   // Blue (Okabe-Ito)
    minimal: '#000000',  // Black (High contrast)
    casual: '#009E73',   // Bluish Green (Okabe-Ito)
    classic: '#D55E00',  // Vermilion (Okabe-Ito)
    default: '#999999'   // Gray
  };

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const toggleFilter = (category: string) => {
    setActiveFilters(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Helper function to format data for the 3D Plot
  const generatePlotData = () => {
    if (graphData.length === 0) return [];

    const filteredData = graphData.filter(d => 
        !d.original_label || activeFilters.includes(d.original_label)
    );

    // Trace 1: Background Dataset (Gray dots)
    const traceBackground = {
      x: filteredData.map(d => d.x),
      y: filteredData.map(d => d.y),
      z: filteredData.map(d => d.z),
      mode: 'markers',
      type: 'scatter3d',
      marker: { 
        size: 3, 
        color: filteredData.map(d => categoryColors[d.original_label?.toLowerCase() || 'default'] || categoryColors['default']),
        // colorscale: 'Viridis', 
        opacity: 0.5 
      },
      name: 'Dataset',
      hoverinfo: 'none',
      visible: showDataset ? true : 'legendonly'
    };

    const traces: any[] = [traceBackground];

    // Trace 2: User Result (Red Diamond)
    // Only add this trace if analysis result exists
    if (result) {
      const userPoint = {
        x: [result.kmeans.coordinates.x],
        y: [result.kmeans.coordinates.y],
        z: [result.kmeans.coordinates.z],
        mode: 'markers',
        type: 'scatter3d',
        marker: { size: 10, color: 'red', symbol: 'diamond', opacity: 1 },
        name: 'My Style',
        hovertemplate: `<b>Style: ${result.classification.category}</b><br>Confidence: ${result.classification.confidence}%<extra></extra>`,
        visible: showMyStyle ? true : 'legendonly'
      };
      traces.push(userPoint);
    }

    return traces;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%'
      }}
    >

      <Box sx={{ flex: 1, bgcolor: '#f9fafb', borderRadius: '12px', overflow: 'hidden', position: 'relative', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Filter Chips */}
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, overflowX: 'auto', borderBottom: '1px solid #eee', bgcolor: 'white', zIndex: 5, whiteSpace: 'nowrap' }}>
            {categories.map(cat => {
                const isActive = activeFilters.includes(cat);
                const color = categoryColors[cat];
                return (
                    <Chip
                        key={cat}
                        label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                        onClick={() => toggleFilter(cat)}
                        size="small"
                        clickable
                        sx={{ 
                            fontSize: '0.75rem', 
                            height: '24px',
                            bgcolor: isActive ? hexToRgba(color, 0.2) : 'rgba(0,0,0,0.05)',
                            color: isActive ? color : '#666',
                            border: `1px solid ${isActive ? hexToRgba(color, 0.5) : 'rgba(0,0,0,0.1)'}`,
                            backdropFilter: 'blur(10px)',
                            fontWeight: isActive ? 600 : 400,
                            '&:hover': {
                                bgcolor: isActive ? hexToRgba(color, 0.3) : 'rgba(0,0,0,0.1)',
                            }
                        }}
                    />
                );
            })}
            
            {/* Separator */}
            <Box sx={{ width: '1px', height: '16px', bgcolor: '#ddd', mx: 0.5, flexShrink: 0 }} />

            {/* Dataset Toggle */}
            <Chip
                label="Dataset"
                onClick={() => setShowDataset(!showDataset)}
                size="small"
                clickable
                sx={{ 
                    fontSize: '0.75rem', 
                    height: '24px',
                    bgcolor: showDataset ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                    color: showDataset ? '#000' : '#666',
                    border: `1px solid ${showDataset ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`,
                    backdropFilter: 'blur(10px)',
                    fontWeight: showDataset ? 600 : 400
                }}
            />

            {/* Me Toggle */}
            {result && (
                <Chip
                    label="Me"
                    onClick={() => setShowMyStyle(!showMyStyle)}
                    size="small"
                    clickable
                    sx={{ 
                        fontSize: '0.75rem', 
                        height: '24px',
                        bgcolor: showMyStyle ? 'rgba(211, 47, 47, 0.2)' : 'rgba(0,0,0,0.05)', // Red for Me
                        color: showMyStyle ? '#d32f2f' : '#666',
                        border: `1px solid ${showMyStyle ? 'rgba(211, 47, 47, 0.5)' : 'rgba(0,0,0,0.1)'}`,
                        backdropFilter: 'blur(10px)',
                        fontWeight: showMyStyle ? 600 : 400
                    }}
                />
            )}

            {/* Axes Toggle */}
            <Chip
                label="Axes"
                onClick={() => setShowAxes(!showAxes)}
                size="small"
                clickable
                sx={{ 
                    fontSize: '0.75rem', 
                    height: '24px',
                    bgcolor: showAxes ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                    color: showAxes ? '#000' : '#666',
                    border: `1px solid ${showAxes ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`,
                    backdropFilter: 'blur(10px)',
                    fontWeight: showAxes ? 600 : 400
                }}
            />
        </Box>

        <Box sx={{ flex: 1, position: 'relative' }}>
        {graphData.length > 0 ? (
          <Plot
            data={generatePlotData()}
            layout={{
              autosize: true,
              scene: {
                xaxis: { title: 'X', showgrid: showAxes, zeroline: showAxes, showline: showAxes, showticklabels: showAxes, visible: showAxes },
                yaxis: { title: 'Y', showgrid: showAxes, zeroline: showAxes, showline: showAxes, showticklabels: showAxes, visible: showAxes },
                zaxis: { title: 'Z', showgrid: showAxes, zeroline: showAxes, showline: showAxes, showticklabels: showAxes, visible: showAxes },
              },
              margin: { l: 0, r: 0, b: 0, t: 0 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              showlegend: false,
              legend: { x: 0, y: 1 }
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
            config={{ 
              displayModeBar: false,
              // Attempt to mitigate WebGL warnings by being explicit about rendering
              plotGlPixelRatio: 2
            }}
          />
        ) : (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
            <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Dataset...
          </Box>
        )}
        </Box>
      </Box>
    </motion.div>
  );
};

export default ClusterMap;
