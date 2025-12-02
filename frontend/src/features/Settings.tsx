import { Button, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Snackbar, Typography } from "@mui/material";
import { useState } from "react";
import { clearResults } from "../utils/storage";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useNavigate } from "react-router-dom";

export default function Settings() {
    const [openConfirm, setOpenConfirm] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const navigate = useNavigate();

    const handleDeleteAll = async () => {
        await clearResults();
        setOpenConfirm(false);
        setSnackbarOpen(true);
        // Navigate to gallery after a short delay to show the snackbar
        setTimeout(() => {
            navigate('/gallery');
        }, 1000);
    };

    return (
        <Container maxWidth="sm" sx={{ pt: 12, pb: 4 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ mb: 4, px: 1 }}>
                설정
            </Typography>

            <Paper 
                elevation={0} 
                sx={{ 
                    p: 4, 
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.18)'
                }}
            >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    데이터 관리
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    갤러리에 저장된 모든 분석 결과와 사진을 삭제합니다. <br/>
                    이 작업은 되돌릴 수 없습니다.
                </Typography>
                
                <Button 
                    fullWidth
                    variant="contained" 
                    color="error" 
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => setOpenConfirm(true)}
                    sx={{
                        borderRadius: '14px',
                        py: 1.5,
                        boxShadow: 'none',
                        fontWeight: 600,
                        backgroundColor: '#FF3B30', // iOS Red
                        '&:hover': {
                            backgroundColor: '#D6342A',
                            boxShadow: 'none'
                        }
                    }}
                >
                    모든 데이터 삭제
                </Button>
            </Paper>

            {/* Confirmation Dialog - Simplified */}
            <Dialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                        maxWidth: '400px',
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    모든 데이터 삭제
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'text.secondary' }}>
                        정말 모든 데이터를 삭제하시겠습니까?<br/>
                        이 작업은 되돌릴 수 없습니다.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button 
                        onClick={() => setOpenConfirm(false)} 
                        sx={{ 
                            color: 'text.secondary',
                            fontWeight: 600,
                            mr: 1
                        }}
                    >
                        취소
                    </Button>
                    <Button 
                        onClick={handleDeleteAll} 
                        variant="contained"
                        color="error"
                        sx={{ 
                            borderRadius: '10px',
                            boxShadow: 'none',
                            fontWeight: 600,
                            backgroundColor: '#FF3B30',
                            '&:hover': {
                                backgroundColor: '#D6342A',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message="모든 데이터가 삭제되었습니다."
                ContentProps={{
                    sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        fontWeight: 500
                    }
                }}
            />
        </Container>
    )
}