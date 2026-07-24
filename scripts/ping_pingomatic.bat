@echo off
REM Ping Pingomatic after publishing a new BrandGEO article or news post.
REM Usage:  ping_pingomatic.bat "<Title>" "<Full Live URL>"
REM Example: ping_pingomatic.bat "GEO vs SEO: The Fundamental Difference" "https://getbrandgeo.com/bg-005.html"
REM See pingomatic_ping.py for full docs, --dry-run, and --name options.
python "%~dp0pingomatic_ping.py" %*
