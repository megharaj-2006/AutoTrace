#!/usr/bin/env python3
"""
AutoTrace-Sec: Automated Remote Provisioning Script for Azure VM
Target: azureuser@172.198.48.214
"""

import sys
import os
import pexpect
import subprocess
import time

HOST = "172.198.48.214"
USER = "azureuser"
PUB_KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519_autotrace.pub")
KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519_autotrace")
TAR_PATH = os.path.join(os.path.dirname(__file__), "autotrace-azure-deploy.tar.gz")

def test_key_ssh():
    cmd = ["ssh", "-i", KEY_PATH, "-o", "BatchMode=yes", "-o", "ConnectTimeout=5", f"{USER}@{HOST}", "echo SUCCESS"]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return res.returncode == 0 and b"SUCCESS" in res.stdout

def install_key_with_password(password):
    print(f"[*] Authorizing SSH public key on {USER}@{HOST}...")
    if not os.path.exists(PUB_KEY_PATH):
        raise FileNotFoundError(f"Public key not found: {PUB_KEY_PATH}")
    
    with open(PUB_KEY_PATH, "r") as f:
        pub_key = f.read().strip()

    remote_cmd = (
        f"mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
        f"grep -q '{pub_key}' ~/.ssh/authorized_keys 2>/dev/null || echo '{pub_key}' >> ~/.ssh/authorized_keys && "
        f"chmod 600 ~/.ssh/authorized_keys"
    )

    child = pexpect.spawn(f"ssh -o StrictHostKeyChecking=accept-new {USER}@{HOST} \"{remote_cmd}\"", timeout=20)
    idx = child.expect(["password:", "Password:", pexpect.EOF, pexpect.TIMEOUT])
    if idx in (0, 1):
        child.sendline(password)
        child.expect(pexpect.EOF)
    output = child.before.decode(errors="ignore") if child.before else ""
    child.close()
    
    if test_key_ssh():
        print("[✓] SSH public key successfully installed and verified!")
        return True
    else:
        print("[!] Key verification failed. Output:\n", output)
        return False

def run_remote_command(cmd, sudo_password=None, desc=""):
    print(f"\n>>> Running: {desc or cmd}...")
    ssh_cmd = f"ssh -i {KEY_PATH} -o StrictHostKeyChecking=accept-new {USER}@{HOST} '{cmd}'"
    child = pexpect.spawn(ssh_cmd, timeout=300)
    
    while True:
        try:
            idx = child.expect([r"\[sudo\] password for", pexpect.EOF, pexpect.TIMEOUT], timeout=30)
            if idx == 0:
                if sudo_password:
                    child.sendline(sudo_password)
                else:
                    child.sendline("")
            elif idx == 1:
                break
            elif idx == 2:
                # Still running, print latest buffer
                if child.before:
                    sys.stdout.write(child.before.decode(errors="ignore"))
                    sys.stdout.flush()
        except pexpect.TIMEOUT:
            pass

    child.close()
    if child.before:
        sys.stdout.write(child.before.decode(errors="ignore"))
        sys.stdout.flush()
    return child.exitstatus == 0

def copy_bundle():
    print(f"[*] Transferring deployment archive {TAR_PATH} to {USER}@{HOST}...")
    scp_cmd = ["scp", "-i", KEY_PATH, TAR_PATH, f"{USER}@{HOST}:~/autotrace-azure-deploy.tar.gz"]
    res = subprocess.run(scp_cmd)
    if res.returncode != 0:
        raise RuntimeError("Failed to transfer deployment bundle.")
    print("[✓] Deployment bundle transferred.")

def main():
    if len(sys.argv) < 2 and not test_key_ssh():
        print("Usage: python3 remote_provision.py <AZURE_VM_PASSWORD> [SUPABASE_DATABASE_URL]")
        print("Please provide the password for azureuser.")
        sys.exit(1)

    password = sys.argv[1] if len(sys.argv) > 1 else None
    supabase_url = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("DATABASE_URL", "")

    if not test_key_ssh():
        if not password:
            print("SSH key not authorized and no password supplied.")
            sys.exit(1)
        if not install_key_with_password(password):
            sys.exit(1)

    # Inject Supabase URL if provided
    if supabase_url:
        print(f"[*] Storing Supabase DATABASE_URL on remote host in ~/.autotrace.env...")
        run_remote_command(f'echo "DATABASE_URL={supabase_url}" > ~/.autotrace.env && chmod 600 ~/.autotrace.env', desc="Configuring Supabase credentials")

    # Transfer deployment bundle
    copy_bundle()

    # Extract deployment bundle
    run_remote_command(
        "mkdir -p ~/autotrace-deploy && tar -xzf ~/autotrace-azure-deploy.tar.gz -C ~/autotrace-deploy",
        desc="Extracting deployment bundle"
    )

    # Step 1 & 2: Setup host, Docker, Node.js 20, BPF tools, 4GB swap, swappiness=10
    run_remote_command(
        "cd ~/autotrace-deploy/infra/azure && chmod +x *.sh && ./01-setup-host.sh",
        sudo_password=password,
        desc="Step 1-3: Base Utilities, Docker, Node 20, Kernel Tooling, 4GB Swap & Swappiness"
    )

    # Step 4: Deploy Redpanda, Redis, and 4 Mock Services
    run_remote_command(
        "cd ~/autotrace-deploy/infra/azure && ./02-deploy-services.sh",
        sudo_password=password,
        desc="Step 4: Deploy Redpanda (1G mem), Redis (256MB), and 4 Mock Services"
    )

    # Step 5: Deploy Express backend with PM2, memory ceiling, Supabase & Redpanda
    run_remote_command(
        "cd ~/autotrace-deploy/infra/azure && ./03-deploy-backend.sh",
        sudo_password=password,
        desc="Step 5: Deploy Express Backend on Port 8080 (PM2, max-old-space-size=512)"
    )

    # Step 6: Compile & Attach eBPF Watchdog
    run_remote_command(
        "cd ~/autotrace-deploy/infra/azure && ./04-deploy-watchdog.sh",
        sudo_password=password,
        desc="Step 6: Compile & Attach eBPF Watchdog and Test Ingestion"
    )

    print("\n======================================================================")
    print("✓ Full AutoTrace-Sec Azure Remote Provisioning Completed Successfully!")
    print("======================================================================")

if __name__ == "__main__":
    main()
