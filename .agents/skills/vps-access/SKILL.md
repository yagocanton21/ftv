---
name: vps-access
description: >-
  Provides connection details, credentials, and deployment procedures for accessing
  and managing Yago's Oracle Cloud VPS (163.176.205.54). Activate this skill whenever
  the user asks to access, inspect, deploy to, or run commands on the VPS.
---

# VPS Access & Management Skill

This skill documents how to connect to and manage Yago's Oracle Cloud VPS instance.

## Server Information

| Property | Value |
|---|---|
| **Host / IP** | `163.176.205.54` |
| **SSH User** | `ubuntu` |
| **SSH Key Path (Local)** | `C:\Users\Yago Canton\.ssh\vps3.key` |
| **Operating System** | Ubuntu 22.04 LTS (ARM64 / aarch64) |
| **Projects Directory** | `~/projetos` |
| **FTV Studio Project** | `~/projetos/ftv` |
| **FTV Docker Container** | `ftv_studio` |
| **FTV Public Port** | `8085` (`http://163.176.205.54:8085`) |

---

## How to Connect via SSH

In PowerShell on Windows, execute remote commands using:

```powershell
ssh -i "C:\Users\Yago Canton\.ssh\vps3.key" -o StrictHostKeyChecking=no ubuntu@163.176.205.54 "<COMMAND>"
```

### Examples:
- Check server uptime and resources:
  ```powershell
  ssh -i "C:\Users\Yago Canton\.ssh\vps3.key" ubuntu@163.176.205.54 "uptime; free -m; df -h"
  ```
- Check running Docker containers:
  ```powershell
  ssh -i "C:\Users\Yago Canton\.ssh\vps3.key" ubuntu@163.176.205.54 "docker ps"
  ```

---

## Deploying & Syncing FTV Studio 3D

The VPS repository at `~/projetos/ftv` is configured with `receive.denyCurrentBranch updateInstead`.

### 1. Push code from local machine directly to VPS:
```powershell
$env:GIT_SSH_COMMAND='ssh -i "C:\Users\Yago Canton\.ssh\vps3.key" -o StrictHostKeyChecking=no'
git push ssh://ubuntu@163.176.205.54/home/ubuntu/projetos/ftv main:main
```

### 2. Push from VPS to GitHub (if needed):
The VPS has an authenticated SSH key (`~/.ssh/id_ed25519`) with full push access to `git@github.com:yagocanton21/ftv.git`:
```powershell
ssh -i "C:\Users\Yago Canton\.ssh\vps3.key" ubuntu@163.176.205.54 "git -C ~/projetos/ftv push origin main"
```

### 3. Rebuild and restart the Docker container on VPS:
```powershell
ssh -i "C:\Users\Yago Canton\.ssh\vps3.key" ubuntu@163.176.205.54 "cd ~/projetos/ftv && docker compose build && docker compose up -d"
```

### 4. Verify deployment health:
```powershell
ssh -i "C:\Users\Yago Canton\.ssh\vps3.key" ubuntu@163.176.205.54 "curl -s -I http://localhost:8085"
```
Or test externally:
```powershell
curl.exe -s -I http://163.176.205.54:8085
```
