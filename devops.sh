#!/bin/bash

docker buildx build --platform linux/amd64 -t deadlock-pro:latest --load .
docker save deadlock-pro:latest | gzip > deadlock-pro-image.tar.gz
scp -i ~/.ssh/scrimlock-key.pem deadlock-pro-image.tar.gz docker-compose.prod.yml .env.production ubuntu@44.204.175.239:/opt/deadlock-pro/
