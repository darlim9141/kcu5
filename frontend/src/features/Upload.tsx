import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type ChangeEvent } from "react";
import axios from "axios";
import { saveResult } from "../utils/storage";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const MAX_FILES = 5;

export interface UploadHandle {
  open: () => void;
}

interface UploadProps {
  onComplete?: () => void;
  onResult?: (result: any, rawResult: any, index: number) => void;
  onUploadStart?: (files: {file: File, preview: string}[]) => void;
  onProgress?: (index: number, progress: number) => void;
}

const Upload = forwardRef<UploadHandle, UploadProps>((props, ref) => {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setError(null);
    }
  }));

  const remainingSlots = useMemo(() => MAX_FILES - images.length, [images.length]);

  const getFilePreview = async (file: File): Promise<{file: File, preview: string}> => {
    // Check if file is HEIC
    if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic")) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await axios.post("http://localhost:8000/convert/preview", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        
        return { file, preview: response.data.preview };
      } catch (e) {
        console.error("Preview generation failed:", e);
        // Fallback or error? Let's show error for now.
        throw new Error("이미지 미리보기를 불러오지 못했습니다.");
      }
    }

    // For other images, use local FileReader
    return new Promise<{file: File, preview: string}>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ file, preview: reader.result as string });
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const fileList = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic'));
    
    if (!fileList.length) return;
    
    processFiles(fileList);
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (fileList: File[]) => {
    if (remainingSlots <= 0) {
      setError(`최대 ${MAX_FILES}장까지 업로드할 수 있어요.`);
      return;
    }

    const usableFiles = fileList.slice(0, remainingSlots);
    if (usableFiles.length < fileList.length) {
      setError(`한 번에 최대 ${MAX_FILES}장까지만 저장돼요.`);
    } else {
      setError(null);
    }

    setIsProcessing(true);
    try {
      const nextImages = await Promise.all(usableFiles.map(getFilePreview));
      setImages((prev) => [...prev, ...nextImages]);
    } catch (e) {
        console.error(e);
      setError("파일을 처리하는 중 문제가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (!fileList.length) return;
    processFiles(fileList);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!images.length) {
      setError("업로드할 이미지를 먼저 선택해 주세요.");
      return;
    }
    
    // Notify start and close dialog immediately
    if (props.onUploadStart) {
        props.onUploadStart(images);
    }
    setOpen(false); // Close the dialog immediately
    
    setIsUploading(true);
    setUploadProgress({});
    setError(null);

    try {
      const uploadPromises = images.map(async (item, index) => {
        const formData = new FormData();
        formData.append("file", item.file);

        const response = await axios.post("http://localhost:8000/predict/single", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress((prev) => ({
                ...prev,
                [index]: percentCompleted,
              }));
              if (props.onProgress) {
                  props.onProgress(index, percentCompleted);
              }
            }
          },
        });

        const analysisResult = response.data;
        const formattedResult = {
            id: crypto.randomUUID(),
            imageUrl: item.preview,
            label: analysisResult.classification.category,
            confidence: analysisResult.classification.confidence / 100,
            timestamp: new Date().toISOString(),
            recommendations: analysisResult.recommendations,
            accessories: analysisResult.accessories,
            rawResult: analysisResult
        };

        // Save and notify immediately
        await saveResult(formattedResult);
        
        if (props.onResult) {
            props.onResult(formattedResult, analysisResult, index);
        }

        return {
          formatted: formattedResult,
          raw: analysisResult
        };
      });

      await Promise.all(uploadPromises);
      
      if (props.onComplete) {
        props.onComplete();
      }
      
      setImages([]);
    } catch (uploadError) {
      console.error(uploadError);
      // Since dialog is closed, we might want to notify via a global snackbar or similar, 
      // but for now we just log it. The individual items in Gallery will just hang or we need error handling there.
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <div className="demoPage">
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          업로드
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: isDragging ? 'action.hover' : 'background.paper',
              transition: 'all 0.2s',
              cursor: 'pointer',
              mb: 2,
              position: 'relative'
            }}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            {isProcessing && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255,255,255,0.8)',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <CircularProgress size={40} />
                    <Typography variant="caption" sx={{ mt: 1 }}>이미지 처리 중...</Typography>
                </Box>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic"
                multiple
                hidden
                onChange={handleFilesSelected}
                disabled={isProcessing}
            />
            <Typography variant="h6" color={isDragging ? 'primary' : 'text.primary'} gutterBottom>
                {isDragging ? '여기에 놓아주세요!' : '이미지를 드래그하거나 클릭하여 선택하세요'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {remainingSlots > 0
                ? `최대 ${remainingSlots}장 더 추가 가능`
                : "최대 개수에 도달했습니다"}
            </Typography>
          </Box>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}

          {images.length > 0 ? (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {images.map((item, index) => (
                <ListItem
                  key={`${item.preview}-${index}`}
                  secondaryAction={
                    !isUploading && (
                      <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveImage(index)}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                        src={item.preview} 
                        variant="rounded" 
                        sx={{ width: 56, height: 56, mr: 2 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                        <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
                            {item.file.name}
                        </Typography>
                    }
                    secondary={
                        <Box sx={{ width: '100%', mt: 1 }}>
                            {isUploading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                        <LinearProgress variant="determinate" value={uploadProgress[index] || 0} />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                        <Typography variant="body2" color="text.secondary">{`${Math.round(
                                            uploadProgress[index] || 0,
                                        )}%`}</Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="caption" color="text.secondary">
                                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                            )}
                        </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", mt: 4, mb: 2 }}
            >
                아직 업로드된 이미지가 없어요.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleClose}>
            닫기
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!images.length || isUploading}
          >
            {isUploading ? "업로드 중..." : "업로드"}
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </div>
  );
});

export default Upload;


