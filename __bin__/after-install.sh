#!/usr/bin/env bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

sudo rsync --delete-before --verbose --archive /home/ec2-user/tripity-server-release/ /home/ec2-user/tripity-server > /home/ec2-user/deploy.log
cd /home/ec2-user/tripity-server
sudo npm install