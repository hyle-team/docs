# Introduction
## Starting the daemon and the wallet application as RPC server
Zano command-line wallet application (simplewallet) can be run in RPC server mode. In this mode it can be controlled by RPC calls via HTTP and be used as a back-end for an arbitrary service.

Starting the wallet in RPC server mode:
1. Run zanod (the daemon application).
2. Run simplewallet with the following options:

`simplewallet --wallet-file PATH_TO_WALLET_FILE --password PASSWORD --rpc-bind-ip RPC_IP --rpc-bind-port RPC_PORT --daemon-address DEAMON_ADDR:DAEMON_PORT --log-file LOG_FILE_NAME`

where:

`PATH_TO_WALLET_FILE` — path to an existing wallet file (should be created beforehand using  `--generate-new-wallet command`);
`PASSWORD` — wallet password;
`RPC_IP` — IP address to bind RPC server to (127.0.0.1 will be used if not specified);
`RPC_PORT` — TCP port for RPC server;
`DEAMON_ADDR:DAEMON_PORT` — daemon address and port (may be omitted if the daemon is running on the same machine with the default settings);
`LOG_FILE_NAME` — path and filename of simplewallet log file.

Examples below are given with assumption that the wallet application is running in RPC server mode and listening at 127.0.0.1:12233.

All amounts and balances are represented as unsigned integers and measured in atomic units — the smallest fraction of a coin. One coin equals 10^12 atomic units.

## Integrated addresses for exchanges
Unlike Bitcoin, CryptoNote family coins have different, more effective approach on how to handle user deposits.
An exchange generates only one address for receiving coins and all users send coins to that address. To distinguish different deposits from different users the exchange generates random identifier (called payment ID) for each one and a user attaches this payment ID to his transaction while sending. Upon receiving, the exchange can extract payment ID and thus identify the user.
In original CryptoNote there were two separate things: exchange deposit address (the same for all users) and payment ID (unique for all users). Later, for user convenience and to avoid missing payment ID we combined them together into one thing, called integrated address. So nowadays modern exchanges usually give to a user an integrated address for depositing instead of pair of standard deposit address and a payment ID.

For more information on how to handle integrated addresses, please refer to RPCs make_integrated_address and split_integrated_address below.
