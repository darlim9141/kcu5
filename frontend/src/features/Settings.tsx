import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Snackbar, Typography } from "@mui/material";
import { useState } from "react";
import { clearResults } from "../utils/storage";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export default function Settings() {
    const [openConfirm, setOpenConfirm] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const handleDeleteAll = async () => {
        await clearResults();
        setOpenConfirm(false);
        setSnackbarOpen(true);
    };

    return (
        <Container maxWidth="sm" sx={{ pt: 12, pb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 4 }}>
                설정
            </Typography>

            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                    데이터 관리
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    갤러리에 저장된 모든 분석 결과와 사진을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                </Typography>
                
                <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => setOpenConfirm(true)}
                >
                    모든 데이터 삭제
                </Button>
            </Paper>

            {/* Confirmation Dialog */}
            <Dialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
            >
                <DialogTitle>
                    정말 모든 데이터를 삭제하시겠습니까?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        저장된 모든 사진과 분석 결과가 영구적으로 삭제됩니다.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirm(false)}>취소</Button>
                    <Button onClick={handleDeleteAll} color="error" autoFocus>
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
            />
        </Container>
    )
}