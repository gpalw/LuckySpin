import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// 导入我们创建的页面
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kiosk from './pages/Kiosk';
import NotFound from './pages/NotFound';
import RouletteDetail from './pages/RouletteDetail';
import UserManagement from './pages/UserManagement';

/**
 * --- 私有路由 (守卫) ---
 * 这是一个包装组件，用于保护需要登录才能访问的页面。
 */
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  // 1. 检查 localStorage 是否有 token
  const token = localStorage.getItem('luckySpinToken');

  // 2. 判断
  if (token) {
    // 2a. 如果有 token, 允许访问子组件 (e.g., Dashboard)
    return <>{children}</>;
  } else {
    // 2b. 如果没有 token, 自动跳转到 /login 页面
    return <Navigate to="/login" replace />;
  }
};

/**
 * --- 应用主入口 ---
 * 定义所有的 URL 路径和它们对应的页面
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 路径 1: /login (登录页, 公开) */}
        <Route path="/login" element={<Login />} />

        {/* 路径 5: /roulette/:id (轮盘详情页, 私有) */}
        <Route
          path="/roulette/:id"
          element={
            <PrivateRoute>
              <RouletteDetail />
            </PrivateRoute>
          }
        />

        {/* 路径 2: /kiosk/:rouletteId (Kiosk页, 私有) */}
        {/* (例如 /kiosk/clxyz123) */}
        <Route
          path="/kiosk/:rouletteId"
          element={
            <PrivateRoute> {/* 用守卫包裹 */}
              <Kiosk />
            </PrivateRoute>
          }
        />

        {/* 路径 3: / (首页, 私有) */}
        {/* (这是 Admin 的后台管理主页) */}
        <Route
          path="/"
          element={
            <PrivateRoute> {/* 用守卫包裹 */}
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* 路径 6: /users (用户管理, 私有) */}
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UserManagement />
            </PrivateRoute>
          }
        />

        {/* 路径 4: * (404 页面) */}
        {/* 匹配所有其他未定义的路径 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;