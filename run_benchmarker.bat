@echo off
cd /d "C:\Users\const\Desktop\BpR"
call C:\Users\const\miniconda3\Scripts\activate.bat base
python benchmarker.py >> "C:\Users\const\Desktop\BpR\benchmarker_log.txt" 2>&1
