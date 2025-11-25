import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Add } from "@mui/icons-material";
import HTMLFlipBook from "react-pageflip";
import Upload, { type UploadHandle } from "./Upload";
import "../styles/flipbook.css"
import { useEffect, useRef, useState } from "react";
import { getResults, deleteResult, type StoredResult } from "../utils/storage";
import ResultsModal, { type AnalysisResult } from "./Results";

export default function Gallery() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [results, setResults] = useState<StoredResult[]>([]);
    const uploadRef = useRef<UploadHandle>(null);
    
    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedResults, setSelectedResults] = useState<AnalysisResult[]>([]);
    const [selectedRawResults, setSelectedRawResults] = useState<any[]>([]);

    const loadResults = async () => {
        const data = await getResults();
        setResults(data);
    };

    useEffect(() => {
        loadResults();
    }, []);

    const handleItemClick = (item: StoredResult) => {
        setSelectedResults([{
            id: item.id,
            imageUrl: item.imageUrl,
            label: item.label,
            confidence: item.confidence,
            description: item.timestamp ? new Date(item.timestamp).toLocaleString() : undefined
        }]);
        setSelectedRawResults([item.rawResult]);
        setModalOpen(true);
    };

    const handleUploadComplete = (results: StoredResult[], rawResults: any[]) => {
        // Refresh gallery list
        loadResults();
        
        // Open modal with new results
        const mappedResults = results.map(result => ({
            id: result.id,
            imageUrl: result.imageUrl,
            label: result.label,
            confidence: result.confidence,
            description: result.timestamp ? new Date(result.timestamp).toLocaleString() : undefined
        }));
        
        setSelectedResults(mappedResults);
        setSelectedRawResults(rawResults);
        setModalOpen(true);
    };

    const handleDeleteResult = async (id: string) => {
        await deleteResult(id);
        await loadResults();
        setModalOpen(false);
        setSelectedResults([]);
        setSelectedRawResults([]);
    };

    const handleAddClick = () => {
        if (uploadRef.current) {
            uploadRef.current.open();
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedResults([]);
        setSelectedRawResults([]);
    };

    const ITEMS_PER_PAGE = 20;
    
    // Grid Logic:
    // Slot 0: Add Button (Fixed)
    // Slot 1: "Add Photos" Label (Fixed)
    // Slot 2, 4, 6...: Metadata (Date/Time)
    // Slot 3, 5, 7...: Photo
    
    // Each result takes 2 slots.
    // Total slots needed = 2 (Fixed) + (Results.length * 2)
    const totalSlots = 2 + (results.length * 2);
    const totalPages = Math.ceil(totalSlots / ITEMS_PER_PAGE);
    const pagesToRender = Math.max(totalPages, 1);

    return (
        <Box sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            paddingTop: "120px",
            paddingBottom: "120px",
            paddingLeft: "120px",
            paddingRight: "120px",
            boxSizing: "border-box"

        }}>
            {/* Hidden Upload Component to handle dialog */}
            <Upload ref={uploadRef} onComplete={handleUploadComplete} />
            
            <ResultsModal 
                open={modalOpen} 
                onClose={handleModalClose} 
                onDelete={handleDeleteResult}
                results={selectedResults}
                rawResults={selectedRawResults}
            />
            
            <HTMLFlipBook
                className="gallery-book"
                style={{}}
                startPage={0}
                size="stretch"
                width={800}
                height={850}
                minWidth={300}
                maxWidth={1000}
                minHeight={400}
                maxHeight={1536}
                drawShadow
                flippingTime={900}
                usePortrait={isMobile}
                startZIndex={1}
                autoSize
                maxShadowOpacity={0.5}
                showCover={false}
                mobileScrollSupport
                clickEventForward
                useMouseEvents
                swipeDistance={30}
                showPageCorners
                disableFlipByClick={false}
            >
                {Array.from({ length: pagesToRender }).map((_, pageIndex) => (
                    <div className="demoPage" key={pageIndex}>
                        <div className="grid-page">
                            {Array.from({ length: ITEMS_PER_PAGE }).map((_, itemIndex) => {
                                const globalIndex = pageIndex * ITEMS_PER_PAGE + itemIndex;
                                let content;
                                let onClick = undefined;
                                let style: React.CSSProperties = {};

                                if (globalIndex === 0) {
                                    // Slot 0: Add Button
                                    content = <Add sx={{ fontSize: 40, color: "#ccc" }} />;
                                    onClick = handleAddClick;
                                    style = { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' };
                                } else if (globalIndex === 1) {
                                    // Slot 1: Label
                                    content = "Add Photos";
                                    style = { display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#666' };
                                } else {
                                    // Results start from index 2
                                    // Result Index = (Global Index - 2) / 2
                                    // If even (2, 4, 6...), it's Metadata (Result Index = (2-2)/2 = 0, (4-2)/2 = 1)
                                    // If odd (3, 5, 7...), it's Photo (Result Index = (3-2)/2 = 0.5 -> same result)
                                    
                                    const adjustedIndex = globalIndex - 2;
                                    const resultIndex = Math.floor(adjustedIndex / 2);
                                    // User wants Photo first, then Metadata.
                                    // Slot 2 (Adj 0): Photo
                                    // Slot 3 (Adj 1): Metadata
                                    const isMeta = adjustedIndex % 2 !== 0;

                                    if (resultIndex < results.length) {
                                        const item = results[resultIndex];
                                        if (isMeta) {
                                            // Metadata Slot
                                            const date = item.timestamp ? new Date(item.timestamp) : new Date();
                                            content = (
                                                <div style={{ fontSize: "12px", textAlign: "center", padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{date.toLocaleDateString()}</div>
                                                    <div style={{ color: '#666' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            );
                                        } else {
                                            // Photo Slot
                                            content = (
                                                <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                                                    <img 
                                                        src={item.imageUrl} 
                                                        alt={item.label} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    />
                                                </div>
                                            );
                                            onClick = () => handleItemClick(item);
                                            style = { cursor: 'pointer' };
                                        }
                                    } else {
                                        // Empty slot
                                        content = null;
                                    }
                                }

                                return (
                                    <div 
                                        className="grid-item" 
                                        key={itemIndex} 
                                        onClick={onClick}
                                        style={style}
                                    >
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </HTMLFlipBook>
        </Box>
    )
}