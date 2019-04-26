FROM nginx
WORKDIR /usr/share/nginx/html
COPY ./download.sh /usr/share/nginx/html
RUN apt-get update && \
  apt-get install curl -y && \
  ./download.sh && rm ./download.sh && \
  apt-get remove curl -y && apt autoremove -y
COPY ./src /usr/share/nginx/html/src
COPY ./index.html /usr/share/nginx/html