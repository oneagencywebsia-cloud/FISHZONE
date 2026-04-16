FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html
COPY logotipo.webp /usr/share/nginx/html/logotipo.webp
COPY logotipo.png /usr/share/nginx/html/logotipo.png
COPY logotipo-1024.webp /usr/share/nginx/html/logotipo-1024.webp
COPY logotipo-1024.png /usr/share/nginx/html/logotipo-1024.png
COPY img/ /usr/share/nginx/html/img/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
