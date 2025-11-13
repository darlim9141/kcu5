import { forwardRef, useMemo, useRef, useState, type ChangeEvent } from "react";
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

const MAX_FILES = 4;

const Upload = forwardRef<HTMLDivElement>((_props, ref) => {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const remainingSlots = useMemo(() => MAX_FILES - images.length, [images.length]);

  const readFileAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleClickOpen = () => {
    setOpen(true);
    setError(null);
  };
  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (!fileList.length) return;
    if (remainingSlots <= 0) {
      setError("최대 4장까지 업로드할 수 있어요.");
      return;
    }

    const usableFiles = fileList.slice(0, remainingSlots);
    if (usableFiles.length < fileList.length) {
      setError("한 번에 최대 4장까지만 저장돼요.");
    } else {
      setError(null);
    }

    try {
      const nextImages = await Promise.all(usableFiles.map(readFileAsDataURL));
      setImages((prev) => [...prev, ...nextImages]);
    } catch {
      setError("파일을 읽어오지 못했어요. 다시 시도해 주세요.");
    }
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
    images.forEach((src, index) => {
      const file = dataUrlToFile(src, `photo-${index + 1}.png`);
      formData.append("files", file);
    });

    try {
      // TODO: Connect to backend API once available.
      // 예시) FastAPI 엔드포인트로 FormData 전달
      /*
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("이미지를 업로드하지 못했습니다.");
      }
      const resultPayload = await response.json();
      navigate("/results", { state: { results: resultPayload } });
      */

      // 임시: 선택된 이미지를 그대로 넘겨서 Results에서 확인.
      const mockedResults = images.map((src, index) => ({
        id: `temp-${index}`,
        imageUrl: src,
        label: "분석 대기",
        confidence: 0,
      }));
      navigate("/results", { state: { results: mockedResults } });
      setImages([]);
      setOpen(false);
    } catch (uploadError) {
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
    <div className="demoPage" ref={ref}>
      <Button variant="outlined" onClick={handleClickOpen}>
        Add Photo(s)
      </Button>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFilesSelected}
          />
          <Button
            variant="contained"
            onClick={() => fileInputRef.current?.click()}
            disabled={remainingSlots <= 0}
          >
            {remainingSlots > 0
              ? `이미지 선택 (최대 ${remainingSlots}장 추가 가능)`
              : "최대 4장까지 저장됩니다"}
          </Button>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
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
            {images.map((src, index) => (
              <Box
                key={`${src}-${index}`}
                sx={{
                  position: "relative",
                  borderRadius: 1,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={src}
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

function dataUrlToFile(dataUrl: string, filename: string) {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1] ?? "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
