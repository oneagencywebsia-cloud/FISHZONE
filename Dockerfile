FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html
COPY privacidad.html /usr/share/nginx/html/privacidad.html
COPY cookies.html /usr/share/nginx/html/cookies.html
COPY aviso-legal.html /usr/share/nginx/html/aviso-legal.html
COPY sobre-fishzone.html /usr/share/nginx/html/sobre-fishzone.html
COPY contacto.html /usr/share/nginx/html/contacto.html
COPY pesca-en-cordoba.html /usr/share/nginx/html/pesca-en-cordoba.html
COPY tiendas-de-pesca-en-cordoba.html /usr/share/nginx/html/tiendas-de-pesca-en-cordoba.html
COPY embalses-de-andalucia.html /usr/share/nginx/html/embalses-de-andalucia.html
COPY pesca-black-bass-andalucia.html /usr/share/nginx/html/pesca-black-bass-andalucia.html
COPY carpfishing-andalucia.html /usr/share/nginx/html/carpfishing-andalucia.html
COPY pesca-a-mosca-truchas-andalucia.html /usr/share/nginx/html/pesca-a-mosca-truchas-andalucia.html
COPY legal.css /usr/share/nginx/html/legal.css
COPY guia.css /usr/share/nginx/html/guia.css
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
