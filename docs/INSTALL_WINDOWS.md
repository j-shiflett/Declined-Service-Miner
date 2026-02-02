# Install (Windows, No Admin)

Declined Service Miner is designed to run without admin rights.

## Option A: Portable ZIP (recommended)

1) Download the latest **Portable ZIP** release
2) Unzip it anywhere you want (Desktop/Downloads is fine)
3) Run: **Declined Service Miner.exe**

That’s it.

### Where does it store data?

It stores its database + run outputs here:

- `Documents/Declined Service Miner/`

Inside that folder you’ll find:

- `db.sqlite` (dealers + outcomes + saved mappings)
- `dealers/<id - name>/runs/<timestamp>/` (exports)

## Getting the Portable ZIP

We build the Windows portable executable via **GitHub Actions** (Windows runner).

- You can download the artifact from the latest workflow run, or
- We can attach it to a GitHub Release when we start tagging versions.

## Updating

Download the newest Portable ZIP and replace the old folder.

Your data remains in `Documents/Declined Service Miner/`.

## Troubleshooting

- If Windows SmartScreen blocks it, click **More info → Run anyway**.
- If you see missing DLL errors, you likely downloaded the wrong build (we will ship x64).
