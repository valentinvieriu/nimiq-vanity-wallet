FROM nginx
COPY . /app
WORKDIR /app
RUN apt-get update && \
  apt-get install curl -y && \
  ./download.sh && cp -r src/* /usr/share/nginx/html   && \
  apt-get remove curl -y && apt autoremove -y