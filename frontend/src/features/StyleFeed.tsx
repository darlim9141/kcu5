import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import axios from 'axios';

// 환경 변수 사용 (배포 시 필수!)
const API_URL = import.meta.env.VITE_API_URL || "/api";

interface StyleFeedProps {
    style: string;
}

const StyleFeed = ({ style }: StyleFeedProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const columnCount = isMobile ? 2 : 4;

    const [images, setImages] = useState<{ image: string, title: string, url: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    
    // [수정 1] 사용하지 않는 page 변수 삭제함
    // const [page, setPage] = useState(1); 

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // Distribute images into columns
    const columns = useMemo(() => {
        const cols: typeof images[] = Array.from({ length: columnCount }, () => []);
        const validImages = images.filter(img => !failedImages.has(img.image));
        
        validImages.forEach((img, index) => {
            cols[index % columnCount].push(img);
        });
        return cols;
    }, [images, columnCount, failedImages]);

    const fetchImages = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            // [수정 2] localhost 대신 환경 변수 API_URL 사용
            const response = await axios.get(`${API_URL}/crawl/images`, {
                params: { style } 
                // 만약 나중에 백엔드에서 페이지네이션을 지원하면 여기에 page: pageNum 등을 추가하면 됩니다.
            });
            
            const newImages = response.data.images || [];
            
            setImages(prev => {
                const existingUrls = new Set(prev.map(img => img.image));
                const uniqueNewImages = newImages.filter((img: any) => !existingUrls.has(img.image));
                return [...prev, ...uniqueNewImages];
            });
            
        } catch (error) {
            console.error("Failed to fetch style feed:", error);
        } finally {
            setLoading(false);
        }
    }, [style]); // loading 의존성 제거됨 (무한 루프 방지)

    // Initial fetch
    useEffect(() => {
        setImages([]); 
        setFailedImages(new Set()); 
        // setPage(1); // [수정 3] 삭제
        fetchImages();
    }, [style, fetchImages]);

    // Infinite Scroll Observer
    useEffect(() => {
        if (loading) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    fetchImages();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [fetchImages, loading]);

    if (images.length === 0 && loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (images.length === 0) {
        return null; 
    }

    return (
        <Box sx={{ px: 2 }}>
            <Box sx={{ 
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
            }}>
                {columns.map((col, colIndex) => (
                    <Box key={colIndex} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {col.map((img, index) => (
                            <Box key={`${img.image}-${index}`} sx={{ 
                                borderRadius: '16px', 
                                overflow: 'hidden',
                                bgcolor: 'white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                position: 'relative',
                                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    zIndex: 1,
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                                }
                            }}>
                                <a href={img.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                                    <img 
                                        src={img.image} 
                                        alt={img.title} 
                                        onError={() => setFailedImages(prev => {
                                            const newSet = new Set(prev);
                                            newSet.add(img.image);
                                            return newSet;
                                        })}
                                        style={{ 
                                            width: '100%', 
                                            display: 'block', 
                                            height: 'auto'
                                        }} 
                                        loading="lazy"
                                    />
                                </a>
                            </Box>
                        ))}
                    </Box>
                ))}
            </Box>
            
            {/* Sentinel for Infinite Scroll */}
            <Box ref={loadMoreRef} sx={{ height: '40px', width: '100%', display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                {loading && <CircularProgress size={24} />}
            </Box>
        </Box>
    );
};

export default StyleFeed;
