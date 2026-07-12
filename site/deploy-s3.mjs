#!/usr/bin/env node
// Deploy the Deck landing page to S3 + CloudFront.
//
//   AWS_PROFILE=nodesoft node site/deploy-s3.mjs --bucket deck.yourdomain.com [--distribution E123ABC]
//
// - Syncs site/ to the bucket (public static hosting).
// - Optionally invalidates a CloudFront distribution so the change is live fast.
// Requires the AWS CLI + credentials with s3 + cloudfront access.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

const bucket = flag("--bucket");
const distribution = flag("--distribution");
if (!bucket) {
  console.error("usage: node site/deploy-s3.mjs --bucket <bucket> [--distribution <cf-id>]");
  process.exit(2);
}

function aws(a) {
  console.log("aws " + a.join(" "));
  execFileSync("aws", a, { stdio: "inherit" });
}

console.log(`Deploying ${HERE} -> s3://${bucket}`);
aws(["s3", "sync", HERE, `s3://${bucket}`, "--exclude", "*.mjs", "--delete",
  "--cache-control", "public,max-age=300"]);

if (distribution) {
  aws(["cloudfront", "create-invalidation", "--distribution-id", distribution, "--paths", "/*"]);
}
console.log("Done. If this is a fresh bucket, enable static website hosting and point CloudFront at it.");
