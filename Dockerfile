FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY logotipo-150-v3.webp /usr/share/nginx/html/logotipo-150-v3.webp
COPY logotipo-150-v3-pc.webp /usr/share/nginx/html/logotipo-150-v3-pc.webp
COPY logotipo-512-v3.webp /usr/share/nginx/html/logotipo-512-v3.webp
COPY logotipo-512-v3-pc.webp /usr/share/nginx/html/logotipo-512-v3-pc.webp
COPY logotipo-1024-v3.webp /usr/share/nginx/html/logotipo-1024-v3.webp
COPY logotipo-1024-v3-pc.webp /usr/share/nginx/html/logotipo-1024-v3-pc.webp
COPY img/ /usr/share/nginx/html/img/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
