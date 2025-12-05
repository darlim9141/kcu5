import { useState, useEffect } from "react";

export default function useAnalysis() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [graphData, setGraphData] = useState([]);

    useEffect(() => {
        fetch('/web_graph_data.json')
            .then(res => res.json())
            .then(data => {
                setGraphData(data);
                console.log("loaded");
            })
            .catch(error => {
                console.error("Error loading graph data:", error);
            });
    }, []);

    return {
        file, setFile,
        preview, setPreview,
        loading, setLoading,
        error, setError,
        result, setResult,
        graphData
    };
}