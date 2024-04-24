git stash
git pull

chmod a+x start-update-production.sh

cp -n .env-example .env
docker build --tag mapp-leads-api-wrapper .
docker stop mapp-leads-api-wrapper
docker rm mapp-leads-api-wrapper
docker run -d  --log-driver none --name leadthing -v mapp-leads-api-wrapper
