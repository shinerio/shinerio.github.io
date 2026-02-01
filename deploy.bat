@echo off
REM One-click compile and deploy batch script for Obsidian Blog Generator
REM Usage: deploy.bat [-c config_file] [-d deploy_method]
REM Options:
REM   -c, --config: Specify the JSON configuration file (default: ./blog.config.json)
REM   -d, --deploy: Specify the deployment method (github, vercel, netlify, docker, local)

setlocal enabledelayedexpansion

REM Default values
set "CONFIG_FILE=./blog.config.json"
set "DEPLOY_METHOD=local"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :args_parsed
if "%~1"=="-c" (
    set "CONFIG_FILE=%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="--config" (
    set "CONFIG_FILE=%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="-d" (
    set "DEPLOY_METHOD=%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="--deploy" (
    set "DEPLOY_METHOD=%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="-h" (
    goto :show_help
)
if "%~1"=="--help" (
    goto :show_help
)
shift
goto :parse_args

:args_parsed

echo ===========================================
echo Obsidian Blog Generator - One-Click Deploy
echo Config file: %CONFIG_FILE%
echo Deploy method: %DEPLOY_METHOD%
echo ===========================================

REM Check if config file exists
if not exist "%CONFIG_FILE%" (
    echo Error: Config file '%CONFIG_FILE%' does not exist!
    echo Please create a configuration file first.
    exit /b 1
)

echo.✓ Configuration file found: %CONFIG_FILE%

REM Install dependencies
echo.📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo Error installing dependencies
    exit /b 1
)

REM Build the project
echo.🔨 Building the project...
call npm run build
if errorlevel 1 (
    echo Error building the project
    exit /b 1
)

REM Generate the blog
echo.📝 Generating blog from Obsidian vault...
npx obsidian-blog generate -c "%CONFIG_FILE%" -v
if errorlevel 1 (
    echo Error generating blog
    exit /b 1
)

echo.✅ Blog generation completed successfully!

REM Deployment based on method
if "%DEPLOY_METHOD%"=="github" goto :deploy_github
if "%DEPLOY_METHOD%"=="vercel" goto :deploy_vercel
if "%DEPLOY_METHOD%"=="netlify" goto :deploy_netlify
if "%DEPLOY_METHOD%"=="docker" goto :deploy_docker
if "%DEPLOY_METHOD%"=="local" goto :deploy_local

echo.⚠️  Unknown deployment method: %DEPLOY_METHOD%
echo.Available methods: github, vercel, netlify, docker, local
echo.Using local preview...
goto :deploy_local

:deploy_github
echo.🚀 Deploying to GitHub Pages...
REM Check if gh-pages is installed
call npm list -g gh-pages >nul 2>&1
if errorlevel 1 (
    echo.📦 Installing gh-pages...
    call npm install -g gh-pages
)

REM Create CNAME file if customDomain is specified in config
for /f "delims=" %%i in ('node -p "require('%CONFIG_FILE%').customDomain || ''" 2^>nul') do set CUSTOM_DOMAIN=%%i
if defined CUSTOM_DOMAIN (
    if not "!CUSTOM_DOMAIN!"=="" (
        echo.🌐 Creating CNAME file for custom domain: !CUSTOM_DOMAIN!
        echo.!CUSTOM_DOMAIN! > dist\CNAME
    )
)

REM Deploy to GitHub Pages
call gh-pages -d dist -b gh-pages -m "Deploy blog [skip ci]"
if errorlevel 1 (
    echo Error deploying to GitHub Pages
    exit /b 1
)
echo.✅ Deployed to GitHub Pages!
goto :end

:deploy_vercel
echo.🚀 Deploying to Vercel...
REM Check if vercel is installed
call vercel --version >nul 2>&1
if errorlevel 1 (
    echo.📦 Installing Vercel CLI...
    call npm install -g vercel
)
REM Deploy to Vercel
call vercel dist --prod
if errorlevel 1 (
    echo Error deploying to Vercel
    exit /b 1
)
echo.✅ Deployed to Vercel!
goto :end

:deploy_netlify
echo.🚀 Deploying to Netlify...
REM Check if netlify-cli is installed
call netlify --version >nul 2>&1
if errorlevel 1 (
    echo.📦 Installing Netlify CLI...
    call npm install -g netlify-cli
)
REM Deploy to Netlify
call netlify deploy --prod --dir=dist
if errorlevel 1 (
    echo Error deploying to Netlify
    exit /b 1
)
echo.✅ Deployed to Netlify!
goto :end

:deploy_docker
echo.🐳 Building and deploying with Docker...
REM Check if Docker is installed
call docker --version >nul 2>&1
if errorlevel 1 (
    echo.❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Create a temporary Dockerfile if it doesn't exist
if not exist "Dockerfile" (
    echo.📄 Creating temporary Dockerfile...
    echo.FROM node:18-alpine> Dockerfile.temp
    echo.>> Dockerfile.temp
    echo.WORKDIR /app>> Dockerfile.temp
    echo.>> Dockerfile.temp
    echo.COPY . .>> Dockerfile.temp
    echo.>> Dockerfile.temp
    echo.RUN npm install>> Dockerfile.temp
    echo.RUN npm run build>> Dockerfile.temp
    echo.RUN npm install -g obsidian-blog-generator>> Dockerfile.temp
    echo.>> Dockerfile.temp
    echo.EXPOSE 3000>> Dockerfile.temp
    echo.>> Dockerfile.temp
    echo.CMD ["sh", "-c", "obsidian-blog generate -c ${CONFIG_FILE:-./blog.config.json} ^&^& cd dist ^&^& npx serve -s -l 3000"]>> Dockerfile.temp
    set "DOCKERFILE=Dockerfile.temp"
) else (
    set "DOCKERFILE=Dockerfile"
)

REM Build Docker image
call docker build -t obsidian-blog-deploy .
if errorlevel 1 (
    echo Error building Docker image
    if exist Dockerfile.temp del Dockerfile.temp
    exit /b 1
)

REM Clean up temporary Dockerfile if created
if "!DOCKERFILE!"=="Dockerfile.temp" (
    del Dockerfile.temp
)

REM Run the container
echo.🏃 Starting Docker container...
call docker run -d -p 3000:3000 --name obsidian-blog-container obsidian-blog-deploy
if errorlevel 1 (
    echo Error running Docker container
    exit /b 1
)
echo.✅ Docker deployment running on http://localhost:8000
echo.Container name: obsidian-blog-container
echo.To stop: docker stop obsidian-blog-container
goto :end

:deploy_local
echo.🏠 Setting up local preview...
REM Check if http-server is installed
call http-server --version >nul 2>&1
if errorlevel 1 (
    echo.📦 Installing http-server...
    call npm install -g http-server
)
echo.✅ Local preview setup completed!
echo.Navigate to the dist directory and run 'http-server' to preview:
echo.  cd dist && http-server
echo.Or visit: http://localhost:8080 (default http-server port)
goto :end

:show_help
echo.One-click compile and deploy script for Obsidian Blog Generator
echo.
echo.Usage: %~nx0 [-c config_file] [-d deploy_method]
echo.Options:
echo.  -c, --config: Specify the JSON configuration file (default: ./blog.config.json)
echo.  -d, --deploy: Specify the deployment method (github, vercel, netlify, docker, local)
echo.
echo.Examples:
echo.  %~nx0                                  ^>^> Build and preview locally with default config
echo.  %~nx0 -c my-config.json               ^>^> Build with custom config and preview locally
echo.  %~nx0 -c my-config.json -d github     ^>^> Build and deploy to GitHub Pages
echo.  %~nx0 -c my-config.json -d vercel     ^>^> Build and deploy to Vercel
echo.  %~nx0 -c my-config.json -d netlify    ^>^> Build and deploy to Netlify
echo.  %~nx0 -c my-config.json -d docker     ^>^> Build and run in Docker container
exit /b 0

:end
echo.===========================================
echo.🎉 Deployment process completed!
echo.Config file used: %CONFIG_FILE%
echo.Deploy method: %DEPLOY_METHOD%
echo.===========================================