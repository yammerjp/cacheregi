const path = require('path')
const fs = require('fs').promises
const childProcess = require('child_process')
const run = (cmd) => new Promise((resolve, reject) => {
  console.log(`run command: ${cmd}`)
  childProcess.exec(cmd, (err, stdout, stderr) => {
    console.error(stderr)
    console.log(stdout)
    if (err) {
      reject()
    }
    resolve()
  })
})

const exec = (cmd) => new Promise((resolve, reject) => {
  childProcess.exec(cmd, (err, stdout, stderr) => {
    if (err) {
      reject(stderr)
    }
    resolve(stdout)
  })
})


async function fileExists(filepath) {
  try {
    return !!(await fs.lstat(filepath))
  } catch (e) {
    return false
  }
}
function version({version}) {
  console.log(version)
}

async function addPackageJsonToDistribution({name, workDir, dist, version}) {
  const packageJsonToDistribution = JSON.stringify({name, version}, null, '  ')
  const pathToWrite = path.join(workDir, dist, 'package.json')
  if (await fileExists(pathToWrite)) {
    return Promise.reject(new Error('package.json already exists'))
  }
  await fs.writeFile(pathToWrite, packageJsonToDistribution)
}

async function build({workDir}) {
  return run(`
    cd ${workDir} && \
    npm install && \
    npm run build
  `)
}

function publish({workDir, dist, registry}) {
  return run(`
    cd ${workDir} && \
    npm publish ./${dist} --access=restricted --registry=${registry}
  `)
}

function validateNotAnyChange({workDir}) {
  return exec(`
    cd ${workDir} && \
    git diff HEAD --exit-code -s
  `).then(() => true).catch(() => false)
}

function resetDist({workDir, dist}) {
  return run(`
    cd ${workDir} && \
    rm -rf ${dist}
  `)
}

async function isAlreadyPublished({workDir, name, version, registry}) {
  return exec(`
    cd ${workDir} && \
    npm install ${name}@${version} --registry=${registry} --dry-run
  `).then(() => true).catch(() => false)
}

async function store(config) {
  if (!await validateNotAnyChange(config)) {
    return Promise.reject(new Error('find diff'))
  }
  await resetDist(config)
  await build(config)
  await addPackageJsonToDistribution(config)
  if (isAlreadyPublished(config)) {
    console.log('already published')
    return false
  }
  await publish(config)
    console.log('published successfuly')
}

async function restore(config) {
  if (!await validateNotAnyChange(config)) {
    return Promise.reject(new Error('find diff'))
  }
  await resetDist(config)
  await install(config).catch(() => {
    build(config)
  })
}

function install({workDir, name, version, dist, registry}) {
  return run(`
    cd ${workDir} && \
    rm -rf ${dist} &&
    mkdir -p ${dist} \
    npm uninstall ${name} && \
    npm install ${name}@${version} --registry=${registry} && \
    rm -f node_modules/${name}/package.json && \
    cp -r node_modules/${name} ${dist}
  `)
}

exports.version = version
exports.build = build
exports.publish = publish
exports.install = install
exports.store = store
exports.restore = restore


