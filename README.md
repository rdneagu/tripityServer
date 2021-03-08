# node.js Tripity server

## Installing the server

Run `npm install` from the root folder which will install all the required dependencies.

## Configuring and running the server

The server requires `pm2` npm module and can be installed using `npm install -g pm2`

[Full documentation for the pm2 module](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)

### General pm2 commands

pm2 command | command details
----------- | -------------
`pm2 start ecosystem.config.js` | Starts the server using the ecosystem config found at `ecosystem.config.js`
`pm2 stop tripity-server` | Stops a running pm2 process, in this case `tripity-server` is specified  
`pm2 restart tripity-server` | Restarts a running pm2 process, in this case `tripity-server` is specified  
`pm2 reload tripity-server` | Does the same as restart  
`pm2 delete tripity-server` | Removes the pm2 process from the list  
`pm2 startup` | Generates a startup script to run when the server boots up, running it once should suffice  
`pm2 list` | Lists all the pm2 processes including various information such as the uptime, amount of restarts, process id, etc.
`pm2 save` | Freezes the process list for automatic respawn, required when you want all the process in the list to start on server boot
`pm2 logs tripity-server` | Shows the logs related to the `tripity-server` process. Note that specifying the `--lines <number>` option will only display X lines from the log

### Automatic restart of the server when application changes

Adding the `--watch` switch to the `pm2 start` command will watch the files and restart when any of them are changed. The `--ignore-watch="node_modules"` option is required with the `--watch` option since we don't need the server to restart whenever we install a new npm module but only when the source files are changed  

Example: `pm2 start ecosystem.config.js --watch --ignore-watch="node_modules"`

### Limiting the amount of space the logs take up on the disk

To make sure the disk does not run out of space due to logs accumulating over time, pm2 supports a module called pm2-logrotate which can be installed with `pm2 install pm2-logrotate`

[pm2 logrotate configuration documentation](https://github.com/pm2-hive/pm2-logrotate#configure)

Log rotation can be executed through the command line by using `pm2 reloadLogs` or by sending a `SIGUSR2` signal to the pm2 process.

### Changing env variables

Changing env variables can be done through the ecosystem config file (`ecosystem.config.js`). Details on how the environmnent variables work within the pm2 ecosystem config can be found [here](https://pm2.keymetrics.io/docs/usage/environment/)

## Running the server on AWS

AWS services **EC2**, **CodePipeline**, **IAM**, **RDS** and general code building knowledge is required and it will not be explained in this section. Briefly:

1. Create an EC2 instance named `tripity-server`
2. Create an AWS CodeDeploy application that allows deployment to our EC2 instance
3. Create an AWS CodePipeline with source set to this repository and master branch
4. Skip the CodeBuild stage
5. Use the AWS CodeDeploy application you created in step 2
6. Create an RDS instance
7. The `appspec.yml` file required is already created including the scripts that will automatically execute on the ec2 instance.

## Database configuration

The table schema can be found in: [/lib/db/tables.js](/lib/db/tables.js)

The database config and connection details which **must** be changed based on your RDS instance is found here: [/lib/db/config.js](/lib/db/config.js)

### Adding more tables, changing table fields

Adding or changing the tables can be done through the [/lib/db/tables.js](/lib/db/tables.js) file.

Any modification requires schema recreation which can be done by changing the `drop` flag on line 29 in [/lib/db/config.js](/lib/db/config.js) to **true** and starting/restarting the server. The change will cause the database to drop all the tables and create them from scratch. Remember to change the flag back to **false** so your database is not purged and recreated on every restart.
