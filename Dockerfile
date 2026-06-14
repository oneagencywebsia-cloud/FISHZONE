FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY site.webmanifest /usr/share/nginx/html/site.webmanifest
COPY og-image.jpg /usr/share/nginx/html/og-image.jpg
COPY favicon.ico /usr/share/nginx/html/favicon.ico
COPY favicon-16x16.png /usr/share/nginx/html/favicon-16x16.png
COPY favicon-32x32.png /usr/share/nginx/html/favicon-32x32.png
COPY favicon-192x192.png /usr/share/nginx/html/favicon-192x192.png
COPY favicon-512x512.png /usr/share/nginx/html/favicon-512x512.png
COPY apple-touch-icon.png /usr/share/nginx/html/apple-touch-icon.png
COPY logotipo-150-v3.webp /usr/share/nginx/html/logotipo-150-v3.webp
COPY logotipo-150-v3-pc.webp /usr/share/nginx/html/logotipo-150-v3-pc.webp
COPY logotipo-512-v3.webp /usr/share/nginx/html/logotipo-512-v3.webp
COPY logotipo-512-v3-pc.webp /usr/share/nginx/html/logotipo-512-v3-pc.webp
COPY logotipo-1024-v3.webp /usr/share/nginx/html/logotipo-1024-v3.webp
COPY logotipo-1024-v3-pc.webp /usr/share/nginx/html/logotipo-1024-v3-pc.webp
COPY img/ /usr/share/nginx/html/img/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
