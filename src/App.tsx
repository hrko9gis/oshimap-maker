import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectSettingsPage } from './pages/ProjectSettingsPage'
import { SpotListPage } from './pages/SpotListPage'
import { SpotEditorPage } from './pages/SpotEditorPage'
import { ExportPage } from './pages/ExportPage'
import { PublishCheckPage } from './pages/PublishCheckPage'
import { PreviewPage } from './pages/PreviewPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/:projectId" element={<SpotListPage />} />
        <Route path="/:projectId/settings" element={<ProjectSettingsPage />} />
        <Route path="/:projectId/spots" element={<SpotEditorPage />} />
        <Route path="/:projectId/spots/:spotId" element={<SpotEditorPage />} />
        <Route path="/:projectId/spots/:spotId/publish-check" element={<PublishCheckPage />} />
        <Route path="/:projectId/preview" element={<PreviewPage />} />
        <Route path="/:projectId/export" element={<ExportPage />} />
      </Routes>
    </BrowserRouter>
  )
}
