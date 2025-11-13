import { Box, Button, Card, CardContent, CardMedia, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  label: string;
  confidence: number;
  description?: string;
}

interface LocationState {
  results?: AnalysisResult[];
}

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? {};
  const results = state.results ?? [];

  const handleBack = () => {
    navigate("/gallery");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: { xs: 2, md: 4 },
        minHeight: "100%",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={700}>
          분석 결과
        </Typography>
        <Button variant="outlined" onClick={handleBack}>
          갤러리로 돌아가기
        </Button>
      </Stack>

      {results.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Typography color="text.secondary">
            표시할 결과가 없습니다. 갤러리에서 이미지를 업로드해 주세요.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {results.map((item) => (
            <Card key={item.id} sx={{ display: "flex", flexDirection: "column" }}>
              <CardMedia
                component="img"
                height={220}
                image={item.imageUrl}
                alt={item.label}
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                  {item.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  신뢰도: {(item.confidence * 100).toFixed(1)}%
                </Typography>
                {item.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {item.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
