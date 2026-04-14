FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html
COPY logotipo.png /usr/share/nginx/html/logotipo.png
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
