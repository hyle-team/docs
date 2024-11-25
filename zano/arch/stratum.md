## Zano stratum testing

Zano daemon features internal stratum-like server that is able to server miner clients via ethProxy protocol. It works like very light and simple pool that mines to a single address.

To run a GPU miner with the internal Zano stratum server follow these steps:
1) get sources from https://github.com/hyle-team/zano/tree/progpow  (mind the branch name 'progpow');
2) buid the daemon (zanod executable);
3) run the daemon in standalone mode with activated stratum server:
`zanod.exe --offline-mode --stratum --stratum-miner-address=ZxD64D8R9SiCLqrvDYjaNret4b32VaZJqTEMnhzzsw4MAYyZ6VQdLaYCTZgj5RsC6W1o5uMg3J7hSfatSeRA9T9333bNt9vJ9 --log-level=2 --stratum-bind-port=11555`

You can use your own miner address if you'd like.

The daemon should start and listen for miners at TCP:11555.

4) run GPU miner (examples):
`ethminer.exe --cuda -P stratum1+tcp://miner@localhost:11555`
or
`progminer.exe --opencl -P stratum1+tcp://miner@localhost:11555`

Change "localhost" to an appropriate address if the daemon is not running locally.

The miner should connect to the daemon and receive a job from it. Upen finding a solution, the miner should send it to the daemon and daemon should confirm the solution.

Ethereum-related code is located at zano/contrib/ethereum
