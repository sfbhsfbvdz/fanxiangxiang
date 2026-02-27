# 饭否项目 - 开发差距分析报告

> 本文档对比 `architecture.md` 设计文档与实际实现的差距，列出待完成的功能。

---

## 📊 总体完成度

| 模块 | 设计 | 已实现 | 完成度 |
|------|------|--------|--------|
| 后端 API | 16 个接口 | 16 个接口 | ✅ 100% |
| 后端架构 | 6 层目录 | 4 层目录 | ⚠️ 67% |
| 前端 API 对接 | 5 个文件 | 1 个文件 | ❌ 20% |
| 前端 Hooks | 2 个 | 0 个 | ❌ 0% |
| 前端页面对接 | 6 个页面 | 0 个页面 | ❌ 0% |
| 共享类型 | 4 个文件 | 0 个文件 | ❌ 0% |
| 文档 | 3 个 | 1 个 | ⚠️ 33% |

---

## 🔴 未实现功能

### 1. 前端 API 层（最关键）

**现状**: 只有一个基础的 `client.ts`，前端页面仍在使用 mock 数据。

**缺失文件**:
```
client/src/api/
├── client.ts      ✅ 已有（但功能不完整）
├── auth.ts        ❌ 缺失 - 认证相关 API
├── restaurants.ts ❌ 缺失 - 餐厅相关 API
├── orders.ts      ❌ 缺失 - 订单相关 API
└── users.ts       ❌ 缺失 - 用户相关 API
```

**client.ts 需要增强**:
- ❌ JWT Token 自动附加到请求头
- ❌ Token 过期自动处理
- ❌ 统一错误处理
- ❌ 请求/响应拦截器

---

### 2. 前端 Hooks

**缺失文件**:
```
client/src/hooks/
├── useAuth.ts     ❌ 缺失 - 认证状态管理
└── useApi.ts      ❌ 缺失 - API 请求封装
```

**useAuth.ts 应包含**:
- 登录/注册/登出方法
- 当前用户状态
- Token 存储管理
- 认证状态检查

---

### 3. 前端页面对接

**所有页面仍使用 mock 数据，需要改造**:

| 页面 | 文件 | 需要对接的 API |
|------|------|----------------|
| 首页 | `Home.tsx` | `GET /api/restaurants` |
| 餐厅详情 | `RestaurantDetail.tsx` | `GET /api/restaurants/:id/menu` |
| 购物车 | `Cart.tsx` | `POST /api/orders` |
| 订单列表 | `Orders.tsx` | `GET /api/orders` |
| 个人中心 | `Profile.tsx` | `GET /api/users/profile`, 地址管理 |
| 支付成功 | `CheckoutSuccess.tsx` | 订单详情展示 |

**缺失页面**:
- ❌ 登录页面 (`Login.tsx`)
- ❌ 注册页面 (`Register.tsx`)
- ❌ 地址管理页面 (`AddressManage.tsx`)
- ❌ 订单详情页面 (`OrderDetail.tsx`)

---

### 4. 认证上下文

**缺失**: `client/src/context/AuthContext.tsx`

需要实现:
- 用户登录状态管理
- Token 持久化 (localStorage)
- 自动登录检查
- 路由守卫集成

---

### 5. 共享类型定义

**设计中有但未实现**:
```
shared/                    ❌ 整个目录缺失
└── types/
    ├── User.ts
    ├── Restaurant.ts
    ├── Order.ts
    └── ApiResponse.ts
```

**问题**: 前后端类型定义重复，不同步风险

---

### 6. 后端架构层缺失

**设计 vs 实际**:

| 目录 | 设计用途 | 实际状态 |
|------|----------|----------|
| `controllers/` | HTTP 请求处理 | ❌ 缺失，逻辑在 routes 中 |
| `models/` | 数据模型封装 | ❌ 缺失，直接用 SQL |
| `utils/jwt.ts` | JWT 工具函数 | ❌ 缺失，在 auth 中间件里 |
| `utils/logger.ts` | 日志工具 | ❌ 缺失 |
| `uploads/` | 文件上传目录 | ❌ 缺失 |

---

### 7. 支付服务

**设计中提到但未实现**:
- ❌ `PaymentService` - 支付接口对接
- ❌ 订单支付流程
- ❌ 支付状态回调

---

### 8. 文档

```
docs/
├── architecture.md   ✅ 已有
├── api.md            ❌ 缺失 - API 接口文档
└── deployment.md     ❌ 缺失 - 部署文档
```

---

## 🟡 部分实现

### 1. 数据库初始化脚本

**现状**: 数据库在服务启动时自动初始化，但缺少独立脚本。

```
server/scripts/
├── init-db.ts    ❌ 缺失
└── seed-db.ts    ❌ 缺失
```

**package.json 中有命令但脚本不存在**:
```json
"db:init": "tsx scripts/init-db.ts",
"db:seed": "tsx scripts/seed-db.ts"
```

---

### 2. 环境变量配置

**前端缺失**:
- ❌ `VITE_API_BASE_URL` 环境变量未配置
- ❌ Vite 代理配置（开发环境）

---

## 🟢 已完成

### 后端 API（全部完成）

| 模块 | 接口 | 状态 |
|------|------|------|
| 认证 | POST /api/auth/register | ✅ |
| 认证 | POST /api/auth/login | ✅ |
| 认证 | GET /api/auth/profile | ✅ |
| 餐厅 | GET /api/restaurants | ✅ |
| 餐厅 | GET /api/restaurants/:id | ✅ |
| 餐厅 | GET /api/restaurants/:id/menu | ✅ |
| 订单 | POST /api/orders | ✅ |
| 订单 | GET /api/orders | ✅ |
| 订单 | GET /api/orders/:id | ✅ |
| 订单 | PUT /api/orders/:id/cancel | ✅ |
| 用户 | GET /api/users/profile | ✅ |
| 用户 | PUT /api/users/profile | ✅ |
| 用户 | GET /api/users/addresses | ✅ |
| 用户 | POST /api/users/addresses | ✅ |
| 用户 | PUT /api/users/addresses/:id | ✅ |
| 用户 | DELETE /api/users/addresses/:id | ✅ |

### 数据库（全部完成）

- ✅ 7 张数据表设计与创建
- ✅ 初始数据填充（4 家餐厅，9 个菜品）
- ✅ 外键约束和索引

### 中间件（全部完成）

- ✅ JWT 认证中间件
- ✅ 参数校验中间件
- ✅ 统一错误处理

---

## 📋 建议开发优先级

### P0 - 必须完成（核心功能）

1. **前端 API 层完善**
   - 增强 `client.ts` (Token 处理)
   - 实现 `auth.ts`, `restaurants.ts`, `orders.ts`, `users.ts`

2. **认证功能**
   - 实现 `AuthContext.tsx`
   - 实现 `useAuth.ts` hook
   - 创建登录/注册页面

3. **页面对接后端**
   - `Home.tsx` → 餐厅列表 API
   - `RestaurantDetail.tsx` → 菜单 API
   - `Cart.tsx` → 创建订单 API
   - `Orders.tsx` → 订单列表 API

### P1 - 应该完成（完整体验）

4. **用户功能**
   - 地址管理页面
   - 个人资料编辑
   - 订单详情页

5. **Vite 配置**
   - API 代理配置
   - 环境变量

### P2 - 可以延后（优化项）

6. **代码优化**
   - 提取 shared 类型
   - 后端 controllers/models 分层
   - 日志系统

7. **文档补充**
   - API 文档
   - 部署文档

8. **支付功能**
   - 模拟支付流程
   - 订单状态流转

---

## 📁 需要创建的文件清单

```bash
# 前端 API
client/src/api/auth.ts
client/src/api/restaurants.ts
client/src/api/orders.ts
client/src/api/users.ts

# 前端 Hooks
client/src/hooks/useAuth.ts
client/src/hooks/useApi.ts

# 前端 Context
client/src/context/AuthContext.tsx

# 前端页面
client/src/pages/Login.tsx
client/src/pages/Register.tsx
client/src/pages/AddressManage.tsx
client/src/pages/OrderDetail.tsx

# 共享类型
shared/types/User.ts
shared/types/Restaurant.ts
shared/types/Order.ts
shared/types/ApiResponse.ts

# 后端脚本
server/scripts/init-db.ts
server/scripts/seed-db.ts

# 文档
docs/api.md
docs/deployment.md
```

---

## 总结

**后端**: API 已基本完成，可以使用。架构上缺少一些分层但不影响功能。

**前端**: 是最大的短板。页面 UI 已有，但完全没有对接后端 API，仍在使用 mock 数据。需要:
1. 完善 API 调用层
2. 实现认证流程
3. 改造所有页面使用真实 API

**建议**: 优先完成前端 API 对接工作，这是让系统真正可用的关键。
