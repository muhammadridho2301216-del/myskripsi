import '../tests/helpers/nuxtGlobalsShim'
import assert from 'node:assert/strict'
import test from 'node:test'
import { assertSafePublicEndpoint } from '../server/utils/network/safeEndpoint'

/**
 * Exercises the REAL safeEndpoint.ts implementation (not a reimplementation)
 * against every category SUBTASK-11.07 calls for. This is the part of
 * "SSRF protection" that can be fully verified without any external
 * credentials — see tests/helpers/nuxtGlobalsShim.ts for how `createError`
 * is bridged outside a Nuxt runtime.
 */

async function expectBlocked(url: string, messageContains?: string) {
  await assert.rejects(
    () => assertSafePublicEndpoint(url),
    (error: any) => {
      if (messageContains) assert.ok(
        String(error.statusMessage ?? error.message).includes(messageContains),
        `expected "${url}" rejection to mention "${messageContains}", got: ${error.statusMessage ?? error.message}`,
      )
      return true
    },
  )
}

async function expectAllowed(url: string) {
  const result = await assertSafePublicEndpoint(url)
  assert.equal(result.toString(), url)
}

test('SSRF: enforces HTTPS-only scheme policy', async () => {
  await expectBlocked('http://example.com/x', 'HTTPS')
  await expectBlocked('ftp://example.com/x', 'HTTPS')
  await expectBlocked('file:///etc/passwd', 'HTTPS')
})

test('SSRF: blocks loopback and localhost by name and literal IP', async () => {
  await expectBlocked('https://localhost/x')
  await expectBlocked('https://127.0.0.1/x')
  await expectBlocked('https://127.1.2.3/x')
  await expectBlocked('https://[::1]/x')
})

test('SSRF: blocks RFC1918 private ranges', async () => {
  await expectBlocked('https://10.0.0.5/x')
  await expectBlocked('https://172.16.0.1/x')
  await expectBlocked('https://172.31.255.255/x')
  await expectBlocked('https://192.168.1.1/x')
  // 172.15/172.32 are NOT private — only 172.16-172.31 is.
  await expectAllowed('https://172.32.0.1/x').catch(() => {
    throw new Error('172.32.0.1 is public and must not be blocked as private')
  })
})

test('SSRF: blocks link-local and cloud metadata ranges by literal IP', async () => {
  await expectBlocked('https://169.254.169.254/latest/meta-data', 'jaringan privat')
  await expectBlocked('https://169.254.0.1/x')
})

test('SSRF: blocks the well-known cloud metadata hostname', async () => {
  await expectBlocked('https://metadata.google.internal/x', 'lokal atau internal')
})

test('SSRF: blocks .local/.internal/.localhost suffixes regardless of casing', async () => {
  await expectBlocked('https://printer.local/x')
  await expectBlocked('https://db.internal/x')
  await expectBlocked('https://FOO.LOCALHOST/x')
})

test('SSRF: rejects URLs carrying embedded credentials', async () => {
  await expectBlocked('https://user:pass@example.com/x', 'Kredensial')
  await expectBlocked('https://attacker.com@example.com/x', 'Kredensial')
})

test('SSRF: rejects multicast and reserved IPv4 ranges (>= 224.x)', async () => {
  await expectBlocked('https://224.0.0.1/x')
  await expectBlocked('https://240.0.0.1/x')
})

test('SSRF: rejects IPv6 unique-local and link-local ranges', async () => {
  await expectBlocked('https://[fc00::1]/x')
  await expectBlocked('https://[fd12:3456::1]/x')
  await expectBlocked('https://[fe80::1]/x')
})

test('SSRF: rejects malformed URLs instead of throwing an unhandled exception', async () => {
  await expectBlocked('not a url at all')
  await expectBlocked('')
})

test('SSRF: allows a normal public HTTPS API endpoint through unchanged', async () => {
  await expectAllowed('https://api.openai.com/v1')
  await expectAllowed('https://api.anthropic.com/v1')
})

test('SSRF: 100.64.0.0/10 (carrier-grade NAT, used by some cloud metadata proxies) is blocked', async () => {
  await expectBlocked('https://100.100.100.200/x')
})
