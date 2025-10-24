import { BrowserRouter, Route, Routes } from 'react-router-dom'
import InboxList from './pages/InboxList'
import EmailView from './pages/EmailView'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InboxList />} />
        <Route path="/email/:id" element={<EmailView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
