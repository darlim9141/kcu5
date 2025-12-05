import { Box, Dialog, DialogContent, IconButton, Typography, useMediaQuery, useTheme, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { Close, ArrowBackIosNew, ArrowForwardIos, ExpandMore, DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import ClusterMap from "../components/ClusterMap";
import polaroidEffect from "../assets/polaroid_effect.jpg";
import whiteGlossy from "../assets/white_glossy.jpg";

export interface AnalysisResult {
    id: string;
    imageUrl: string;
    label: string;
    confidence: number;
    description?: string;

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
    const [expanded, setExpanded] = useState(true); // Default expanded
    const contentRef = useRef<HTMLDivElement>(null);

    const categories = ['street', 'minimal', 'casual', 'classic'];
    const categoryKo: Record<string, string> = {
        street: '스트릿',
        minimal: '미니멀',
        casual: '캐주얼',
        classic: '클래식'
    };

    useEffect(() => {
        if (open) {
            setCurrentIndex(0);
            setExpanded(false); // Start closed by default
        }
    }, [open]);

    // Auto-scroll logic
    useEffect(() => {
        if (contentRef.current) {
            if (expanded) {
                // Scroll to bottom continuously during animation to "stick" to the bottom
                const startTime = Date.now();
                const duration = 400; // Match/exceed accordion transition duration

                const animateScroll = () => {
                    if (!contentRef.current) return;
                    
                    // Instant scroll to current bottom
                    contentRef.current.scrollTo({
                        top: contentRef.current.scrollHeight,
                        behavior: 'auto'
                    });

                    if (Date.now() - startTime < duration) {
                        requestAnimationFrame(animateScroll);
                    }
                };
                requestAnimationFrame(animateScroll);
            } else {
                // Scroll to top when collapsed
                contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }, [expanded]);

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

            <DialogContent 
                ref={contentRef}
                sx={{ 
                p: 0, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'flex-start', // Align to top to allow scrolling down
                overflowY: expanded ? 'auto' : 'hidden', // Lock scroll when collapsed
                mt: { xs: 14, md: 0 }, // Use margin instead of padding to push scroll container down
                height: { xs: 'calc(100% - 112px)', md: '100%' } // Adjust height to account for margin
            }}>
                {!currentResult ? (
                    <Box sx={{ bgcolor: 'white', p: 4, borderRadius: 1 }}>
                        <Typography>결과를 불러오는 중...</Typography>
                    </Box>
                ) : (
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        width: { xs: '90%', sm: '80%', md: '100%' }, // Responsive width
                        maxWidth: '500px', 
                        mb: { xs: 2, md: 10 } // Reduce bottom margin on mobile
                    }}>
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
                                height: 'auto', // Allow it to grow
                                // Removed maxHeight and overflow to allow full expansion
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
                                expanded={expanded}
                                onChange={(_, isExpanded) => setExpanded(isExpanded)}
                                elevation={0}
                                disableGutters
                                sx={{
                                    '&:before': { display: 'none' }, // Remove default divider
                                    bgcolor: 'transparent',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '100%'
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
                                            <Typography variant="h5" sx={{ fontFamily: 'Pretendard', fontWeight: 700 }}>
                                                {{
                                                    street: '스트릿',
                                                    minimal: '미니멀',
                                                    casual: '캐주얼',
                                                    classic: '클래식'
                                                }[currentResult.label.toLowerCase()] || currentResult.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Pretendard' }}>
                                                {currentResult.description || new Date().toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', ml: 2 }}>
                                        {(currentResult.confidence * 100).toFixed(0)}%
                                    </Typography>
                                </AccordionSummary>

                                <AccordionDetails sx={{ 
                                    px: 1, 
                                    pb: 2, 
                                    pt: 0, 
                                    display: 'block'
                                }}> 
                                    {/* Recommendations */}
                                    {currentRawResult?.classification?.all_confidences && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, mt: 1 }}>
                                            {[...categories]
                                                .sort((a, b) => {
                                                    const valA = currentRawResult.classification.all_confidences[Object.keys(currentRawResult.classification.all_confidences).find((k: string) => k.toLowerCase() === a) || ''] || 0;
                                                    const valB = currentRawResult.classification.all_confidences[Object.keys(currentRawResult.classification.all_confidences).find((k: string) => k.toLowerCase() === b) || ''] || 0;
                                                    return valB - valA;
                                                })
                                                .map(cat => {
                                                    // Find the key in all_confidences that matches the category (case-insensitive)
                                                    const confKey = Object.keys(currentRawResult.classification.all_confidences).find((k: string) => k.toLowerCase() === cat) || '';
                                                    const percentage = currentRawResult.classification.all_confidences[confKey] || 0;
                                                    
                                                    return (
                                                    <Box key={cat}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                            <Typography variant="body2" fontWeight="800" color="text.primary" fontFamily="Pretendard">
                                                                {categoryKo[cat]}
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="600" color="text.secondary" fontFamily="Pretendard">
                                                                {percentage}%
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ 
                                                            height: '8px', 
                                                            width: '100%', 
                                                            bgcolor: '#f0f0f0', 
                                                            borderRadius: '4px', 
                                                            overflow: 'hidden' 
                                                        }}>
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                transition={{ duration: 1, delay: 0.2 }}
                                                                style={{
                                                                    height: '100%',
                                                                    backgroundColor: cat === currentResult.label.toLowerCase() ? '#007AFF' : '#C7C7CC',
                                                                    borderRadius: '4px'
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                )})}
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
