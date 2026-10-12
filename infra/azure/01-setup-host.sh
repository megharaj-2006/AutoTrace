#!/usr/bin/env bash
# ==============================================================================
# AutoTrace-Sec Azure VM Provisioning: Step 1 & 2 (Host Setup, Tooling & Swap)
# Target: Ubuntu 24.04 LTS (x64) - Standard_B2s_v2 (2 vCPUs, 8 GiB RAM)
# ==============================================================================
set -euo pipefail

echo "======================================================================"
echo "[Step 1/3] Host Verification & Kernel BPF Check"
echo "======================================================================"
uname -a
echo "Kernel Release: $(uname -r)"

# Verify BPF support in running kernel
if [ -d /sys/fs/bpf ]; then
    echo "✓ BPF filesystem (/sys/fs/bpf) is mounted."
else
    echo "Mounting /sys/fs/bpf..."
    sudo mount -t bpf bpf /sys/fs/bpf || true
fi

echo "======================================================================"
echo "[Step 2/3] Base Utilities, Docker, Node.js 20, & Kernel Tooling"
echo "======================================================================"
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
sudo apt-get upgrade -y

# Install prerequisites
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    build-essential \
    linux-headers-$(uname -r) \
    bpfcc-tools \
    python3-bpfcc \
    libbpf-tools \
    git \
    htop \
    net-tools

# Ensure bpftool binary is linked on PATH
if ! command -v bpftool &>/dev/null && [ -f /usr/lib/linux-tools-6.8.0-146/bpftool ]; then
    sudo ln -sf /usr/lib/linux-tools-6.8.0-146/bpftool /usr/local/bin/bpftool
fi

# Install Docker Engine & Compose plugin if not already installed
if ! command -v docker &>/dev/null; then
    echo "Installing Docker Engine..."
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable --now docker
fi

# Ensure azureuser can run Docker without sudo
sudo usermod -aG docker "$USER" || true

# Install Node.js 20+ LTS via NodeSource
if ! command -v node &>/dev/null; then
    echo "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
node --version
npm --version

echo "======================================================================"
echo "[Step 3/3] Memory Safety Allocation: 4 GiB Swapfile & Swappiness=10"
echo "======================================================================"
if [ ! -f /swapfile ]; then
    echo "Allocating 4 GiB swapfile at /swapfile..."
    sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Persist in /etc/fstab if not present
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo "✓ 4 GiB swapfile enabled and registered in /etc/fstab."
else
    echo "Swapfile /swapfile already exists:"
    swapon --show
fi

# Set swappiness to 10 for low-overhead kernel memory discipline
echo "Configuring vm.swappiness=10..."
sudo sysctl vm.swappiness=10
if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
else
    sudo sed -i 's/^vm.swappiness.*/vm.swappiness=10/' /etc/sysctl.conf
fi

echo "======================================================================"
echo "Host setup and memory discipline completed successfully!"
echo "Memory & Swap status:"
free -h
echo "======================================================================"
