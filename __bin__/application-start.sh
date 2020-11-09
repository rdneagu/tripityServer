#!/usr/bin/env bash
cd /home/ec2-user/tripity-server
pm2 start ecosystem.config.js --env production