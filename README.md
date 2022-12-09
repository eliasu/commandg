[<img alt="Deployed with web deploy" src="https://img.shields.io/badge/Deployed With-web deploy-%3CCOLOR%3E?style=for-the-badge&color=0077b6">](https://github.com/SamKirkland/web-deploy)


## installation instructions

1. run `composer install`
2. run `php please make:user`
3. run `npm i` && `npm run dev`

## Environment file contents

### Production

```env
Dump your .env values here with sensitive data removed. The following is a production example that uses full static caching:
APP_NAME="commandg"
APP_ENV=production
APP_KEY="base64:fOKHKkR475SfnzzcI4Fa574CH/wqa6vX3RucL1L1AfU="
APP_DEBUG=false
APP_URL=

DEBUGBAR_ENABLED=false

LOG_CHANNEL=stack

BROADCAST_DRIVER=log
CACHE_DRIVER=file
QUEUE_CONNECTION=redis
SESSION_DRIVER=file
SESSION_LIFETIME=120

REDIS_HOST=127.0.0.1
REDIS_DATABASE=
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=smtp.postmarkapp.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="${APP_NAME}"

IMAGE_MANIPULATION_DRIVER=imagick

STATAMIC_LICENSE_KEY=
STATAMIC_THEME=business

STATAMIC_API_ENABLED=false
STATAMIC_REVISIONS_ENABLED=false

STATAMIC_GIT_ENABLED=true
STATAMIC_GIT_PUSH=true
STATAMIC_GIT_DISPATCH_DELAY=5

STATAMIC_STATIC_CACHING_STRATEGY=full
SAVE_CACHED_IMAGES=true
STATAMIC_STACHE_WATCHER=false
STATAMIC_CACHE_TAGS_ENABLED=true

#STATAMIC_CUSTOM_CMS_NAME=
STATAMIC_CUSTOM_LOGO_OUTSIDE_URL="/visuals/client-logo.svg"
#STATAMIC_CUSTOM_LOGO_NAV_URL=
#STATAMIC_CUSTOM_FAVICON_URL=
#STATAMIC_CUSTOM_CSS_URL=
```

## NGINX config

Add the following to your NGINX config __inside the server block__ enable static resource caching:
```
expires $expires;
```

And this __outside the server block__:
```
map $sent_http_content_type $expires {
    default    off;
    text/css    max;
    ~image/    max;
    application/javascript    max;
    application/octet-stream    max;
}
```

## Deploy script WEB Deploy

```bash
on: push
name: 🚀 Deploy command+g website on push
jobs:
  web-deploy:
    name: 🚀 Deploy Website Every Commit
    runs-on: ubuntu-latest
    steps:
    - name: 🚚 Get Latest Code
      uses: actions/checkout@v3

    - name: 📦 Install Packages
    - uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: "npm"
    - run: npm ci
      
    - name: 🔨 Build
      run: |
        npm run build
        composer install
        php please cache:clear
        php please config:cache
        php please route:cache
        php please stache:warm
        php please queue:restart
        php please search:update --all
    
    - name: 📂 Sync Files
      uses: SamKirkland/web-deploy@v1
      with:
        target-server: w01abbc7.kasserver.com
        remote-user: ssh-w01abbc7
        private-ssh-key: ${{ secrets.SSH_KEY }}
        destination-path: ~/www/htdocs/w01abbc7/dev.command-g.de/
        exclude: |
          **/.git*
          **/.git*/**
          **/public/img/**
          **/vendor/**
          **/node_modules/**
          **/public/storage/**
          **/public/vendor/statamic/**
          **/public/img/**
          **/public/static/**
          **/storage/**
```