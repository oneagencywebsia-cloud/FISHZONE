FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html
COPY logotipo.webp /usr/share/nginx/html/logotipo.webp
COPY logotipo.png /usr/share/nginx/html/logotipo.png
COPY logotipo-512.webp /usr/share/nginx/html/logotipo-512.webp
COPY logotipo-512.png /usr/share/nginx/html/logotipo-512.png
COPY logotipo-1024.webp /usr/share/nginx/html/logotipo-1024.webp
COPY logotipo-1024.png /usr/share/nginx/html/logotipo-1024.png
COPY logotipo-2048.webp /usr/share/nginx/html/logotipo-2048.webp
COPY logotipo-2048.png /usr/share/nginx/html/logotipo-2048.png
COPY logotipo-v3.webp /usr/share/nginx/html/logotipo-v3.webp
COPY logotipo-v3.png /usr/share/nginx/html/logotipo-v3.png
COPY logotipo-512-v3.webp /usr/share/nginx/html/logotipo-512-v3.webp
COPY logotipo-512-v3.png /usr/share/nginx/html/logotipo-512-v3.png
COPY logotipo-1024-v3.webp /usr/share/nginx/html/logotipo-1024-v3.webp
COPY logotipo-1024-v3.png /usr/share/nginx/html/logotipo-1024-v3.png
COPY logotipo-2048-v3.webp /usr/share/nginx/html/logotipo-2048-v3.webp
COPY logotipo-2048-v3.png /usr/share/nginx/html/logotipo-2048-v3.png
COPY img/ /usr/share/nginx/html/img/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
