# Pixelrises - Domain Deployment Checklist

## Goal

Support both:

- `nomdusite.pixelrises.fr`
- `mondomaineclient.fr`

with the same Vercel project.

## 1. Wildcard Pixelrises subdomains

Add these domains to the Vercel project:

- `pixelrises.fr`
- `www.pixelrises.fr`
- `*.pixelrises.fr`

Recommended DNS model:

- apex `pixelrises.fr` -> Vercel apex target
- `www` -> Vercel CNAME target
- wildcard `*` -> Vercel wildcard target

Important:

- the React app already resolves `slug.pixelrises.fr` in the client
- the published site is loaded from the same app, based on hostname

## 2. Custom client domains

For each client domain:

1. Add the domain to the same Vercel project
2. Point DNS to Vercel
3. Save the domain in `generated_sites.custom_domain`
4. Publish the site

The app already resolves:

- `custom_domain = hostname`
- and `www.hostname` / bare hostname variants

## 3. App behavior already implemented

- subdomain rendering:
  - `slug.pixelrises.fr`
- custom domain rendering:
  - `mondomaineclient.fr`
- fallback preview:
  - `/preview/:id`
- public fallback route:
  - `/s/:slug`

## 4. Recommended operating model

1. generate the site
2. edit the content if needed
3. publish first on `slug.pixelrises.fr`
4. validate the message and structure
5. connect the client custom domain

## 5. Important note

The code is ready.
The final activation still depends on:

- adding wildcard/custom domains in Vercel
- correct DNS records
- SSL issuance on the configured domains
