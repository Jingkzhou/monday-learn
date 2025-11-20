# Monday Learn

## 启动说明

### 后台服务 (Backend)

确保已安装 Python 3.12+ 和 MySQL。
kill -9 $(lsof -t -i:8000)

1.  进入 API 目录：
    ```bash
    cd monday-learn-api
    ```

2.  创建并激活虚拟环境（如果尚未创建）：
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  安装依赖：
    ```bash
    pip install -r requirements.txt
    ```

4.  **多环境配置**：
    项目支持 `dev` (默认), `sit`, `prod` 三种环境。
    请确保对应的配置文件存在：`.env.dev`, `.env.sit`, `.env.prod`。

5.  启动服务：
    *   **开发环境 (Dev)**:
        ```bash
        uvicorn main:app --reload
        ```
    *   **测试环境 (SIT)**:
        ```bash
        APP_ENV=sit uvicorn main:app --reload
        ```
    *   **生产环境 (Prod)**:
        ```bash
        APP_ENV=prod uvicorn main:app
        ```
    API 文档地址: http://localhost:8000/docs

### 前端服务 (Frontend)

确保已安装 Node.js (推荐 v18+)。

1.  进入 Web 目录：
    ```bash
    cd monday-learn-web
    ```

2.  安装依赖：
    ```bash
    npm install
    ```

3.  启动/构建：
    *   **本地开发**:
        ```bash
        npm run dev
        ```
        访问地址: http://localhost:5173
    *   **构建测试环境 (SIT)**:
        ```bash
        npm run build:sit
        ```
    *   **构建生产环境 (Prod)**:
        ```bash
        npm run build:prod
        ```