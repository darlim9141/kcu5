import { Box, Dialog, DialogContent, IconButton, Stack, Typography, useMediaQuery, useTheme, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { Close, ArrowBackIosNew, ArrowForwardIos, ExpandMore, DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";
import { useEffect, useState } from "react";
import ClusterMap from "../components/ClusterMap";
import polaroidEffect from "../assets/polaroid_effect.jpg";
import whiteGlossy from "../assets/white_glossy.jpg";

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  label: string;
  confidence: number;
  description?: string;
  recommendations?: string[];
  accessories?: string[];
}

interface ResultsModalProps {
  open: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  results: AnalysisResult[];
  rawResults?: any[];
}

export default function ResultsModal({ open, onClose, onDelete, results, rawResults }: ResultsModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [graphData, setGraphData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageOrientation, setImageOrientation] = useState<'landscape' | 'portrait' | 'square'>('square');

  useEffect(() => {
    if (open) {
        setCurrentIndex(0);
    }
  }, [open]);

  useEffect(() => {
    fetch('/web_graph_data.json')
      .then(res => res.json())
      .then(data => {
        setGraphData(data);
      })
      .catch(err => console.error("Failed to load graph data:", err));
  }, []);

  const handleDelete = () => {
    if (onDelete && results.length > 0) {
        if (window.confirm("정말 이 결과를 삭제하시겠습니까?")) {
            onDelete(results[currentIndex].id);
        }
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % results.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + results.length) % results.length);
  };

  const currentResult = results[currentIndex];
  const currentRawResult = rawResults ? rawResults[currentIndex] : null;

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    
    if (Math.abs(width - height) < 10) {
        setImageOrientation('square');
    } else if (width > height) {
        setImageOrientation('landscape');
    } else {
        setImageOrientation('portrait');
    }
  };

  // Determine aspect ratio style based on orientation
  const getAspectRatio = () => {
    switch (imageOrientation) {
        case 'landscape': return '4 / 3';
        case 'portrait': return '3 / 4';
        case 'square': default: return '1 / 1';
    }
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      maxWidth="lg" // Reduced from xl to fit Polaroid look better
      fullWidth
      slotProps={{
        backdrop: {
            sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.6) !important',
            }
        }
      }}
      PaperProps={{
        sx: {
          bgcolor: 'transparent', // Make dialog background transparent to emphasize the Polaroid
          boxShadow: 'none',
          overflow: 'visible', // Allow navigation buttons to be outside if needed
          maxHeight: '95vh',
          m: 2
        }
      }}
    >
        {/* Navigation Arrows - Fixed Position relative to Dialog */}
        {results.length > 1 && (
        <>
            <IconButton 
                onClick={handlePrev}
                sx={{ 
                    position: 'absolute', 
                    left: { xs: 0, md: -60 }, 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    zIndex: 10,
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.3)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}
            >
                <ArrowBackIosNew />
            </IconButton>
            <IconButton 
                onClick={handleNext}
                sx={{ 
                    position: 'absolute', 
                    right: { xs: 0, md: -60 }, 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    zIndex: 10,
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.3)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}
            >
                <ArrowForwardIos />
            </IconButton>
        </>
        )}

      <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        {!currentResult ? (
            <Box sx={{ bgcolor: 'white', p: 4, borderRadius: 1 }}>
                <Typography>결과를 불러오는 중...</Typography>
            </Box>
        ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px', mb: 10 }}>
                <Box
                    sx={{
                        bgcolor: 'white',
                        backgroundImage: `url(${whiteGlossy})`, // Apply glossy texture
                        backgroundSize: 'cover',
                        p: 3, // Increased padding for larger bezel
                        pb: 5, // Add bottom padding for closed state bezel
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        // transform: 'rotate(-1deg)', // Removed tilt
                        transition: 'transform 0.3s',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: 'calc(90vh - 64px)', // Constrain height to viewport minus margins
                        overflow: 'hidden', // Prevent card itself from scrolling
                    }}
                >


                    {/* Image Area */}
                    <Box 
                        sx={{ 
                            width: '100%', 
                            aspectRatio: getAspectRatio(), 
                            bgcolor: '#f0f0f0',
                            overflow: 'hidden',
                            mb: 2,
                            position: 'relative'
                        }}
                    >
                        <img
                            src={currentResult.imageUrl}
                            alt={currentResult.label}
                            onLoad={handleImageLoad}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                        />
                        {/* Texture Overlay */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(${polaroidEffect})`,
                                backgroundSize: 'cover',
                                opacity: 0.3,
                                pointerEvents: 'none',
                                mixBlendMode: 'overlay',
                                zIndex: 10 // Ensure it's on top
                            }}
                        />
                    </Box>

                    {/* Polaroid "Writing" Area (Accordion) */}
                    <Accordion 
                        elevation={0} 
                        disableGutters 
                        sx={{ 
                            '&:before': { display: 'none' }, // Remove default divider
                            bgcolor: 'transparent'
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore />}
                            sx={{ 
                                px: 1,
                                minHeight: 60,
                                '& .MuiAccordionSummary-content': { 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    m: 0
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box>
                                    <Typography variant="h5" sx={{ fontFamily: '"Permanent Marker", "cursive", sans-serif', fontWeight: 700 }}>
                                        {currentResult.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Permanent Marker", "cursive", sans-serif' }}>
                                        {currentResult.description || new Date().toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', ml: 2 }}>
                                {(currentResult.confidence * 100).toFixed(0)}%
                            </Typography>
                        </AccordionSummary>
                        
                        <AccordionDetails sx={{ px: 1, pb: 2, pt: 0, overflowY: 'auto', flex: 1 }}> {/* Allow scrolling within details */}
                            {/* Recommendations */}
                            {(currentResult.recommendations && currentResult.recommendations.length > 0) && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Recommended Brands</Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {currentResult.recommendations.map((brand, idx) => (
                                            <Box 
                                                key={idx} 
                                                component="a"
                                                href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(brand)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ 
                                                    px: 1.5, 
                                                    py: 0.5, 
                                                    bgcolor: '#eee', 
                                                    borderRadius: 4, 
                                                    fontSize: '0.8rem',
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: '#ddd',
                                                        textDecoration: 'underline'
                                                    }
                                                }}
                                            >
                                                {brand}
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* 3D Map */}
                            <Box sx={{ height: 500, width: '100%', mt: 2, border: '1px solid #eee', borderRadius: 1, overflow: 'hidden' }}>
                                <ClusterMap graphData={graphData} result={currentRawResult} />
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
                
                {/* Delete Button - Fixed at Top Right */}
                {onDelete && (
                    <Box sx={{ position: 'fixed', top: 30, right: 30, zIndex: 1300 }}>
                        <IconButton 
                            onClick={handleDelete}
                            sx={{ 
                                color: 'white',
                                bgcolor: 'rgba(0,0,0,0.5)',
                                '&:hover': { bgcolor: 'rgba(255,0,0,0.7)' },
                                border: '1px solid rgba(255,255,255,0.3)',
                                width: 56,
                                height: 56,
                            }}
                        >
                            <DeleteOutlineIcon fontSize="large" />
                        </IconButton>
                    </Box>
                )}

                {/* Close Button - Fixed at Top Left */}
                <Box sx={{ position: 'fixed', top: 30, left: 30, zIndex: 1300 }}>
                    <IconButton 
                        onClick={onClose}
                        sx={{ 
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            '&:hover': { bgcolor: 'rgba(255,0,0,0.7)' },
                            border: '1px solid rgba(255,255,255,0.3)',
                            width: 56,
                            height: 56,
                        }}
                    >
                        <Close fontSize="large" />
                    </IconButton>
                </Box>
            </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
