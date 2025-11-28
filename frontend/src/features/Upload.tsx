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
  onComplete?: (results: any[], rawResults: any[]) => void;
}

const Upload = forwardRef<UploadHandle, UploadProps>((props, ref) => {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setError(null);
    }
  }));



// ... existing imports

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

    try {
      const nextImages = await Promise.all(usableFiles.map(getFilePreview));
      setImages((prev) => [...prev, ...nextImages]);
    } catch (e) {
        console.error(e);
      setError("파일을 처리하는 중 문제가 발생했습니다.");
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
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    
    // Convert all base64 images to files and append to formData
    images.forEach((item, index) => {
        // Use the original file stored in the state
        if (images.length === 1) {
            formData.append("file", item.file);
        } else {
            formData.append("files", item.file);
        }
    });

    try {
      let formattedResults: any[] = [];
      let rawResults: any[] = [];

      if (images.length === 1) {
          const response = await axios.post("http://localhost:8000/predict/single", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const analysisResult = response.data;
          const formatted = {
            id: crypto.randomUUID(),
            imageUrl: images[0].preview, // Use the preview URL for display
            label: analysisResult.classification.category,
            confidence: analysisResult.classification.confidence / 100, 
            timestamp: new Date().toISOString(),
            rawResult: analysisResult
          };
          formattedResults.push(formatted);
          rawResults.push(analysisResult);
      } else {
          const response = await axios.post("http://localhost:8000/predict/batch", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const batchData = response.data;
          
          batchData.individual_results.forEach((res: any, index: number) => {
              const formatted = {
                id: crypto.randomUUID(),
                imageUrl: images[index].preview, // Use the preview URL for display
                label: res.classification.category,
                confidence: res.classification.confidence / 100,
                timestamp: new Date().toISOString(),
                rawResult: res
              };
              formattedResults.push(formatted);
              rawResults.push(res);
          });
      }

      // Save all results
      for (const result of formattedResults) {
          await saveResult(result);
      }

      if (props.onComplete) {
        props.onComplete(formattedResults, rawResults);
      }
      
      setImages([]);
      setOpen(false);
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "업로드 중 문제가 발생했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="demoPage">
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Upload
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
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic"
                multiple
                hidden
                onChange={handleFilesSelected}
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
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 2,
            }}
          >
            {images.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ gridColumn: "1 / -1", textAlign: "center" }}
              >
                아직 업로드된 이미지가 없어요.
              </Typography>
            )}
            {images.map((item, index) => (
              <Box
                key={`${item.preview}-${index}`}
                sx={{
                  position: "relative",
                  borderRadius: 1,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={item.preview}
                  alt={`Uploaded ${index + 1}`}
                  style={{
                    width: "100%",
                    display: "block",
                    objectFit: "cover",
                    aspectRatio: "3 / 4",
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemoveImage(index)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.7)",
                    },
                  }}
                  aria-label="remove image"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
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


