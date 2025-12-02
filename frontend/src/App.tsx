import MenuLayout from "./components/MenuLayout";
import { Box } from "@mui/material";
import Gallery from "./features/Gallery";

import Statistic from "./features/Statistic";
import Settings from "./features/Settings";
import { Navigate, Route, Routes } from "react-router-dom";

function App() {

  return (
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
  )
}

export default App
