#!/bin/bash
# Host Discovery Tool

# --- Color Constants ---
RED="\e[0;31m"
GREEN="\e[0;32m"
YELLOW="\e[0;33m"
BLUE="\e[0;34m"
CYAN="\e[0;36m"
GRAY="\e[0;90m"
WHITE="\e[1;37m"
NC="\e[0m"
BOLD="\e[1m"

# --- Signal Trap Handler (Ctrl + C) ---
handle_cancel() {
    echo -e "\n\n${RED}${BOLD}[!] Scan interrupted by user (Ctrl+C). Exiting cleanly...${NC}\n"
    exit 130
}

trap handle_cancel SIGINT

print_banner() {
    echo -e "${CYAN}╔═════════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${BLUE}  _  _ _____ _____   ___  ___ ___  ___ _____   _____  _____ _____ __   __ ║${NC}"
    echo -e "${CYAN}║${BLUE} | || |  ___|_   _| |   \|_ _/ __|/ __/ _ \ \ / / __|/ _ \ \ / /\ \ / /   ║${NC}"
    echo -e "${CYAN}║${BLUE} | \| |  _|   | |   | |) | | \__ \ (_| (_) \ V /| _|| (_) \ V /  \ V /    ║${NC}"
    echo -e "${CYAN}║${BLUE} |_|\_|____|  |_|   |___/___|___/\___\___/  \_/ |___|\___/ \_/    |_|     ║${NC}"
    echo -e "${CYAN}╠═════════════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║ ${WHITE}NET-DISCOVERY CORE SYSTEM${NC} ${GRAY}|${NC} ${YELLOW}v1.0.0${NC} ${GRAY}|${NC} ${YELLOW}Written by Ishaque${NC} ${RED}[SEC-LAB]${NC}      ${CYAN}║${NC}"
    echo -e "${CYAN}╚═════════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}[*]${NC} ${WHITE}Engine Status:${NC} ${GREEN}ACTIVE${NC}"
    echo -e "${GRAY}-------------------------------------------------------------------------------------${NC}"
}

print_banner

# --- Input Subnet ---
echo -e "${BOLD}${BLUE}Enter your ip prefix (e.g 192.168.1): ${NC}" 
read ip_prefix

# Validate 3 octets
ipv4_pattern="^([0-9]{1,3}\.){2}[0-9]{1,3}$"
if [[ ! $ip_prefix =~ $ipv4_pattern ]]; then
  echo -e "${RED}--------------------------------------------------------${NC}"
  echo -e "${RED}${BOLD} Error: Invalid Inputs ${NC}"
  echo -e "\n${YELLOW}${BOLD} Please enter only the first 3 parts of your IPv4 address ${NC}\n"
  printf "${RED} Exiting program \n${NC}"
  echo -e "${RED}--------------------------------------------------------${NC}"
  exit 1
fi

# --- Filter Preference ---
echo -e "\n${CYAN}[?] Select Display Mode:${NC}"
echo -e "  ${BOLD}[1]${NC} Online Hosts Only ${GRAY}(Default)${NC}"
echo -e "  ${BOLD}[2]${NC} All Hosts (Online + Offline)"
echo -e "${BLUE}Choice [1/2]: ${NC}"
read display_choice

# Default to choice 1 if left empty
display_choice=${display_choice:-1}

echo -e "\n${YELLOW}[*] Scanning Target Host:${NC} ${BOLD}${ip_prefix}.0/24${NC} ${GRAY}(Press Ctrl+C to stop)${NC}\n"

# Output Table Headers
printf "${BOLD}%-20s %-20s %-20s${NC}\n" "IP ADDRESS" "STATUS" "RESPONSE TIME"
echo -e "${GRAY}------------------------------------------------------------${NC}"

online_count=0

# Scan Loop
for host in {1..254}; do 
  ip="${ip_prefix}.${host}"

  if ping -c 1 -w 1 "$ip" > /dev/null 2>&1; then
    printf "%-20s ${GREEN}%-20s${NC} %-20s\n" "$ip" "[ ONLINE ]" "< 2ms"
    ((online_count++))
  else 
    # Only print OFFLINE hosts if user chose option 2
    if [[ "$display_choice" == "2" ]]; then
      printf "%-20s ${RED}%-20s${NC} %-20s\n" "$ip" "[ OFFLINE ]" "N/A"
    fi
  fi
done

echo -e "${GRAY}------------------------------------------------------------${NC}"
echo -e "${GREEN}${BOLD}[+] Scanning Complete.${NC} Found ${BOLD}${online_count}${NC} active host(s).\n"

# Outro Banner
echo -e "${BLUE}${BOLD}Thank you for using this program. I really appreciate your time and dedication.${NC}\n" 
echo -e "${CYAN}${BOLD}"
echo "=========================================="
echo "          NET-DISCOVERY CLI v1.0          "
echo "=========================================="
echo -e "${NC}"
echo -e "${YELLOW}Written by Ishaque${NC} ${RED}[SEC-LAB]${NC}\n"