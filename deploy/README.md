# Hosting Set Check on Redbox

Set Check runs as a Next.js server in an Incus container on Redbox, published
through a Cloudflare Tunnel. Supabase (database and cover storage) stays in the
cloud. Redbox pulls `main` nightly and deploys it if it changed; nothing
connects into Redbox.

```
visitor ──https──▶ Cloudflare ◀──outbound tunnel── cloudflared ─▶ next start :3000
                                                     (setcheck container on Redbox)
browser ──────────────────────────────▶ Supabase (queries, cover images)
```

Redbox is at the RoleModel office, so the container is blocked from reaching
any private address. If the app were compromised, it could reach the internet
and nothing on the office network.

| Phase | When | Downtime |
|---|---|---|
| 0. Ship this PR on Vercel | Before anything else | None |
| 1. Move DNS to Cloudflare | Days before cutover | None |
| 2. Build the container | Any time | None |
| 3. Test on staging.setcheck.app | After 2 | None |
| 4. Cutover | Planned window | Seconds |

## 0. Ship this PR while still on Vercel

The upload and analytics changes work on Vercel, so they go live and get tested
before the host changes.

1. Apply the two new migrations to the production Supabase project
   (`supabase db push`, or paste them into the SQL editor in order):
   - `20260101000013_create_playlist_covers_bucket.sql`
   - `20260101000014_create_page_views.sql`
2. Add these to the Vercel project's environment variables (Production):
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase → Project Settings → API keys.
   - `ANALYTICS_SALT`: `openssl rand -hex 32`.
   - `STATS_PASSWORD`: any password; `/stats` asks for it (username is ignored).
3. Merge. After Vercel deploys, upload a cover and open `https://setcheck.app/stats`.
4. Copy the existing covers off Vercel Blob:
   ```sh
   vercel env pull .env.local     # or fill .env.local from .env.example
   node --env-file=.env.local scripts/migrate-covers-to-supabase.mjs          # dry run
   node --env-file=.env.local scripts/migrate-covers-to-supabase.mjs --apply
   ```
   It skips rows already on Supabase, so it is safe to re-run. Keep the Blob
   store until cutover is done, in case a cover needs re-copying.

## 1. Move setcheck.app DNS to Cloudflare

Add the site in Cloudflare. It imports the current records, which still point
at Vercel. Change the nameservers at the registrar and wait until Cloudflare
says the site is active. This can take hours, so do it days ahead.

While you're there:
- SSL/TLS mode: **Full**.
- Add a redirect rule from `www.setcheck.app/*` to `https://setcheck.app/$1`
  (301), unless Vercel is serving `www` as the primary today.

## 2. Build the container on Redbox

Run on Redbox. The Arch image and limits follow `josh-box`. Next builds need
about 1.5–2 GB of memory, and the server idles at about 150–300 MB.

```sh
incus launch images:archlinux setcheck \
  -c limits.cpu=2 -c limits.memory=3GiB -c boot.autostart=true \
  -c raw.lxc='lxc.cgroup2.cpu.weight=20
lxc.cgroup2.io.weight=20'
incus config device override setcheck root size=20GiB
```

### Block the office network

An Incus network ACL rejects egress to every private and Tailscale range, and
allows everything else:

```sh
incus network acl create setcheck-egress
for cidr in 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 100.64.0.0/10 169.254.0.0/16 fc00::/7 fe80::/10; do
  incus network acl rule add setcheck-egress egress action=reject destination=$cidr state=enabled
done
incus config device override setcheck eth0 \
  security.acls=setcheck-egress \
  security.acls.default.egress.action=allow \
  security.acls.default.ingress.action=allow
incus restart setcheck
```

Check it from inside the container. DNS and the internet must work, and private
addresses must fail:

```sh
incus exec setcheck -- getent hosts github.com            # resolves
incus exec setcheck -- curl -sI https://supabase.com      # HTTP response
incus exec setcheck -- curl -m 5 -sI http://192.168.1.1   # must fail
incus exec setcheck -- curl -m 5 -sI http://10.154.155.1  # must fail (the Redbox host)
```

If DNS breaks because the bridge gateway (`10.154.155.1`) is in `10.0.0.0/8`,
add `incus network acl rule add setcheck-egress egress action=allow
destination=10.154.155.1/32 destination_port=53 protocol=udp state=enabled`
and the same for `protocol=tcp`. Then check that the last test above still
fails. If DNS still fails with the allow rules in place, point the container's
resolver at `1.1.1.1` instead.

### Install the app

```sh
incus exec setcheck -- bash
pacman -Syu --noconfirm git nodejs-lts-jod pnpm curl cloudflared sudo

useradd --system --create-home --home-dir /srv/setcheck --shell /bin/bash setcheck
sudo -u setcheck mkdir -p /srv/setcheck/{releases,shared}
```

Give Redbox read-only access to the private repo with a deploy key:

```sh
sudo -u setcheck mkdir -m 700 -p /srv/setcheck/.ssh
sudo -u setcheck ssh-keygen -t ed25519 -N '' -f /srv/setcheck/.ssh/id_ed25519 -C setcheck-redbox
cat /srv/setcheck/.ssh/id_ed25519.pub
```

Add that key in GitHub → Category-5/set-check → Settings → Deploy keys, with
write access **off**. Then:

```sh
sudo -u setcheck git clone git@github.com:Category-5/set-check.git /srv/setcheck/repo
```

Create `/srv/setcheck/shared/.env` with every key from `.env.example`, using
the production values (`vercel env pull` gives you most of them). Lock it down:

```sh
chown setcheck:setcheck /srv/setcheck/shared/.env && chmod 600 /srv/setcheck/shared/.env
```

Install the units and the sudoers rule, then do the first deploy from the clone
(later deploys run the script from the live release):

```sh
cd /srv/setcheck/repo
install -m 0644 deploy/systemd/setcheck.service deploy/systemd/setcheck-deploy.service \
  deploy/systemd/setcheck-deploy.timer /etc/systemd/system/
install -m 0440 deploy/sudoers.d/setcheck /etc/sudoers.d/setcheck && visudo -c
systemctl daemon-reload
systemctl enable setcheck.service

sudo -u setcheck bash /srv/setcheck/repo/deploy/deploy.sh --force
systemctl enable --now setcheck-deploy.timer
systemctl list-timers setcheck-deploy.timer
```

`deploy.sh` restarts the service after the first build. If `setcheck.service`
wasn't running yet, the restart starts it.

## 3. Tunnel and staging

Inside the container:

```sh
cloudflared tunnel login                  # opens a URL; pick setcheck.app
cloudflared tunnel create setcheck        # prints TUNNEL_ID, writes ~/.cloudflared/TUNNEL_ID.json
mkdir -p /etc/cloudflared
mv ~/.cloudflared/*.json /etc/cloudflared/
cp /srv/setcheck/repo/deploy/cloudflared/config.yml /etc/cloudflared/config.yml
sed -i "s/TUNNEL_ID/<the id>/g" /etc/cloudflared/config.yml
cloudflared tunnel route dns setcheck staging.setcheck.app
cloudflared service install
systemctl enable --now cloudflared
```

Test `https://staging.setcheck.app`:
- Open a playlist and a song page.
- Search for a song (Spotify and Tidal).
- Upload a cover.
- Open `/stats` and check that your own visits show up.
- Check the OG image at `/opengraph-image` and a playlist's preview card.

## 4. Cutover

1. In Cloudflare DNS, delete the `setcheck.app` and `www` records that point
   at Vercel, then run:
   ```sh
   cloudflared tunnel route dns setcheck setcheck.app
   cloudflared tunnel route dns setcheck www.setcheck.app
   ```
2. Watch `journalctl -u setcheck -f`, then repeat the staging checks on
   `https://setcheck.app`.
3. Leave the Vercel project up for a day or two. To roll back, point the DNS
   records back at Vercel.
4. Then remove the Vercel project and the Blob store, and add a Cloudflare
   health check on `https://setcheck.app/` that emails you, so office outages
   don't go unnoticed.

## Day to day

| Task | Command (inside the container) |
|---|---|
| Deploy now if `main` moved | `sudo systemctl start setcheck-deploy.service` |
| Rebuild the current commit | `sudo -u setcheck /srv/setcheck/current/deploy/deploy.sh --force` |
| Deploy logs | `journalctl -u setcheck-deploy -n 100` |
| App logs | `journalctl -u setcheck -f` |
| What's live | `cat /srv/setcheck/current/.deployed-sha` |
| Next nightly run | `systemctl list-timers setcheck-deploy.timer` |
| Roll back by hand | `ln -sfn /srv/setcheck/releases/<older> /srv/setcheck/current && sudo systemctl restart setcheck` |

The nightly run is at 03:30 Eastern, plus up to 15 minutes of random delay. If
the build fails, the live release is left alone. If the new release fails its
health check, the script switches back to the previous one. Either way the
deploy unit ends up `failed`, which `systemctl --failed` shows.
