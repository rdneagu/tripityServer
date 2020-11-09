#!/usr/bin/env bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

rsync --delete-before --verbose --archive /home/ec2-user/tripity-server-release/ /home/ec2-user/tripity-server > /var/log/deploy.log
cd /home/ec2-user/tripity-server
npm install