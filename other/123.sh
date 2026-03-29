cd /tmp
wget https://github.com/hzyitc/openwrt-redmi-ax3000/releases/latest/download/openwrt-ipq50xx-arm-redmi_ax3000-squashfs-nand-factory.ubi
 
# Check your partition table
cat /proc/mtd
[[ "$(grep '"rootfs"' /proc/mtd | cut -d':' -f1)" == "mtd18" ]] || exit
[[ "$(grep '"rootfs_1"' /proc/mtd | cut -d':' -f1)" == "mtd19" ]] || exit
 
# Detect the current system slot and flash into the other one
cat /proc/cmdline
mtd="$(grep -oE 'ubi.mtd=[a-zA-Z0-9\-\_]*' /proc/cmdline | cut -d'=' -f2)"
if [[ "$mtd" == "rootfs" ]]; then
    # Flash it as system 2
    ubiformat /dev/mtd19 -f openwrt-ipq50xx-arm-redmi_ax3000-squashfs-nand-factory.ubi
    nvram set flag_try_sys2_failed=0
    nvram set flag_boot_rootfs=1
    nvram set flag_last_success=1
    nvram commit
elif [[ "$mtd" == "rootfs_1" ]]; then
    # Flash it as system 1
    ubiformat /dev/mtd18 -f openwrt-ipq50xx-arm-redmi_ax3000-squashfs-nand-factory.ubi
    nvram set flag_try_sys1_failed=0
    nvram set flag_boot_rootfs=0
    nvram set flag_last_success=0
    nvram commit
fi
 
# Reboot
reboot