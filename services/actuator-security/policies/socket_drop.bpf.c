// ==============================================================================
// AutoTrace-Sec: eBPF Socket-Drop Filter Policy (Mechanism C)
//
// Injects kernel-level packet drops at the cgroup socket egress layer,
// dropping packets destined for protected port (e.g. 5003 - payment-vault).
// ==============================================================================

#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/in.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

// Protected payment-vault port (5003 in host byte order)
#define TARGET_PORT 5003

// Return codes for BPF programs
#define BPF_PASS 1
#define BPF_DROP 0

SEC("cgroup_skb/egress")
int autotrace_socket_drop(struct __sk_buff *skb) {
    void *data = (void *)(long)skb->data;
    void *data_end = (void *)(long)skb->data_end;

    // Parse IPv4 header
    struct iphdr *ip = data;
    if ((void *)(ip + 1) > data_end) {
        return BPF_PASS;
    }

    // Only process TCP traffic
    if (ip->protocol != IPPROTO_TCP) {
        return BPF_PASS;
    }

    // Parse TCP header
    struct tcphdr *tcp = (void *)ip + (ip->ihl * 4);
    if ((void *)(tcp + 1) > data_end) {
        return BPF_PASS;
    }

    // Check if destination port matches protected service (payment-vault: 5003)
    if (bpf_ntohs(tcp->dest) == TARGET_PORT) {
        // Drop unauthorized lateral connection attempt at the kernel level
        bpf_printk("[AutoTrace-Sec] eBPF socket drop: egress to port %d blocked\n", TARGET_PORT);
        return BPF_DROP;
    }

    return BPF_PASS;
}

char _license[] SEC("license") = "GPL";
