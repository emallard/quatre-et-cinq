rm -rf ~/zip2mp4
mkdir -p ~/zip2mp4
cp ~/Téléchargements/images.zip ~/zip2mp4/images.zip
rm ~/Téléchargements/images.zip
cd ~/zip2mp4
unzip images.zip
ffmpeg -framerate 30 -i 'img%04d.jpeg' -c:v libx264 -pix_fmt yuv420p ~/zip2mp4.mp4