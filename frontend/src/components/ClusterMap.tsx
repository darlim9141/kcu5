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
  const categories = ['street', 'minimal', 'casual', 'classic'];

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
        color: graphData.map(d => d.cluster), // Color by K-Means cluster
        colorscale: 'Viridis', 
        opacity: 0.3 
      },
      name: 'Dataset',
      hoverinfo: 'none'
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
        hovertemplate: `<b>Style: ${result.classification.category}</b><br>Confidence: ${result.classification.confidence}%<extra></extra>`
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
        <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap', borderBottom: '1px solid #eee', bgcolor: 'white', zIndex: 5 }}>
            {categories.map(cat => (
                <Chip
                    key={cat}
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    onClick={() => toggleFilter(cat)}
                    color={activeFilters.includes(cat) ? "primary" : "default"}
                    variant={activeFilters.includes(cat) ? "filled" : "outlined"}
                    size="small"
                    clickable
                />
            ))}
        </Box>

        <Box sx={{ flex: 1, position: 'relative' }}>
        {graphData.length > 0 ? (
          <Plot
            data={generatePlotData()}
            layout={{
              autosize: true,
              scene: {
                xaxis: { title: '', showgrid: false, zeroline: false, showline: false, showticklabels: false, visible: false },
                yaxis: { title: '', showgrid: false, zeroline: false, showline: false, showticklabels: false, visible: false },
                zaxis: { title: '', showgrid: false, zeroline: false, showline: false, showticklabels: false, visible: false },
              },
              margin: { l: 0, r: 0, b: 0, t: 0 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              showlegend: true,
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
