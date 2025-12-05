import MenuLayout from "./components/MenuLayout";
import { Box, createTheme, CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import Gallery from "./features/Gallery";

import Statistic from "./features/Statistic";
import Settings from "./features/Settings";
import { Navigate, Route, Routes } from "react-router-dom";
import { createContext, useMemo, useState, useEffect } from "react";

// Context for managing color mode
export type ColorMode = 'light' | 'dark' | 'system';
export const ColorModeContext = createContext({ 
  mode: 'system' as ColorMode,
  setColorMode: (_mode: ColorMode) => {} 
});

function App() {
  // 1. Get stored preference or default to 'system'
  const [modePreference, setModePreference] = useState<ColorMode>(() => {
    const stored = localStorage.getItem('colorMode');
    return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
  });

  // 2. Detect system preference
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // 3. Resolve effective mode
  const effectiveMode = useMemo(() => {
    if (modePreference === 'system') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return modePreference;
  }, [modePreference, prefersDarkMode]);

  // 4. Persist preference
  useEffect(() => {
    localStorage.setItem('colorMode', modePreference);
  }, [modePreference]);

  const colorMode = useMemo(
    () => ({
      mode: modePreference,
      setColorMode: (newMode: ColorMode) => {
        setModePreference(newMode);
      },
    }),
    [modePreference],
  );

  const theme = useMemo(
    () =>
      createTheme({
        typography: { fontFamily: `'Pretendard', system-ui, -apple-system, "Noto Sans KR", sans-serif` },
        palette: {
          mode: effectiveMode,
          background: {
            default: effectiveMode === 'light' ? "#f5f5f7" : "#1c1c1e",
            paper: effectiveMode === 'light' ? "#ffffff" : "#2c2c2e",
          },
          text: {
            primary: effectiveMode === 'light' ? "#000000" : "#ffffff",
            secondary: effectiveMode === 'light' ? "#666666" : "#ebebf5",
          }
        },
      }),
    [effectiveMode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MenuLayout>
          <Box sx={{ height: "100%" }}>
            <Routes>
              <Route path="/" element={<Navigate to="/gallery" replace />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/statistic" element={<Statistic />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/gallery" replace />} />
            </Routes>
          </Box>
        </MenuLayout>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App
