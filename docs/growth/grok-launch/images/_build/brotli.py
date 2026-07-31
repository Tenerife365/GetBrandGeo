"""Shim: fontTools.ttLib.woff2 only needs brotli.decompress. Node 24 ships
brotliDecompressSync in core zlib, so route through node instead of a wheel."""
import subprocess, tempfile, os

def decompress(data):
    with tempfile.TemporaryDirectory() as d:
        i = os.path.join(d, "in.br"); o = os.path.join(d, "out.bin")
        with open(i, "wb") as f: f.write(data)
        js = (
            "const z=require('zlib'),fs=require('fs');"
            "fs.writeFileSync(process.argv[2], z.brotliDecompressSync(fs.readFileSync(process.argv[1])));"
        )
        subprocess.run(["node", "-e", js, i, o], check=True,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        with open(o, "rb") as f: return f.read()

def compress(data, quality=11):
    raise NotImplementedError
