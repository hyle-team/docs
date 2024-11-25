# Zano munin setup

Prerequisites: Ubuntu 18.04 LTS

1. `apt-get update`
1. `apt install munin, munin-node, munin-run, nginx, apache2-utils`
1. Setup nginx config:
```
    location / {
            return 403;
        }

    location /munin {
        alias /var/cache/munin/www;
        autoindex on;
        auth_basic "Munin Statistics";
        auth_basic_user_file /etc/munin/.passwd;
    }
```
4. `htpasswd -c /etc/munin/.passwd USERNAME_HERE`
5. `systemctl restart nginx`
6. Edit `/etc/munin/munin.conf` (consider adding `graph_width 600` and `graph_height 300`) and `/etc/munin/munin-node.conf`
7. `systemctl enable munin`
8. `systemctl start munin`
9. `cd /etc/munin/plugins` and remove all unneccessary plugins
10. Clone Zano, build zanod and connectivity_tool.
11. Run zanod and make sure it's RPC port is accessible (11211 by default).
12. Make system-wide link to connectivity_tool:
`ln -s /home/zano_for_munin/build/src/connectivity_tool /usr/bin/connectivity_tool`
13. Edit `/etc/munin/plugin-conf.d/zano_plugins` add the following (change 11211 to RPC port if not default):
```
[*]
env.ZANO_RPC_PORT 11211

[*_data_file_size]
user root
```
14. Go to `zano/utils/munun_plugins` and run `_link_munin_plugins.sh`, make sure plugins were added to `/etc/munun/plugins`
15. `systemctl restart munin-node`
16. Make sure all plugins are listed: `echo -e "list\nquit" | nc 127.0.0.1 4949`
17. Make sure a plugin is working and outputs some reasonable data:
`sudo -u munin munin-run outs_stat`
18. Check `/var/log/munin/munin-update.log` for errors.
19. Check `/var/log/munin/munin-node.log` for errors.
20. Log in into your website and check munin graphs.
21. Enjoy!
