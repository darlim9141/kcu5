import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { getResults, type StoredResult } from '../utils/storage';

const Statistic = () => {
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<StoredResult[]>([]);
    const [stats, setStats] = useState<{
        total: number;
        counts: Record<string, number>;
        percentages: Record<string, number>;
        topStyle: string;
    } | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const categories = ['street', 'minimal', 'casual', 'classic'];
    const categoryKo: Record<string, string> = {
        street: '스트릿',
        minimal: '미니멀',
        casual: '캐주얼',
        classic: '클래식'
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getResults();
                setResults(data);
                analyzeData(data);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const slideshowImages = results.filter(r => r.label.toLowerCase() === stats?.topStyle);

    useEffect(() => {
        if (slideshowImages.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % slideshowImages.length);
            }, 5000);
            return () => clearInterval(interval);
        } else {
            setCurrentIndex(0);
        }
    }, [slideshowImages.length]);

    const analyzeData = (data: StoredResult[]) => {
        if (data.length === 0) return;

        const counts: Record<string, number> = {
            street: 0,
            minimal: 0,
            casual: 0,
            classic: 0
        };

        data.forEach(item => {
            const label = item.label.toLowerCase();
            if (counts[label] !== undefined) {
                counts[label]++;
            }
        });

        const total = data.length;
        const percentages: Record<string, number> = {};
        let maxCount = -1;
        let topStyle = '';

        Object.keys(counts).forEach(key => {
            percentages[key] = Math.round((counts[key] / total) * 100);
            if (counts[key] > maxCount) {
                maxCount = counts[key];
                topStyle = key;
            }
        });

        setStats({ total, counts, percentages, topStyle });
    };

    if (loading) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (results.length === 0) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <Typography variant="h6" color="text.secondary">데이터가 없습니다.</Typography>
                <Typography variant="body2" color="text.secondary">통계를 확인하려면 사진을 업로드해주세요.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            height: '100%', 
            p: { xs: 2, md: 4 }, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: '#f5f5f7' // iOS-like background
        }}>
            <Box sx={{ 
                width: '100%', 
                maxWidth: '1400px', 
                height: { xs: 'auto', md: '80vh' },
                minHeight: { xs: 'auto', md: '600px' }, 
                bgcolor: 'white', 
                borderRadius: '24px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                display: 'flex',
                overflow: 'hidden',
                flexDirection: { xs: 'column', md: 'row' }
            }}>
                {/* Left: Slideshow */}
                <Box sx={{ 
                    flex: 1, 
                    position: 'relative', 
                    bgcolor: '#000', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden',
                    minHeight: { xs: '300px', md: 'auto' }
                }}>
                    <AnimatePresence initial={false}>
                        {slideshowImages.length > 0 && (
                            <motion.img
                                key={currentIndex}
                                src={slideshowImages[currentIndex]?.imageUrl}
                                alt="Style"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'tween', ease: 'easeInOut', duration: 1.0 }}
                                style={{  
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    position: 'absolute'
                                }}
                            />
                        )}
                    </AnimatePresence>
                    <Box sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        p: 3, 
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' 
                    }}>
                        <Typography variant="h5" color="white" fontWeight="bold">
                            {slideshowImages[currentIndex]?.label.charAt(0).toUpperCase() + slideshowImages[currentIndex]?.label.slice(1)}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.8)">
                            {slideshowImages[currentIndex] && new Date(slideshowImages[currentIndex].timestamp).toLocaleDateString()}
                        </Typography>
                    </Box>
                </Box>

                {/* Right: Statistics */}
                <Box sx={{ 
                    flex: 1, 
                    p: 5, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between' 
                }}>
                    <Typography variant="h3" fontWeight="800" gutterBottom sx={{ mt: 2 }}>
                        가장 많이 업로드 된 스타일은 <br/>
                        <span style={{ color: 'inherit' }}>
                            {categoryKo[stats?.topStyle || ''] || stats?.topStyle || '...'}
                        </span>
                        입니다.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5, mb: 2 }}>
                        {[...categories]
                            .sort((a, b) => (stats?.percentages[b] || 0) - (stats?.percentages[a] || 0))
                            .map(cat => (
                            <Box key={cat}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body1" fontWeight="800" color="text.primary">
                                        {categoryKo[cat]}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="600" color="text.secondary">
                                        {stats?.percentages[cat] || 0}%
                                    </Typography>
                                </Box>
                                <Box sx={{ 
                                    height: '12px', 
                                    width: '100%', 
                                    bgcolor: '#f0f0f0', 
                                    borderRadius: '6px', 
                                    overflow: 'hidden' 
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats?.percentages[cat] || 0}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        style={{
                                            height: '100%',
                                            backgroundColor: cat === stats?.topStyle ? '#007AFF' : '#C7C7CC',
                                            borderRadius: '6px'
                                        }}
                                    />
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Statistic;
