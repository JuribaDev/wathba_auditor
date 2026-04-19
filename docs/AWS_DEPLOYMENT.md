# AWS S3 + CloudFront Static Website Deployment Guide

A comprehensive, reusable guide for deploying static websites (Vite, React, Next.js static export, Vue, etc.) to AWS with HTTPS via CloudFront and automated GitHub Actions deployments using OIDC authentication.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Configuration Variables](#configuration-variables)
4. [Step-by-Step Deployment](#step-by-step-deployment)
   - [Step 1: Create S3 Bucket](#step-1-create-s3-bucket)
   - [Step 2: Create CloudFront OAC](#step-2-create-cloudfront-origin-access-control)
   - [Step 3: Create CloudFront Distribution](#step-3-create-cloudfront-distribution)
   - [Step 4: Update S3 Bucket Policy](#step-4-update-s3-bucket-policy)
   - [Step 5: Set Up GitHub OIDC Provider](#step-5-set-up-github-oidc-provider)
   - [Step 6: Create IAM Role](#step-6-create-iam-role-for-github-actions)
   - [Step 7: Create GitHub Actions Workflow](#step-7-create-github-actions-workflow)
5. [Deploying a New Website](#deploying-a-new-website)
6. [Custom Domain Setup](#custom-domain-setup-optional)
   - [Step 1: Request SSL Certificate in ACM](#step-1-request-ssl-certificate-in-acm)
   - [Step 2: Get DNS Validation Records](#step-2-get-dns-validation-records)
   - [Step 3: Create Route 53 Hosted Zone](#step-3-create-route-53-hosted-zone)
   - [Step 4: Add ACM Validation Record](#step-4-add-acm-validation-record-to-route-53)
   - [Step 5: Update CloudFront Distribution](#step-5-update-cloudfront-distribution)
   - [Step 6: Create Route 53 ALIAS Records](#step-6-create-route-53-alias-records)
   - [Step 7: Update Nameservers](#step-7-update-nameservers-at-domain-registrar)
   - [Step 8: Verify Setup](#step-8-verify-setup)
7. [Cost Estimation](#cost-estimation)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)
10. [Cleanup](#cleanup)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
│                            │                                     │
│                            ▼                                     │
│                   ┌─────────────────┐                           │
│                   │   CloudFront    │ ◄── HTTPS + Caching       │
│                   │   Distribution  │                           │
│                   └────────┬────────┘                           │
│                            │                                     │
│                            │ OAC (Origin Access Control)        │
│                            ▼                                     │
│                   ┌─────────────────┐                           │
│                   │    S3 Bucket    │ ◄── Private (no public)   │
│                   │  (Static Files) │                           │
│                   └─────────────────┘                           │
│                            ▲                                     │
│                            │ S3 Sync                            │
│                            │                                     │
│   ┌─────────────────┐     │     ┌─────────────────┐            │
│   │  GitHub Actions │─────┼────►│   IAM Role      │            │
│   │   (CI/CD)       │     │     │ (OIDC Auth)     │            │
│   └─────────────────┘     │     └─────────────────┘            │
│                            │                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- **HTTPS by default**: CloudFront provides free SSL/TLS certificates
- **Global CDN**: Content cached at edge locations worldwide
- **No stored credentials**: GitHub OIDC means no AWS access keys in secrets
- **Private bucket**: S3 bucket blocks all public access
- **SPA support**: Custom error responses handle client-side routing

---

## Prerequisites

1. **AWS CLI** installed and configured with appropriate credentials
   ```bash
   aws configure
   # Or use SSO: aws sso login
   ```

2. **GitHub repository** for your static website

3. **Build tool** that outputs static files (Vite, Create React App, Next.js export, etc.)

---

## Configuration Variables

Before starting, define these variables for your project:

| Variable | Description | Example |
|----------|-------------|---------|
| `BUCKET_NAME` | Globally unique S3 bucket name | `my-website-prod` |
| `AWS_REGION` | AWS region for S3 bucket | `me-south-1` |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID | `123456789012` |
| `GITHUB_ORG` | GitHub username or organization | `myusername` |
| `GITHUB_REPO` | Repository name | `my-website` |
| `BUILD_COMMAND` | Command to build the site | `npm run build` |
| `OUTPUT_DIR` | Build output directory | `dist` |

For this project, the values are:
```bash
BUCKET_NAME="namudaj-cleaning-services-website"
AWS_REGION="me-south-1"
AWS_ACCOUNT_ID="340752835012"
GITHUB_ORG="JuribaDev"
GITHUB_REPO="namudaj-cleaning-services"
BUILD_COMMAND="bun run build"
OUTPUT_DIR="dist"
```

---

## Step-by-Step Deployment

### Step 1: Create S3 Bucket

```bash
# Create the bucket
aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $AWS_REGION \
  --create-bucket-configuration LocationConstraint=$AWS_REGION

# Block all public access (CloudFront will access via OAC)
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

**Note**: For `us-east-1`, omit the `--create-bucket-configuration` parameter:
```bash
aws s3api create-bucket --bucket $BUCKET_NAME --region us-east-1
```

---

### Step 2: Create CloudFront Origin Access Control

OAC allows CloudFront to securely access your private S3 bucket.

```bash
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
  "Name=${BUCKET_NAME}-oac,Description=OAC for ${BUCKET_NAME},SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3"
```

**Save the OAC ID** from the output (e.g., `E1XEOFZFU9F0HV`):
```bash
OAC_ID="<from-output>"
```

---

### Step 3: Create CloudFront Distribution

Create a file `cloudfront-config.json`:

```json
{
  "CallerReference": "unique-reference-string-YYYYMMDD",
  "Comment": "CloudFront distribution for BUCKET_NAME",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-BUCKET_NAME",
        "DomainName": "BUCKET_NAME.s3.AWS_REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "OAC_ID"
      }
    ]
  },
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 10
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 10
      }
    ]
  },
  "PriceClass": "PriceClass_All",
  "HttpVersion": "http2and3"
}
```

**Replace placeholders**, then create the distribution:

```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

**Save from output**:
- `Distribution.Id` (e.g., `E2BIYSB9711DMO`)
- `Distribution.DomainName` (e.g., `d3jarhb3mqwdvm.cloudfront.net`)

```bash
DISTRIBUTION_ID="<from-output>"
CLOUDFRONT_DOMAIN="<from-output>"
```

---

### Step 4: Update S3 Bucket Policy

Create `s3-bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::AWS_ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

**Replace placeholders**, then apply:

```bash
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://s3-bucket-policy.json
```

---

### Step 5: Set Up GitHub OIDC Provider

**Note**: This step only needs to be done ONCE per AWS account, regardless of how many repositories you deploy.

Check if it already exists:
```bash
aws iam list-open-id-connect-providers
```

If not present, create it:
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 1c58a3a8518e8759bf075b76b750d4f2df264fcd
```

---

### Step 6: Create IAM Role for GitHub Actions

Create `github-oidc-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:GITHUB_ORG/GITHUB_REPO:*"
        }
      }
    }
  ]
}
```

Create `deploy-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DeployAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::BUCKET_NAME",
        "arn:aws:s3:::BUCKET_NAME/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "arn:aws:cloudfront::AWS_ACCOUNT_ID:distribution/DISTRIBUTION_ID"
    }
  ]
}
```

**Replace placeholders**, then create the role:

```bash
# Create the role (use a unique name per project)
ROLE_NAME="GitHubActions-${GITHUB_REPO}-DeployRole"

aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file://github-oidc-trust-policy.json \
  --description "Role for GitHub Actions to deploy $GITHUB_REPO"

# Attach the deployment policy
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name S3CloudFrontDeployPolicy \
  --policy-document file://deploy-policy.json
```

**Save the Role ARN**:
```bash
ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"
```

---

### Step 7: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS S3 + CloudFront

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

env:
  AWS_REGION: me-south-1                              # Change this
  S3_BUCKET: my-website-bucket                        # Change this
  CLOUDFRONT_DISTRIBUTION_ID: EXXXXXXXXXX             # Change this

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # For Bun projects:
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build

      # For Node/npm projects, replace above with:
      # - name: Setup Node.js
      #   uses: actions/setup-node@v4
      #   with:
      #     node-version: '20'
      #     cache: 'npm'
      # - name: Install dependencies
      #   run: npm ci
      # - name: Build
      #   run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME  # Change this
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to S3
        run: |
          # Sync all files except index.html with long cache
          aws s3 sync dist/ s3://${{ env.S3_BUCKET }} \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "index.html" \
            --exclude "*.json"
          
          # Upload index.html with no-cache (for instant updates)
          aws s3 cp dist/index.html s3://${{ env.S3_BUCKET }}/index.html \
            --cache-control "public, max-age=0, must-revalidate"
          
          # Upload JSON files with no-cache (if they exist)
          find dist -name "*.json" -exec aws s3 cp {} s3://${{ env.S3_BUCKET }}/{} \
            --cache-control "public, max-age=0, must-revalidate" \; 2>/dev/null || true

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ env.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

---

## Deploying a New Website

To deploy a new static website using this guide:

### Quick Checklist

1. **Set variables**:
   ```bash
   export BUCKET_NAME="new-website-bucket"
   export AWS_REGION="us-east-1"
   export GITHUB_ORG="yourusername"
   export GITHUB_REPO="new-website"
   ```

2. **Run Steps 1-4** (S3 + CloudFront setup)

3. **Skip Step 5** if OIDC provider already exists in your account

4. **Run Step 6** with a unique role name

5. **Copy and customize** `.github/workflows/deploy.yml`

6. **Push to main branch** to trigger deployment

### Files to Copy

Copy these files from an existing project and update the values:
- `aws/cloudfront-config.json`
- `aws/s3-bucket-policy.json`
- `aws/github-oidc-trust-policy.json`
- `aws/deploy-policy.json`
- `.github/workflows/deploy.yml`

---

## Custom Domain Setup (Optional)

This section documents how to add a custom domain to your CloudFront distribution using Route 53 for DNS management.

### Architecture with Custom Domain

```
┌─────────────────────────────────────────────────────────────────┐
│                     Domain Registrar                             │
│                    (e.g., souqt2.sa)                            │
│                          │                                       │
│                          │ Nameservers point to                 │
│                          ▼                                       │
│                   ┌─────────────────┐                           │
│                   │    Route 53     │ ◄── DNS Management        │
│                   │  Hosted Zone    │     ALIAS records         │
│                   └────────┬────────┘                           │
│                            │                                     │
│                            │ ALIAS to CloudFront                │
│                            ▼                                     │
│                   ┌─────────────────┐                           │
│                   │   CloudFront    │ ◄── SSL via ACM           │
│                   │   Distribution  │     (us-east-1)           │
│                   └────────┬────────┘                           │
│                            │                                     │
│                            ▼                                     │
│                   ┌─────────────────┐                           │
│                   │    S3 Bucket    │                           │
│                   └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Why Route 53 for DNS?

Many domain registrars don't support ALIAS/ANAME records at the apex domain (e.g., `example.com` without `www`). Route 53 solves this:

| Feature | Most Registrars | Route 53 |
|---------|-----------------|----------|
| ALIAS at apex | No | Yes |
| CloudFront integration | Manual | Native |
| ACM auto-validation | No | Yes |
| Cost | Usually included | ~$0.50/month |

### Step 1: Request SSL Certificate in ACM

**Important**: Certificate MUST be created in `us-east-1` region (CloudFront requirement), regardless of where your other resources are.

```bash
# Set your domain
DOMAIN_NAME="example.com"

# Request certificate with wildcard
aws acm request-certificate \
  --domain-name $DOMAIN_NAME \
  --subject-alternative-names "*.$DOMAIN_NAME" \
  --validation-method DNS \
  --region us-east-1
```

**Save the `CertificateArn`** from the output:
```bash
CERTIFICATE_ARN="arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/xxxxx"
```

### Step 2: Get DNS Validation Records

```bash
aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1 \
  --query "Certificate.DomainValidationOptions"
```

This outputs CNAME records needed for validation. Example:
```json
{
  "Name": "_abc123.example.com.",
  "Type": "CNAME",
  "Value": "_xyz789.acm-validations.aws."
}
```

### Step 3: Create Route 53 Hosted Zone

```bash
aws route53 create-hosted-zone \
  --name $DOMAIN_NAME \
  --caller-reference "$(date +%s)"
```

**Save from output:**
- `HostedZone.Id` (e.g., `/hostedzone/Z00762756ZWUKDFJD24W`)
- `DelegationSet.NameServers` (4 nameservers)

Example nameservers:
```
ns-1875.awsdns-42.co.uk
ns-1412.awsdns-48.org
ns-40.awsdns-05.com
ns-976.awsdns-58.net
```

### Step 4: Add ACM Validation Record to Route 53

```bash
HOSTED_ZONE_ID="Z00762756ZWUKDFJD24W"  # Without /hostedzone/ prefix

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_abc123.example.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_xyz789.acm-validations.aws."}]
      }
    }]
  }'
```

Wait for certificate to be issued (~5 minutes):
```bash
aws acm wait certificate-validated \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1

# Verify status
aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1 \
  --query "Certificate.Status"
# Should return: "ISSUED"
```

### Step 5: Update CloudFront Distribution

Get current distribution config:
```bash
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > cloudfront-update.json
```

Extract the ETag:
```bash
ETAG=$(jq -r '.ETag' cloudfront-update.json)
```

Update the config using jq:
```bash
jq '.DistributionConfig.Aliases = {"Quantity": 2, "Items": ["example.com", "www.example.com"]} | 
    .DistributionConfig.ViewerCertificate = {
      "ACMCertificateArn": "'"$CERTIFICATE_ARN"'",
      "SSLSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021",
      "Certificate": "'"$CERTIFICATE_ARN"'",
      "CertificateSource": "acm"
    } | .DistributionConfig' cloudfront-update.json > dist-config-only.json
```

Apply the update:
```bash
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file://dist-config-only.json \
  --if-match $ETAG
```

Clean up temporary files:
```bash
rm -f cloudfront-update.json dist-config-only.json
```

### Step 6: Create Route 53 ALIAS Records

Create ALIAS records for both apex and www domains:

```bash
# CloudFront hosted zone ID (this is constant for all CloudFront distributions)
CLOUDFRONT_HOSTED_ZONE_ID="Z2FDTNDATAQYW2"

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "example.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d3jarhb3mqwdvm.cloudfront.net",
            "EvaluateTargetHealth": false
          }
        }
      },
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "www.example.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d3jarhb3mqwdvm.cloudfront.net",
            "EvaluateTargetHealth": false
          }
        }
      }
    ]
  }'
```

**Note**: `Z2FDTNDATAQYW2` is the fixed hosted zone ID for ALL CloudFront distributions.

### Step 7: Update Nameservers at Domain Registrar

Log into your domain registrar and update the nameservers to the 4 Route 53 nameservers from Step 3.

**Example**: Replace registrar's default nameservers:
```
ns1.registrar.com  →  ns-1875.awsdns-42.co.uk
ns2.registrar.com  →  ns-1412.awsdns-48.org
                      ns-40.awsdns-05.com
                      ns-976.awsdns-58.net
```

**Important**: DNS propagation can take up to 48 hours, but usually completes within a few hours.

### Step 8: Verify Setup

After DNS propagation:

```bash
# Check DNS resolution
dig example.com
dig www.example.com

# Test HTTPS
curl -I https://example.com
curl -I https://www.example.com
```

You can also use [dnschecker.org](https://dnschecker.org) to verify global DNS propagation.

---

### Custom Domain Setup for This Project

The following commands were executed to set up `namudaj.sa`:

```bash
# 1. Request ACM certificate
aws acm request-certificate \
  --domain-name namudaj.sa \
  --subject-alternative-names "*.namudaj.sa" \
  --validation-method DNS \
  --region us-east-1
# Output: arn:aws:acm:us-east-1:340752835012:certificate/8ebdeedb-fcb6-46ed-957f-7d7916eb2458

# 2. Create Route 53 hosted zone
aws route53 create-hosted-zone \
  --name namudaj.sa \
  --caller-reference "namudaj-1766553795"
# Output: Hosted Zone ID: Z00762756ZWUKDFJD24W

# 3. Add ACM validation CNAME (added at souqt2.sa initially, then Route 53 took over)
# Name: _dfb406eb394165f402a9f7df39afdd9d.namudaj.sa
# Value: _3af6ea4138f11535926a54c11ddf18a0.jkddzztszm.acm-validations.aws.

# 4. Update CloudFront with aliases and certificate
aws cloudfront get-distribution-config --id E2BIYSB9711DMO > cloudfront-update.json
jq '.DistributionConfig.Aliases = {"Quantity": 2, "Items": ["namudaj.sa", "www.namudaj.sa"]} | 
    .DistributionConfig.ViewerCertificate = {
      "ACMCertificateArn": "arn:aws:acm:us-east-1:340752835012:certificate/8ebdeedb-fcb6-46ed-957f-7d7916eb2458",
      "SSLSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021",
      "Certificate": "arn:aws:acm:us-east-1:340752835012:certificate/8ebdeedb-fcb6-46ed-957f-7d7916eb2458",
      "CertificateSource": "acm"
    } | .DistributionConfig' cloudfront-update.json > dist-config-only.json
aws cloudfront update-distribution \
  --id E2BIYSB9711DMO \
  --distribution-config file://dist-config-only.json \
  --if-match ER8OY5NGO600W

# 5. Create Route 53 ALIAS records
aws route53 change-resource-record-sets \
  --hosted-zone-id Z00762756ZWUKDFJD24W \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "namudaj.sa",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d3jarhb3mqwdvm.cloudfront.net",
            "EvaluateTargetHealth": false
          }
        }
      },
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "www.namudaj.sa",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d3jarhb3mqwdvm.cloudfront.net",
            "EvaluateTargetHealth": false
          }
        }
      }
    ]
  }'

# 6. Update nameservers at souqt2.sa to:
#    - ns-1875.awsdns-42.co.uk
#    - ns-1412.awsdns-48.org
#    - ns-40.awsdns-05.com
#    - ns-976.awsdns-58.net
```

### Custom Domain Resources Summary

| Resource | Value |
|----------|-------|
| Custom Domains | `namudaj.sa`, `www.namudaj.sa` |
| ACM Certificate ARN | `arn:aws:acm:us-east-1:340752835012:certificate/8ebdeedb-fcb6-46ed-957f-7d7916eb2458` |
| Route 53 Hosted Zone ID | `Z00762756ZWUKDFJD24W` |
| Route 53 Nameservers | `ns-1875.awsdns-42.co.uk`, `ns-1412.awsdns-48.org`, `ns-40.awsdns-05.com`, `ns-976.awsdns-58.net` |
| Domain Registrar | souqt2.sa |
| CloudFront Hosted Zone ID | `Z2FDTNDATAQYW2` (constant for all CloudFront) |

---

## Cost Estimation

### Monthly Costs (Approximate)

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| **S3 Storage** | 5 GB | ~$0.023/GB |
| **S3 Requests** | 20,000 GET | ~$0.0004/1000 requests |
| **CloudFront Data** | 1 TB | ~$0.085/GB |
| **CloudFront Requests** | 10M | ~$0.0075/10,000 requests |
| **Route 53** (if used) | N/A | $0.50/hosted zone + $0.40/M queries |

### Typical Small Website

For a site with ~10,000 monthly visitors:
- **S3**: < $1/month
- **CloudFront**: < $5/month
- **Total**: ~$5-10/month (often covered by free tier for first year)

---

## Troubleshooting

### Common Issues

#### 1. "Access Denied" when accessing CloudFront URL

**Causes**:
- S3 bucket policy not applied correctly
- OAC not configured properly
- Distribution still deploying

**Fix**:
```bash
# Verify bucket policy
aws s3api get-bucket-policy --bucket $BUCKET_NAME

# Check distribution status
aws cloudfront get-distribution --id $DISTRIBUTION_ID --query "Distribution.Status"
```

#### 2. GitHub Actions fails with "Could not assume role"

**Causes**:
- Wrong repository in trust policy
- OIDC provider not created
- Role ARN incorrect in workflow

**Fix**:
```bash
# Verify OIDC provider
aws iam list-open-id-connect-providers

# Check trust policy
aws iam get-role --role-name $ROLE_NAME --query "Role.AssumeRolePolicyDocument"
```

#### 3. Old content still showing after deploy

**Causes**:
- CloudFront cache not invalidated
- Browser cache

**Fix**:
```bash
# Manual invalidation
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Clear browser cache or use incognito
```

#### 4. SPA routes return 404

**Causes**:
- Custom error responses not configured

**Fix**: Ensure CloudFront has custom error responses for 403 and 404 returning `/index.html` with 200 status.

#### 5. Custom domain not resolving

**Causes**:
- Nameservers not updated at registrar
- DNS propagation not complete
- Route 53 ALIAS records not created

**Fix**:
```bash
# Check if DNS is resolving to CloudFront
dig yourdomain.com

# Verify Route 53 records exist
aws route53 list-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID

# Check nameservers being used
dig yourdomain.com NS
```

**Note**: DNS propagation can take up to 48 hours. Use [dnschecker.org](https://dnschecker.org) to verify global propagation.

#### 6. SSL certificate stuck in "Pending Validation"

**Causes**:
- DNS validation CNAME record not added correctly
- Wrong CNAME value (missing trailing dot)
- DNS hasn't propagated

**Fix**:
```bash
# Get the validation records again
aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1 \
  --query "Certificate.DomainValidationOptions"

# Verify the CNAME record exists in DNS
dig _validation-name.yourdomain.com CNAME
```

#### 7. "CNAMEAlreadyExists" error when updating CloudFront

**Causes**:
- Another CloudFront distribution already has this domain as an alias

**Fix**:
- Find and remove the alias from the other distribution
- Or delete the other distribution if no longer needed

---

## Security Best Practices

1. **Use OIDC instead of access keys**: Never store AWS credentials in GitHub Secrets

2. **Least privilege IAM policies**: Only grant necessary permissions

3. **Private S3 bucket**: Block all public access, let CloudFront serve content

4. **Enable CloudFront logging**: For audit trails and debugging

5. **Use unique role names**: One role per repository for better access control

6. **Review trust policies**: Ensure `sub` condition restricts to your specific repo

---

## Cleanup

To remove all resources:

```bash
# 1. Delete CloudFront distribution (must disable first)
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > config.json
# Edit config.json: set "Enabled": false
aws cloudfront update-distribution --id $DISTRIBUTION_ID --if-match <ETag> --distribution-config file://config.json
# Wait for status to be "Deployed", then:
aws cloudfront delete-distribution --id $DISTRIBUTION_ID --if-match <new-ETag>

# 2. Delete OAC
aws cloudfront delete-origin-access-control --id $OAC_ID --if-match <ETag>

# 3. Empty and delete S3 bucket
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3api delete-bucket --bucket $BUCKET_NAME

# 4. Delete IAM role
aws iam delete-role-policy --role-name $ROLE_NAME --policy-name S3CloudFrontDeployPolicy
aws iam delete-role --role-name $ROLE_NAME

# 5. Delete OIDC provider (only if no other repos use it)
aws iam delete-open-id-connect-provider \
  --open-id-connect-provider-arn arn:aws:iam::$AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com

# 6. Delete Route 53 hosted zone (if custom domain was configured)
# First, delete all non-default records (NS and SOA are auto-created)
aws route53 list-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID
# Delete each A/CNAME record manually, then:
aws route53 delete-hosted-zone --id $HOSTED_ZONE_ID

# 7. Delete ACM certificate (must remove from CloudFront first)
aws acm delete-certificate --certificate-arn $CERTIFICATE_ARN --region us-east-1

# 8. Revert nameservers at domain registrar (if applicable)
# Update nameservers back to registrar's defaults
```

---

## Resources Created for This Project

| Resource | Value |
|----------|-------|
| S3 Bucket | `namudaj-cleaning-services-website` |
| CloudFront Distribution ID | `E2BIYSB9711DMO` |
| CloudFront Domain | `d3jarhb3mqwdvm.cloudfront.net` |
| OAC ID | `E1XEOFZFU9F0HV` |
| IAM Role ARN | `arn:aws:iam::340752835012:role/GitHubActionsDeployRole` |
| AWS Account ID | `340752835012` |
| AWS Region | `me-south-1` |
| **Custom Domain** | `namudaj.sa`, `www.namudaj.sa` |
| ACM Certificate ARN | `arn:aws:acm:us-east-1:340752835012:certificate/8ebdeedb-fcb6-46ed-957f-7d7916eb2458` |
| Route 53 Hosted Zone ID | `Z00762756ZWUKDFJD24W` |
| Route 53 Nameservers | `ns-1875.awsdns-42.co.uk`, `ns-1412.awsdns-48.org`, `ns-40.awsdns-05.com`, `ns-976.awsdns-58.net` |
| Domain Registrar | souqt2.sa (nameservers point to Route 53) |

---

## References

- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront with S3 OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [GitHub OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS CLI S3 Commands](https://docs.aws.amazon.com/cli/latest/reference/s3/)
- [Route 53 ALIAS Records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html)
- [ACM Certificate Validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)
- [CloudFront Custom Domains](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)
- [Using Custom SSL Certificates with CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-https-alternate-domain-names.html)

