#!/usr/bin/env node

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const subCommands = require('./subCommands')
const { setupConfig } = require('./setup')

async function main() {
  const config = await setupConfig(argv.package)

  const subCommand = argv._[0]
  switch (subCommand) {
    case 'version':
      subCommands.version(config)
      break
    case 'build':
      subCommands.build(config)
      break
    case 'publish':
      subCommands.publish(config)
      break
    case 'install':
      subCommands.install(config)
      break
    case 'store':
      subCommands.store(config)
      break
    case 'restore':
      subCommands.restore(config)
      break
  }
}
main()
