#!/usr/bin/env node
const fs = require('fs/promises');


const deployPath = './deploy'
const buildPath = './dist'

const dirExists = async (path) => {
    let exists = false;

    try {
        await fs.access(path)

        exists = true;
    } catch {
        console.log(`${path} does not exist`);
    }

    return exists;
}

const execShellCommand = async (cmd) => {
    const { exec } = require('child_process');

    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if(error) {
                console.warn(error);
            }

            resolve(stdout ? stdout : stderr);
        });
    });
}

const main = async () => {
    console.log('Deploying...');

    // print process.argv
    console.log('ARGS:')
    process.argv.forEach(function (val, index, array) {
        console.log(index + ': ' + val);
    });

    console.log('\n');

    if(process.argv.length !== 3) {
        console.log('Incorrect number of arguments\nexpected: 3 received: ', process.argv.length);
        return;
    }

    const packageName = process.argv[2];

    // Check if build dir is available
    const hasBuild = await dirExists(buildPath)
    
    if (!hasBuild) {
        console.log('Failed to deploy, please ensure build has been run. (npm run build)');
        return;
    }

    // create 'deploy' directory if it doesn't exist
    const hasDeploy = await dirExists(deployPath);

    if (!hasDeploy) {
        console.log('Deployment directory does not exist, creating...');
        await fs.mkdir(deployPath);
    }

    // copy package.json and package-lock.json and .env into deploy directory
    console.log(`copying files to deployment dir...`);

    await fs.copyFile('./package.json', `${deployPath}/package.json`);
    await fs.copyFile('./package-lock.json', `${deployPath}/package-lock.json`);
    await fs.copyFile('./.env', `${deployPath}/.env`);

    // copy index.js into 'deploy' directory
    const fullBuildPath = `${buildPath}/${packageName}`;

    await fs.copyFile(`${fullBuildPath}/index.js`, `${deployPath}/index.js`);

    console.log('Running npm install...')
    const npmInstallOutput = await execShellCommand(`cd ${deployPath} && npm i --omit=dev`);

    console.log(npmInstallOutput);
    console.log('\nZipping files...');

    const zipOutput = await execShellCommand(`cd ${deployPath} && zip -r ../deploy-${packageName}.zip .`);

    console.log(zipOutput);
    console.log(`\nDeployment package is ready for upload, can be found at ./deploy-${packageName}.zip`);

};

main();