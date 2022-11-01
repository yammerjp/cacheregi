const childProcess = require('child_process')
const path = require('path')
const fs = require('fs').promises

const crypto = require('crypto');
const shasum = crypto.createHash('sha1');

const sha1sum = (sourceString) => {
  shasum.update(sourceString);
  return shasum.digest('hex');
}

const exec = (cmd) => new Promise((resolve, reject) => {
  childProcess.exec(cmd, (err, stdout, stderr) => {
    if (err) {
      reject(stderr)
    }
    resolve(stdout)
  })
})

async function getPackageJson(workDir) {
  const packageJsonFullPath = path.join(workDir, 'package.json')
  const packageJsonString = await fs.readFile(packageJsonFullPath)
  return packageJson = JSON.parse(packageJsonString)
}

async function setupConfig(packagePath) {
  const workDir = path.resolve(packagePath)
  const packageJson = await getPackageJson(workDir)
  const dependencies = Array.from(new Set([...(packageJson.cacheregi.dependencies), './']))
  return {
    workDir,
    name: `@${packageJson.cacheregi.scope}/${packageJson.cacheregi.name}`,
    version: `${packageJson.version}-${await versionHash({workDir, dependencies})}`,
    dist: packageJson.cacheregi.distribution,
    registry: packageJson.cacheregi.registry,
    dependencies
  }
}

async function versionHash({workDir, dependencies}) {
  const revParseArgs = dependencies.map(d => `HEAD:${d}`).join(' ')
  const stdout = await exec(`
    cd ${workDir} && \
    git rev-parse ${revParseArgs}
  `)
  return sha1sum(stdout)
}

exports.setupConfig = setupConfig
