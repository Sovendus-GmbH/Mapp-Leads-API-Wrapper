# Mapp Leads API Wrapper

This is a wrapper API to create and subscribe a contact to the MAPP API

## Run it in production

### 1. Clone the Repository

Execute the following command in the folder where you want to install it:

```bash
git clone https://github.com/Sovendus-GmbH/Mapp-Leads-API-Wrapper
cd Mapp-Leads-API-Wrapper
```

### 2. Create the .env file

You can copy the .env-example but make sure to change the API_KEY to something different

```bash
cp -n .env-example .env
```

### 3. Run the app with Docker

Execute the following commands to build and run the docker container.

```bash
docker build --tag mapp-leads-api-wrapper .
docker run -d  --log-driver none --name leadthing -v mapp-leads-api-wrapper
```

### 4. Setup access and HTTPS

Note that the APP runs on port 3000 but with the above command it wont be accessible from the outside.
It is recommended to use something like [caddy](https://caddyserver.com/docs/automatic-https), to handle HTTPS and attach the API wrapper to the caddy internal docker network to forward HTTPS encrypted requests to the api wrapper docker container
