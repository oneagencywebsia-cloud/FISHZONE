FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html
COPY logotipo.webp /usr/share/nginx/html/logotipo.webp
COPY logotipo.png /usr/share/nginx/html/logotipo.png
COPY img/ /usr/share/nginx/html/img/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
