#!/usr/bin/env bash
EB_ENV=$(/opt/elasticbeanstalk/bin/get-config environment -k APP_DOMAIN)
sudo certbot -n -d $EB_ENV --nginx --agree-tos --email arvind@consolelabs.in
