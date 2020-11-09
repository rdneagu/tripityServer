#!/usr/bin/env bash
rsync --verbose --archive /home/ec2-user/tripity-server-release/ /home/ec2-user/tripity-server/ > /home/ec2-user/deploy.log
rm -rf /home/ec2-user/tripity-server-release
cd /home/ec2-user/tripity-server
npm install