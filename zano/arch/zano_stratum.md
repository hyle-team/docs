## Zano stratum testing

Zano daemon features internal stratum-like server that is able to server miner clients via ethProxy protocol(big thanks to [@sowle](https://github.com/sowle) for implementing this). It works like very light and simple pool that mines to a single address.

To run a GPU miner with the internal Zano stratum server follow these steps:

* build the daemon (zanod executable);
* run the daemon with activated stratum server:
`zanod.exe --stratum --stratum-miner-address=ZxD64D8R9SiCLqrvDYjaNret4b32VaZJqTEMnhzzsw4MAYyZ6VQdLaYCTZgj5RsC6W1o5uMg3J7hSfatSeRA9T9333bNt9vJ9 --log-level=2 --stratum-bind-port=11555`

You can use your own miner address if you'd like.

The daemon should start and listen for miners at TCP:11555.

* run GPU miner (examples):
`progminer.exe --cuda -P stratum1+tcp://miner@localhost:11555`
or
`progminer.exe --opencl -P stratum1+tcp://miner@localhost:11555`
or
`progminer.exe --cpu -P stratum1+tcp://miner@localhost:11555`

Change "localhost" to an appropriate address if the daemon is not running locally.

The miner should connect to the daemon and receive a job from it. Upon finding a solution, the miner should send it to the daemon and daemon should confirm the solution.
