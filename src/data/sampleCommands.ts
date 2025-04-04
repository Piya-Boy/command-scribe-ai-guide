
export interface Command {
  id: string;
  name: string;
  description: string;
  syntax: string;
  platform: "linux" | "windows" | "both";
  examples: string[];
  category: string;
}

export const sampleCommands: Command[] = [
  {
    id: "1",
    name: "nmap",
    description: "Network exploration tool and security scanner",
    syntax: "nmap [options] [target]",
    platform: "linux",
    examples: [
      "nmap -sV 192.168.1.1",
      "nmap -p 1-100 192.168.1.1-254",
      "nmap -A scanme.nmap.org"
    ],
    category: "network"
  },
  {
    id: "2",
    name: "dir",
    description: "Lists the files and directories in the current or specified directory",
    syntax: "dir [options] [pattern]",
    platform: "windows",
    examples: [
      "dir /a",
      "dir /s *.txt",
      "dir /b /s"
    ],
    category: "filesystem"
  },
  {
    id: "3",
    name: "ls",
    description: "Lists files and directories in the current or specified directory",
    syntax: "ls [options] [file/directory]",
    platform: "linux",
    examples: [
      "ls -la",
      "ls -lh /var/log",
      "ls --color=auto"
    ],
    category: "filesystem"
  },
  {
    id: "4",
    name: "ping",
    description: "Sends ICMP echo requests to a specified network host",
    syntax: "ping [options] destination",
    platform: "both",
    examples: [
      "ping google.com",
      "ping -c 4 192.168.1.1",
      "ping -t 192.168.1.1"
    ],
    category: "network"
  },
  {
    id: "5",
    name: "ipconfig",
    description: "Displays network configuration information",
    syntax: "ipconfig [options]",
    platform: "windows",
    examples: [
      "ipconfig",
      "ipconfig /all",
      "ipconfig /renew"
    ],
    category: "network"
  },
  {
    id: "6",
    name: "ifconfig",
    description: "Configures or displays network interface parameters",
    syntax: "ifconfig [interface] [options]",
    platform: "linux",
    examples: [
      "ifconfig",
      "ifconfig eth0",
      "ifconfig eth0 up"
    ],
    category: "network"
  }
];
