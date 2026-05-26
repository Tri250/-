// ============================================
// PawSync Pro - main.tsx
// 
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 应用入口文件
// ============================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/animations.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
