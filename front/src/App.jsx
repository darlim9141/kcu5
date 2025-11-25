import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Plotly.js Import Fix for Vite Environment
// Vite loads CommonJS modules differently. We check if 'default' exists to avoid "Element type is invalid" errors.
import PlotlyHelper from 'react-plotly.js';
const Plot = PlotlyHelper.default ? PlotlyHelper.default : PlotlyHelper;

import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  // === 1. State Management (Memory) ===
  // React components use 'state' to remember data that changes over time.
  const [file, setFile] = useState(null);           // Stores the selected image file
  const [preview, setPreview] = useState(null);     // Stores the URL for image preview
  const [loading, setLoading] = useState(false);    // Tracks loading status (True/False)
  const [result, setResult] = useState(null);       // Stores analysis results from Backend
  const [graphData, setGraphData] = useState([]);   // Stores background dataset for 3D graph
  const [error, setError] = useState(null);         // Stores error messages

  // === 2. Side Effects (Lifecycle) ===
  // useEffect runs code after the component renders. 
  // The empty array [] means this runs only ONCE when the page loads.
  useEffect(() => {
    // Fetch the pre-calculated dataset for the 3D graph background
    fetch('/web_graph_data.json')
      .then(res => res.json())
      .then(data => {
        setGraphData(data);
        console.log("Graph data loaded successfully:", data.length);
      })
      .catch(err => console.error("Failed to load graph data:", err));
  }, []);

  // === 3. Event Handlers (Logic) ===

  // Handle file selection from the user
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create a temporary URL to display the image immediately
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null); // Reset previous results
      setError(null);  // Clear errors
    }
  };

  // Handle form submission (Send data to Backend)
  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    // Prepare FormData to send file (Standard way to upload files via HTTP)
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Send POST request to FastAPI Backend
      const res = await axios.post('http://localhost:8000/predict/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log("Server Response:", res.data);
      setResult(res.data); // Update state with analysis result
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please ensure the backend is running.");
    } finally {
      setLoading(false); // Stop loading spinner regardless of success or failure
    }
  };

  // Helper function to format data for the 3D Plot
  const generatePlotData = () => {
    if (graphData.length === 0) return [];

    // Trace 1: Background Dataset (Gray dots)
    const traceBackground = {
      x: graphData.map(d => d.x),
      y: graphData.map(d => d.y),
      z: graphData.map(d => d.z),
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

    const traces = [traceBackground];

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

  // === 4. UI Rendering (JSX) ===
  // JSX looks like HTML but works like JavaScript.
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">My Fashion DNA</h1>
      <p className="text-gray-500 mb-8">AI analyzes your fashion style and maps it on a 3D landscape.</p>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl">
        
        {/* Left Panel: Upload & Result */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 bg-white p-6 rounded-2xl shadow-lg h-fit">
          
          {/* Image Preview Area */}
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-6 flex items-center justify-center border-2 border-dashed border-gray-300 relative">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Upload size={48} className="mb-2" />
                <span>Upload your photo</span>
              </div>
            )}
            {/* Hidden Input for File Selection */}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
          </div>

          {/* Analysis Button */}
          <button 
            onClick={handleSubmit} 
            disabled={!file || loading}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2
              ${!file ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}
            `}
          >
            {loading ? <><Loader2 className="animate-spin" /> Analyzing...</> : 'Analyze My Style'}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Result Card */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                <CheckCircle size={20} /> Analysis Complete
              </div>
              <h2 className="text-3xl font-bold text-gray-900 capitalize mb-1">
                {result.classification.category}
              </h2>
              <p className="text-gray-600">
                Confidence: <span className="font-mono font-bold text-blue-600">{result.classification.confidence}%</span>
              </p>
              <div className="mt-3 text-xs text-gray-400 bg-white p-2 rounded border">
                Cluster ID: {result.kmeans.cluster_id} <br/>
                Coord: ({result.kmeans.coordinates.x.toFixed(2)}, {result.kmeans.coordinates.y.toFixed(2)}, {result.kmeans.coordinates.z.toFixed(2)})
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Right Panel: 3D Visualization */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-[2] bg-white p-4 rounded-2xl shadow-lg flex flex-col">
          <h3 className="text-lg font-bold text-gray-700 mb-4 px-2">Fashion Cluster Map 3D</h3>
          <div className="flex-1 min-h-[500px] bg-gray-50 rounded-xl overflow-hidden relative">
            {graphData.length > 0 ? (
              <Plot
                data={generatePlotData()}
                layout={{
                  autosize: true,
                  scene: {
                    xaxis: { title: 'X (Style)' },
                    yaxis: { title: 'Y (Texture)' },
                    zaxis: { title: 'Z (Shape)' },
                  },
                  margin: { l: 0, r: 0, b: 0, t: 0 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  showlegend: true,
                  legend: { x: 0, y: 1 }
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
                config={{ displayModeBar: false }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <Loader2 className="animate-spin mr-2" /> Loading Dataset...
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default App;