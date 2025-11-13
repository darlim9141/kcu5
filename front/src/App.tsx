import MenuLayout from './components/MenuLayout'
import { Box } from '@mui/material'
import Gallery from './features/Gallery'

function App() {

  return (
    <MenuLayout>
      <Box>
        <Gallery />
      </Box>
    </MenuLayout>
  )
}

export default App
