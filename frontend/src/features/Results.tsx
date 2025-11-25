import { Box, Button, Card, CardContent, CardMedia, Dialog, DialogContent, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Close, ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import { useEffect, useState } from "react";
import ClusterMap from "../components/ClusterMap";

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  label: string;
  confidence: number;
  description?: string;
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

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700}>
            분석 결과 {results.length > 1 && `(${currentIndex + 1}/${results.length})`}
          </Typography>
          <Box>
            {onDelete && results.length > 0 && (
                <Button color="error" onClick={handleDelete} sx={{ mr: 1 }}>
                    삭제
                </Button>
            )}
            <IconButton onClick={onClose}>
                <Close />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flex: 1, overflow: 'hidden', position: 'relative' }}>
          
          {/* Navigation Arrows */}
          {results.length > 1 && (
            <>
                <IconButton 
                    onClick={handlePrev}
                    sx={{ 
                        position: 'absolute', 
                        left: 10, 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        zIndex: 10,
                        bgcolor: 'rgba(255,255,255,0.7)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        boxShadow: 3
                    }}
                >
                    <ArrowBackIosNew />
                </IconButton>
                <IconButton 
                    onClick={handleNext}
                    sx={{ 
                        position: 'absolute', 
                        right: { xs: 10, lg: 'calc(66.66% + 10px)' }, // Adjust based on layout
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        zIndex: 10,
                        bgcolor: 'rgba(255,255,255,0.7)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        boxShadow: 3
                    }}
                >
                    <ArrowForwardIos />
                </IconButton>
            </>
          )}

          {/* Left Side: Results List */}
          <Box sx={{ flex: 1, p: 3, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {!currentResult ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">
                  결과를 불러오는 중이거나 데이터가 없습니다.
                </Typography>
              </Box>
            ) : (
              <Card key={currentResult.id} elevation={3} sx={{ width: '100%', maxWidth: 500 }}>
                <CardMedia
                  component="img"
                  height={400}
                  image={currentResult.imageUrl}
                  alt={currentResult.label}
                  sx={{ objectFit: "contain", bgcolor: '#f5f5f5' }}
                />
                <CardContent>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {currentResult.label}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    신뢰도: {(currentResult.confidence * 100).toFixed(1)}%
                  </Typography>
                  {currentResult.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {currentResult.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Right Side: 3D Cluster Map */}
          <Box sx={{ flex: 2, borderLeft: { lg: 1 }, borderColor: 'divider', minHeight: '500px', position: 'relative' }}>
             <ClusterMap graphData={graphData} result={currentRawResult} />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
