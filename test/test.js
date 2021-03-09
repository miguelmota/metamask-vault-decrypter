const assert = require('assert')
const exec = require('child_process').execSync

const res = exec('bash -c "cat test/vault.txt | ./bin/metamask-vault-decrypter -p mysecretpassword"')

assert(res.toString().includes('mnemonic'), true)

try {
  exec('bash -c "cat test/vault.txt | ./bin/metamask-vault-decrypter -p invalidpassword"')
  assert.fail()
} catch (err) {
  assert(err.stdout.toString().includes('Incorrect password'), true)
}
console.log('pass')
