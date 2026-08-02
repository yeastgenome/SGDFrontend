// Uploads the built static assets to S3 under a fresh random prefix and rewrites
// production_asset_url.json so the app points CloudFront at the new prefix.
// Replaces the grunt-aws `s3` task + `uploadToS3` (which pulled in the vulnerable
// aws-sdk v2). Uses only node built-ins (crypto + https) with a hand-rolled AWS
// Signature V4 -- no dependencies, so it adds zero new vulnerability surface.
//
//   node build/upload_s3.mjs            # upload
//   node build/upload_s3.mjs --dry-run  # list what would upload, no writes
//
// Credentials come from the environment (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY,
// optionally AWS_SESSION_TOKEN), set by prod.sh -- same as before.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_DIR = path.join(ROOT, 'src/sgd/frontend/yeastgenome/static');
const BUCKET = 'sgd-prod-assets';
const REGION = 'us-west-2';
const HOST = `${BUCKET}.s3.${REGION}.amazonaws.com`;
const CLOUDFRONT_ROOT = 'https://d1x6jdqbvd5dr.cloudfront.net/';
const CACHE_CONTROL = 'max-age=2629740, public'; // ~1 month; safe because each deploy uses a new prefix

const dryRun = process.argv.includes('--dry-run');

const CONTENT_TYPES = {
  '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.map': 'application/json', '.html': 'text/html',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject', '.otf': 'font/otf',
  '.txt': 'text/plain', '.xml': 'application/xml',
};

const sha256hex = (data) => crypto.createHash('sha256').update(data).digest('hex');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
// RFC3986 encoding for each path segment ('/' is kept as the separator).
const encodeSegment = (s) =>
  encodeURIComponent(s).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

function putObject({ key, body, contentType, accessKeyId, secretAccessKey, sessionToken }) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = '/' + key.split('/').map(encodeSegment).join('/');
  const payloadHash = sha256hex(body);

  const headers = {
    'cache-control': CACHE_CONTROL,
    'content-type': contentType,
    host: HOST,
    'x-amz-acl': 'public-read', // CloudFront serves these anonymously (matches grunt-aws)
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (sessionToken) headers['x-amz-security-token'] = sessionToken;

  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort().map((h) => `${h}:${headers[h]}\n`).join('');
  const canonicalRequest = ['PUT', canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

  const scope = `${dateStamp}/${REGION}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n');
  const kDate = hmac('AWS4' + secretAccessKey, dateStamp);
  const signature = hmac(hmac(hmac(hmac(kDate, REGION), 's3'), 'aws4_request'), stringToSign);
  const signatureHex = Buffer.isBuffer(signature) ? signature.toString('hex') : signature;

  headers.Authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      { method: 'PUT', host: HOST, path: canonicalUri, headers: { ...headers, 'content-length': body.length } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () =>
          res.statusCode === 200 ? resolve() : reject(new Error(`S3 ${res.statusCode} for ${key}: ${data.slice(0, 300)}`))
        );
      }
    );
    req.on('error', reject);
    req.end(body);
  });
}

function walk(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (!entry.name.endsWith('.jinja2')) out.push(path.relative(base, full));
  }
  return out;
}

const prefix = crypto.randomBytes(10).toString('hex');
const files = walk(STATIC_DIR);
console.log(`${dryRun ? '[dry-run] ' : ''}prefix=${prefix}  files=${files.length}  bucket=${BUCKET}`);

if (dryRun) {
  files.slice(0, 10).forEach((f) => console.log('  would put', `${prefix}/${f}`));
  if (files.length > 10) console.log(`  ...and ${files.length - 10} more`);
  process.exit(0);
}

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const sessionToken = process.env.AWS_SESSION_TOKEN;
if (!accessKeyId || !secretAccessKey) {
  console.error('missing AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (source prod.sh first)');
  process.exit(1);
}

let uploaded = 0;
for (const rel of files) {
  const key = `${prefix}/${rel.split(path.sep).join('/')}`;
  const ext = path.extname(rel).toLowerCase();
  await putObject({
    key,
    body: fs.readFileSync(path.join(STATIC_DIR, rel)),
    contentType: CONTENT_TYPES[ext] || 'application/octet-stream',
    accessKeyId, secretAccessKey, sessionToken,
  });
  uploaded++;
  if (uploaded % 25 === 0) console.log(`  uploaded ${uploaded}/${files.length}`);
}

// Only rewrite the pointer after every object is safely uploaded.
fs.writeFileSync(path.join(ROOT, 'production_asset_url.json'), JSON.stringify({ url: CLOUDFRONT_ROOT + prefix }));
console.log(`uploaded ${uploaded} files; production_asset_url.json -> ${CLOUDFRONT_ROOT}${prefix}`);
