#!/usr/bin/env bash
if [ -d /home/ec2-user/tripity-server-release ]; then
  sudo rm -rf /home/ec2-user/tripity-server-release
fi
mkdir -vp /home/ec2-user/tripity-server-release