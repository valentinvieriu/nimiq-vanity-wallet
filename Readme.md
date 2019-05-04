# Nimiq Vanity Wallet Generator

I've build this small app to be able to generate a custom Nimiq wallet using my a memoranble adress. This can be easy run offline on your computer.

The code is written in simple Javascript, no build process and no external libraries. We download some external dependencies from the official github repository, but we use no magic npm install.

You can choose how many Parallel Workers to use. The more Parallel Workers you choose, the faster the process of finding the right address is.

For the Wallet pattern you can use plain text or RegExp.

To build the project using Docker:

```bash
docker build -t nimiq-wallet .

```

Run a local web server and open the browser at [http://localhost:8080](http://localhost:8080)

```bash
docker run --name nimiq-wallet-nginx -d -p 8080:80 nimiq-wallet
```

To stop the container

``` bash
docker rm -f nimiq-wallet-nginx
```

You can run this project without Docker. First run `download.sh` to get all the external libraries and then choose your static server of your choice. You can use the built in static server from python : `cd src && python -m SimpleHTTPServer 8080`. You can see the app running at [http://localhost:8080](http://localhost:8080)