#!/usr/bin/env bash
rsync --delete-before --verbose --archive /home/ec2-user/tripity-server-release/ /home/ec2-user/tripity-server > /home/ec2-user/deploy.log
cd /home/ec2-user/tripity-server
npm install