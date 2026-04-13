FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY logotipo.png /usr/share/nginx/html/logotipo.png
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
