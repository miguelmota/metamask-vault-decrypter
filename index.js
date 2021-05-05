const fs = require('fs')
const path = require('path')
const meow = require('meow')
const passworder = require('node-passworder')

const cli = meow(`
    Usage
      $ metamask-vault-decrypter <encrypted-vault-keystore> [flags]

    Options
      --password, -p  Password
      --password-list, -l  Password list file
`, {
  flags: {
    password: {
      type: 'string',
      alias: 'p'
    },
    passwordList: {
      type: 'string',
      alias: 'l'
    }
  }
})

if (process.stdin) {
  process.stdin.setEncoding('utf8')
  process.stdin.resume()
  let content = ''
  process.stdin.on('data', (buf) => {
    content += buf.toString()
  })
  setTimeout(() => {
    let vault = (content || '')
    const password = cli.flags.password || ''
    const passwordList = cli.flags.passwordList || ''

    if (!content) {
      const vaultFile = cli.input[0]
      if (vaultFile) {
        vault = fs.readFileSync(path.resolve(__dirname, vaultFile), 'utf8')
      }
    }

    run(vault, password, passwordList)
  }, 10)
} else {
  const vaultFile = cli.input[0]
  const password = cli.flags.password || ''
  const passwordList = cli.flags.passwordList || ''
  let vault = ''
  if (vaultFile) {
    vault = fs.readFileSync(path.resolve(__dirname, vaultFile), 'utf8')
  }

  run(vault, password, passwordList)
}

async function run (vault, password, passwordList) {
  vault = vault.trim()
  if (!vault) {
    console.log('vault input is required')
    process.exit(1)
  }

  try {
    let passwords = [password]
    if (passwordList) {
      const data = fs.readFileSync(path.resolve(__dirname, passwordList), 'utf8')
      try {
        passwords = JSON.parse(data.trim())
      } catch (err) {
        passwords = data.split('\n')
      }
    }
    const result = await decrypt(vault, passwords)
    if (passwords.length > 1) {
      console.log('password:', result.password)
      console.log('decrypted:')
    }
    console.log(JSON.stringify(result.decrypted, null, 2))
    process.exit(0)
  } catch (err) {
    console.log(err.message)
    process.exit(1)
  }
}

async function decrypt (vault, passwords) {
  vault = vault.trim().replaceAll('\\"', '"')
  for (const password of passwords) {
    try {
      const decrypted = await passworder.decrypt(password, vault)
      return { password, decrypted }
    } catch (err) {
      if (err.message !== 'Incorrect password') {
        throw err
      }
    }
  }

  throw new Error(`Incorrect password${passwords.length > 1 ? 's' : ''}`)
}
